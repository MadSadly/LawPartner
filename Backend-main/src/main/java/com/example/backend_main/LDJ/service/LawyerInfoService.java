package com.example.backend_main.LDJ.service;

import com.example.backend_main.common.repository.LawyerInfoRepository;
import com.example.backend_main.dto.LawyerCardDTO;
import com.example.backend_main.dto.LawyerDetailDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LawyerInfoService {

    private final LawyerInfoRepository lawyerInfoRepository;

    // ✅ 리스트(ExpertsPage)
    public List<LawyerCardDTO> getApprovedLawyerCards() {
        return lawyerInfoRepository.findApprovedCards();
    }

    // ✅ 디테일(ExpertsDetailPage)
    public LawyerDetailDTO getLawyerDetail(Long userNo) {
        return lawyerInfoRepository.findDetailByUserNo(userNo);
    }
}