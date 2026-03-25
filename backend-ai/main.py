import json
import logging
import os
import threading
from typing import Any, Dict, List, Optional

from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from fastapi import FastAPI, HTTPException
from starlette.responses import Response

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_rag_lock = threading.Lock()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    logger.warning("GOOGLE_API_KEY가 설정되지 않았습니다. .env를 확인하세요.")
else:
    logger.info("GOOGLE_API_KEY가 로드되었습니다.")

app = FastAPI()

DB_PATH = "./faiss_db"

@app.get("/health")
def health():
    return {"status": "ok"}


def _rag_top_k() -> int:
    try:
        return max(1, int(os.getenv("RAG_TOP_K", "5")))
    except ValueError:
        return 5


# RAG_DISABLE=1 이면 LLM만 사용
_rag_disable_env = os.getenv("RAG_DISABLE", "").strip().lower()
RAG_DISABLE = _rag_disable_env in ("1", "true", "yes", "on")

# FAISS DB 로드
vectordb = None
if not RAG_DISABLE:
    if os.path.exists(DB_PATH) and os.path.exists(os.path.join(DB_PATH, "index.faiss")):
        try:
            logger.info("FAISS DB 로드 중...")
            embedding_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
            vectordb = FAISS.load_local(DB_PATH, embedding_model, allow_dangerous_deserialization=True)
            logger.info("FAISS DB 로드 완료!")
        except Exception:
            logger.exception("FAISS DB 로드 실패. LLM만 사용합니다.")
    else:
        logger.warning("FAISS DB가 없습니다. update_db_faiss.py를 먼저 실행하세요.")
else:
    logger.warning("RAG_DISABLE: LLM만 사용합니다.")

# LLM 설정
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    api_key=api_key,
)

# RAG 프롬프트
rag_prompt_template = """
당신은 한국 법률 전문가입니다.
아래에 제공된 판례와 법령 요약은 참고 자료일 뿐이며,
일반적인 법률 지식과 실무 경험도 함께 활용해서 질문에 답변해야 합니다.

반드시 다음 원칙을 지키세요.
1. 질문이 구체적이지 않더라도, 아는 범위 내에서 가능한 한 자세히 설명합니다.
2. '제공된 정보만으로는 답변을 드릴 수 없습니다' 와 같은 문장은 사용하지 마세요.
3. 판례 내용은 예시로 활용하되, 사용자가 지금 어떤 조치를 취해야 하는지
   단계별로 정리해서 안내합니다.
4. 너무 단호하게 결과를 단정하지 말고,
   '일반적으로는 ~할 수 있습니다', '다만 구체적인 사실관계에 따라 달라질 수 있습니다' 처럼 설명하세요.

[참고 판례 및 자료]
{context}

[사용자 질문]
{question}

위 정보를 바탕으로,
1) 현재 상황에서 일반적으로 예상되는 법적 평가
2) 단기적으로 취해야 할 조치 (예: 신고, 증거 확보, 변호사 상담 등)
3) 유의해야 할 점
을 한국어로 자세히 설명하세요.
"""

rag_prompt = PromptTemplate(
    template=rag_prompt_template,
    input_variables=["context", "question"],
)


class QueryRequest(BaseModel):
    question: str
    disable_rag: Optional[bool] = False


class SummarizeMessage(BaseModel):
    isUser: bool
    text: str
    sources: Optional[list[str]] = None


class SummarizeConsultRequest(BaseModel):
    messages: list[SummarizeMessage]


def _llm_only_answer(question: str, *, intro: str = "") -> Dict[str, Any]:
    text = (
        "당신은 한국 법률 전문가입니다.\n"
        + (intro + "\n" if intro else "")
        + "질문에 대해 일반적인 법률 지식과 실무 관행을 바탕으로 답하세요.\n\n"
        f"질문: {question}"
    )
    llm_resp = llm.invoke(text)
    answer_text = getattr(llm_resp, "content", llm_resp)
    return {"answer": answer_text, "related_cases": []}


def _chat_sync(request: QueryRequest) -> Dict[str, Any]:
    if request.disable_rag or RAG_DISABLE or vectordb is None:
        return _llm_only_answer(request.question)

    try:
        k = _rag_top_k()
        with _rag_lock:
            logger.info("FAISS similarity_search 시작 (k=%s)", k)
            docs = vectordb.similarity_search(request.question, k=k)
            logger.info("FAISS 검색 완료, docs=%s", len(docs))
        sources = [doc.page_content for doc in docs if (doc.page_content or "").strip()]
    except Exception:
        logger.exception("FAISS similarity_search 실패, LLM만 사용")
        return _llm_only_answer(
            request.question,
            intro="판례 검색 중 오류가 발생하여 판례를 참조하지 못했습니다.",
        )

    if not sources:
        return _llm_only_answer(request.question)

    context = "\n\n".join(sources)
    try:
        prompt_text = rag_prompt.format(context=context, question=request.question)
        logger.info("LLM invoke (RAG) 시작")
        llm_resp = llm.invoke(prompt_text)
        logger.info("LLM invoke (RAG) 완료")
    except Exception:
        logger.exception("LLM invoke 실패, LLM만 사용")
        return _llm_only_answer(request.question)

    answer_text = getattr(llm_resp, "content", llm_resp)
    return {"answer": answer_text, "related_cases": sources}


@app.post("/chat")
async def chat(request: QueryRequest):
    logger.info("POST /chat (question len=%s, disable_rag=%s)",
                len(request.question or ""), request.disable_rag)
    try:
        payload = _chat_sync(request)
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        return Response(content=body, media_type="application/json; charset=utf-8")
    except Exception as e:
        logger.exception("POST /chat 오류: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e


SUMMARIZE_CONSULT_PROMPT = """당신은 법률 상담 게시글을 정리하는 전문가입니다.
아래 [상담 원문]은 사용자와 LAW PARTNER AI의 법률 상담 대화입니다.
이를 변호사에게 올리는 상담 게시글 양식으로 정리해주세요.

[상담 원문]
{conversation}

[출력 형식]
반드시 아래 형식만 따르세요. 다른 설명이나 서두 없이 이 형식대로만 출력하세요.

제목: (한 줄 제목. 예: 술자리 내 소지품 절도 사건(피해액 100만 원) 대응 및 법적 절차 문의)

1. 사건 개요
일시 : (상담 내용에서 추론 가능한 일시, 없으면 "상담 시 기재" 등으로 표기)
장소 : (장소가 나오면 구체 기재, 없으면 "[사건이 발생한 장소명 또는 위치 기재]")
피해 사실 : (피해 금액·물품·상황을 한두 문장으로 요약)

2. 현재 상황 및 증거
증거 확보 : (CCTV, 물증 등 확보 여부와 내용)
용의자 특정 : (용의자 특정 여부, 인상착의 등)

3. 변호사님께 드리는 질문
(상담 내용을 바탕으로, 변호사에게 실제로 하고 싶은 질문 2~4개를 구체적으로 번호 없이 나열)
"""


@app.post("/summarize-consult")
def summarize_consult(request: SummarizeConsultRequest):
    try:
        conversation_parts = []
        for m in request.messages:
            if m.isUser:
                conversation_parts.append(f"[질문]\n{m.text or ''}")
            else:
                if not (m.text or "").strip():
                    continue
                conversation_parts.append(f"[LAW PARTNER 답변]\n{(m.text or '').strip()}")
        conversation_text = "\n\n".join(conversation_parts)

        if not conversation_text.strip():
            return {"title": "AI 법률 상담 내용", "content": "상담 내역이 없습니다."}

        prompt = SUMMARIZE_CONSULT_PROMPT.format(conversation=conversation_text)
        llm_resp = llm.invoke(prompt)
        raw = getattr(llm_resp, "content", llm_resp) or ""

        title = "AI 법률 상담 내용"
        for sep in ("제목:", "제목 :"):
            if sep in raw:
                idx = raw.find(sep) + len(sep)
                end = raw.find("\n", idx)
                title = (raw[idx:end] if end > idx else raw[idx:]).strip()
                break

        content_lines = raw.strip().split("\n")
        content_start = 0
        for i, line in enumerate(content_lines):
            if line.strip().startswith("1.") or "사건 개요" in line:
                content_start = i
                break
        content = "\n".join(content_lines[content_start:]).strip()

        all_sources = []
        for m in request.messages:
            if getattr(m, "sources", None):
                all_sources.extend(m.sources)
        if all_sources:
            content += "\n\n📚 참고 판례 (" + str(len(all_sources)) + "건)\n"
            content += "\n".join("• " + s for s in all_sources)

        return {"title": title, "content": content}
    except Exception as e:
        logger.exception("summarize-consult 오류: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e