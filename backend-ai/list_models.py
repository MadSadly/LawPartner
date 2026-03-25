import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

print("💡 내 API 키로 쓸 수 있는 채팅 모델 목록:")
for m in genai.list_models():
    # generateContent(채팅/생성) 기능을 지원하는 모델만 출력
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)