# LAWPARTNER — AI 기반 법률 상담 · 변호사 매칭 서비스

저장소 폴더명은 **AI-Law**이며, 서비스 브랜드/프로젝트명은 **LAWPARTNER**로 소개합니다.

---

## 1. 프로젝트 개요

**LAWPARTNER**는 사용자가 겪은 사건에 대해 **AI 상담**을 받고, 그 맥락을 바탕으로 **적합한 변호사를 찾아 구인·매칭**할 수 있도록 돕는 웹 서비스입니다.

- AI가 질문·상황을 분석해 관련 법률 정보와 안내를 제공합니다.
- 상담 결과를 토대로 변호사 탐색·매칭으로 이어져, 법률 서비스 이용 진입장벽을 낮추는 것을 목표로 합니다.

### 프로젝트 목표

- **AI 즉각 상담**: 사건/상황 입력 시 빠른 1차 법률 안내 제공
- **변호사 매칭**: AI 상담 맥락을 바탕으로 적합한 변호사 탐색 지원
- **1:1 실시간 상담**: 사용자-변호사 간 채팅 기반 소통 환경 제공

---

## 2. 개발 환경

| 구분 | 도구 |
|------|------|
| IDE / Editor | Cursor, IntelliJ IDEA, Eclipse |
| OS (권장) | Windows |
| Runtime | Node.js, Java, Python |

---

## 3. 기술 스택

| 구분 | 기술 |
|------|------|
| Language | Java, JavaScript, Python, SQL (Oracle) |
| Frontend | React, React Router, Tailwind CSS, Node.js (개발 런타임) |
| Backend | Spring Boot |
| AI Server | FastAPI (Python) — 모델 추론 및 자연어 처리 |
| Database | Oracle — 사용자, 상담, 변호사 등 데이터 저장 |

---

## 4. 디렉터리 구조

```
AI-Law/
├── Backend-main/    # Spring Boot 백엔드
├── backend-ai/      # FastAPI AI 서버
├── frontend/        # React 프론트엔드
├── setup.bat        # Windows 통합 환경 설치 스크립트
└── .gitignore
```

---

## 5. 시작하기 (Quick Start)

### Git 협업 (매일 작업 전·후)

**아침에 작업을 이어갈 때 (원격 변경을 안전하게 반영)**

```bash
git stash
git pull --rebase
git stash pop
```

**커밋 후 푸시할 때**

```bash
git status
git add .
git commit -m "커밋 메시지"
git pull --rebase origin main
git push origin main
```

### 환경 준비

1. **Node.js** 설치: [https://nodejs.org/ko/download](https://nodejs.org/ko/download) — 설치 마법사 마지막 옵션 체크는 생략해도 됩니다.

2. **의존성 일괄 설치**
   저장소 최상위에서 `setup.bat` 실행 → Maven, pip, npm 등이 설치됩니다.

3. **실행 포트**

   | 서비스 | URL |
   |--------|-----|
   | React (프론트) | http://localhost:3000 |
   | Spring Boot (백엔드) | http://localhost:8080 |
   | FastAPI (AI) | http://localhost:8000 |

4. **Python (AI 서버)** — `backend-ai` 폴더에서:

   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install fastapi uvicorn pydantic
   ```

   이후 `run.bat`으로 AI 서버 실행.

5. **프론트엔드** — `frontend` 폴더에서 `npm start`.

---

## 6. 팀 구성 (5인)

| 담당 | 역할 |
|------|------|
| **김민수** | `KImMinSU`디렉토리, 메인/일반 마이페이지, 1:1 채팅, 헤더 알림 |
| **홍승현** | `HSH` 디렉토리, 공통 API 객체·보안·AOP, 로그인/회원가입, 관리자 페이지 |
| **변운조** | `BWJ` 디렉토리, AI 상담, 상담 게시판 |
| **김용** | `KY` 디렉토리, 결제 페이지, 변호사 마이페이지 |
| **임동주** | `LDJ` 관련 디렉토리, 변호사 찾기, 변호사 상세, 고객센터 |

---
