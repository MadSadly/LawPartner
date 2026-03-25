package com.example.backend_main.BWJ;

import com.example.backend_main.dto.BoardFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoardFileRepository extends JpaRepository<BoardFile, Long> {
    // 게시글 번호로 파일 목록을 찾는 메서드
    List<BoardFile> findByBoardNo(Long boardNo);
}