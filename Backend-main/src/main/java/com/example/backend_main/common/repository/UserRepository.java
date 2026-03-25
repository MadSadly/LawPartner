package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/*
[UserRepository]
TB_USER 테이블에 접근하여 데이터를 넣고 빼는 역할을 하는 클래스
JpaRepository를 상속받아 기본적인 CRUD 기능을 자동으로 가지도록 처리!
*/
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // 1. 아이디로 회원 찾기 (로그인 및 관리자 조회용)
    Optional<User> findByUserId(String userId);

    // 2. 이메일로 회원 찾기 (아이디/비번 찾기용)
    Optional<User> findByEmail(String email);

    // 3. 아이디 중복 확인 (회원가입 USR-01 대응)
    boolean existsByUserId(String userId);

    // 4. 이메일 중복 확인 (회원가입 USR-01 대응)
    boolean existsByEmailHash(String emailHash);

    // 5. 번호 중복 확인
    boolean existsByPhoneHash(String phoneHash);

    // 6. 닉네임 중복 확인
    boolean existsByNickNm(String nickNm);

    int countByNickNmStartingWith(String nickNm);

    // 7. S99 상태가 아닌 유저들만 조회하기
    List<User> findAllByStatusCodeNot(String statusCode);

    // 8. 이메일 해시값으로 유저 찾기 (보안 검색용)
    Optional<User> findByEmailHash(String emailHash);

    // 9. 계정 찾기용 조회
    Optional<User> findByUserNmAndEmailHash(String userNm, String emailHash);

    Optional<User> findByUserIdAndUserNmAndEmailHash(String userId, String userNm, String emailHash);

    // 9-1. 임시 비밀번호 저장 시 PW_CHANGE_REQUIRED = 'Y' 업데이트
    @Modifying
    @Query("UPDATE User u SET u.pwChangeRequired = 'Y' WHERE u.userNo = :userNo")
    int updatePwChangeRequiredToY(@Param("userNo") Long userNo);

    // ==================================================================================
    // 📊 대시보드 통계용 쿼리 (성능 최적화)
    // ==================================================================================

    // 10. 기간별 가입자 수 (오늘/어제 비교용)
    long countByJoinDtBetween(LocalDateTime start, LocalDateTime end);

    // 11. 특정 상태 회원 수 (변호사 승인 대기: S02)
    long countByStatusCode(String statusCode);

    // 12. 일별 가입자 통계 (차트용)
    @Query(value = "SELECT TO_CHAR(JOIN_DT, 'YYYY-MM-DD') as \"date\", COUNT(*) as \"count\" " +
            "FROM TB_USER " +
            "WHERE JOIN_DT >= :sevenDaysAgo " +
            "GROUP BY TO_CHAR(JOIN_DT, 'YYYY-MM-DD')", nativeQuery = true)
    List<Map<String, Object>> findDailySignupStats(@Param("sevenDaysAgo") LocalDateTime sevenDaysAgo);
}
/*
레퍼지토리(Repository)란 무엇인가?
DB : 지하 식자재 창고
Repository : 식자재 창고 AI 관리자

@Repository와 extends JpaRepository<User, Long>의 역할은 무엇인가?
@Repository : DB와 연결된 실제 시민(Entity)을 선언하고, [TB_USER]라는 특정 구역(테이블)에 살 것임을 지정합니다.
extends JpaRepository<User, Long> : JpaRepository를 상속받아 기본적인 CRUD 기능을 자동으로 가지도록 처리!

#### JpaRepository<T, ID> ####
JpaRepository는 스프링 데이터 JPA에서 제공하는 인터페이스로, 기본적인 CRUD 기능을 자동으로 가지도록 처리합니다.
<T, ID> 괄호 안에 있는 T와 ID는 제네릭(Generic) 타입으로, 이 Repository가 전담해서 관리할 엔티티(Entity)의 타입과 기본키(PK)의 타입을 지정합니다.

T(Type) : 이 Repository가 전담해서 관리할 엔티티(Entity)의 타입을 지정합니다. 
    EX) User -> TB_USER
ID(Identifier) : 이 Repository가 전담해서 관리할 엔티티(Entity)의 기본키(PK)의 타입을 지정합니다. 
    EX) Long -> USER_NO (자바에서 Long 타입으로 선언이 되어있기 때문에 long로 선언)

검색 예시 
findById(1L) --> SELECT * FROM TB_USER WHERE USER_NO = 1

--> DTO가 아닌 Entity를 사용하는 이유 ?
Repository의 유일한 존재 이유는 DB(데이터베이스)와의 직접적인 통신입니다.
- 엔티티 : 실제 DB 테이블의 구조(컬럼, 타입, 제약조건)를 자바 코드로 완벽하게 본떠 만든 [거울]이자 [설계도]
- DTO : DB 구조와는 상관 X, 프론트엔드 화면이나 다른 계층으로 데이터를 포장해서 나르기 위한 [택배 상자]


위 처리를 통해 가짜 구현체(Proxy)를 만들어줍니다.
가짜 구현체(Proxy)의 역할은 무엇인가?
1. 실제 구현체(Impl)를 대신하여 데이터를 조회하고 저장하는 역할
2.    "     데이터의 조회 조건을 정의하고 조회하는 역할
3.    "     저장 조건을 정의하고 저장하는 역할
4.    "     삭제 조건을 정의하고 삭제하는 역할
5.    "     실수정 조건을 정의하고 수정하는 역할
6.    "     조회 조건을 정의하고 조회하는 역할
7.    "     장 조건을 정의하고 저장하는 역할

    #### 쿼리 메서드 (Query Methods) ####
    ]
코드 :findByUserId, existsByEmailHash, countByJoinDtBetween 등
원리 : 스프링 데이터 JAP는 메서드 이름에 적힌 [ 영어 단어의 규칙 ]을 분석하는 번역기를 가지고 있습니다.
결과 : 데이터베이스에 접근하여 데이터를 조회하고 저장하는 역할을 합니다.

1) 개발자가 findByUserId(String userId) 라고 적으면, 스프링 데이터 JAP는 자동으로 아래 SQL 쿼리를 생성합니다.
SELECT * FROM TB_USER WHERE USER_ID = :userId

2) 개발자가 existsByEmailHash(String emailHash) 라고 적으면, 스프링 데이터 JAP는 자동으로 아래 SQL 쿼리를 생성합니다.
SELECT COUNT(*) FROM TB_USER WHERE EMAIL_HASH = :emailHash

3) 개발자가 countByJoinDtBetween(LocalDateTime start, LocalDateTime end) 라고 적으면, 스프링 데이터 JAP는 자동으로 아래 SQL 쿼리를 생성합니다.
SELECT COUNT(*) FROM TB_USER WHERE JOIN_DT BETWEEN :start AND :end

위 DB 쿼리를 쏜 후 결과를 User 엔티티에 담아서 돌려줍니다.
--> 개발자는 쿼리를 단 한 줄도 짤 필요가 없으며, 이름만 규칙에 맞게 잘 지으면 됩니다.


    #### JPQL (Java Persistence Query Language) ####

코드 : @Query("UPDATE User u SET u.pwChangeRequired = 'Y' WHERE u.userNo = :userNo")
원리 : 메서드 이름만으로 조건을 만들기 너무 길어지니, 특정 필드만 부분 업데이트 할 때만 사용    
결과 : DB의 테이블이 아니라 자바의 엔티티 클래스(User)에 접근하여 데이터를 수정하는 역할을 합니다.

1) 개발자가 자바 문법을 기준으로 쿼리 작성
테이블 TB_USER이 아닌 클래스 User에 접근하여 컬럼 PW_CHANGE_REQUIRED이 
아닌 필드 pwChangeRequired에 접근하여 데이터를 수정하는 역할을 합니다.

2) JPA가 이 JPQL을 읽고, 현재 연결된 DB(Oracle, MySQL 등)의 방언에 맞춰서 진짜 SQL로 실시간 번역
예시 : UPDATE TB_USER SET PW_CHANGE_REQUIRED = 'Y' WHERE USER_NO = :userNo

3) 쿼리는 개발자가 통제, 나중에 DB를 Oracle에서 MySQL로 바꾸더라도 쿼리 자체는 변경할 필요가 없습니다.
--> 강력한 유지보수성을 얻을 수 있음

참고) @Modifying : JPA에게 이건 조회(SELECT)가 아니라 데이터 변경(UPDATE/DELETE)이다! 라고 알려주며, 
DB 구조를 건드려라! 라고 허가증을 내어주는 필수 어노테이션


    #### Native Query (원시 쿼리) ####

코드 : @Query(value = "SELECT * FROM TB_USER WHERE USER_NO = :userNo", nativeQuery = true)
원리 : DB 특정 벤더(Oracle)에만 있는 고유 함수(TO_CHAR, COUNT 등)를  써야하거나, 수십 개의 테이블을 JOIN하는 극도로 복잡한
통계 쿼리를 짜야할 때 사용

1) nativeQuery = true 옵션을 주면, JPA가 자동으로 아래 SQL 쿼리를 생성합니다.
SELECT * FROM TB_USER WHERE USER_NO = :userNo

2) JPA는 [이 쿼리는 내 번역기 능력을 벗어났으니, 개발자가 쓴 글자 토시 하나 안 바꾸고 DB에 그대로 직통으로 꽂아 넣겠다 !]
라고 판단하며, 무조건 실제 DB 테이블명(TB_USER)과 컬럼명(USER_NO)을 그대로 사용합니다.

3) 성능이 가장 빠르고, 어떤 복잡한 쿼리도 가능
단, 개발자가 모든 컬럼명과 테이블명을 정확히 알고 있어야 하며, 
Oracle에서 MySQL로 바꾸게 되면 TO_CHAR 등의 함수를 사용할 수 없습니다.


*/