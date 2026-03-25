import os
import sys
import math
import traceback
from dotenv import load_dotenv
from datasets import load_dataset
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("WARN: GOOGLE_API_KEY 가 비어 있습니다.", flush=True)

SEGMENT_SIZE = 10000
TOTAL_RECORDS = 150000

def add_more_data_to_db(segment: int) -> None:
    embedding_model = "models/gemini-embedding-001"
    embeddings = GoogleGenerativeAIEmbeddings(model=embedding_model)
    db_path = "./db"

    vectordb = Chroma(
        persist_directory=db_path,
        embedding_function=embeddings,
        collection_name="langchain",
    )

    start = (segment - 1) * SEGMENT_SIZE
    end = min(segment * SEGMENT_SIZE, TOTAL_RECORDS)
    if start >= TOTAL_RECORDS:
        print(f"세그먼트 {segment}은 범위 초과. 종료.", flush=True)
        return

    print(f"세그먼트 {segment}: {start}~{end}건 다운로드 중...", flush=True)
    ds = load_dataset(
        "parquet",
        data_files="hf://datasets/lawcompany/KLAID@~parquet/ljp/train/*.parquet",
        split=f"train[{start}:{end}]",
    )

    print("텍스트 분할 중...", flush=True)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
    )

    documents = []
    for row in ds:
        combined_text = f"사건: {row['fact']}\n법령: {row['laws_service']}"
        for text in text_splitter.split_text(combined_text):
            documents.append(Document(page_content=text))

    n = len(documents)
    print(f"총 {n}개 청크 준비됨.", flush=True)

    batch_size = 200  # API 부하 줄이기 위해 작게
    total_batches = math.ceil(n / batch_size) if n else 0

    for bi, i in enumerate(range(0, n, batch_size), start=1):
        batch = documents[i: i + batch_size]
        print(f"배치 {bi}/{total_batches} ({len(batch)}개) 처리 중...", flush=True)
        try:
            vectordb.add_documents(batch)
        except KeyboardInterrupt:
            print("\n[중단]", flush=True)
            raise
        except Exception as e:
            print(f"[ERROR] 배치 {bi}: {type(e).__name__}: {e}", flush=True)
            traceback.print_exc()
            sys.exit(1)

    print(f"세그먼트 {segment} 완료! ({n}개 저장)", flush=True)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python update_db_new.py <세그먼트번호>")
        print("  예: python update_db_new.py 1  → 0~10,000건")
        sys.exit(1)
    try:
        segment = int(sys.argv[1])
    except ValueError:
        print("숫자를 입력하세요.")
        sys.exit(1)
    if segment < 1:
        print("1 이상 입력하세요.")
        sys.exit(1)
    add_more_data_to_db(segment)