package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.LawyerDocument;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import com.example.backend_main.common.repository.LawyerDocumentRepository;
import com.example.backend_main.common.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final LawyerDocumentRepository lawyerDocumentRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ★★★ 허용할 파일 확장자 및 MIME 타입 목록 (보안 강화)
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("pdf", "jpg", "jpeg", "png");
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("application/pdf", "image/jpeg", "image/png");

    @Transactional
    public LawyerDocument storeFile(MultipartFile file, Long userNo, String docType) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // ★★★ 1. getOriginalFilename() null 체크 강화
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename(), "파일 이름이 없습니다."));

        try {
            // 2. 기본 유효성 검사
            if (file.isEmpty()) {
                throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR, "빈 파일은 업로드할 수 없습니다.");
            }
            if (originalFileName.contains("..")) {
                throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR, "파일 이름에 부적절한 문자가 포함되어 있습니다.");
            }

            // ★★★ 3. 확장자 및 MIME 타입 이중 검증
            String extension = StringUtils.getFilenameExtension(originalFileName);
            String mimeType = file.getContentType();

            if (!isAllowed(extension, mimeType)) {
                throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR, "허용되지 않는 파일 형식입니다.");
            }

            // 4. 서버에 저장될 파일명 생성 (UUID 사용)
            String savedName = UUID.randomUUID().toString() + "." + extension;
            Path targetLocation = Paths.get(uploadDir).resolve(savedName);

            // 5. 파일 저장
            Files.createDirectories(targetLocation.getParent());
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 6. DB에 메타데이터 저장
            LawyerDocument doc = LawyerDocument.builder()
                    .user(user)
                    .docType(docType)
                    .originalName(originalFileName)
                    .savedName(savedName)
                    .filePath(targetLocation.getParent().toString())
                    .fileSize(file.getSize())
                    .build();

            return lawyerDocumentRepository.save(doc);

        } catch (IOException ex) {
            log.error("파일 저장에 실패했습니다. 파일명: {}", originalFileName, ex);
            throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR, "파일 저장 중 오류가 발생했습니다.");
        }
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(Long docNo) {
        LawyerDocument doc = lawyerDocumentRepository.findById(docNo)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "파일 정보를 찾을 수 없습니다."));

        try {
            Path filePath = Paths.get(doc.getFilePath()).resolve(doc.getSavedName()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                log.error("파일을 찾을 수 없거나 읽을 수 없습니다. 경로: {}", filePath);
                throw new CustomException(ErrorCode.DATA_NOT_FOUND, "파일을 찾을 수 없습니다.");
            }
        } catch (MalformedURLException ex) {
            log.error("파일 경로가 잘못되었습니다. 경로: {}", doc.getFilePath(), ex);
            throw new CustomException(ErrorCode.DATA_NOT_FOUND, "파일 경로가 잘못되었습니다.");
        }
    }
    
    @Transactional(readOnly = true)
    public LawyerDocument getDocumentInfo(Long docNo) {
        return lawyerDocumentRepository.findById(docNo)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "파일 정보를 찾을 수 없습니다."));
    }

    // ★★★ 확장자와 MIME 타입을 함께 검증하는 헬퍼 메서드
    private boolean isAllowed(String extension, String mimeType) {
        if (extension == null || mimeType == null) {
            return false;
        }
        return ALLOWED_EXTENSIONS.contains(extension.toLowerCase()) && ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase());
    }
}
