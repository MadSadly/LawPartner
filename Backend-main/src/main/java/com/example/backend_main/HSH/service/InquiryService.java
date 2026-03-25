package com.example.backend_main.HSH.service;

import com.example.backend_main.common.entity.CustomerInquiry;
import com.example.backend_main.common.entity.Notification;
import com.example.backend_main.common.repository.CustomerInquiryRepository;
import com.example.backend_main.common.repository.NotificationRepository;
import com.example.backend_main.dto.HSH_DTO.InquiryDto;
import com.example.backend_main.common.exception.CustomException;
import com.example.backend_main.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InquiryService {

    private final CustomerInquiryRepository customerInquiryRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ==================================================================================
    // 💬 문의 관리 (관리자용)
    // ==================================================================================

    /*
     [전체 문의 목록 조회]
     [도입 원인]: JOIN FETCH를 통해 작성자(User) 정보를 한 번에 가져와 성능 최적화
     [기대 결과]: N+1 문제 해결 및 리액트 화면에 작성자 실명/아이디 즉시 노출
    */
    @Transactional(readOnly = true)
    public List<InquiryDto.ListResponse> getAllInquiries(String status) {
        List<CustomerInquiry> inquiries;

        if (status == null || status.isBlank() || "ALL".equals(status)) {
            // ✅ 레포지토리의 JOIN FETCH 메서드 호출
            inquiries = customerInquiryRepository.findAllWithUser();
        } else {
            // ✅ 상태 필터링 시에도 JOIN FETCH 적용
            inquiries = customerInquiryRepository.findByStatusWithUser(status);
        }

        return inquiries.stream()
                .map(InquiryDto.ListResponse::from)
                .collect(Collectors.toList());
    }

    /*
     [문의 상세 조회]
    */
    @Transactional(readOnly = true)
    public InquiryDto.DetailResponse getInquiryDetail(Long id) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "존재하지 않는 문의입니다."));

        return InquiryDto.DetailResponse.from(inquiry);
    }

    /*
     [관리자 답변 저장]
     - 답변 내용 저장 + 상태 "답변완료" 자동 변경
     [추가 사항]: 누가(answeredBy), 언제(answeredAt) 답변했는지 로그 기록 및 저장
     */
    @Transactional
    public void saveAnswer(Long id, InquiryDto.AnswerRequest dto) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.DATA_NOT_FOUND, "존재하지 않는 문의입니다."));

        // 작성자(관리자) 이름 설정
        String adminNm = (dto.getAnsweredBy() != null && !dto.getAnsweredBy().isBlank())
                ? dto.getAnsweredBy()
                : "관리자";

        // ✅ 엔티티의 비즈니스 메서드 호출 (상태변경 + 답변일시 기록)
        inquiry.answer(dto.getAnswerContent(), adminNm);

        // 답변 완료 알람 발송
        if (inquiry.getWriter() != null) {
            Long writerNo = inquiry.getWriter().getUserNo();

            Notification notification = Notification.builder()
                    .userNo(writerNo)
                    .msgTitle("고객센터 문의 답변 완료")
                    .msgContent("고객센터에 문의하신 「" + inquiry.getTitle() + "」에 답변이 등록되었습니다.")
                    .build();
            notificationRepository.save(notification);

            Map<String, String> payload = new HashMap<>();
            payload.put("title", "고객센터 문의 답변 완료");
            payload.put("content", "「" + inquiry.getTitle() + "」에 답변이 등록되었습니다.");
            payload.put("roomId", "");
            messagingTemplate.convertAndSend("/sub/user/" + writerNo + "/notification", payload);
        }

        log.info("✅ [문의 답변 완료] ID: {}, 담당자: {}, 일시: {}", id, adminNm, inquiry.getAnsweredAt());
    }

    /*
     [문의 삭제]
    */
    @Transactional
    public void deleteInquiry(Long id) {
        if (!customerInquiryRepository.existsById(id)) {
            throw new CustomException(ErrorCode.DATA_NOT_FOUND, "존재하지 않는 문의입니다.");
        }
        customerInquiryRepository.deleteById(id);
        log.info("🗑️ [문의 삭제 완료] 문의 ID: {}", id);
    }

}
