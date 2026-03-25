/* 1. 공통 코드 (시스템의 기준 - 법률 분야, 진행 상태 등)
- TB_COM_CODE : 시스템의 헌법 / 절대 사전
테이블 공통 코드

- GRP_CODE/DTL_CODE 복합키 사용
- 이는 공통 코드를 처리하기 위함에 있어서 화면의 메뉴나 버튼 이름을 관리하는 테이블
모든 테이블에서 사용하는 모든 분류값을 한 곳에 모아둔 만능 창고!

- 사용 이유:
1. 데이터의 통일성
해당 테이블로 모든 분류가 필요한 곳에 사용
2. 유지보수의 확기적
테이블 코드 GRP_CODE 예시
USER_ROLE	회원 권한 (일반/변호사/관리자)	TB_USER
USER_STATUS	회원 상태 (정상/정지/탈퇴)	TB_USER
LAW_FIELD	법률 전문 분야	TB_LAWYER_SPECIALTY, TB_BOARD - [핵심이라고 볼 수 있음]
CASE_STEP	사건 진행 단계 (채팅방 상단)	TB_CHAT_ROOM
PAY_STATUS	결제 상태	TB_PAYMENT
MSG_TYPE	채팅 메시지 타입	TB_CHAT_MESSAGE

예시 1 - 변호사 관련
LAW_FIELD	L01	민사	돈, 계약, 손해배상

FK를 설정 안 하면 어떻게 무결성을 지키는가..?

이를 애플리케이션(Java/Spring 서버)이 담당
1. 화면(Front) : 애초에 셀렉트 박스(Dropdown)에는 TB_COM_CODE에 있는 값만 뿌려주기 (사용자 입력 불가)
2. 서버(Back) : 저장하기 전에 Java 코드에서 if(code==null) 체크를 한 번 더 하기..

공통 코드는 부모가 아닌, 친절한 사전(Reference)이다.
1. DB에서는 FK 연결을 끊어서 구조를 단순하게 만들고, 속도를 높임
2. 대신 Java 프로그램이 올바른 코드만 들어가도록 입구를 지키기..
*/
CREATE TABLE TB_COM_CODE (
    GRP_CODE VARCHAR2(20) NOT NULL, -- 예: LAW_FIELD, CASE_STEP
    DTL_CODE VARCHAR2(20) NOT NULL, -- 예: L01(민사), ST01(접수)
    CODE_NM VARCHAR2(100) NOT NULL,
    USE_YN CHAR(1) DEFAULT 'Y',
    CONSTRAINT PK_COM_CODE PRIMARY KEY (GRP_CODE, DTL_CODE)
);

commit;
/* 2-1 공통 코드 */
-- 1. 회원 권한 (USER_ROLE)
INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'USER_ROLE',
        'ROLE_USER',
        '일반 의뢰인'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'USER_ROLE',
        'ROLE_LAWYER',
        '변호사'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'USER_ROLE',
        'ROLE_ADMIN',
        '시스템 관리자'
    );

-- 2. 회원 상태 (USER_STATUS)
INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES ('USER_STATUS', 'S01', '정상 회원');

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'USER_STATUS',
        'S02',
        '휴면(장기 미접속)'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'USER_STATUS',
        'S03',
        '이용 정지(차단)'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES ('USER_STATUS', 'S99', '탈퇴 회원');

-- 3. 법률 전문 분야 (LAW_FIELD) - [중요] AI 분류 및 검색용
-- 일단 더미데이터로, 추후 지정한 카테고리로 추가하면 됩니당
-- 보류
/*
INSERT INTO TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM) VALUES ('LAW_FIELD', 'L01', '민사 (손해배상/대여금)');
INSERT INTO TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM) VALUES ('LAW_FIELD', 'L02', '형사 (폭행/사기/성범죄)');
INSERT INTO TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM) VALUES ('LAW_FIELD', 'L03', '이혼/가사 (상속/양육권)');
INSERT INTO TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM) VALUES ('LAW_FIELD', 'L04', '부동산 (임대차/명도)');
INSERT INTO TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM) VALUES ('LAW_FIELD', 'L05', '노무/산재 (해고/임금)');
INSERT INTO TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM) VALUES ('LAW_FIELD', 'L06', '행정 (영업정지/면허)');
INSERT INTO TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM) VALUES ('LAW_FIELD', 'L07', '기업/세무 (법인파산)');
INSERT INTO TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM) VALUES ('LAW_FIELD', 'L99', '기타 법률');
*/

-- 4. 사건 진행 단계 (CASE_STEP) - 채팅방 프로그레스 바
INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'CASE_STEP',
        'ST01',
        '사건 접수/대기'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'CASE_STEP',
        'ST02',
        '상담 진행 중'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'CASE_STEP',
        'ST03',
        '소장 작성/검토'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'CASE_STEP',
        'ST04',
        '소송 진행/재판'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'CASE_STEP',
        'ST05',
        '판결/사건 종료'
    );

-- 5. 결제 상태 (PAY_STATUS)
INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES ('PAY_STATUS', 'P01', '결제 대기');

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'PAY_STATUS',
        'P02',
        '결제 완료(승인)'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'PAY_STATUS',
        'P03',
        '결제 취소(사용자)'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES ('PAY_STATUS', 'P04', '환불 완료');

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'PAY_STATUS',
        'P99',
        '결제 오류/실패'
    );

-- 6. 메시지 타입 (MSG_TYPE)
-- 오롯 1:1 실시간 채팅방을 위한 처리..
INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES ('MSG_TYPE', 'TEXT', '일반 텍스트');

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES ('MSG_TYPE', 'IMG', '이미지 파일');

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'MSG_TYPE',
        'FILE',
        '일반 첨부파일(PDF 등)'
    );

INSERT INTO
    TB_COM_CODE (GRP_CODE, DTL_CODE, CODE_NM)
VALUES (
        'MSG_TYPE',
        'SYS',
        '시스템 알림 메시지'
    );

/* 2. 회원 기본 (보안: 비밀번호 SHA-256, 개인정보 AES-256)
SHA-256이란?
단방향 암호화 기법으로

처리 해야할 컬럼들
1. 비밀번호
2. 휴대폰 번호
3. 이메일
2~3번의 경우 대한민국의 법에서는 전화번호와 이메일같은 개인 정보도 암호화할 것을 강력하게 권고!

- ROLE_CODE를 따로 테이블을 만들지 않은 이유

아이디는 변경 불가.
이메일은 수정 가능.
*/
CREATE TABLE TB_USER (
    -- 내부 관리 번호 (PK)
    USER_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    USER_ID VARCHAR2(50) NOT NULL,
    USER_PW VARCHAR2(256) NOT NULL,
    USER_NM VARCHAR2(50) NOT NULL, -- 실명
    -- 닉네임 (화면 표시용) - 선택
    NICK_NM VARCHAR2(50),
    EMAIL VARCHAR2(256) NOT NULL, -- 암호화 저장
    PHONE VARCHAR2(256) NOT NULL, -- 암호화 저장
    -- ROLE_USER / ROLE_LAWYER / ROLE_ADMIN 등등 (상태 코드가 들어감)
    ROLE_CODE VARCHAR2(20) DEFAULT 'ROLE_USER',
    -- 동일하게 S01, S99 등 (상태 테이블의 코드)
    STATUS_CODE VARCHAR2(20) DEFAULT 'S01', -- S01:정상, S99:탈퇴
    -- 로그인 실패 횟수
    FAIL_CNT NUMBER DEFAULT 0,
    -- 계정 잠금 시작 시간
    LOCK_DT DATE,
    JOIN_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_USER PRIMARY KEY (USER_NO),
    CONSTRAINT UQ_USER_ID UNIQUE (USER_ID)
);
-- 추가한 컬럼
ALTER TABLE TB_USER ADD FAIL_CNT NUMBER DEFAULT 0;

ALTER TABLE TB_USER ADD LOCK_DT DATE;
-- TB_USER 테이블에 검색용 해시 컬럼 추가
ALTER TABLE TB_USER ADD EMAIL_HASH VARCHAR2(64);

ALTER TABLE TB_USER ADD PHONE_HASH VARCHAR2(64);
-- 임시 비밀번호 강제 변경 여부 플래그
ALTER TABLE TB_USER ADD PW_CHANGE_REQUIRED CHAR(1) DEFAULT 'N';
/*
-- 일반 유저는 휴대폰이 없을 수도 있다? (선택 사항이라면 NULL 허용)
-- 하지만 '중복 가입 방지'를 위해선 NOT NULL을 유지하는 게 베스트!
PHONE       VARCHAR2(256) NOT NULL, -- 알림용 (AES-256)
PHONE_HASH  VARCHAR2(64)  NOT NULL, -- 중복가입 방지용 (SHA-256)
*/

select * from TB_USER;

SELECT USER_ID, PW_CHANGE_REQUIRED
FROM TB_USER
FETCH FIRST
    5 ROWS ONLY;
-- 유니크 인덱스를 걸어 DB 수준에서 한 번 더 방어
CREATE UNIQUE INDEX UQ_USER_EMAIL_HASH ON TB_USER (EMAIL_HASH);

CREATE UNIQUE INDEX UQ_USER_PHONE_HASH ON TB_USER (PHONE_HASH);

commit;

select * from TB_USER;

UPDATE TB_USER SET ROLE_CODE = 'ROLE_ADMIN' WHERE USER_NO = 8;

COMMIT;
/* 3. 변호사 상세 정보 (슈퍼타입/서브타입) (구독 만료일 포함)
슈퍼 타입이란?
1. 공통 속성을 가진 상위 엔티티
2. 여러 엔티티가 공유하는 필드를 모아둔 부모 개념
ex) TB_USER : 모든 사용자(일반 회원, 변호사, 관리자)가 공통적으로 가지는 속성
--> USER_ID, USER_NM, EMAIL,PHONE 등등..

서브 타입이란?
1. 슈퍼타입을 상속받아 특화된 속성을 추가하는 하위 엔티티
2. 특정 역할이나 유형에 따라 추가 속성을 가짐
ex) TB_USER를 기반으로 변호사만 가지는 속성
--> LICENSE_NO, CAREER, INTRO, APPROVAL_YN, SUB_EXPIRE_DT

USER_ID가 PK/FK인 이유?
--> 슈퍼타입과 서브타입을 연결하기 위해서 변호사 테이블의 USER_ID는 유저 테이블의 USER_ID를 참조하면서 동시에 변호사 테이블의 PK 역할
즉, 이 변호사의 정보는 특정 사용자에게 속한다는 의미..
*/
CREATE TABLE TB_LAWYER_INFO (
    -- 유저 아이디를 할당 및 PK키로 설정 / PK이면서 FK
    USER_NO NUMBER NOT NULL,
    -- 변호사 자격증 증빙 파일 (S3 URL)
    LICENSE_FILE VARCHAR2(500), -- ★★★ NOT NULL 제거 (별도 테이블 관리)
    -- 라이센스 번호 = 시제 변호사 협회에 등록된 사람인지 확인
    LICENSE_NO VARCHAR2(100),
    -- VARCHAR2의 경우 최대 4,000바이트(한글 약 1,300자)
    OFFICE_NAME VARCHAR2(100), -- 소속 로펌/사무실
    OFFICE_ADDR VARCHAR2(200), -- 사무실 주소
    EXAM_TYPE VARCHAR2(50), -- 출신 (사법고시/로스쿨)
    INTRO_TEXT VARCHAR2(4000), -- 자기소개 (CLOB 대신 짧게)
    IMG_URL VARCHAR2(500), -- 프로필 사진(경로만)
    APPROVAL_YN CHAR(1) DEFAULT 'N', -- 관리자 승인 여부 (Y/N/R)
    SUB_EXPIRE_DT DATE, -- [중요] 구독 만료일 (기능 제한용)
    -- IF (오늘날짜 > 만료일): "구독이 만료되었습니다. 결제해주세요."
    CONSTRAINT PK_LAWYER_INFO PRIMARY KEY (USER_NO),
    CONSTRAINT FK_LAWYER_USER FOREIGN KEY (USER_NO) REFERENCES TB_USER (USER_NO)
);
-- 전문분야 따로 문자열로 처리.. 넉넉하게 1,000바이트 정도로 잡는 것이 안전
ALTER TABLE TB_LAWYER_INFO ADD SPECIALTY_STR VARCHAR2(1000);

COMMENT ON COLUMN TB_LAWYER_INFO.SPECIALTY_STR IS '전문 분야 (콤마로 구분: 민사,형사,가사)';

select * from TB_LAWYER_INFO;

UPDATE TB_LAWYER_INFO SET LICENSE_NO = 11111 WHERE USER_NO = 22;

COMMIT;

/* ★★★ [신규] 3-1. 변호사 증명 파일 관리 테이블 ★★★ */
CREATE TABLE TB_LAWYER_DOCUMENTS (
    DOC_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    USER_NO NUMBER NOT NULL,
    DOC_TYPE VARCHAR2(50) NOT NULL, -- 'LICENSE', 'EMPLOYMENT' 등
    ORIGINAL_NAME VARCHAR2(500) NOT NULL, -- 원본 파일명 (다운로드 시 사용)
    SAVED_NAME VARCHAR2(500) NOT NULL, -- 서버 저장 파일명 (UUID)
    FILE_PATH VARCHAR2(500) NOT NULL, -- 서버 저장 경로
    FILE_SIZE NUMBER, -- 파일 크기 (bytes)
    REG_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_LAWYER_DOCUMENTS PRIMARY KEY (DOC_NO),
    CONSTRAINT FK_DOCUMENTS_LAWYER FOREIGN KEY (USER_NO) REFERENCES TB_LAWYER_INFO (USER_NO)
);

CREATE INDEX IX_LAWYER_DOCUMENTS_USER ON TB_LAWYER_DOCUMENTS (USER_NO);

/* 4. AI 채팅 이력 (토큰 비용 관리 - 핵심)
- 1년 지난 거 삭제
DELETE FROM TB_AI_CHAT_LOG
WHERE REG_DT < SYSDATE - 365;

비즈니스 로직은 법률 답변에만 집중
비용 계싼은 AOP가 뒤에서 죠용히 처리..
*/
/* 4-0. AI 채팅방 (최근 상담 내역/방 전환용) */
CREATE TABLE TB_AI_CHAT_ROOM (
    ROOM_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    USER_NO NUMBER,
    TITLE VARCHAR2(200),
    LAST_QUESTION CLOB,
    REG_DT DATE DEFAULT SYSDATE,
    UPD_DT DATE DEFAULT SYSDATE,
    LAST_CHAT_DT DATE,
    CONSTRAINT PK_AI_CHAT_ROOM PRIMARY KEY (ROOM_NO),
    CONSTRAINT FK_AI_CHAT_ROOM_USER FOREIGN KEY (USER_NO) REFERENCES TB_USER (USER_NO)
);

CREATE TABLE TB_AI_CHAT_LOG (
    LOG_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    ROOM_NO NUMBER,
    -- AI와 대화하는 유저 번호
    USER_NO NUMBER,
    -- 자동 분류된 법률 분야, 이혼/민법/형사 저문 변호사 등등 추천할 때 사용.
    -- 해당 값에도 상태 테이블 활용
    -- FIELD_CODE, CATEGORY_CODE은 이름만 다를 뿐, 변호사의 전문 분야 및 게시글의 카테고리는 동일한 코드 사용
    -- 법률 분야는 같기 때문에..
    CATEGORY_CODE VARCHAR2(20),
    -- 질문은 적당하게 한 두 문장
    QUESTION VARCHAR2(4000),
    -- 답변은 법률 관련이기 때문에 많이 길어질 수 있으므로 무제한.. 최대 4GB
    ANSWER CLOB,
    /*
    API 비용 계산할 때 사용
    ChatGPT API 같은 경우 토큰 요금(Token)의 비용을 매깁니다.
    한글 1글자 = 2~3토큰
    영어 단어 1개 = 1토큰
    사용자가 질문하고 답변을 받는 그 짧은 순간, 서버 내부에서 돈 계산이 일어나며,
    ex) 사용자: 사기죄 성립 요건이 뭐야? (약 20토큰) - 비용 1
    AI: 사기죄가 성립하려면.... (약 500~600토큰) - 비용 2
    이렇게 발생한 520~620 토큰을 TOKEN_USAGE 컬럼에 저장..
    
    이는 구독료의 책정의 기준이 되며, 인당 월 사용료와 api 비용을 합산하여 마진을 계산.
    혹은 무료/유료 차별화로 인해, 토큰 기준 정하기.
    */
    TOKEN_USAGE NUMBER DEFAULT 0,
    -- 등록 일시 사용자가 질문하고 AI가 답변을 완료해서 DB에 저장되는 순간.
    REG_DT DATE DEFAULT SYSDATE,
    -- RAG 관련 판례 목록(줄바꿈 구분 문자열). AI 답변 시 참고한 판례 저장.
    RELATED_CASES CLOB,
    -- AI 응답 속도 측정용도 처리 가능.. 이건 선택사항..
    -- ELAPSED_TIME   NUMBER,  -- 단위: 밀리초 (ms)
    CONSTRAINT PK_AI_CHAT_LOG PRIMARY KEY (LOG_NO),
    CONSTRAINT FK_AI_USER FOREIGN KEY (USER_NO) REFERENCES TB_USER (USER_NO),
    CONSTRAINT FK_AI_CHAT_LOG_ROOM FOREIGN KEY (ROOM_NO) REFERENCES TB_AI_CHAT_ROOM (ROOM_NO)
);

/* 5. 법률 상담 게시판 (질문) */
CREATE TABLE TB_BOARD (
    BOARD_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    -- 상담 법률 분야
    CATEGORY_CODE VARCHAR2(20) NOT NULL,
    -- 제목
    TITLE VARCHAR2(300) NOT NULL,
    -- 내용은 길 수 있으니 CLOB로 처리
    CONTENT CLOB NOT NULL,
    -- 작성자 (의뢰인) 번호
    WRITER_NO NUMBER NOT NULL,
    -- 비밀글 여부 - 핵심
    SECRET_YN CHAR(1) DEFAULT 'N',
    -- 관리자에 의한 블라인드 처리 여부
    BLIND_YN CHAR(1) DEFAULT 'N',
    -- 조회수
    HIT_CNT NUMBER DEFAULT 0,
    -- 작성일자
    REG_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_BOARD PRIMARY KEY (BOARD_NO),
    CONSTRAINT FK_BOARD_WRITER FOREIGN KEY (WRITER_NO) REFERENCES TB_USER (USER_NO)
);

/* 5-1. 게시판 답변 (변호사만 작성 가능) */
CREATE TABLE TB_BOARD_REPLY (
    -- 댓글의 고유 번호
    REPLY_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    -- 어떤 글에 대한 답변인가 (FK)
    BOARD_NO NUMBER NOT NULL,
    -- 댓글을 단 변호사의 고유번호 = 유저 번호
    WRITER_NO NUMBER NOT NULL,
    -- 답변 내용은 4000바이트로 제한
    CONTENT VARCHAR2(4000) NOT NULL,
    --  의뢰인 채택 여부(변호인 채택은 없으나 글을 확정지어서 더이상 수정이 안되게 해야하므로 사용)
    SELECTION_YN CHAR(1) DEFAULT 'N',
    -- 등록일자.
    REG_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_BOARD_REPLY PRIMARY KEY (REPLY_NO),
    CONSTRAINT FK_REPLY_BOARD FOREIGN KEY (BOARD_NO) REFERENCES TB_BOARD (BOARD_NO),
    CONSTRAINT FK_REPLY_WRITER FOREIGN KEY (WRITER_NO) REFERENCES TB_LAWYER_INFO (USER_NO)
);

select * from TB_BOARD_REPLY;

/* 6. 결제 정보 (PG사 연동)
유저가 변호사에게 결제하려고 처리..
*/
CREATE TABLE TB_PAYMENT (
    -- 주문번호(UUID)
    -- 인덱스로 번호 처리하지 않은 이유 : 결제 URL에 숫자로 다른 결제 창을 볼 수 있기 때문에 무작위 난수 설정..
    -- PG사는 순수한 UUID 문자열을 원하기 때문에 서로 확인이 가능하려면 UUID로 처리해야 함.
    PAY_NO VARCHAR2(50) NOT NULL,
    -- 결제자 (의뢰인) / OR 변호사의 월 구독료
    USER_NO NUMBER NOT NULL,
    -- 결제 대상 (상담료면 '변호사번호', 구독료면 'NULL')
    TARGET_NO NUMBER,
    -- 결제 유형 ('CONSULT', 'SUB') - 상담/구독 [분기점]
    PAY_TYPE VARCHAR2(20) NOT NULL,
    -- 결제 금액
    AMOUNT NUMBER NOT NULL,
    -- CARD, KAKAO, 무통장입금 등등
    PAY_METHOD VARCHAR2(20), -- CARD, KAKAO
    -- P01:결제대기, P02:결제완료, P03:취소, P99 (오류): 잔액 부족 등으로 실패함 등등
    -- 상태 코드 테이블 사용
    PAY_STATUS VARCHAR2(20) DEFAULT 'P01',
    -- 결제 날짜
    PAY_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_PAYMENT PRIMARY KEY (PAY_NO),
    CONSTRAINT FK_PAY_USER FOREIGN KEY (USER_NO) REFERENCES TB_USER (USER_NO)
);

select * from TB_PAYMENT;

/* 7. 1:1 (사용자:변호사) - 채팅방 (사건 진행 상태 포함) */
CREATE TABLE TB_CHAT_ROOM (
    -- UUID (보안에 유리) - 결제창과 동일한 이유
    ROOM_ID VARCHAR2(50) NOT NULL,
    -- 의뢰인 NO
    USER_NO NUMBER NOT NULL,
    -- 변호사 NO
    LAWYER_NO NUMBER NOT NULL,
    -- 채팅방 상태 (종료 여부)
    -- 공통 상태 테이블 사용 X (직접 관리 예정) - 왜?
    STATUS_CODE VARCHAR2(20) DEFAULT 'OPEN',
    -- 사건 진행 단계 (요청->접수->진행->완료)
    -- 공통 코드 그룹 사용 예정
    PROGRESS_CODE VARCHAR2(20) DEFAULT 'ST01',
    -- 생성일 (결제 직후)
    REG_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_CHAT_ROOM PRIMARY KEY (ROOM_ID),
    CONSTRAINT FK_CHAT_USER FOREIGN KEY (USER_NO) REFERENCES TB_USER (USER_NO),
    CONSTRAINT FK_CHAT_LAWYER FOREIGN KEY (LAWYER_NO) REFERENCES TB_LAWYER_INFO (USER_NO)
);

select * from TB_CHAT_ROOM;

/* 7-1. 채팅 메시지 (파일 전송 지원) */
CREATE TABLE TB_CHAT_MESSAGE (
    MSG_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    -- 소속된 방 번호(UUID)
    ROOM_ID VARCHAR2(50) NOT NULL,
    -- 발신자
    SENDER_NO NUMBER NOT NULL,
    -- 텍스트 내용
    MESSAGE VARCHAR2(4000),
    -- 메시지의 타입 : TEXT, IMG, FILE 등
    -- 상태 코드 테이블 사용
    MSG_TYPE VARCHAR2(10) DEFAULT 'TEXT',
    -- 파일 업로드 주소 (이미지/PDF)
    FILE_URL VARCHAR2(500),
    -- 읽음 여부
    READ_YN CHAR(1) DEFAULT 'N',
    -- 전송 시간
    SEND_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_CHAT_MESSAGE PRIMARY KEY (MSG_NO),
    CONSTRAINT FK_MSG_ROOM FOREIGN KEY (ROOM_ID) REFERENCES TB_CHAT_ROOM (ROOM_ID)
);

select * from TB_CHAT_MESSAGE;

/* 8. 알림 (웹 푸시 내역) */
CREATE TABLE TB_NOTIFICATION (
    ALARM_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    -- 받는 사람
    USER_NO NUMBER NOT NULL,
    -- 알림 제목
    MSG_TITLE VARCHAR2(100),
    -- 알림 내용
    MSG_CONTENT VARCHAR2(500),
    -- 읽음 여부
    READ_YN CHAR(1) DEFAULT 'N',
    -- 보낸 일
    REG_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_NOTIFICATION PRIMARY KEY (ALARM_NO),
    CONSTRAINT FK_NOTI_USER FOREIGN KEY (USER_NO) REFERENCES TB_USER (USER_NO)
);

select * from TB_NOTIFICATION;

-- 1. 알림 테이블에 목적지(채팅방) 컬럼 추가 (NULL 허용 필수!)
ALTER TABLE TB_NOTIFICATION ADD ROOM_ID VARCHAR2(50);

-- 2. TB_CHAT_ROOM 테이블과 연결(참조)하는 외래키(FK) 설정
-- ON DELETE SET NULL : 만약 채팅방이 폭파되면, 알림 테이블의 ROOM_ID만 NULL로 만들고 알림 내역 자체는 남겨둠 (실무 국룰)
ALTER TABLE TB_NOTIFICATION
ADD CONSTRAINT FK_NOTI_ROOM FOREIGN KEY (ROOM_ID) REFERENCES TB_CHAT_ROOM (ROOM_ID) ON DELETE SET NULL;

/* 9. 후기 및 평점 */
CREATE TABLE TB_REVIEW (
    REVIEW_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    -- 변호사 번호
    LAWYER_NO NUMBER NOT NULL,
    -- 작성사(일반 사용자) 번호
    WRITER_NO NUMBER NOT NULL,
    -- 점수
    RATING NUMBER(2, 1) DEFAULT 5.0,
    -- 작성 세부 내용
    CONTENT VARCHAR2(1000),
    -- 작성일
    REG_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_REVIEW PRIMARY KEY (REVIEW_NO),
    CONSTRAINT FK_REVIEW_LAWYER FOREIGN KEY (LAWYER_NO) REFERENCES TB_LAWYER_INFO (USER_NO),
    CONSTRAINT FK_REVIEW_WRITER FOREIGN KEY (WRITER_NO) REFERENCES TB_USER (USER_NO)
);

select * from TB_REVIEW;

-- 10. 보안 감사 로그 (관리자용)
/*
누가, 어디서, 무엇으로 들어왔는가?
사용자가 클릭을 할 때(API 호출)마다 묵묵히 기록을 남기는 테이블
주로 Spring AOP.txt(Aspect Oriented Programming) 기술을 이용해서 개발자가 일일이 코드를 짜지 않아도
자동으로 쌓이게 처리!

누가 (Who)
USER_NO : 유저 아이디
REQ_IP : 접속 IP 주소
USER_AGENT : 어떤 브라우저/기기로 접속했는가?

언제 (When)
REG_DT : 행위 발생 날짜와 시간

무엇을 (What)
REQ_URL : 어떤 펭지ㅣ나 API에 접근했는가

*/
CREATE TABLE TB_ACCESS_LOG (
    LOG_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    -- 요청 추적 ID
    -- 사용자의 한 번 클릭(요청)에 부여되는 고유한 영수증 번호(UUID)
    -- 입구세어 UUID 생성 --> 나갈 때까지 부여되는 번호
    -- DB 로그와 서버 파일 로그를 연결하는 다리 역할
    /*
    사용 예시:
    1) 사용자가 결제 오류났다고 신고
    2) 개발자는 이 테이블에서 해당 시간대의 TRACE_ID를 찾기 (예: a1b2-c3d4...)
    3) 개발자는 서버에 접속해서 로그 파일(Log File)을 열고 해당 명을 검색
    4) 거기에 적혀있는 상세한 에러 내용(Stack Trace)을 보고 문제 해결!
    */
    TRACE_ID VARCHAR2(50),
    REQ_IP VARCHAR2(50),
    REQ_URI VARCHAR2(200),
    -- 접속 환경
    -- 사용자가 어떤 브라우저, 어떤 기기로 접속했는지 알려주는 정보
    -- 예시: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/...
    -- 기기별 오류 분석에 용이
    USER_AGENT VARCHAR2(200),
    -- FK 안검! (탈퇴해도 로그는 남김 / 속도를 위해)
    -- 접속 로그는 1초에 수십, 수백 건이 쌓일 수 있음!
    -- FK를 걸면 저장할 때마다 회원이 진짜 있는지 확인 검사하느라 DB가 느려짐
    -- 로그는 빠르게 받아 적는 것이 최우선이라 검사 절차 생략
    USER_NO NUMBER,
    STATUS_CODE NUMBER(3), -- 상태 코드 (200, 404, 500 등)
    EXEC_TIME NUMBER, -- 실행 시간 (ms 단위)
    ERROR_MSG VARCHAR2(500), -- 에러 메시지 (요약)
    REG_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_ACCESS_LOG PRIMARY KEY (LOG_NO)
);
-- 데이터가 너무 많으니, 인덱스는 날짜에만...!
CREATE INDEX IX_ACCESS_LOG_DATE ON TB_ACCESS_LOG (REG_DT);
-- 날짜별 조회
CREATE INDEX IX_ACCESS_LOG_STATUS ON TB_ACCESS_LOG (STATUS_CODE);
-- 에러(500) 조회
commit;

select * from TB_ACCESS_LOG;

drop table TB_ACCESS_LOG;

/* 11. 관리자 중요 감사 로그 (Audit Log - 보안 필수!)
관리자 ID, 접속 IP, ACTION_TYPE 판별, TARGET_INFO 생성..

누가 (Who)
ADMIN_ID : 관리자 아이디
REQ_OP : 접속 IP 주소
USER_AGENT : 어떤 브라우저/기기

언제 (When)
REG_DT : 행위가 발생한 날짜와 시간

무엇을 (WHAT)
ACTION_TYPE : 행위 카테고리(삭제, 수정, 조회, 다운로드 등)
REASON : 수행 사유
ERROR_YN / ERROR_MSG : 성공 또는 실패, 실패의 경우 왜 실패했는지 요약
*/
CREATE TABLE TB_ADMIN_AUDIT (
    -- 로그의 고유 번호 (인덱스 처리)
    AUDIT_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    -- 행위자(관리자)의 고유 식별 번호
    ADMIN_NO NUMBER NOT NULL,
    -- 행위자(관리자)의 로그인 아이디 (텍스트)
    ADMIN_ID VARCHAR2(50),
    -- 행동 유형 (DOWNLOAD, DELETE_POST, FORCE_WITHDRAWAL, VIEW_PRIVACY)
    ACTION_TYPE VARCHAR2(30) NOT NULL,
    -- 대상 정보 (예: '2026_결제내역.xls', '회원(user_no:105)')
    TARGET_INFO VARCHAR2(200) NOT NULL,
    -- 수행 사유 (개인정보 조회/다운로드 시 필수 입력)
    REASON VARCHAR2(200),
    -- 서버 로그 파일과 연결할 고리 (UUID)
    TRACE_ID VARCHAR2(50),
    -- 성공(N)/실패(Y) -> Severity 대체
    ERROR_YN CHAR(1) DEFAULT 'N',
    -- 에러 났으면 간단한 메시지 (Stack Trace는 파일에!)
    ERROR_MSG VARCHAR2(500),
    -- 사고 터지면 IP 추적해야 함
    REQ_IP VARCHAR2(50),
    -- 브라우저/OS 정보
    USER_AGENT VARCHAR2(200),
    -- 로그 활동 날짜
    REG_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_ADMIN_AUDIT PRIMARY KEY (AUDIT_NO)
    -- 관리자는 탈퇴 개념이 거의 없지만, 무결성을 위해 FK 걸어둠
    -- CONSTRAINT FK_AUDIT_ADMIN FOREIGN KEY (ADMIN_NO) REFERENCES TB_USER(USER_NO)
);
-- "다운로드 이력만 가져와!" 할 때 빠르게 검색 속도를 위한 인덱스 처리.
CREATE INDEX IX_ADMIN_AUDIT_ACTION ON TB_ADMIN_AUDIT (ACTION_TYPE);

drop table TB_ADMIN_AUDIT;

select * from TB_ADMIN_AUDIT;

commit;

-- 12. IP 블랙리스트 (접속 차단용)
CREATE TABLE TB_IP_BLACKLIST (
    -- 차단할 IP (예: 192.168.0.1)
    IP_ADDR VARCHAR2(50) NOT NULL,
    -- 차단 사유 (예: DDoS 공격 시도)
    REASON VARCHAR2(200) NOT NULL,
    -- 차단한 관리자 번호
    ADMIN_NO NUMBER NOT NULL,
    -- 차단 일시
    BLOCK_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_IP_BLACKLIST PRIMARY KEY (IP_ADDR)
);

select * from TB_IP_BLACKLIST;

/* 14. 금지어 관리 (욕설/비방 필터링) */
CREATE TABLE TB_BANNED_WORD (
    WORD_NO NUMBER GENERATED BY DEFAULT AS IDENTITY,
    -- 금지어 (예: 시*놈, 도박)
    WORD VARCHAR2(100) NOT NULL,
    -- 등록한 관리자
    ADMIN_NO NUMBER NOT NULL,
    -- 등록한 날짜
    REG_DT DATE DEFAULT SYSDATE,
    CONSTRAINT PK_BANNED_WORD PRIMARY KEY (WORD_NO),
    -- 중복 등록 방지
    CONSTRAINT UQ_BANNED_WORD UNIQUE (WORD)
);

select * from TB_BANNED_WORD;

ALTER TABLE TB_BANNED_WORD ADD REASON VARCHAR2(200);

commit;
-- 일병 통계 (대시보드용)
CREATE TABLE TB_DAILY_STATS (
    -- 날짜 (20260205)
    STAT_DT CHAR(8) NOT NULL,
    -- 신규 가입
    JOIN_CNT NUMBER DEFAULT 0,
    -- 접속자
    VISIT_CNT NUMBER DEFAULT 0,
    -- 상담 요청
    REQ_CNT NUMBER DEFAULT 0,
    CONSTRAINT PK_DAILY_STATS PRIMARY KEY (STAT_DT)
);

select * from TB_DAILY_STATS;

/* 프레시 토큰 관리 (중복 로그인 방지 및 보안 강화) */
CREATE TABLE TB_REFRESH_TOKEN (
    TOKEN_ID NUMBER GENERATED BY DEFAULT AS IDENTITY,
    USER_NO NUMBER NOT NULL,
    -- 암호화된 Refresh Token 값
    TOKEN_VALUE VARCHAR2(500) NOT NULL,
    -- 만료 일시
    EXPIRE_DT DATE NOT NULL,
    CONSTRAINT PK_REFRESH_TOKEN PRIMARY KEY (TOKEN_ID),
    CONSTRAINT FK_TOKEN_USER FOREIGN KEY (USER_NO) REFERENCES TB_USER (USER_NO)
);

select * from TB_REFRESH_TOKEN;

/*
AOP.txt 수행할 로그 시퀀스(흐름)

1. 낚아채기 시작 : 관리자 API 호출
2. ID 발급 : TRACE_ID 생성 (MDC 등을 활용해 쓰레드에 저장)
3. 환경 수집 : REQ_IP, USER_AGENT를 헤더에서 추출
4. 비즈니스 실행 : 실제 DB 작업(회우너 정지 등) 수행
5. 결과 판단
- 성공 시 : TRAGET_INFO를 요약하여 TB_ADMIN_ADUIT에 저장
- 실패 시 : 에러 요약을 ERROR_MSG에 담고 ERROR_YN = 'Y'로 저장
6. 종료 : TRACE_ID를 응답 헤더에 담아 클라이언트에 전달 (필요시)

*/

/* 15. 사건 일정 관리 (풀캘린더 연동용)
- 누가(어떤 방에서) / 언제 / 무슨 일정이 있는지 기록하는 테이블입니다.
*/
CREATE TABLE TB_CALENDAR_EVENT (
                                   EVENT_NO      NUMBER GENERATED BY DEFAULT AS IDENTITY,
    -- 어떤 사건(채팅방)의 일정인가?
                                   ROOM_ID       VARCHAR2(50) NOT NULL,
    -- 일정 관련 의뢰인 (조회 속도 향상을 위해 추가)
                                   USER_NO       NUMBER NOT NULL,
    -- 일정 관련 변호사 (조회 속도 향상을 위해 추가)
                                   LAWYER_NO     NUMBER NOT NULL,

-- 일정 제목 (예: "1차 공판 기일", "대면 상담")
TITLE VARCHAR2(200) NOT NULL,
-- 시작 날짜 (YYYY-MM-DD 또는 YYYY-MM-DD HH:mm:ss 형식 저장)
START_DATE VARCHAR2(50) NOT NULL,
-- 캘린더 색상 (예: #3b82f6 (파란색), #f59e0b (주황색))
COLOR_CODE VARCHAR2(20) DEFAULT '#3b82f6',

-- 등록 일시
REG_DT        DATE DEFAULT SYSDATE,

                                   CONSTRAINT PK_CALENDAR_EVENT PRIMARY KEY (EVENT_NO),
                                   CONSTRAINT FK_CAL_ROOM FOREIGN KEY (ROOM_ID) REFERENCES TB_CHAT_ROOM(ROOM_ID),
                                   CONSTRAINT FK_CAL_USER FOREIGN KEY (USER_NO) REFERENCES TB_USER(USER_NO),
                                   CONSTRAINT FK_CAL_LAWYER FOREIGN KEY (LAWYER_NO) REFERENCES TB_LAWYER_INFO(USER_NO)
);

-- 내 일정을 빨리 찾기 위한 인덱스
CREATE INDEX IX_CAL_USER ON TB_CALENDAR_EVENT (USER_NO);

-- 외래키(FK) 끊어버리기
ALTER TABLE TB_CALENDAR_EVENT DROP CONSTRAINT FK_CAL_ROOM;

ALTER TABLE TB_CALENDAR_EVENT DROP CONSTRAINT FK_CAL_LAWYER;

-- 개인 일정일 땐 방 번호랑 변호사 번호 안 넣어도 되게(NULL) 허용
ALTER TABLE TB_CALENDAR_EVENT MODIFY ROOM_ID NULL;

ALTER TABLE TB_CALENDAR_EVENT MODIFY LAWYER_NO NULL;

select * from TB_ADMIN_AUDIT;

select * from TB_USER;

UPDATE TB_USER SET ROLE_CODE = 'ROLE_OPERATOR' WHERE USER_NO = 43;

COMMIT;

SELECT * FROM TB_ACCESS_LOG;

alter table TB_ACCESS_LOG MODIFY ERROR_MSG VARCHAR2(4000);

COMMIT;

DELETE FROM TB_ACCESS_LOG WHERE REG_DT IS NULL;

COMMIT;

select * from TB_ACCESS_LOG;

-- 방법 A: 과거의 찜찜한 빈 깡통 로그들을 다 날려버리기 (추천)
DELETE FROM TB_ACCESS_LOG
WHERE
    STATUS_CODE IS NULL
    OR EXEC_TIME IS NULL;

COMMIT;

select * from TB_BANNED_WORD;

-- 2. 6일 전 (2월 17일) - 2명 접속
INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-17-001',
        '111.222.33.44',
        '/api/main',
        'Mozilla/5.0 Windows NT 10.0',
        1,
        200,
        45,
        NULL,
        TO_DATE(
            '2026-02-17 10:30:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-17-002',
        '111.222.33.45',
        '/api/login',
        'Mozilla/5.0 Mac OS X',
        2,
        200,
        120,
        NULL,
        TO_DATE(
            '2026-02-17 11:15:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

-- 3. 5일 전 (2월 18일) - 3명 접속 (해킹 시도 에러 1건 포함!)
INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-18-001',
        '192.168.1.10',
        '/api/admin/users',
        'Mozilla/5.0 Windows NT 10.0',
        NULL,
        403,
        15,
        '권한 없음',
        TO_DATE(
            '2026-02-18 09:20:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-18-002',
        '192.168.1.11',
        '/api/board',
        'Mozilla/5.0 iPhone',
        3,
        200,
        30,
        NULL,
        TO_DATE(
            '2026-02-18 14:00:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-18-003',
        '192.168.1.12',
        '/api/main',
        'Mozilla/5.0 Linux',
        4,
        200,
        22,
        NULL,
        TO_DATE(
            '2026-02-18 18:30:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

-- 4. 4일 전 (2월 19일) - 2명 접속
INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-19-001',
        '10.0.0.5',
        '/api/lawyer',
        'Mozilla/5.0 Windows NT 10.0',
        5,
        200,
        50,
        NULL,
        TO_DATE(
            '2026-02-19 10:10:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-19-002',
        '10.0.0.6',
        '/api/lawyer/detail',
        'Mozilla/5.0 Mac OS X',
        5,
        200,
        60,
        NULL,
        TO_DATE(
            '2026-02-19 10:15:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

-- 5. 3일 전 (2월 20일) - 2명 접속 (서버 내부 500 에러 1건 포함!)
INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-20-001',
        '172.16.0.1',
        '/api/login',
        'PostmanRuntime/7.32.3',
        NULL,
        500,
        210,
        'NullPointerException',
        TO_DATE(
            '2026-02-20 02:00:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-20-002',
        '172.16.0.2',
        '/api/main',
        'Mozilla/5.0 Android',
        6,
        200,
        18,
        NULL,
        TO_DATE(
            '2026-02-20 12:00:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

-- 6. 2일 전 (2월 21일) - 4명 접속 (주말 접속량 증가)
INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-21-001',
        '8.8.8.8',
        '/api/chat',
        'Mozilla/5.0 Windows NT 10.0',
        7,
        200,
        100,
        NULL,
        TO_DATE(
            '2026-02-21 09:00:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-21-002',
        '8.8.8.8',
        '/api/chat/send',
        'Mozilla/5.0 Windows NT 10.0',
        7,
        200,
        35,
        NULL,
        TO_DATE(
            '2026-02-21 09:05:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-21-003',
        '8.8.4.4',
        '/api/main',
        'Mozilla/5.0 iPhone',
        8,
        200,
        25,
        NULL,
        TO_DATE(
            '2026-02-21 15:30:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-21-004',
        '8.8.4.4',
        '/api/board',
        'Mozilla/5.0 iPhone',
        8,
        200,
        40,
        NULL,
        TO_DATE(
            '2026-02-21 16:00:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

-- 7. 1일 전 (2월 22일) - 5명 접속
INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-22-001',
        '211.111.22.33',
        '/api/main',
        'Mozilla/5.0 Windows NT 10.0',
        9,
        200,
        11,
        NULL,
        TO_DATE(
            '2026-02-22 08:00:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-22-002',
        '211.111.22.34',
        '/api/lawyer',
        'Mozilla/5.0 Android',
        10,
        200,
        45,
        NULL,
        TO_DATE(
            '2026-02-22 09:15:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-22-003',
        '211.111.22.35',
        '/api/consultation',
        'Mozilla/5.0 Mac OS X',
        11,
        200,
        32,
        NULL,
        TO_DATE(
            '2026-02-22 13:00:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-22-004',
        '211.111.22.36',
        '/api/admin/users',
        'curl/7.68.0',
        NULL,
        403,
        10,
        '접근 거부',
        TO_DATE(
            '2026-02-22 15:45:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

INSERT INTO
    TB_ACCESS_LOG (
        TRACE_ID,
        REQ_IP,
        REQ_URI,
        USER_AGENT,
        USER_NO,
        STATUS_CODE,
        EXEC_TIME,
        ERROR_MSG,
        REG_DT
    )
VALUES (
        'TRC-22-005',
        '211.111.22.37',
        '/api/main',
        'Mozilla/5.0 Windows NT 10.0',
        12,
        200,
        19,
        NULL,
        TO_DATE(
            '2026-02-22 21:00:00',
            'YYYY-MM-DD HH24:MI:SS'
        )
    );

COMMIT;

select * from TB_USER;

delete from TB_USER WHERE USER_NO = 8;

SELECT
    'SELECT ''' || table_name || ''' AS TBL, COUNT(*) AS CNT FROM ' || table_name || ' WHERE USER_NO = 8 HAVING COUNT(*) > 0' AS QUERY
FROM user_tab_cols
WHERE
    column_name = 'USER_NO'
    AND table_name != 'TB_USER';
-- 원본 테이블 제외

SELECT * FROM TB_USER;

update tb_user set ROLE_CODE = 'ROLE_USER' where user_no = 41;

COMMIT;

delete from TB_ACCESS_LOG where reg_dt is null;

commit;

select * from board_file;

CREATE TABLE board_file (
    file_no NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- Oracle의 자동증가 방식
    board_no NUMBER NOT NULL, -- 게시글 번호와 연결
    origin_name VARCHAR2(255) NOT NULL, -- 원래 파일 이름
    save_name VARCHAR2(255) NOT NULL, -- 저장된 파일 이름
    reg_dt DATE DEFAULT SYSDATE -- 등록일 (Oracle은 SYSDATE 사용)
);

ALTER TABLE BOARD_FILE ADD (FILE_PATH VARCHAR2(500));

ALTER TABLE TB_BOARD ADD IS_NICKNAME_VISIBLE NUMBER(1) DEFAULT 0;

ALTER TABLE TB_BOARD ADD NICKNAME_VISIBLE_YN CHAR(1) DEFAULT 'N';

ALTER TABLE TB_BOARD DROP COLUMN IS_NICKNAME_VISIBLE;

ALTER TABLE TB_BOARD ADD REPLY_CNT NUMBER DEFAULT 0;

ALTER TABLE TB_BOARD ADD MATCH_YN CHAR(1) DEFAULT 'N';

ALTER TABLE TB_REVIEW ADD REPLY_NO NUMBER;

ALTER TABLE TB_REVIEW ADD WRITER_NM VARCHAR2(50);

alter table tb_user modify nick_nm unique;

commit;

select * from TB_ACCESS_LOG;

delete from tb_user where user_no = 86;

commit;

select * from tb_user;

update tb_user set nick_nm = '킹반인2' where user_no = 64;

commit;

select * from tb_user;

select * from TB_LAWYER_INFO;

delete from tb_user where user_no = 20003;

select * From TB_BOARD;

SELECT * FROM TB_ACCESS_LOG;

ALTER TABLE TB_USER ADD PROFILE_IMG VARCHAR2(500);

select * from TB_CHAT_ROOM;

select * from TB_IP_BLACKLIST;

select * from tb_lawyer_info;

commit;

select * from tb_user;

drop table TB_CUSTOMER_INQUIRY;

-- ==================================================================================
-- TB_CUSTOMER_INQUIRY (고객 문의 테이블)
-- ==================================================================================

CREATE TABLE TB_CUSTOMER_INQUIRY
(
    ID             NUMBER          GENERATED AS IDENTITY PRIMARY KEY,
    WRITER_NO      NUMBER          NOT NULL,                            -- 작성자 USER_NO (FK)
    TYPE           VARCHAR2(100)   NOT NULL,                            -- 문의 유형 (계정/결제/서비스 등)
    TITLE          VARCHAR2(300)   NOT NULL,                            -- 문의 제목
    CONTENT        CLOB            NOT NULL,                            -- 문의 내용
    STATUS         VARCHAR2(20)    DEFAULT '대기' NOT NULL,             -- 대기 / 답변완료
    ANSWER_CONTENT CLOB,                                                -- 관리자 답변 내용
    ANSWERED_BY    VARCHAR2(100),                                       -- 답변한 관리자 이름
    ANSWERED_AT    TIMESTAMP,                                           -- 답변 일시
    CREATED_AT     TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,       -- 등록 일시
    UPDATED_AT     TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,       -- 수정 일시

-- 외래키 제약조건
CONSTRAINT FK_INQUIRY_USER FOREIGN KEY (WRITER_NO)
        REFERENCES TB_USER (USER_NO)
);

-- ==================================================================================
-- 인덱스
-- ==================================================================================

-- 상태별 조회 (대기 목록 필터링)
CREATE INDEX IX_INQUIRY_STATUS ON TB_CUSTOMER_INQUIRY (STATUS);

-- 작성자별 조회 (내 문의 목록)
CREATE INDEX IX_INQUIRY_WRITER ON TB_CUSTOMER_INQUIRY (WRITER_NO);

-- 날짜순 정렬 (최신순 정렬)
CREATE INDEX IX_INQUIRY_CREATED ON TB_CUSTOMER_INQUIRY (CREATED_AT DESC);

-- ==================================================================================
-- 트리거 — UPDATED_AT 자동 갱신
-- UPDATE 시 DEFAULT SYSDATE는 적용 안 됨 → 트리거로 강제 갱신
-- ==================================================================================

CREATE OR REPLACE TRIGGER TRG_INQUIRY_UPDATED_AT
    BEFORE UPDATE ON TB_CUSTOMER_INQUIRY
    FOR EACH ROW
BEGIN
    :NEW.UPDATED_AT := SYSTIMESTAMP;
END;
/
SELECT * FROM TB_CUSTOMER_INQUIRY;

SELECT * FROM TB_ACCESS_LOG ORDER BY LOG_NO DESC;

SELECT DISTINCT ROLE_CODE FROM TB_USER;

DELETE FROM TB_REFRESH_TOKEN;

COMMIT;

select * from TB_REFRESH_TOKEN;

ALTER TABLE TB_REFRESH_TOKEN
MODIFY TOKEN_VALUE VARCHAR2(64) NOT NULL;

SELECT * FROM TB_REFRESH_TOKEN;

SELECT * FROM TB_USER;