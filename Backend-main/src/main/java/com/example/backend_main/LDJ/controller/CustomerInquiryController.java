package com.example.backend_main.LDJ.controller;

import com.example.backend_main.LDJ.service.CustomerInquiryService;
import com.example.backend_main.common.entity.CustomerInquiry;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.dto.CustomerInquiryDTO;
import com.example.backend_main.dto.HSH_DTO.InquiryDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/customer/inquiries")
public class CustomerInquiryController {

    private final CustomerInquiryService customerInquiryService;

    @GetMapping
    public ResultVO<List<InquiryDto.ListResponse>> getMyInquiries() {
        return ResultVO.ok("내 문의 목록을 성공적으로 불러왔습니다.",
                customerInquiryService.getMyInquiries());
    }

    @GetMapping("/{id}")
    public ResultVO<InquiryDto.DetailResponse> getInquiryById(@PathVariable Long id) {
        return ResultVO.ok("문의 상세를 성공적으로 불러왔습니다.",
                customerInquiryService.getInquiryById(id));
    }

    @PostMapping
    public ResultVO<CustomerInquiry> createInquiry(
            @Valid @RequestBody CustomerInquiryDTO.CreateRequest request) {

        // 서비스 호출 (우리가 리팩토링한 LDJ의 CustomerInquiryService 사용)
        CustomerInquiry created = customerInquiryService.createInquiry(
                request.getType(),
                request.getTitle(),
                request.getContent()
        );

        return ResultVO.ok("문의가 성공적으로 등록되었습니다.", created);
    }

    @PutMapping("/{id}")
    public ResultVO<InquiryDto.DetailResponse> updateInquiry(
            @PathVariable Long id,
            @Valid @RequestBody CustomerInquiryDTO.CreateRequest request
    ) {
        InquiryDto.DetailResponse updated = customerInquiryService.updateInquiry(
                id,
                request.getType(),
                request.getTitle(),
                request.getContent()
        );

        return ResultVO.ok("문의 내용이 수정되었습니다.", updated);
    }

    @DeleteMapping("/{id}")
    public ResultVO<Void> deleteInquiry(@PathVariable Long id) {
        customerInquiryService.deleteInquiry(id);
        return ResultVO.ok("문의가 삭제되었습니다.", null);
    }
}