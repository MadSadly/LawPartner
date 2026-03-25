package com.example.backend_main.LDJ.controller;

import com.example.backend_main.LDJ.service.LawyerInfoService;
import com.example.backend_main.dto.LawyerCardDTO;
import com.example.backend_main.dto.LawyerDetailDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = {"http://192.168.0.43:3000", "http://localhost:3000"})
@RestController
@RequestMapping("/api/lawyers")
@RequiredArgsConstructor
public class LawyerInfoController {

    private final LawyerInfoService lawyerInfoService;

    // ✅ 리스트
    @GetMapping
    public List<LawyerCardDTO> getLawyers() {
        return lawyerInfoService.getApprovedLawyerCards();
    }

    // ✅ 디테일
    @GetMapping("/{id}")
    public LawyerDetailDTO getLawyerDetail(@PathVariable("id") Long id) {
        return lawyerInfoService.getLawyerDetail(id);
    }
}