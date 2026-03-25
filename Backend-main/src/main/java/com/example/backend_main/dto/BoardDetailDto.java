package com.example.backend_main.dto;

import lombok.*;
import java.util.List;

@Getter @Builder
public class BoardDetailDto {
    // 게시글 정보
    private Long id;
    private String category;
    private String title;
    private String content;
    private Long writerId;      // 글쓴이 ID
    private String writerName;  // 글쓴이 닉네임
    private String date;

    // 답변 리스트
    private List<ReplyDto> replies;

    @Getter @Builder
    public static class ReplyDto {
        private Long replyId;
        private String content;
        private Long lawyerId;      // 변호사 ID
        private String lawyerName;  // 변호사 이름 (TB_USER 조인 필요하지만 임시 처리)
        private String selectionYn; // 채택 여부
        private String date;
        private boolean isMine;     // (선택사항) 현재 로그인한 사람의 댓글인지
    }
}