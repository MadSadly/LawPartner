import os
import sys
import math
import traceback
from dotenv import load_dotenv
from datasets import load_dataset
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from chromadb.config import Settings

# 1. 환경 변수(.env)에서 구글 API 키를 불러옵니다.
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("WARN: GOOGLE_API_KEY 가 비어 있습니다. .env 를 확인하세요.", flush=True)

# 한 번에 불러올 데이터 구간 크기 (원본 판례 레코드 기준 1만 건씩)
SEGMENT_SIZE = 10000
# 전체 원본 레코드 상한 (15만이면 150000, 세그먼트 1~15)
TOTAL_RECORDS = 150000

# Chroma: 텔레메트리 끄기 + Windows에서도 동일 설정
_CHROMA_SETTINGS = Settings(anonymized_telemetry=False, is_persistent=True)


def add_more_data_to_db(segment: int) -> None:
    embedding_model = "models/gemini-embedding-001"
    embeddings = GoogleGenerativeAIEmbeddings(model=embedding_model)

    db_path = "./db"

    if os.path.exists(db_path):
        print("💾 기존 크로마 DB를 찾았습니다. 여기에 데이터를 추가합니다.", flush=True)
    else:
        print("🌱 기존 DB가 없습니다. 새로운 DB를 생성합니다.", flush=True)

    vectordb = Chroma(
        persist_directory=db_path,
        embedding_function=embeddings,
        client_settings=_CHROMA_SETTINGS,
    )

    start = (segment - 1) * SEGMENT_SIZE
    end = min(segment * SEGMENT_SIZE, TOTAL_RECORDS)
    if start >= TOTAL_RECORDS:
        print(f"⚠️ 세그먼트 {segment}은 전체 범위({TOTAL_RECORDS}건)를 벗어납니다. 종료합니다.", flush=True)
        return

    print(
        f"📥 허깅페이스에서 KLAID 데이터를 다운로드 중입니다... (세그먼트 {segment}: {start}~{end}건)",
        flush=True,
    )
    # datasets 4.x: loading by repo script (KLAID.py) raises
    # "Dataset scripts are no longer supported". Use Hub Parquet instead.
    ds = load_dataset(
        "parquet",
        data_files="hf://datasets/lawcompany/KLAID@~parquet/ljp/train/*.parquet",
        split=f"train[{start}:{end}]",
    )

    print("⚙️ 다운받은 데이터를 800자 크기로 쪼개는 중...", flush=True)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
    )

    documents = []
    for row in ds:
        combined_text = f"사건: {row['fact']}\n법령: {row['laws_service']}"
        split_texts = text_splitter.split_text(combined_text)
        for text in split_texts:
            documents.append(Document(page_content=text))

    n = len(documents)
    print(
        f"📚 총 {n}개의 조각이 준비되었습니다. 구글 API로 임베딩 후 Chroma에 저장합니다.",
        flush=True,
    )

    try:
        batch_size = max(1, int(os.getenv("EMBED_BATCH_SIZE", "5000")))
    except ValueError:
        batch_size = 5000

    total_batches = math.ceil(n / batch_size) if n else 0
    print(
        f"⏳ 배치 {total_batches}회 (배치당 최대 {batch_size}개). 환경변수 EMBED_BATCH_SIZE 로 조정 가능.",
        flush=True,
    )

    for bi, i in enumerate(range(0, n, batch_size), start=1):
        batch = documents[i : i + batch_size]
        print(
            f"🔄 배치 {bi}/{total_batches} — {len(batch)}개 임베딩+저장 중...",
            flush=True,
        )
        try:
            vectordb.add_documents(batch)
        except KeyboardInterrupt:
            print("\n[중단] 사용자 중단.", flush=True)
            raise
        except Exception as e:
            print(f"\n[ERROR] 배치 {bi}/{total_batches}: {type(e).__name__}: {e}", flush=True)
            traceback.print_exc()
            sys.exit(1)
        done = min(i + batch_size, n)
        print(f"🔄 진행 상황: {done} / {n} 개 저장 완료...", flush=True)

    print(f"✅ 세그먼트 {segment} ({start}~{end}건) 추가 및 저장 완료!", flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python update_db.py <세그먼트번호>")
        print(f"  TOTAL_RECORDS={TOTAL_RECORDS:,} (원본 레코드 기준)")
        print("  예: python update_db.py 1   → 0~10,000")
        print("      python update_db.py 2   → 10,000~20,000")
        print(f"      python update_db.py 15 → 140,000~{min(15 * SEGMENT_SIZE, TOTAL_RECORDS):,}")
        sys.exit(1)
    try:
        segment = int(sys.argv[1])
    except ValueError:
        print("세그먼트 번호는 숫자로 입력하세요. (예: 1, 2, 3, ...)")
        sys.exit(1)
    if segment < 1:
        print("세그먼트 번호는 1 이상이어야 합니다.")
        sys.exit(1)
    add_more_data_to_db(segment)
