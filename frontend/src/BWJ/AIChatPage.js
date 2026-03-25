import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api, { getAccessToken } from '../common/api/axiosConfig';
import { AttachedFilesFromAiContext } from '../common/context/AttachedFilesFromAiContext';

/** 액세스 토큰이 있을 때만 localStorage userNo 신뢰 (로그아웃 후 userNo 잔존 방지) */
function getSessionUserNo() {
    if (!getAccessToken()) return null;
    const v = localStorage.getItem('userNo');
    const n = v ? Number(v) : null;
    return Number.isFinite(n) ? n : null;
}

const AIChatPage = () => {
    const navigate = useNavigate();
    const { setFilesFromAi } = useContext(AttachedFilesFromAiContext);
    const [searchParams] = useSearchParams();
    const userNo = getSessionUserNo();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "안녕하세요. LAW PARTNER 입니다.\n법률 문제에 대해 판례 분석과 법적 절차를 기반으로 답변해 드립니다.\n어떤 도움이 필요하신가요?", isUser: false }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedSources, setExpandedSources] = useState(new Set());
    const [rooms, setRooms] = useState([]);
    const [currentRoomNo, setCurrentRoomNo] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const SOURCE_PREVIEW_LEN = 200;

    const getFileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

    const removeAttachedFileByKey = (fileKey) => {
        setAttachedFiles(prev => prev.filter(f => getFileKey(f) !== fileKey));
        setMessages(prev => prev.map(m => {
            if (!m?.attachments?.length) return m;
            return { ...m, attachments: m.attachments.filter(a => a.key !== fileKey) };
        }));
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const initialQuestionSent = useRef(false);
    useEffect(() => {
        const question = searchParams.get('question');
        if (question?.trim() && !initialQuestionSent.current) {
            initialQuestionSent.current = true;
            sendMessage(question.trim());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const loadRooms = async () => {
        const uid = getSessionUserNo();
        if (!uid) {
            setRooms([]);
            return;
        }
        const res = await api.get('/api/ai/rooms', { params: { userNo: uid } });
        setRooms(Array.isArray(res.data) ? res.data : []);
    };

    const loadRoomLogs = async (roomNo) => {
        const res = await api.get(`/api/ai/rooms/${roomNo}/logs`);
        const logs = Array.isArray(res.data) ? res.data : [];
        const mapped = logs.flatMap(l => ([
            { text: l.question, isUser: true },
            {
                text: l.answer,
                isUser: false,
                sources: Array.isArray(l.relatedCases) ? l.relatedCases : []
            }
        ]));
        setMessages(mapped.length > 0 ? mapped : [
            { text: "안녕하세요. LAW PARTNER 입니다.\n법률 문제에 대해 판례 분석과 법적 절차를 기반으로 답변해 드립니다.\n어떤 도움이 필요하신가요?", isUser: false }
        ]);
    };

    const openNewChat = () => {
        setCurrentRoomNo(null);
        setExpandedSources(new Set());
        setMessages([
            { text: "안녕하세요. LAW PARTNER 입니다.\n법률 문제에 대해 판례 분석과 법적 절차를 기반으로 답변해 드립니다.\n어떤 도움이 필요하신가요?", isUser: false }
        ]);
    };

    useEffect(() => {
        if (!getAccessToken()) {
            setRooms([]);
            setCurrentRoomNo(null);
            return;
        }
        loadRooms().catch(console.error);
    }, []);

    // 타이핑 애니메이션 + 스크롤 자동 따라옴
    const animateAiMessage = (fullText, sources) => {
        const charsPerTick = 8; // 높일수록 빠름, 낮출수록 느림
        const typingInterval = 16; // ms (16ms ≈ 60fps)
        let index = 0;

        setMessages(prev => [
            ...prev,
            { text: '', isUser: false, sources: sources || [] }
        ]);

        const intervalId = setInterval(() => {
            index += charsPerTick;

            setMessages(prev => {
                if (prev.length === 0) return prev;
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                const lastMsg = updated[lastIdx];
                if (!lastMsg || lastMsg.isUser) return prev;
                updated[lastIdx] = {
                    ...lastMsg,
                    text: fullText.slice(0, index)
                };
                return updated;
            });

            // 타이핑 중 스크롤 자동 따라옴
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

            if (index >= fullText.length) {
                clearInterval(intervalId);
            }
        }, typingInterval);
    };

    const sendMessage = async (questionText, options = {}) => {
        const finalQuestion = typeof questionText === 'string' ? questionText : input;
        if (!finalQuestion.trim()) return;

        const userMsg = { text: finalQuestion, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('/api/ai/consult', {
                question: userMsg.text,
                userNo: userNo,
                roomNo: currentRoomNo,
                disableRag: options.disableRag === true
            });
            const data = res.data?.data ?? res.data;
            const hideSources = options.hideSources === true;
            const fullText = data?.answer ?? res.data?.answer ?? '';
            const sources = hideSources ? [] : (data?.related_cases ?? res.data?.related_cases ?? []);

            animateAiMessage(fullText, sources);

            const newRoomNo = data?.roomNo ?? res.data?.roomNo;
            if (newRoomNo != null) setCurrentRoomNo(newRoomNo);
            await loadRooms();
        } catch (error) {
            console.error(error);
            const serverMsg =
                error?.response?.data?.message ||
                (typeof error?.response?.data === 'string' ? error.response.data : null);
            const fallbackMsg = error?.code === 'ECONNABORTED'
                ? "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
                : "서버 연결 오류가 발생했습니다.";
            setMessages(prev => [...prev, { text: serverMsg || fallbackMsg, isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSummarizeAndWrite = async () => {
        const payload = {
            messages: messages.map(m => ({
                isUser: m.isUser,
                text: m.text || '',
                sources: m.sources || []
            }))
        };
        setIsSummarizing(true);
        try {
            const res = await api.post('/api/ai/summarize-consult', payload);
            const data = res.data?.data ?? res.data;
            if (!data || typeof data !== 'object') throw new Error('정리된 데이터를 받지 못했습니다.');
            const title = data.title ?? 'AI 법률 상담 내용';
            const content = data.content ?? '';
            setFilesFromAi(attachedFiles);
            navigate('/write', { state: { title, content, fromAiChatWithFiles: true, filesFromAi: attachedFiles } });
        } catch (err) {
            console.error(err);
            alert('상담 내용 정리에 실패했습니다. 네트워크와 AI 서버(파이썬)를 확인해주세요.');
        } finally {
            setIsSummarizing(false);
        }
    };

    const faqList = [
        { title: "내용증명 작성 가이드" },
        { title: "임대차 보호법 해설" },
        { title: "민사 소송 절차" },
        { title: "이혼 절차 및 준비 서류" }
    ];

    return (
        <div className="flex h-full bg-white font-sans overflow-hidden">

            {/* 왼쪽 사이드바 */}
            <div className="w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
                <div className="pt-2.5 px-3 pb-3 border-b border-gray-200">
                    <button
                        onClick={openNewChat}
                        className="w-full flex items-center gap-2.5 text-gray-600 text-sm py-2 px-3 rounded-lg bg-white/60 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200 shadow-sm"
                    >
                        <span className="text-lg">💬</span>
                        <span className="font-medium">새로운 상담 시작</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-4">
                    <h3 className="text-xs font-semibold text-gray-400 mb-4 pl-2">최근 상담 내역</h3>
                    <ul className="space-y-3 text-sm text-gray-600">
                        {rooms.length === 0 && (
                            <li className="text-xs text-gray-400 pl-2">최근 상담이 없습니다.</li>
                        )}
                        {rooms.map((r) => (
                            <li
                                key={r.roomNo}
                                onClick={() => {
                                    setCurrentRoomNo(r.roomNo);
                                    setExpandedSources(new Set());
                                    loadRoomLogs(r.roomNo).catch(console.error);
                                }}
                                className={`cursor-pointer hover:text-blue-600 truncate pl-2 ${currentRoomNo === r.roomNo ? 'text-blue-600 font-semibold' : ''}`}
                                title={r.title || r.lastQuestion || ''}
                            >
                                {r.title || r.lastQuestion || `상담 #${r.roomNo}`}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="shrink-0 px-2 py-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-400 mb-3 pl-2">자주 묻는 질문</h3>
                    <div className="space-y-2">
                        {faqList.map((faq, idx) => (
                            <button
                                key={idx}
                                onClick={() => sendMessage(faq.title, { hideSources: true, disableRag: true })}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white hover:border hover:border-gray-200 transition"
                            >
                                <span className="truncate">{faq.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 오른쪽 메인 채팅 영역 */}
            <div className="flex-1 flex flex-col relative bg-white overflow-hidden">

                {/* 메시지 영역 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                {!msg.isUser && (
                                    <span className="text-sm font-bold text-gray-700 mb-1">LAW PARTNER</span>
                                )}
                                <div className={`px-4 py-3 text-[14px] leading-relaxed rounded-2xl ${
                                    msg.isUser
                                        ? 'bg-blue-50 text-gray-800 rounded-tr-sm'
                                        : 'bg-white text-gray-800'
                                }`}>
                                    {msg.isUser ? (
                                        <span className="whitespace-pre-wrap">{msg.text}</span>
                                    ) : (
                                        <ReactMarkdown
                                            components={{
                                                h1: ({children}) => <h1 className="text-lg font-bold mt-3 mb-1">{children}</h1>,
                                                h2: ({children}) => <h2 className="text-base font-bold mt-3 mb-1">{children}</h2>,
                                                h3: ({children}) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                                                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                                ul: ({children}) => <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>,
                                                ol: ({children}) => <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>,
                                                li: ({children}) => <li className="text-[14px]">{children}</li>,
                                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                                hr: () => <hr className="my-2 border-gray-200" />,
                                                code: ({children}) => <code className="bg-gray-100 px-1 rounded text-sm font-mono">{children}</code>,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    )}
                                </div>

                                {/* 유저 메시지 첨부파일 */}
                                {msg.isUser && msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2 max-w-[520px]">
                                        {msg.attachments.map((a) => (
                                            <div
                                                key={a.key}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                                            >
                                                <span className="font-mono text-gray-400">@</span>
                                                <span className="truncate max-w-[360px]" title={a.name}>{a.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachedFileByKey(a.key)}
                                                    className="ml-1 text-gray-400 hover:text-red-600"
                                                    aria-label="첨부 파일 삭제"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* AI 메시지 참고 판례 */}
                                {!msg.isUser && msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 w-full border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm">
                                        <div className="font-bold text-gray-700 mb-2">📚 참고 판례 ({msg.sources.length}건)</div>
                                        {msg.sources.map((src, i) => {
                                            const key = `${idx}-${i}`;
                                            const isExpanded = expandedSources.has(key);
                                            const needsMore = src.length > SOURCE_PREVIEW_LEN;
                                            const displayText = needsMore && !isExpanded
                                                ? src.slice(0, SOURCE_PREVIEW_LEN) + "..."
                                                : src;
                                            return (
                                                <div key={i} className="text-gray-600 mb-3 last:mb-0">
                                                    <div className="whitespace-pre-wrap">• {displayText}</div>
                                                    {needsMore && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedSources(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(key)) next.delete(key);
                                                                else next.add(key);
                                                                return next;
                                                            })}
                                                            className="mt-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                                                        >
                                                            {isExpanded ? "접기" : "더보기"}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* 로딩 인디케이터 */}
                    {isLoading && (
                        <div className="flex gap-3 items-center max-w-4xl mx-auto text-gray-500 py-2">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <div>AI가 답변을 준비하고 있습니다...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* 하단 입력창 */}
                <div className="shrink-0 w-full max-w-4xl mx-auto px-6 pb-4 pt-1">
                    <div className="mb-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSummarizeAndWrite}
                                disabled={messages.length <= 1 || isSummarizing}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {isSummarizing ? '정리 중...' : '📋 상담내용으로 글쓰기'}
                            </button>
                            <div className="relative">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.hwp,.txt,image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.length) {
                                            const picked = Array.from(e.target.files);
                                            const withKeys = picked.map(f => ({
                                                key: getFileKey(f),
                                                name: f.name,
                                                file: f
                                            }));
                                            setAttachedFiles(prev => [...prev, ...picked]);
                                            const count = picked.length;
                                            setMessages(prev => ([
                                                ...prev,
                                                {
                                                    text: `파일 ${count}개가 추가되었습니다.`,
                                                    isUser: true,
                                                    attachments: withKeys
                                                }
                                            ]));
                                        }
                                        e.target.value = '';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition flex items-center gap-1"
                                >
                                    {attachedFiles.length > 0 ? `📎 파일 추가 (${attachedFiles.length})` : '📎 파일 추가'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="relative shadow-lg rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-sm">
                        <textarea
                            className="w-full bg-transparent border-none rounded-2xl px-5 py-3.5 pr-14 text-[14px] resize-none focus:outline-none focus:ring-0"
                            rows="2"
                            placeholder="법률적인 궁금증을 물어보세요..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition disabled:opacity-50 disabled:bg-gray-300 disabled:hover:bg-gray-300"
                        >
                            ↑
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatPage;
