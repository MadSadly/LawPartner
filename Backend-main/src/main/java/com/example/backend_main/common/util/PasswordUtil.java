package com.example.backend_main.common.util;

import java.security.SecureRandom;

public final class PasswordUtil {

    private static final int TEMP_PASSWORD_LENGTH = 16;

    private PasswordUtil() {
    }

    public static String generateTempPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "!@#$%^&*-";
        String allChars = upper + lower + digits + special;

        SecureRandom random = new SecureRandom();
        char[] password = new char[TEMP_PASSWORD_LENGTH];

        password[0] = upper.charAt(random.nextInt(upper.length()));
        password[1] = upper.charAt(random.nextInt(upper.length()));
        password[2] = lower.charAt(random.nextInt(lower.length()));
        password[3] = lower.charAt(random.nextInt(lower.length()));
        password[4] = digits.charAt(random.nextInt(digits.length()));
        password[5] = digits.charAt(random.nextInt(digits.length()));
        password[6] = special.charAt(random.nextInt(special.length()));
        password[7] = special.charAt(random.nextInt(special.length()));

        for (int i = 8; i < TEMP_PASSWORD_LENGTH; i++) {
            password[i] = allChars.charAt(random.nextInt(allChars.length()));
        }

        for (int i = TEMP_PASSWORD_LENGTH - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = password[i];
            password[i] = password[j];
            password[j] = temp;
        }

        return new String(password);
    }
}
