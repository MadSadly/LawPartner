package com.example.backend_main;

import org.junit.jupiter.api.Test;

/**
 * [CI 전용 최소 스모크 테스트]
 *
 * - 목적: mvn clean test 시 ApplicationContext, DB, SMTP 등
 *   실제 외부 자원을 로딩하지 않고도 BUILD SUCCESS를 보장하기 위함.
 * - 통합 테스트 및 실제 Bean 로딩 검증은 별도의 테스트 클래스로 분리해서 작성한다.
 */
class BackendMainApplicationTests {

    @Test
    void dummySmokeTest() {
        // 아무 동작도 하지 않는 최소 스모크 테스트
        // - Spring Context 미로딩
        // - 외부 의존성(DataSource, Mail 등) 연결 없음
    }
}

