package com.example.backend_main.BWJ;

import com.example.backend_main.dto.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {

    // 1. 전체 목록 최신순
    List<Board> findAllByOrderByRegDtDesc();

    /**
     * TB_USER 조인 — STATUS_CODE = 'S99'(탈퇴) 작성자의 글은 제외.
     * 작성자 행이 없는 게시글은 INNER JOIN 특성상 목록에 포함되지 않음.
     */
    @Query("SELECT b FROM Board b JOIN User u ON b.writerNo = u.userNo "
            + "WHERE u.statusCode IS NULL OR u.statusCode <> 'S99' ORDER BY b.regDt DESC")
    List<Board> findAllByNonWithdrawnWriterOrderByRegDtDesc();

    // 2. 특정 작성자의 최신글 5개 (김민수님 마이페이지 기능)
    List<Board> findTop5ByWriterNoOrderByRegDtDesc(Long writerNo);

    // 3. [수정됨] 카테고리 완전 삭제 및 REPLY_NO 추가
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO TB_REVIEW (LAWYER_NO, WRITER_NO, WRITER_NM, RATING, CONTENT, REPLY_NO, REG_DT) " +
            "VALUES (:lawyerNo, :writerNo, :writerNm, :stars, :content, :replyNo, SYSDATE)", nativeQuery = true)
    void insertReviewNative(
            @Param("lawyerNo") Long lawyerNo,
            @Param("writerNo") Long writerNo,
            @Param("writerNm") String writerNm,
            @Param("stars") Integer stars,
            @Param("content") String content,
            @Param("replyNo") Long replyNo);
}