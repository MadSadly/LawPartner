package com.example.backend_main.common.spec;

import com.example.backend_main.common.entity.AccessLog;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class AccessLogSpecification {

    public static Specification<AccessLog> searchLog(String startDate, String endDate, String keywordType, String keyword, String statusType) {
        return (Root<AccessLog> root, CriteriaQuery<?> query, CriteriaBuilder criteriaBuilder) -> {

            Predicate predicate = criteriaBuilder.conjunction();

            // 1. 기간 검색
            if (startDate != null && !startDate.isEmpty()) {
                LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("regDt"), start));
            }
            if (endDate != null && !endDate.isEmpty()) {
                LocalDateTime end = LocalDate.parse(endDate).atTime(LocalTime.MAX);
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("regDt"), end));
            }

            // 2. 키워드 검색
            if (keyword != null && !keyword.isEmpty() && keywordType != null) {
                switch (keywordType) {
                    case "TRACE_ID" ->
                            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("traceId"), "%" + keyword + "%"));
                    case "IP" ->
                            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("reqIp"), "%" + keyword + "%"));
                    case "URI" ->
                            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("reqUri"), "%" + keyword + "%"));
                    case "USER_NO" -> {
                        try {
                            long userNo = Long.parseLong(keyword);
                            predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("userNo"), userNo));
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            // 3. 상태 코드 필터 (여기가 핵심 수정!)
            if ("ERROR".equals(statusType)) {
                // DB의 statusCode는 Integer 타입입니다.
                // 따라서 문자열 "400"이 아닌, 숫자 400과 비교해야 합니다.
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.greaterThanOrEqualTo(root.get("statusCode"), 400));
            }

            query.orderBy(criteriaBuilder.desc(root.get("regDt")));
            return predicate;
        };
    }
}