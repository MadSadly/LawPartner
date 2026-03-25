package com.example.backend_main.BWJ;

import com.example.backend_main.dto.AiChatLog;
import com.example.backend_main.common.entity.AiChatRoom;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.AiChatRoomRepository;
import com.example.backend_main.common.repository.GuestConsultDailyQuotaRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.entity.GuestConsultDailyQuota;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://192.168.0.43:3000", "http://localhost:3000"}) // 리액트 허용
public class AiChatController {

    private static final int AI_CONSULT_DAILY_LIMIT = Integer.parseInt(
            System.getenv().getOrDefault("AI_CONSULT_DAILY_LIMIT", "10"));
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Autowired
    private AiChatLogRepository aiChatLogRepository;

    @Autowired
    private AiChatRoomRepository aiChatRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuestConsultDailyQuotaRepository guestConsultDailyQuotaRepository;

    // 파이썬 서버 주소 (환경변수 우선, 없으면 기본값 사용)
    private final String PYTHON_SERVER_URL = System.getenv().getOrDefault("PYTHON_CHAT_URL", "http://127.0.0.1:8000/chat");
    private final String PYTHON_SUMMARIZE_URL = System.getenv().getOrDefault("PYTHON_SUMMARIZE_URL", "http://127.0.0.1:8000/summarize-consult");

    private RestTemplate buildRestTemplate() {
        // BufferingClientHttpRequestFactory: 응답 본문을 버퍼링해 Connection reset(읽기 중 RST) 완화
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10_000);   // 연결 10초
        requestFactory.setReadTimeout(600_000);     // 응답 대기 최대 10분
        BufferingClientHttpRequestFactory buffering = new BufferingClientHttpRequestFactory(requestFactory);
        return new RestTemplate(buffering);
    }

    /**
     * Connection refused / reset / 일시 장애 대비: 최대 6회, 2초 간격 재시도.
     * (run_all 시 pip·Chroma 때문에 8000이 늦게 뜨는 경우와 Uvicorn 재시작 직후 흡수)
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> postWithRetry(RestTemplate restTemplate, String url, Map<String, Object> body) {
        // Uvicorn 재시작(run.bat 5초 대기) + Chroma 로딩 지연 흡수: 총 대기 여유 확대
        final int maxAttempts = 15;
        final long sleepMs = 3000;
        ResourceAccessException last = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return restTemplate.postForObject(url, body, Map.class);
            } catch (ResourceAccessException e) {
                last = e;
                if (attempt < maxAttempts) {
                    try {
                        Thread.sleep(sleepMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw e;
                    }
                }
            }
        }
        if (last == null) {
            throw new ResourceAccessException("AI 서버 연결 실패");
        }
        throw last;
    }

    private Map<String, Object> postPythonChat(RestTemplate restTemplate, Map<String, Object> body) {
        return postWithRetry(restTemplate, PYTHON_SERVER_URL, body);
    }

    private Map<String, Object> postPythonSummarize(RestTemplate restTemplate, Map<String, Object> body) {
        return postWithRetry(restTemplate, PYTHON_SUMMARIZE_URL, body);
    }

    private ResponseEntity<Map<String, Object>> aiErrorResponse(String message, HttpStatus status) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", message);
        body.put("status", status.value());
        return ResponseEntity.status(status).body(body);
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String ra = request.getRemoteAddr();
        return ra != null ? ra : "";
    }

    private static String normalizeGuestIp(String ip) {
        if (ip == null || ip.isEmpty()) {
            return "unknown";
        }
        return ip.length() > 64 ? ip.substring(0, 64) : ip;
    }

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, Object> payload) {
        Object userNoObj = payload.get("userNo");
        Long userNo = userNoObj == null ? null : Long.valueOf(String.valueOf(userNoObj));

        User user = null;
        if (userNo != null) {
            user = userRepository.findById(userNo).orElse(null);
        }

        AiChatRoom room = AiChatRoom.builder()
                .user(user)
                .title(null)
                .lastQuestion(null)
                .build();

        AiChatRoom saved = aiChatRoomRepository.save(room);
        Map<String, Object> res = new HashMap<>();
        res.put("roomNo", saved.getRoomNo());
        res.put("title", saved.getTitle());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/rooms")
    public ResponseEntity<?> listRooms(@RequestParam("userNo") Long userNo) {
        List<AiChatRoom> rooms = aiChatRoomRepository.findByUserNoOrderByRecent(userNo);
        List<Map<String, Object>> result = rooms.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("roomNo", r.getRoomNo());
            m.put("title", r.getTitle());
            m.put("lastQuestion", r.getLastQuestion());
            m.put("lastChatDt", r.getLastChatDt());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/rooms/{roomNo}/logs")
    public ResponseEntity<?> getRoomLogs(@PathVariable("roomNo") Long roomNo) {
        List<AiChatLog> logs = aiChatLogRepository.findByRoom_RoomNoOrderByLogNoAsc(roomNo);
        List<Map<String, Object>> result = logs.stream().map(l -> {
            Map<String, Object> m = new HashMap<>();
            m.put("question", l.getQuestion());
            m.put("answer", l.getAnswer());
            m.put("regDt", l.getRegDt());
            // RELATED_CASES(CLOB)에 직렬화되어 저장된 판례들을 다시 List<String>으로 풀어서 전달
            String relatedCasesStr = l.getRelatedCases();
            List<String> relatedCases = (relatedCasesStr == null || relatedCasesStr.isBlank())
                    ? List.of()
                    : Arrays.asList(relatedCasesStr.split("\\n\\n"));
            m.put("relatedCases", relatedCases);
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/consult")
    @Transactional
    public ResponseEntity<?> consult(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        String question = payload.get("question") == null ? null : String.valueOf(payload.get("question"));
        Object roomNoObj = payload.get("roomNo");
        Long roomNo = roomNoObj == null ? null : Long.valueOf(String.valueOf(roomNoObj));
        Object userNoObj = payload.get("userNo");
        Long userNo = userNoObj == null ? null : Long.valueOf(String.valueOf(userNoObj));
        Object disableRagObj = payload.get("disableRag");
        Boolean disableRag = disableRagObj == null ? null : Boolean.valueOf(String.valueOf(disableRagObj));

        LocalDate todayKst = LocalDate.now(KST);
        LocalDateTime dayStart = todayKst.atStartOfDay(KST).toLocalDateTime();
        LocalDateTime dayEnd = todayKst.plusDays(1).atStartOfDay(KST).toLocalDateTime();

        String guestIpKey = null;
        if (userNo != null) {
            long usedToday = aiChatLogRepository.countByUserNoAndRegDtRange(userNo, dayStart, dayEnd);
            if (usedToday >= AI_CONSULT_DAILY_LIMIT) {
                return aiErrorResponse(
                        "오늘 AI 상담은 최대 " + AI_CONSULT_DAILY_LIMIT + "회까지 이용할 수 있습니다. 내일 다시 이용해 주세요.",
                        HttpStatus.TOO_MANY_REQUESTS);
            }
        } else {
            guestIpKey = normalizeGuestIp(resolveClientIp(request));
            int usedGuest = guestConsultDailyQuotaRepository
                    .findByClientIpAndQuotaDate(guestIpKey, todayKst)
                    .map(GuestConsultDailyQuota::getCallCnt)
                    .orElse(0);
            if (usedGuest >= AI_CONSULT_DAILY_LIMIT) {
                return aiErrorResponse(
                        "오늘 AI 상담은 최대 " + AI_CONSULT_DAILY_LIMIT + "회까지 이용할 수 있습니다. 내일 다시 이용해 주세요.",
                        HttpStatus.TOO_MANY_REQUESTS);
            }
        }

        // 1. 파이썬 서버에 질문 전송
        RestTemplate restTemplate = buildRestTemplate();
        Map<String, Object> pythonRequest = new HashMap<>();
        pythonRequest.put("question", question);
        // 프론트에서 disableRag 플래그가 온 경우 파이썬 서버로 그대로 전달
        if (disableRag != null) {
            pythonRequest.put("disable_rag", disableRag);
        }

        try {
            // 파이썬으로부터 응답 받기 (JSON -> Map 변환)
            Map<String, Object> pythonResponse = postPythonChat(restTemplate, pythonRequest);
            if (pythonResponse == null) {
                return aiErrorResponse("AI 서버가 빈 응답을 반환했습니다.", HttpStatus.BAD_GATEWAY);
            }

            String answer = (String) pythonResponse.get("answer");
            List<String> relatedCases = (List<String>) pythonResponse.get("related_cases");
            if (answer == null || answer.isBlank()) {
                return aiErrorResponse("AI 서버 응답 형식이 올바르지 않습니다.", HttpStatus.BAD_GATEWAY);
            }

            User user = null;
            if (userNo != null) {
                user = userRepository.findById(userNo).orElse(null);
            }

            AiChatRoom room;
            if (roomNo != null) {
                room = aiChatRoomRepository.findById(roomNo).orElse(null);
                if (room != null) {
                    room.touchLastChat(question);
                    // 오라클 컬럼이 200 BYTE 이므로, 한글 등 멀티바이트 문자열까지 고려해
                    // 여유 있게 60자까지만 제목으로 사용
                    room.ensureTitleMaxLength(60);
                    room = aiChatRoomRepository.save(room);
                } else {
                    room = null;
                }
            } else {
                // 첫 질문 시 방 생성 (질문 내용으로 제목/최근질문 설정)
                // 오라클 VARCHAR2(200 BYTE)를 안전하게 맞추기 위해, 한글/이모지 등을 고려해
                // 최대 60자까지만 제목으로 저장
                String title = null;
                if (question != null) {
                    String trimmed = question.trim();
                    title = trimmed.length() > 60 ? trimmed.substring(0, 60) : trimmed;
                }
                room = AiChatRoom.builder()
                        .user(user)
                        .title(title)
                        .lastQuestion(question)
                        .lastChatDt(LocalDateTime.now())
                        .build();
                room = aiChatRoomRepository.save(room);
            }

            // 2. 오라클 DB에 저장 (TB_AI_CHAT_LOG)
            AiChatLog log = AiChatLog.builder()
                    .room(room)
                    .user(user)
                    .question(question)
                    .answer(answer)
                    .relatedCases(relatedCases == null || relatedCases.isEmpty()
                            ? null
                            : String.join("\n\n", relatedCases))
                    .tokenUsage(0L)
                    .build();
            aiChatLogRepository.save(log);

            if (userNo == null && guestIpKey != null) {
                final String ipKey = guestIpKey;
                GuestConsultDailyQuota row = guestConsultDailyQuotaRepository
                        .findByClientIpAndQuotaDate(ipKey, todayKst)
                        .orElseGet(() -> GuestConsultDailyQuota.builder()
                                .clientIp(ipKey)
                                .quotaDate(todayKst)
                                .callCnt(0)
                                .build());
                row.setCallCnt(row.getCallCnt() + 1);
                guestConsultDailyQuotaRepository.save(row);
            }

            // 3. 리액트에 결과 반환 (답변 + 관련 판례 + roomNo)
            Map<String, Object> finalResponse = new HashMap<>();
            finalResponse.put("answer", answer);
            finalResponse.put("related_cases", relatedCases);
            finalResponse.put("roomNo", room != null ? room.getRoomNo() : null);

            return ResponseEntity.ok(finalResponse);

        } catch (Exception e) {
            e.printStackTrace();
            return aiErrorResponse("AI 서버 연결 실패: " + e.getMessage(), HttpStatus.GATEWAY_TIMEOUT);
        }
    }

    /** 상담내용으로 글쓰기: 대화 내역을 파이썬 LLM으로 변호사 상담용 제목·본문으로 정리 */
    @PostMapping("/summarize-consult")
    public ResponseEntity<?> summarizeConsult(@RequestBody Map<String, Object> payload) {
        try {
            RestTemplate restTemplate = buildRestTemplate();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
            if (messages == null) {
                return ResponseEntity.badRequest().body("messages 필드가 필요합니다.");
            }
            Map<String, Object> pythonRequest = new HashMap<>();
            pythonRequest.put("messages", messages);
            Map<String, Object> pythonResponse = postPythonSummarize(restTemplate, pythonRequest);
            return ResponseEntity.ok(pythonResponse != null ? pythonResponse : new HashMap<>());
        } catch (Exception e) {
            e.printStackTrace();
            return aiErrorResponse("상담 정리 요청 실패: " + e.getMessage(), HttpStatus.GATEWAY_TIMEOUT);
        }
    }
}