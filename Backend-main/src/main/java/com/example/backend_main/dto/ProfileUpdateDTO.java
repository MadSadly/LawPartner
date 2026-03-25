package com.example.backend_main.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class ProfileUpdateDTO {
    private String name;
    private String email;
    private String phone;
    private MultipartFile profileImage;
}