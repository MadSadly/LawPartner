package com.example.backend_main.common.Mapper;

import com.example.backend_main.dto.GeneralMyPageDTO;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface GeneralMyPageMapper {
    // 1. 유저 이름 조회
    String getUserName(Long userNo);

    // 2. 내 게시글에 달린 최근 답글 수 조회
    int getRecentReplyCount(Long userNo);

    // 3. 최근 상담 요청 건수 (TB_CHAT_ROOM 기준)
    int getRequestCount(Long userNo);

    // 4. 최근 상담 요청 리스트 조회 (최대 5개)
    List<GeneralMyPageDTO.ConsultationItemDTO> getRecentConsultations(Long userNo);

    // 5. 내 최근 게시글 리스트 조회 (최대 5개)
    List<GeneralMyPageDTO.MyBoardDTO> getRecentPosts(Long userNo);

    // 6. 캘린더용 상담 일정 조회 (TB_CHAT_ROOM)
    List<GeneralMyPageDTO.CalendarEventDTO> getCalendarEvents(Long userNo);
}