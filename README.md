# LAWPARTNER — AI 기반 법률 상담 · 변호사 매칭 서비스

저장소 폴더명은 **AI-Law**이며, 서비스 브랜드/프로젝트명은 **LAWPARTNER**로 소개합니다.

---

## 1. 프로젝트 개요

**LAWPARTNER**는 사용자가 겪은 사건에 대해 상담을 받고, 그 맥락을 바탕으로 **적합한 변호사를 찾아 구인·매칭**할 수 있도록 돕는 웹 서비스입니다.

- 입력한 질문/상황을 바탕으로 관련 법률 정보와 상담 안내를 제공합니다.
- 상담 결과를 토대로 변호사 탐색·매칭으로 이어져, 법률 서비스 이용 진입장벽을 낮추는 것을 목표로 합니다.

### 프로젝트 목표

- **즉각 상담**: 사건/상황 입력 시 빠른 1차 법률 안내 제공
- **변호사 매칭**: 상담 맥락을 바탕으로 적합한 변호사 탐색 지원
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
| 상담 처리 서버 | FastAPI (Python) — 상담 처리 API |
| Database | Oracle — 사용자, 상담, 변호사 등 데이터 저장 |

---

## 4. 디렉터리 구조

```
AI-Law/
├── Backend-main/    # Spring Boot 백엔드
├── backend-ai/      # FastAPI 상담 처리 서버
├── frontend/        # React 프론트엔드
├── setup.bat        # Windows 통합 환경 설치 스크립트
└── .gitignore
```

---

## 5. Quick Start (Portfolio Demo)

### 1) 실행 준비
- Node.js
- JDK 17
- Python venv 환경

### 2) 한 번에 실행
저장소 루트에서 `run_all.bat`을 실행하세요.

```bat
.\run_all.bat
```

`run_all.bat`은 React(3000) / FastAPI(8000) / Spring Boot(8080)를 순서대로 기동하고, 실행 중 포트 충돌이 있으면 선처리합니다.

### 3) 실행 포트
- React: `http://localhost:3000`
- Spring Boot: `http://localhost:8080`
- FastAPI: `http://localhost:8000`

---

## 6. Demo Flow (화면 시연 흐름)

아래 장면들은 `docs/` 폴더에 캡처 이미지를 넣고, README에 링크로 연결하면 포트폴리오 완성도가 크게 올라갑니다.

1. **[장면 1] 회원가입/로그인**
   - `LoginPage`, `SignupPage`에서 계정 생성 및 로그인
   - 로그인 성공 후 `Header`에 사용자 메뉴/알림 UI가 노출되는지 확인

<details>
<summary><b>🔐 로그인 (일반) 시연</b> &nbsp;&nbsp; 🎬 영상 있음</summary>
<br />

<div align="center">
  <video src="https://github.com/user-attachments/assets/78610535-e367-486f-9e1c-9985dabb8140" width="90%" controls></video>
</div>

<br />

> 일반 사용자의 시각에서 로그인 흐름을 구현했습니다.

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

</details>

<details>
<summary><b>🔐 로그인 (변호사) 시연</b> &nbsp;&nbsp; 🎬 영상 있음</summary>
<br />

<div align="center">
   <video src="https://github.com/user-attachments/assets/1fd14c0a-a77e-4e98-8c9b-def4188bbf8a" width="90%" controls>/video>
</div>

<br />

> 변호사 전용 대시보드 접근 권한 확인 로직을 포함합니다.

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

</details>

회원가입 시연 영상 : [Scene 1 (일반)](https://drive.google.com/file/d/1qrDG4IrmS81Vu3KpDlZLqePdCl-VPELO/preview)

---

2. **[장면 2] 마이페이지(General) 대시보드**
   - `GeneralMypage.js`에서 `/api/mypage/general`로 대시보드 데이터 로딩
   - 최근 상담 요청 테이블에서 진행 상태 확인 + “취소” 처리 시 `/api/mypage/chat/room/{roomId}` 호출
   - 캘린더에서 일정 추가/수정/삭제
     - 추가: `/api/mypage/calendar`
     - 수정/삭제: `/api/mypage/calendar/{id}`
   - 내가 남긴 리뷰 목록 노출 및 리뷰 삭제(`/api/mypage/review/{reviewNo}`) 후 화면 갱신
   - 최근 게시판 글 목록에서 상담 게시판으로 이동
  
<details>
<summary><b>👤 마이페이지 (일반) 시연</b> &nbsp;&nbsp; 🎬 영상 있음</summary>
<br />

<div align="center">
  <video src="https://github.com/user-attachments/assets/bf43bb92-e3d4-40e6-87c5-07318be2db82" width="90%" controls></video>
</div>

<br />

> 일반 사용자의 마이페이지 입니다.

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

</details>

<details>
<summary><b>⚖️ 마이페이지 (변호사) 시연</b> &nbsp;&nbsp; 🎬 영상 있음</summary>
<br />

<div align="center">
  <video src="https://github.com/user-attachments/assets/1ce16ae3-4c47-4dce-b7db-f0deebdfcc4b" width="90%" controls></video>
</div>

<br />

> 변호사 마이페이지 입니다.

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

</details>
---


3. **[장면 3] 상담 게시판(질문 등록 → 상세)**
   - `ConsultationBoard`에서 `/api/boards`로 글 목록 조회
   - `AIChatPage`에서 사건/상황을 입력한 뒤 결과를 `WriteQuestionPage`로 전달하여 질문을 작성하는 흐름(구현 화면 연계)
   - `WriteQuestionPage`에서 `/api/boards`로 질문 작성
   - `ConsultationDetail`에서 `/api/boards/{id}`로 상세 조회
   - 상세 화면에서 답변/리뷰 및 채팅방 생성 동작을 시연

<details>
<summary><b> 질문 등록 시연</b> &nbsp;&nbsp; 🎬 영상 있음</summary>
<br />

<div align="center">
  <video src="https://github.com/user-attachments/assets/0f61336c-6ec0-4291-a256-041364fbb878" width="90%" controls></video>
</div>

<br />

> 상담 게시판 질문 등록 게시글 입니다.

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)


AI 상담 후 게시판 등록 영상 : [(일반)](https://drive.google.com/file/d/1FL-hanilUj_pbp6g6hCMsaeRVPjII5BN/view?t=2)

---


4. **[장면 4] 전문가 찾기 & 상담 진행**
   - `ExpertsPage`에서 `/api/lawyers` 목록/조건 조회
   - `ExpertDetailPage`에서 `/api/lawyers/{id}` 상세 확인
   - 상담 진행 시 `/api/boards/chat/room`로 채팅방 생성 → `/api/chat/room/notify`로 상대 알림 발송
   - 생성된 `roomId`로 `chatList/{roomId}` 이동


---


5. **[장면 5] 1:1 실시간 채팅(핵심 기능)**
   - `chatList.js`에서 입장 시
     - 과거 내역: `/api/chat/history/{roomId}`
     - 읽음 처리: `/api/chat/room/{roomId}/read`
   - SockJS + STOMP로 `/sub/chat/room/{roomId}` 구독
   - 송신은 `/pub/chat/message`로 메시지를 전송하고, 구독 메시지로 화면이 갱신되는 것을 확인


---


6. **[장면 6] 일정 제안 → 확정/거절**
   - 채팅에서 일정 제안 전송
   - 상대가 `/api/chat/calendar/confirm` 또는 `/api/chat/calendar/reject`로 처리하면 상태 카드/UI가 즉시 반영되는 것을 시연


---


7. **[장면 7] 상담 상태 변화 & 실시간 알림**
   - `Header`에서 `/sub/user/{userNo}/notification` 구독으로 알림이 실시간 반영
   - 채팅방 진행 상태(Status 변경)가 상단 UI로 갱신되는 흐름 확인


---


8. **[장면 8] 상담 처리 대시보드(ky, 선택)**
   - `ky/Lawmainpage.js`에서 상담 목록/캘린더/후기 모달 확인
   - 상담 수락 처리(`/api/chat/room/accept/{roomId}`)로 진행 상태가 바뀌는 것을 보여줌


---


## 7. Pages & Features (기능별 정리)

| 페이지/모듈 | 담당 기능 | 시연/구현 포인트 |
|---|---|---|
| `LoginPage`, `SignupPage`, `ChangePasswordPage` | 인증/계정 | JWT 기반 로그인/권한 구조, 예외 처리 UX |
| `GeneralMypage.js` | 일반 마이페이지(대시보드) | `/api/mypage/general` 기반 최근 상담/내 리뷰/최근 글 + 캘린더 CRUD(`/api/mypage/calendar`) + 상담 취소(`/api/mypage/chat/room/{roomId}`) |
| `AIChatPage` (상담 입력/결과) | 상담 입력/결과 정리 | `/api/ai/consult` 요청 + `/api/ai/summarize-consult` 기반 결과를 `WriteQuestionPage`로 전달 |
| `ConsultationBoard`, `WriteQuestionPage`, `ConsultationDetail` | 상담 게시판 | `/api/boards` 목록/등록 + `/api/boards/{id}` 상세 + 답변/리뷰/채팅방 생성 |
| `ExpertsPage`, `ExpertDetailPage` | 전문가 찾기 & 상담 연결 | `/api/lawyers` 목록/필터 + `/api/lawyers/{id}` 상세 + 채팅방 생성(`/api/boards/chat/room`) 및 상대 알림(`/api/chat/room/notify`) |
| `chatList` | 1:1 실시간 채팅 | 입장 시 `/api/chat/history/{roomId}`와 `/read`로 상태 동기화 + SockJS/STOMP(` /sub/chat/room/{roomId}` ) 구독 + `/pub/chat/message` 송신 |
| `chatList` (일정) | 일정 제안/결정 | `/api/chat/calendar/confirm`, `/api/chat/calendar/reject` 처리 후 상태 카드/UI 갱신 |
| `Header` | 실시간 알림 | `/sub/user/{userNo}/notification` 실시간 반영 |
| `ky/Lawmainpage.js` | 변호사 상담 처리 대시보드 | 상담 목록/캘린더/후기 모달 + 상담 수락 및 진행 상태 변경(`/api/chat/room/accept/{roomId}` 등) |

---

## 8. Team (5인)

| 담당 | 역할 |
|------|------|
| **김민수** | `KImMinSU` 디렉토리, 메인/일반 마이페이지, 1:1 채팅, 헤더 알림 |
| **홍승현** | `HSH` 디렉토리, 공통 API 객체·보안·AOP, 로그인/회원가입, 관리자 페이지 |
| **변운조** | `BWJ` 디렉토리, 상담 게시판(질문 등록/상세/답변) |
| **김용** | `KY` 디렉토리, 결제 페이지, 변호사 마이페이지 |
| **임동주** | `LDJ` 관련 디렉토리, 변호사 찾기, 변호사 상세, 고객센터 |


