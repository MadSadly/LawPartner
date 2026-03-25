package com.example.backend_main.common.util;

/*
개인정보 마스킹 유틸리티
마스킹 정책 변경 시 이 클래스만 수정하면 됩니다.
*/
public class MaskingUtil {

    private MaskingUtil() {}

    /*
     아이디 마스킹
     - 길이 >= 4 : 앞 2자리 + '*' 반복 + 뒤 1자리
       예) hong        → ho*g
           lawuser123  → la*******3
       - 길이 < 4  : 전체 마스킹
       예) ab          → ***
     */
    public static String maskUserId(String userId) {
        if (userId == null || userId.length() < 4) {
            return "***";
        }
        String prefix = userId.substring(0, 2);
        String suffix = userId.substring(userId.length() - 1);
        String middle = "*".repeat(userId.length() - 3);
        return prefix + middle + suffix;
    }

    /*
     이메일 마스킹
     - 로컬 파트 길이 >= 3 : 앞 2자리 + '***' + '@' + 도메인
       예) hong@test.com    → ho***@test.com
           a@test.com       → ***@test.com
     - '@' 없는 경우: 전체 마스킹
    */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int atIdx = email.indexOf('@');
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx);

        if (local.length() < 3) {
            return "***" + domain;
        }
        return local.substring(0, 2) + "***" + domain;
    }
}
