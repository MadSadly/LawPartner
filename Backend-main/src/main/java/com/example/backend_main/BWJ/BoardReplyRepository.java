package com.example.backend_main.BWJ;

import com.example.backend_main.dto.BoardReply;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoardReplyRepository extends JpaRepository<BoardReply, Long> {
    // 게시글 번호로 답변 목록 가져오기
    List<BoardReply> findByBoardNo(Long boardNo);

    int countByBoardNo(Long boardNo);
}