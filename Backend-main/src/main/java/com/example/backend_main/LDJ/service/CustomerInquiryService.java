package com.example.backend_main.LDJ.service;

import com.example.backend_main.common.entity.CustomerInquiry;
import com.example.backend_main.common.repository.CustomerInquiryRepository;
import com.example.backend_main.common.security.CustomUserDetails;
import com.example.backend_main.dto.HSH_DTO.InquiryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerInquiryService {

    private final CustomerInquiryRepository customerInquiryRepository;

    public List<InquiryDto.ListResponse> getMyInquiries() {
        Long currentUserNo = getCurrentUserNo();

        return customerInquiryRepository.findByWriter_UserNoOrderByCreatedAtDesc(currentUserNo)
                .stream()
                .map(InquiryDto.ListResponse::from)
                .collect(Collectors.toList());
    }

    public InquiryDto.DetailResponse getInquiryById(Long id) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));

        Long currentUserNo = getCurrentUserNo();
        if (!inquiry.getWriterNo().equals(currentUserNo)) {
            throw new RuntimeException("본인 문의만 조회할 수 있습니다.");
        }

        return InquiryDto.DetailResponse.from(inquiry);
    }

    public CustomerInquiry createInquiry(String type, String title, String content) {
        Long currentUserNo = getCurrentUserNo();

        CustomerInquiry inquiry = CustomerInquiry.builder()
                .writerNo(currentUserNo)
                .type(type)
                .title(title)
                .content(content)
                .status("대기")
                .build();

        return customerInquiryRepository.save(inquiry);
    }

    public void deleteInquiry(Long id) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));

        Long currentUserNo = getCurrentUserNo();
        if (!inquiry.getWriterNo().equals(currentUserNo)) {
            throw new RuntimeException("본인 문의만 삭제할 수 있습니다.");
        }

        customerInquiryRepository.delete(inquiry);
    }

    public CustomerInquiry answerInquiry(Long id, String answerContent, String answeredBy) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));

        inquiry.answer(answerContent, answeredBy);
        return customerInquiryRepository.save(inquiry);
    }

    private Long getCurrentUserNo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            throw new RuntimeException("Authentication 이 null 입니다.");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUserNo();
        }

        throw new RuntimeException("현재 사용자 번호를 찾을 수 없습니다. principal=" + principal);
    }

    /**
     * 수정 후 DTO로 반환 — JSON 직렬화 시 LAZY writer 접근 문제를 피하고 프론트와 형식을 통일합니다.
     */
    @Transactional
    public InquiryDto.DetailResponse updateInquiry(Long id, String type, String title, String content) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 문의를 찾을 수 없습니다. id=" + id));

        Long currentUserNo = getCurrentUserNo();
        if (!inquiry.getWriterNo().equals(currentUserNo)) {
            throw new RuntimeException("본인 문의만 수정할 수 있습니다.");
        }

        inquiry.update(type, title, content);
        CustomerInquiry saved = customerInquiryRepository.save(inquiry);
        return InquiryDto.DetailResponse.from(saved);
    }
}