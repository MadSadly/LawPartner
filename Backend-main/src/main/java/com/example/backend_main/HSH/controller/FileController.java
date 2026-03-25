package com.example.backend_main.HSH.controller;

import com.example.backend_main.HSH.service.FileService;
import com.example.backend_main.common.entity.LawyerDocument;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.common.vo.ResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload/lawyer-document")
    @PreAuthorize("hasRole('LAWYER') or hasRole('ASSOCIATE')")
    public ResponseEntity<ResultVO<LawyerDocument>> uploadLawyerDocument(@RequestParam("file") MultipartFile file,
                                                                         @RequestParam("docType") String docType,
                                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {

        LawyerDocument savedDocument = fileService.storeFile(file, userDetails.getUserNo(), docType);
        return ResponseEntity.ok(ResultVO.ok("파일이 성공적으로 업로드되었습니다.", savedDocument));
    }

    @GetMapping("/download/admin/document/{docNo}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long docNo) throws IOException {

        LawyerDocument docInfo = fileService.getDocumentInfo(docNo);
        Resource resource = fileService.loadFileAsResource(docNo);

        ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
                .filename(docInfo.getOriginalName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(resource);
    }
}
