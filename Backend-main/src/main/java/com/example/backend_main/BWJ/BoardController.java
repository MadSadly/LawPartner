package com.example.backend_main.BWJ;

import com.example.backend_main.KimMinSu.ChatService;
import com.example.backend_main.dto.ChatRoomRequestResultDTO;
import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.BoardReply;
import com.example.backend_main.dto.BoardFile;
import com.example.backend_main.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://192.168.0.43:3000", "http://localhost:3000"})
public class BoardController {

    private final BoardRepository boardRepository;
    private final BoardReplyRepository boardReplyRepository;
    private final UserRepository userRepository;
    private final BoardFileRepository boardFileRepository;
    private final ChatService chatService;

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public String createBoard(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("categories") String categoryString,
            @RequestParam("userNo") Long userNo,
            @RequestParam(value = "secretYn", required = false) Boolean isSecret,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {

        try {
            String secretYn = (isSecret != null && isSecret) ? "Y" : "N";

            Board board = Board.builder()
                    .title(title)
                    .content(content)
                    .categoryCode(categoryString)
                    .writerNo(userNo)
                    .secretYn(secretYn)
                    .replyCnt(0)
                    .matchYn("N")
                    .build();

            boardRepository.save(board);
            Long generatedBoardNo = board.getBoardNo();

            if (files != null && !files.isEmpty()) {
                String projectPath = System.getProperty("user.dir");
                String directoryPath = projectPath + "\\src\\main\\resources\\static\\files";

                File directory = new File(directoryPath);
                if (!directory.exists()) directory.mkdirs();

                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;

                    String originalFileName = file.getOriginalFilename();
                    File destFile = new File(directoryPath, originalFileName);
                    String finalFileName = originalFileName;

                    if (destFile.exists()) {
                        int dotIndex = originalFileName.lastIndexOf(".");
                        String baseName = (dotIndex == -1) ? originalFileName : originalFileName.substring(0, dotIndex);
                        String extension = (dotIndex == -1) ? "" : originalFileName.substring(dotIndex);

                        int count = 1;
                        while (destFile.exists()) {
                            finalFileName = baseName + "(" + count + ")" + extension;
                            destFile = new File(directoryPath, finalFileName);
                            count++;
                        }
                    }

                    file.transferTo(destFile);

                    BoardFile boardFile = BoardFile.builder()
                            .boardNo(generatedBoardNo)
                            .originName(originalFileName)
                            .saveName(finalFileName)
                            .filePath(destFile.getAbsolutePath())
                            .build();
                    boardFileRepository.save(boardFile);
                }
            }
            return "SUCCESS";
        } catch (IOException e) {
            e.printStackTrace();
            return "FAIL";
        }
    }

    @GetMapping
    public List<Board> getBoardList(@RequestParam(value = "userNo", required = false) Long userNo) {
        // TB_USER 조인으로 STATUS_CODE = S99(탈퇴) 작성자 글 제외 + 블라인드 제외
        List<Board> boards = boardRepository.findAllByNonWithdrawnWriterOrderByRegDtDesc().stream()
                .filter(b -> !isBlinded(b))
                .collect(Collectors.toList());
        for (Board board : boards) {
            userRepository.findById(board.getWriterNo()).ifPresent(user -> board.setNickNm(user.getNickNm()));
            if (board.getReplyCnt() == null) board.setReplyCnt(0);
        }

        // 비밀글: 변호사/관리자 또는 작성자 본인만 조회 가능
        final Long viewerNo = userNo;
        if (viewerNo == null) {
            boards = boards.stream()
                    .filter(b -> !"Y".equalsIgnoreCase(b.getSecretYn()))
                    .toList();
        } else {
            boards = boards.stream()
                    .filter(b -> !"Y".equalsIgnoreCase(b.getSecretYn()) || canViewSecretBoard(b, viewerNo))
                    .toList();
        }
        return boards;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getBoardDetail(
            @PathVariable("id") Long id,
            @RequestParam(value = "userNo", required = false) Long userNo) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (isConsultBoardHidden(board)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제되었거나 볼 수 없는 게시글입니다.");
        }
        if ("Y".equalsIgnoreCase(board.getSecretYn()) && !canViewSecretBoard(board, userNo)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "비밀글은 변호사만 열람할 수 있습니다.");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("boardNo", board.getBoardNo());
        result.put("title", board.getTitle());
        result.put("content", board.getContent());
        result.put("categoryCode", board.getCategoryCode());
        result.put("writerNo", board.getWriterNo());
        result.put("regDt", board.getRegDt());
        result.put("matchYn", board.getMatchYn());

        userRepository.findById(board.getWriterNo()).ifPresent(u -> result.put("nickNm", u.getNickNm()));

        List<BoardFile> boardFiles = boardFileRepository.findByBoardNo(id);
        result.put("files", boardFiles);

        List<BoardReply> replies = boardReplyRepository.findByBoardNo(id);
        List<Map<String, Object>> replyList = replies.stream().map(reply -> {
            Map<String, Object> map = new HashMap<>();
            map.put("replyNo", reply.getReplyNo());
            map.put("content", reply.getContent());
            map.put("regDt", reply.getRegDt());
            map.put("lawyerNo", reply.getWriterNo());
            userRepository.findById(reply.getWriterNo()).ifPresent(lawyer -> map.put("lawyerNm", lawyer.getNickNm()));
            return map;
        }).collect(Collectors.toList());

        result.put("replies", replyList);
        return result;
    }

    @PostMapping("/{id}/replies")
    public String createReply(@PathVariable("id") Long boardId, @RequestBody Map<String, Object> data) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        if (isConsultBoardHidden(board)) return "FAIL";
        if ("Y".equals(board.getMatchYn())) return "FAIL";

        Long lawyerNo = Long.parseLong(data.get("lawyerNo").toString());
        BoardReply reply = BoardReply.builder()
                .boardNo(boardId)
                .writerNo(lawyerNo)
                .content((String) data.get("content"))
                .selectionYn("N")
                .build();
        boardReplyRepository.save(reply);

        board.setReplyCnt((board.getReplyCnt() == null ? 0 : board.getReplyCnt()) + 1);
        boardRepository.save(board);
        return "SUCCESS";
    }

    @PostMapping("/{id}/reviews")
    public String createReview(@PathVariable("id") Long boardId, @RequestBody Map<String, Object> data) {
        Board board = boardRepository.findById(boardId).orElseThrow();
        if (isConsultBoardHidden(board)) return "FAIL";
        Long lawyerNo = Long.parseLong(data.get("lawyerNo").toString());
        Long writerNo = Long.parseLong(data.get("writerNo").toString());
        String writerNm = (String) data.get("writerNm");
        Integer stars = Integer.parseInt(data.get("stars").toString());
        String content = (String) data.get("content");
        Long replyNo = Long.parseLong(data.get("replyNo").toString());

        boardRepository.insertReviewNative(lawyerNo, writerNo, writerNm, stars, content, replyNo);
        return "SUCCESS";
    }

    @PutMapping("/{id}/match")
    public String completeMatch(@PathVariable("id") Long id) {
        Board board = boardRepository.findById(id).orElseThrow();
        if (isConsultBoardHidden(board)) return "FAIL";
        board.setMatchYn("Y");
        boardRepository.save(board);
        return "SUCCESS";
    }

    @PutMapping("/{id}")
    public String updateBoard(@PathVariable("id") Long id, @RequestBody Map<String, Object> data) {
        Board board = boardRepository.findById(id).orElseThrow();
        if (isConsultBoardHidden(board)) return "FAIL";
        board.setTitle((String) data.get("title"));
        board.setContent((String) data.get("content"));
        boardRepository.save(board);
        return "SUCCESS";
    }

    @DeleteMapping("/{id}")
    @Transactional
    public String deleteBoard(@PathVariable("id") Long id) {
        Board board = boardRepository.findById(id).orElseThrow();
        if (isConsultBoardHidden(board)) return "FAIL";
        List<BoardReply> replies = boardReplyRepository.findByBoardNo(id);
        if (!replies.isEmpty()) boardReplyRepository.deleteAll(replies);
        boardRepository.delete(board);
        return "SUCCESS";
    }

    @GetMapping("/download/{fileNo}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long fileNo,
            @RequestParam(value = "userNo", required = false) Long userNo) throws MalformedURLException {
        BoardFile fileEntity = boardFileRepository.findById(fileNo).orElse(null);

        if (fileEntity == null) {
            return ResponseEntity.notFound().build();
        }
        Board fileBoard = boardRepository.findById(fileEntity.getBoardNo()).orElse(null);
        if (fileBoard == null || isConsultBoardHidden(fileBoard)) {
            return ResponseEntity.notFound().build();
        }
        if ("Y".equalsIgnoreCase(fileBoard.getSecretYn()) && !canViewSecretBoard(fileBoard, userNo)) {
            return ResponseEntity.notFound().build();
        }

        String savePath = fileEntity.getFilePath();
        UrlResource resource = new UrlResource("file:" + savePath);
        String encodedUploadFileName = UriUtils.encode(fileEntity.getOriginName(), StandardCharsets.UTF_8);
        String contentDisposition = "attachment; filename=\"" + encodedUploadFileName + "\"";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .body(resource);
    }

    @PutMapping("/replies/{replyId}")
    public String updateReply(@PathVariable Long replyId, @RequestBody Map<String, Object> data) {
        BoardReply reply = boardReplyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("답변을 찾을 수 없습니다."));
        Board parentBoard = boardRepository.findById(reply.getBoardNo()).orElseThrow();
        if (isConsultBoardHidden(parentBoard)) return "FAIL";

        String content = (String) data.get("content");
        reply.setContent(content);
        boardReplyRepository.save(reply);
        return "SUCCESS";
    }

    @DeleteMapping("/replies/{replyId}")
    @Transactional
    public String deleteReply(@PathVariable Long replyId) {
        BoardReply reply = boardReplyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("답변을 찾을 수 없습니다."));

        Board board = boardRepository.findById(reply.getBoardNo()).orElseThrow();
        if (isConsultBoardHidden(board)) return "FAIL";
        if (board.getReplyCnt() > 0) {
            board.setReplyCnt(board.getReplyCnt() - 1);
            boardRepository.save(board);
        }

        boardReplyRepository.delete(reply);
        return "SUCCESS";
    }

    // ★ [11] 1:1 대화방 생성 (새로 추가된 기능)
    // UUID로 생성된 결과 객체가 정상적으로 리액트로 넘어갑니다.
    @PostMapping("/chat/room")
    public ResponseEntity<?> createChatRoom(@RequestBody Map<String, Object> data) {
        Long userNo = Long.valueOf(data.get("userNo").toString());
        Long lawyerNo = Long.valueOf(data.get("lawyerNo").toString());

        ChatRoomRequestResultDTO result = chatService.requestOrReuseActiveConsultationRoom(userNo, lawyerNo);
        return ResponseEntity.ok(result);
    }

    /** 관리자 블라인드(BLIND_YN = 'Y') 또는 탈퇴(S99) 작성자 글 — 일반 상담게시판에서 제외 */
    private boolean isConsultBoardHidden(Board board) {
        if (board == null) return true;
        if (isBlinded(board)) return true;
        if (board.getWriterNo() == null) return true;
        return userRepository.findById(board.getWriterNo())
                .map(u -> "S99".equals(u.getStatusCode()))
                .orElse(true);
    }

    /** 관리자 블라인드(BLIND_YN = 'Y') 게시글 — 일반 상담게시판 API에서 제외 */
    private static boolean isBlinded(Board b) {
        if (b == null) return true;
        String v = b.getBlindYn();
        return v != null && "Y".equalsIgnoreCase(v.trim());
    }

    /** 비밀글 열람 권한: 작성자 본인 또는 변호사/관리자 */
    private boolean canViewSecretBoard(Board board, Long userNo) {
        if (userNo == null) return false;
        if (board != null && userNo.equals(board.getWriterNo())) return true;
        return userRepository.findById(userNo)
                .map(u -> {
                    String role = u.getRoleCode();
                    if (role == null) return false;
                    String normalized = role.trim().toUpperCase();
                    return normalized.startsWith("ROLE_LAWYER")
                            || normalized.startsWith("ROLE_ASSOCIATE")
                            || normalized.contains("ADMIN");
                })
                .orElse(false);
    }
}