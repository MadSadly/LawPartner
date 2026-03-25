import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../common/components/DashboardSidebar';
import api, { API_BASE_URL, getAccessToken } from '../common/api/axiosConfig';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import './chatList.css';

const ChatList = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentRoomStatus, setCurrentRoomStatus] = useState(null);
    const [targetName, setTargetName] = useState('상대방');
    const [currentRoom, setCurrentRoom] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const stompClient = useRef(null);
    const chatContainerRef = useRef(null);
    const reconnectTimer = useRef(null);
    const currentRoomIdRef = useRef(roomId);
    const chatSubRef = useRef(null);

    const userNo = Number(localStorage.getItem('userNo'));

    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const initialMessageRef = useRef('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    /** 변호사가 일정 제안 시 "이 날짜로 하시겠습니까?" 확인용 (true면 확인 모달 표시) */
    const [showCalendarSendConfirm, setShowCalendarSendConfirm] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [toastMsg, setToastMsg] = useState(null);

    const [pendingCalendarAction, setPendingCalendarAction] = useState(null);
    const [pendingCalendarRejectDate, setPendingCalendarRejectDate] = useState(null);
    const [calendarRejectReason, setCalendarRejectReason] = useState('');
    const [isCalendarDecisionDone, setIsCalendarDecisionDone] = useState(false);
    const [latestIncomingCalendarIdx, setLatestIncomingCalendarIdx] = useState(-1);
    /** 상담 종료 후 의뢰인 리뷰 작성 모달 */
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewContent, setReviewContent] = useState('');
    const [reviewSubmittedRooms, setReviewSubmittedRooms] = useState(() => new Set());
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    /** 스크롤 시 이전 메시지 로드: 더 있을지 여부, 로딩 중, 최초 로드 완료 */
    const [hasMoreOlder, setHasMoreOlder] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [initialHistoryDone, setInitialHistoryDone] = useState(false);
    const HISTORY_PAGE_SIZE = 20;

    /**
     * 채팅/캘린더용 날짜+시간 표시 포맷 (날짜·시간만 깔끔하게)
     * - "2026-03-15T14:00" / "2026-03-15 14:00" 등 모두 파싱
     * - 결과: "3월 15일 14:00" (한 자리 수는 0 없이)
     */
    const formatDateTimeClean = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return '';
        const normalized = dateString.trim().replace(' ', 'T');
        const d = new Date(normalized);
        if (Number.isNaN(d.getTime())) return dateString;
        const month = d.getMonth() + 1;
        const date = d.getDate();
        const h = d.getHours();
        const m = d.getMinutes();
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        return `${month}월 ${date}일 ${time}`;
    };

    /**
     * datetime-local 값 → API/저장용 "YYYY-MM-DD HH:mm" 형식으로 통일
     * (백엔드 confirmSchedule 및 채팅 메시지 저장 시 동일 형식 사용)
     */
    const toApiDateString = (datetimeLocalValue) => {
        if (!datetimeLocalValue) return '';
        const d = new Date(datetimeLocalValue);
        if (Number.isNaN(d.getTime())) return datetimeLocalValue;
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // datetime-local min 속성용 현재 시각("YYYY-MM-DDTHH:mm")
    const getNowLocalDateTimeMin = () => {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    const isPastDateTime = (datetimeLocalValue) => {
        if (!datetimeLocalValue) return false;
        const selected = new Date(datetimeLocalValue);
        if (Number.isNaN(selected.getTime())) return true;
        return selected.getTime() < Date.now();
    };

    // 공통 axios(axiosConfig)가 요청 인터셉터로 Authorization 자동 부착 → API 호출 시 헤더 따로 넘기지 않음
    const showNotification = useCallback((msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    }, []);

    useEffect(() => {
        currentRoomIdRef.current = roomId;
    }, [roomId]);

    // 1. 채팅방 목록 불러오기 (공통 api가 토큰 자동 부착)
    const loadRooms = useCallback(() => {
        api.get('/api/chat/rooms')
            .then(res => setRooms(res.data.data || []))
            .catch(() => setRooms([]));
    }, []);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    /** 의뢰인·담당 변호사: ST99로 숨김 → 목록에서 제외(서버 권한과 동일) */
    const handleHideRoomFromList = useCallback(async (e, targetRoomId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('채팅방을 나가겠습니까?')) return;
        try {
            await api.delete(`/api/mypage/chat/room/${targetRoomId}`);
            loadRooms();
            if (String(roomId) === String(targetRoomId)) {
                navigate('/chatList');
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || '채팅방을 숨기지 못했습니다.');
        }
    }, [loadRooms, navigate, roomId]);

    // 2. 방 선택 시 상태/이름 갱신
    useEffect(() => {
        if (!roomId || rooms.length === 0) return;
        const selectedRoom = rooms.find(r => String(r.roomId) === String(roomId));
        if (selectedRoom) {
            setCurrentRoom(selectedRoom);
            setCurrentRoomStatus(selectedRoom.progressCode);
            const opponentName = Number(selectedRoom.userNo) === Number(userNo)
                ? selectedRoom.lawyerName : selectedRoom.userNm;
            setTargetName(opponentName || '상대방');
        }
    }, [roomId, rooms, userNo]);

    useEffect(() => {
        if (!roomId) return;
        setIsCalendarDecisionDone(false);
    }, [roomId]);

    useEffect(() => {
        // "가장 최근에 받은 일정 제안" 기준으로만 확정/거절 여부를 판단한다.
        // 이전 제안에 대한 확정/거절 기록 때문에 새 제안 버튼이 사라지는 문제를 방지.
        if (!roomId) {
            setIsCalendarDecisionDone(false);
            setLatestIncomingCalendarIdx(-1);
            return;
        }

        let latestIncomingCalendarIndex = -1;
        for (let i = chatLog.length - 1; i >= 0; i -= 1) {
            const msg = chatLog[i];
            const isMyMessage = Number(msg.senderNo) === Number(userNo);
            if (msg.msgType === 'CALENDAR' && !isMyMessage) {
                latestIncomingCalendarIndex = i;
                break;
            }
        }
        setLatestIncomingCalendarIdx(latestIncomingCalendarIndex);

        if (latestIncomingCalendarIndex < 0) {
            setIsCalendarDecisionDone(false);
            return;
        }

        const decidedAfterLatestProposal = chatLog
            .slice(latestIncomingCalendarIndex + 1)
            .some((msg) =>
                msg.msgType === 'TEXT' &&
                (
                    (msg.message || '').includes('[일정 확정]') ||
                    (msg.message || '').includes('거절')
                )
            );

        setIsCalendarDecisionDone(decidedAfterLatestProposal);
    }, [chatLog, roomId, userNo]);

    // 4. 방 변경 시 과거 내역(페이지네이션) + 웹소켓 연결 (헤더 추가 완료)
    useEffect(() => {
        if (!roomId) return;

        setChatLog([]);
        setWsConnected(false);
        setInitialHistoryDone(false);
        setHasMoreOlder(true);

        // 최신 HISTORY_PAGE_SIZE개만 먼저 로드 (스크롤 올리면 이전 메시지 추가 로드)
        api.get(`/api/chat/history/${roomId}`, { params: { size: HISTORY_PAGE_SIZE } })
            .then(res => {
                const list = res.data.data || [];
                setChatLog(list);
                setHasMoreOlder(list.length >= HISTORY_PAGE_SIZE);
                setInitialHistoryDone(true);
            })
            .catch(() => {
                setChatLog([]);
                setInitialHistoryDone(true);
                setHasMoreOlder(false);
            });

        api.post(`/api/chat/room/${roomId}/read`, {}).catch(() => {});

        let isMounted = true;
        const socket = new SockJS(`${API_BASE_URL}/ws-stomp`);
        const client = Stomp.over(socket);
        client.debug = () => {};
        const token = getAccessToken();

        client.connect({ Authorization: `Bearer ${token}` }, () => {
            if (!isMounted) { client.disconnect(); return; }
            setWsConnected(true);

            if (chatSubRef.current) {
                chatSubRef.current.unsubscribe();
            }

            chatSubRef.current = client.subscribe(`/sub/chat/room/${roomId}`, (response) => {
                if (!isMounted) return;
                const newMsg = JSON.parse(response.body);
                if (newMsg.msgType === 'STATUS_CHANGE') {
                    setCurrentRoomStatus(newMsg.message);
                    loadRooms();
                } else {
                    setChatLog(prev => [...prev, newMsg]);
                    loadRooms();
                }
            });

            client.subscribe(`/sub/user/${userNo}/notification`, (response) => {
                if (!isMounted) return;
                const noti = JSON.parse(response.body);
                if (noti.roomId && String(noti.roomId) === String(roomId)) return;
                showNotification({ senderName: noti.title, message: noti.content });
            });

        }, (error) => {
            console.error("❌ WS 연결 실패:", error);
            setWsConnected(false);
        });

        stompClient.current = client;

        return () => {
            isMounted = false;

            if (chatSubRef.current) {
                chatSubRef.current.unsubscribe();
                chatSubRef.current = null;
            }

            if (stompClient.current) {
                stompClient.current.disconnect();
                stompClient.current = null;
            }
            if (recognitionRef.current) recognitionRef.current.stop();
            setWsConnected(false);
        };
    }, [roomId]);


    const isLawyer = currentRoom && Number(currentRoom.lawyerNo) === Number(userNo);

    // ★ 상태 변경 API 호출 (헤더 추가 완료)
    const handleStatusChange = async (type) => {
        try {
            const endpoint = type === 'ACCEPT' ? `/api/chat/room/accept/${roomId}` : `/api/chat/room/close/${roomId}`;
            await api.put(endpoint, {});

            alert(type === 'ACCEPT' ? "상담을 수락했습니다." : "상담을 종료했습니다.");
            setCurrentRoomStatus(type === 'ACCEPT' ? 'ST02' : 'ST05');
            loadRooms();
        } catch (error) {
            alert("처리 중 에러가 발생했습니다.");
        }
    };

    // ★ 메시지 전송 (웹소켓 전송 시에도 헤더 추가 완료)
    const handleSendMessage = useCallback((typeOverride, msgOverride) => {
        const msgType = typeOverride || 'TEXT';
        const msgContent = msgOverride !== undefined ? msgOverride : message;
        if (!msgContent.trim()) return;

        if (!stompClient.current?.connected) {
            alert("연결이 불안정합니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const chatDTO = { roomId, senderNo: userNo, message: msgContent, msgType };
        const token = getAccessToken();

        // ★ [핵심 3] STOMP 전송 시에도 헤더에 신분증 꽂아줌!
        stompClient.current.send("/pub/chat/message", { Authorization: `Bearer ${token}` }, JSON.stringify(chatDTO));
        if (msgType === 'TEXT') setMessage('');
    }, [message, roomId, userNo]);

    const sendCalendarProposal = () => {
        if (!selectedDate) { alert("날짜와 시간을 선택해주세요."); return; }
        if (isPastDateTime(selectedDate)) { alert("지난 날짜/시간은 제안할 수 없습니다."); return; }
        setShowCalendarSendConfirm(true);
    };

    /** 변호사 확인 모달에서 "예, 제안할게요" 클릭 시 실제 전송 */
    const confirmAndSendCalendarProposal = () => {
        if (!selectedDate) return;
        if (isPastDateTime(selectedDate)) { alert("지난 날짜/시간은 제안할 수 없습니다."); return; }
        const dateForApi = toApiDateString(selectedDate);
        handleSendMessage('CALENDAR', dateForApi);
        setIsCalendarOpen(false);
        setSelectedDate('');
        setShowCalendarSendConfirm(false);
    };

    // ★ [핵심 변경] 수락 버튼 누르면 바로 확정 안 하고 모달 띄우기용 상태값 세팅
    const openCalendarConfirmModal = (dateStr) => {
        setPendingCalendarAction(dateStr);
    };

    /** 상담 종료 후 변호사 리뷰 제출 (한 번만 등록되도록 버튼 비활성화) */
    const submitReview = async () => {
        if (!roomId || isSubmittingReview) return;
        setIsSubmittingReview(true);
        try {
            await api.post(`/api/chat/room/${roomId}/review`, { rating: reviewRating, content: reviewContent });
            setReviewSubmittedRooms(prev => new Set([...prev, roomId]));
            setShowReviewModal(false);
            alert('리뷰가 등록되었습니다.');
        } catch (e) {
            const msg = e.response?.data?.message || e.message || '리뷰 등록에 실패했습니다.';
            alert(msg);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // ★ [핵심 추가] 모달에서 '예, 확정합니다' 눌렀을 때 실행되는 찐 로직
    const executeCalendarAccept = async () => {
        if (!pendingCalendarAction) return;
        try {
            await api.post('/api/chat/calendar/confirm', { roomId, date: pendingCalendarAction });
            // 시스템 메시지를 로봇처럼 안 하고 깔끔하게 포맷팅해서 던짐
            handleSendMessage('TEXT', `[일정 확정] ${formatDateTimeClean(pendingCalendarAction)} 예약이 완료되었습니다.`);
            setIsCalendarDecisionDone(true);
            setPendingCalendarAction(null); // 모달 닫기
        } catch {
            alert("일정 확정에 실패했습니다.");
            setPendingCalendarAction(null);
        }
    };

    const openCalendarRejectModal = (dateStr) => {
        setPendingCalendarRejectDate(dateStr);
        setCalendarRejectReason('');
    };

    const executeCalendarReject = async () => {
        if (!pendingCalendarRejectDate) return;
        try {
            await api.post('/api/chat/calendar/reject', {
                roomId,
                date: pendingCalendarRejectDate,
                reason: calendarRejectReason
            });
            setIsCalendarDecisionDone(true);
            setPendingCalendarRejectDate(null);
            setCalendarRejectReason('');
        } catch {
            alert("일정 취소 처리에 실패했습니다.");
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) { alert("100MB 이하 파일만 가능합니다."); return; }
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("roomId", roomId);
        try {
            // 공통 api가 FormData 시 Content-Type 자동 처리 + 요청 인터셉터로 Authorization 부착
            await api.post('/api/chat/files', formData);
        } catch { alert("파일 업로드에 실패했습니다."); }
        finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const toggleRecording = async () => {
        if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("마이크 기능이 작동하지 않습니다."); return; }

        // 이 환경에서는 mediaDevices 자체가 undefined일 수 있음 (보안 컨텍스트/정책 위반 등)
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
            alert("마이크 기능이 이 환경에서는 제공되지 않습니다. HTTPS(또는 localhost)로 접속해보세요.");
            return;
        }

        // SpeechRecognition은 권한 상태가 꼬이면 not-allowed로 바로 떨어질 수 있어서,
        // 먼저 getUserMedia로 마이크 접근 권한 프롬프트를 한번 확실히 띄운다.
        // (권한이 이미 허용이면 즉시 통과)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
        } catch (e) {
            alert("마이크 권한이 아직 허용되지 않았습니다. 브라우저 사이트 설정 + Windows 마이크 권한을 확인 후 새로고침하세요.");
            setIsRecording(false);
            return;
        }
        initialMessageRef.current = message;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
            setMessage((initialMessageRef.current ? initialMessageRef.current + ' ' : '') + transcript);
        };
        recognition.onerror = (e) => {
            if (e.error === 'no-speech') return;

            // e.error 값에 따라 원인/조치가 달라서 메시지를 구체화
            if (e.error === 'not-allowed') {
                alert("마이크 권한이 거부되었습니다. 브라우저 사이트 설정에서 마이크 허용 후 새로고침하세요.");
            } else if (e.error === 'service-not-allowed') {
                alert("마이크 음성 인식 서비스가 차단되었습니다. HTTPS(또는 localhost) 환경에서 다시 시도해보세요.");
            } else if (e.error === 'audio-capture') {
                alert("마이크를 찾을 수 없습니다. 입력 장치를 확인해주세요.");
            } else {
                alert(`마이크 기능이 작동하지 않습니다. (${e.error || 'unknown error'})`);
            }
            setIsRecording(false);
        };
        recognition.onend = () => setIsRecording(false);
        try {
            recognition.start();
        } catch {
            alert("마이크 기능이 작동하지 않습니다.");
            setIsRecording(false);
            return;
        }
        setIsRecording(true);
        recognitionRef.current = recognition;
    };

    // 새 메시지 추가 시 맨 아래로 스크롤 (이전 메시지 로드로 prepend 시에는 스크롤 유지)
    const isPrependRef = useRef(false);
    useEffect(() => {
        if (!chatContainerRef.current) return;
        if (isPrependRef.current) {
            isPrependRef.current = false;
            return;
        }
        const el = chatContainerRef.current;
        el.scrollTo({ top: el.scrollHeight - el.clientHeight, behavior: "smooth" });
    }, [chatLog]);

    /** 스크롤 맨 위 근처에서 이전 메시지 더 불러오기 */
    const loadOlderMessages = useCallback(() => {
        if (!roomId || !hasMoreOlder || loadingOlder || chatLog.length === 0) return;
        const oldest = chatLog[0];
        let before = null;
        if (typeof oldest.sendDt === 'string') before = oldest.sendDt;
        else if (Array.isArray(oldest.sendDt) && oldest.sendDt.length >= 5)
            before = `${oldest.sendDt[0]}-${String(oldest.sendDt[1]).padStart(2,'0')}-${String(oldest.sendDt[2]).padStart(2,'0')}T${String(oldest.sendDt[3]).padStart(2,'0')}:${String(oldest.sendDt[4]).padStart(2,'0')}:00`;
        if (!before) return;
        setLoadingOlder(true);
        const prevScrollHeight = chatContainerRef.current ? chatContainerRef.current.scrollHeight : 0;
        api.get(`/api/chat/history/${roomId}`, { params: { size: HISTORY_PAGE_SIZE, before } })
            .then(res => {
                const list = res.data.data || [];
                if (list.length > 0) {
                    isPrependRef.current = true;
                    setChatLog(prev => [...list, ...prev]);
                    setHasMoreOlder(list.length >= HISTORY_PAGE_SIZE);
                } else {
                    setHasMoreOlder(false);
                }
                requestAnimationFrame(() => {
                    if (chatContainerRef.current && prevScrollHeight > 0) {
                        const newScrollHeight = chatContainerRef.current.scrollHeight;
                        chatContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
                    }
                });
            })
            .catch(() => setHasMoreOlder(false))
            .finally(() => setLoadingOlder(false));
    }, [roomId, hasMoreOlder, loadingOlder, chatLog]);

    /** 채팅 영역 스크롤 핸들러: 맨 위 근처면 이전 메시지 로드 */
    const handleChatScroll = useCallback(() => {
        const el = chatContainerRef.current;
        if (!el || !initialHistoryDone) return;
        if (el.scrollTop < 120 && hasMoreOlder && !loadingOlder) loadOlderMessages();
    }, [initialHistoryDone, hasMoreOlder, loadingOlder, loadOlderMessages]);

    const filteredRooms = rooms.filter(room => {
        const matchStatus = filterStatus === 'ALL' || room.progressCode === filterStatus;
        const opponentName = Number(room.userNo) === Number(userNo) ? room.lawyerName : room.userNm;
        return matchStatus && (opponentName || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="flex flex-1 min-h-0 bg-[#f1f5f9] overflow-hidden font-sans text-slate-900" style={{ height: '100%', minHeight: 0 }}>
            <DashboardSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 flex flex-col min-h-0 bg-slate-100 min-w-0 relative" style={{ minHeight: 0, overflow: 'hidden', height: '100%' }}>

                <header className="h-20 shrink-0 flex-none bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-navy-dark tracking-tight">채팅 목록</h2>
                        {roomId && (
                            <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${wsConnected ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`}></div>
                                {wsConnected ? '실시간 연결됨' : '연결 중...'}
                            </div>
                        )}
                    </div>
                    {isLawyer && roomId && (
                        <div className="flex gap-2">
                            {currentRoomStatus === 'ST01' && <button onClick={() => handleStatusChange('ACCEPT')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition">상담 수락하기</button>}
                            {currentRoomStatus === 'ST02' && <button onClick={() => handleStatusChange('CLOSE')} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-900 transition">상담 완료(종료)</button>}
                        </div>
                    )}
                </header>

                <div className="flex-1 flex min-h-0 overflow-hidden" style={{ minHeight: 0, flex: '1 1 0%' }}>
                    <section className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-inner shrink-0 hidden lg:flex">
                        <div className="p-6 border-b border-slate-100 bg-white space-y-4">
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                                <input type="text" placeholder="이름으로 검색.." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                       className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium" />
                            </div>
                            <div className="flex p-1 bg-slate-100 rounded-lg">
                                {[['ALL','전체'],['ST02','진행중'],['ST01','대기'],['ST05','완료']].map(([code, label]) => (
                                    <button key={code} onClick={() => setFilterStatus(code)}
                                            className={`flex-1 py-1.5 text-[14px] font-bold rounded-md transition ${filterStatus === code ? 'bg-white shadow-sm text-blue-900' : 'text-slate-400'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                            {filteredRooms.length > 0 ? filteredRooms.map((room) => {
                                const opponentName = Number(room.userNo) === Number(userNo) ? room.lawyerName : room.userNm;
                                return (
                                    <div key={room.roomId} className={`flex items-stretch border-b border-slate-100 ${String(roomId) === String(room.roomId) ? 'bg-blue-50' : ''}`}>
                                        <Link to={`/chatList/${room.roomId}`}
                                              className={`flex-1 min-w-0 p-3 cursor-pointer transition flex items-center gap-3 ${String(roomId) === String(room.roomId) ? '' : 'hover:bg-slate-50'}`}>
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black shrink-0 shadow-sm text-sm">
                                                {opponentName ? opponentName.substring(0, 1) : '상'}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className="font-bold text-slate-800 text-[13px] truncate pr-2">{opponentName || `상담방`}</span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${room.progressCode === 'ST01' ? 'bg-orange-100 text-orange-600' : room.progressCode === 'ST02' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {room.progressCode === 'ST01' ? '대기' : room.progressCode === 'ST02' ? '진행' : '완료'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 truncate font-medium mt-0.5">{room.lastMessage || '대화를 시작하세요...'}</p>
                                            </div>
                                        </Link>
                                        {(Number(room.userNo) === Number(userNo) || Number(room.lawyerNo) === Number(userNo)) && (
                                            <button
                                                type="button"
                                                title="채팅방 나가기"
                                                onClick={(e) => handleHideRoomFromList(e, room.roomId)}
                                                className="shrink-0 px-2 text-slate-400 hover:text-red-500 transition"
                                            >
                                                <i className="fas fa-trash-alt text-sm" />
                                            </button>
                                        )}
                                    </div>
                                );
                            }) : <div className="p-10 text-center text-xs text-slate-400 font-bold">조건에 맞는 방이 없습니다.</div>}
                        </div>
                    </section>

                    <section className="flex-1 flex flex-col min-h-0 min-w-0 bg-white relative overflow-hidden" style={{ minHeight: 0, flex: '1 1 0%', display: 'flex', flexDirection: 'column' }}>
                        {!roomId ? (
                            <div className="flex-1 flex items-center justify-center bg-slate-50 font-bold text-slate-400">방을 선택해주세요.</div>
                        ) : (
                            <>
                                {currentRoomStatus === 'ST01' && <div className="flex-none bg-orange-50 p-2 text-center text-orange-600 text-sm font-bold">대기 중입니다. 변호사의 수락을 기다려주세요.</div>}
                                {currentRoomStatus === 'ST05' && (
                                    <div className="flex-none bg-slate-100 p-3 flex items-center justify-center gap-4 flex-wrap border-b border-slate-200">
                                        <span className="text-slate-600 text-sm font-bold">종료된 상담입니다.</span>
                                        {!isLawyer && currentRoom?.lawyerNo && !reviewSubmittedRooms.has(roomId) && (
                                            <button onClick={() => { setReviewRating(5); setReviewContent(''); setShowReviewModal(true); }} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2d4a6f] transition shadow-sm">
                                                <i className="fas fa-star mr-1.5"></i> 변호사 리뷰 작성
                                            </button>
                                        )}
                                        {!isLawyer && reviewSubmittedRooms.has(roomId) && <span className="text-slate-600 text-sm font-bold">리뷰를 작성하셨습니다.</span>}
                                    </div>
                                )}

                                {/* 채팅 내역 스크롤 영역 - 반드시 스크롤 가능하도록 */}
                                <div
                                    ref={chatContainerRef}
                                    className="chat-scroll-area flex-1 min-h-0 overflow-x-hidden px-4 sm:px-6 py-4 bg-[#e8ecf1]"
                                    style={{ flex: '1 1 0%', overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}
                                    onScroll={handleChatScroll}
                                >
                                    {loadingOlder && (
                                        <div className="flex justify-center py-3 text-slate-500 text-xs font-semibold">
                                            <i className="fas fa-spinner fa-spin mr-1.5"></i> 이전 메시지 불러오는 중...
                                        </div>
                                    )}
                                    {!hasMoreOlder && chatLog.length > 0 && (
                                        <div className="text-center py-2 text-slate-500 text-[11px] font-semibold">처음 메시지입니다.</div>
                                    )}
                                    {chatLog.length === 0 && initialHistoryDone && !loadingOlder && (
                                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                            <div className="w-16 h-16 rounded-full bg-slate-200/80 flex items-center justify-center mb-3">
                                                <i className="fas fa-comments text-2xl text-slate-400"></i>
                                            </div>
                                            <p className="text-sm font-bold">아직 메시지가 없어요</p>
                                            <p className="text-xs mt-1">첫 메시지를 보내 보세요.</p>
                                        </div>
                                    )}
                                    {chatLog.map((msg, index) => {
                                        const isMyMessage = Number(msg.senderNo) === Number(userNo);
                                        const profileImg = msg.profileUrl || (currentRoom && !isMyMessage ? currentRoom.targetProfileImg : null);
                                        const isLatestIncomingCalendarMsg =
                                            msg.msgType === 'CALENDAR' &&
                                            !isMyMessage &&
                                            index === latestIncomingCalendarIdx;
                                        const canRespondToThisProposal =
                                            !isLawyer &&
                                            currentRoomStatus !== 'ST05' &&
                                            !isCalendarDecisionDone &&
                                            isLatestIncomingCalendarMsg;
                                        return (
                                            <div key={index} className={`flex items-end gap-2 mb-4 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {!isMyMessage && (
                                                    profileImg
                                                        ? <img src={profileImg} alt="profile" className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-white shadow-sm" />
                                                        : <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0 border-2 border-white shadow-sm">{targetName ? targetName.substring(0, 1) : '상'}</div>
                                                )}
                                                <div className={`max-w-[75%] sm:max-w-[65%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                                    {!isMyMessage && <span className="text-[11px] font-bold text-slate-500 mb-0.5 px-1">{msg.senderName || targetName}</span>}
                                                    <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${isMyMessage ? 'bg-[#1e3a5f] text-white rounded-br-md shadow-md' : 'bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-100'}`}>
                                                        {msg.msgType === 'CALENDAR' ? (
                                                            <div className={`flex flex-col items-center p-3 rounded-xl min-w-[180px] ${isMyMessage ? 'bg-white/15 text-white' : 'bg-slate-50 text-slate-800 border border-slate-100'}`}>
                                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                                                                    <i className="fas fa-calendar-day text-sm"></i>
                                                                </div>
                                                                <p className="text-[11px] font-bold opacity-90 mb-0.5">상담 일정 제안</p>
                                                                <p className="font-bold text-sm">{formatDateTimeClean(msg.message)}</p>
                                                                {canRespondToThisProposal && (
                                                                    <div className="mt-2 w-full flex gap-1.5">
                                                                        <button onClick={() => openCalendarConfirmModal(msg.message)} className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-[11px] font-bold hover:bg-blue-700 transition">
                                                                            수락
                                                                        </button>
                                                                        <button onClick={() => openCalendarRejectModal(msg.message)} className="flex-1 bg-slate-200 text-slate-700 py-1.5 rounded-lg text-[11px] font-bold hover:bg-slate-300 transition">
                                                                            거절
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : msg.msgType === 'FILE' ? (
                                                            <div className="flex flex-col space-y-1.5">
                                                                {msg.message && /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i.test(msg.message)
                                                                    ? <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"><img src={msg.fileUrl} alt={msg.message} className="max-w-[220px] rounded-lg border border-slate-200/50 cursor-pointer hover:opacity-90 transition" /></a>
                                                                    : <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline font-bold opacity-90"><i className="fas fa-file-alt"></i><span className="truncate max-w-[180px]">{msg.message}</span></a>
                                                                }
                                                                <a href={`${msg.fileUrl}?isDownload=true`} className="text-[10px] opacity-80 hover:opacity-100 flex items-center gap-1 w-max"><i className="fas fa-download"></i> 저장</a>
                                                            </div>
                                                        ) : <span className="break-words">{msg.message}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 채팅 입력창 - 항상 하단에 고정 표시 */}
                                <div className="flex-none shrink-0 w-full p-4 border-t-2 border-slate-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)]" style={{ flexShrink: 0 }}>
                                    <div className="relative bg-slate-100 rounded-2xl p-3 border border-slate-200 max-w-4xl mx-auto">
                                        <textarea disabled={currentRoomStatus === 'ST05'}
                                                  placeholder={currentRoomStatus === 'ST05' ? "상담이 종료되어 채팅할 수 없습니다." : "메시지를 입력하세요."}
                                                  className="w-full bg-transparent border-none outline-none text-sm font-medium resize-none disabled:opacity-50 min-h-[44px]"
                                                  rows="2" value={message} onChange={(e) => setMessage(e.target.value)}
                                                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                        />
                                        <div className="flex justify-between items-center mt-2 border-t border-slate-200 pt-2">
                                            <div className="flex space-x-5 text-slate-400">
                                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                                                <button onClick={() => fileInputRef.current.click()} disabled={currentRoomStatus === 'ST05' || isUploading} className={`transition ${isUploading ? 'text-gray-300 cursor-wait' : 'hover:text-blue-600'}`}>
                                                    <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-paperclip'}`}></i>
                                                </button>
                                                <button onClick={toggleRecording} disabled={currentRoomStatus === 'ST05'} className={`transition ${isRecording ? 'text-red-500 animate-pulse' : 'hover:text-blue-600 text-slate-400'}`}>
                                                    <i className="fa-solid fa-microphone"></i>
                                                </button>
                                                {isLawyer && (
                                                    <button onClick={() => setIsCalendarOpen(true)} disabled={currentRoomStatus === 'ST05'} className="hover:text-blue-600 transition">
                                                        <i className="fas fa-calendar-alt text-lg"></i>
                                                    </button>
                                                )}
                                            </div>
                                            <button onClick={() => handleSendMessage()} disabled={currentRoomStatus === 'ST05' || !message.trim() || !wsConnected}
                                                    className="bg-navy-main text-white px-4 py-1.5 rounded-lg text-xs font-black disabled:bg-slate-300 transition">전송</button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>

                {isCalendarOpen && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-80 shadow-2xl">
                            <h3 className="font-black text-lg mb-2 text-slate-800">일정 제안하기</h3>
                            <p className="text-xs text-slate-500 mb-4 font-medium">제안할 날짜와 시간을 선택하세요.</p>
                            <input type="datetime-local" min={getNowLocalDateTimeMin()} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg mb-4 text-sm font-bold" />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setIsCalendarOpen(false); setSelectedDate(''); setShowCalendarSendConfirm(false); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200">취소</button>
                                <button onClick={sendCalendarProposal} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700">상대방에게 제안</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* 변호사: 날짜 선택 후 "이 날짜로 하시겠습니까?" 확인 모달 */}
                {showCalendarSendConfirm && selectedDate && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[55] backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-2xl w-[300px] shadow-2xl text-center">
                            <p className="text-slate-600 text-sm mb-1">상담 일정</p>
                            <p className="text-blue-700 font-black text-base mb-4">{formatDateTimeClean(selectedDate)}</p>
                            <p className="text-slate-700 font-bold text-sm mb-4">이 날짜로 상담 일정을 제안하시겠습니까?</p>
                            <div className="flex gap-2">
                                <button onClick={() => setShowCalendarSendConfirm(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">취소</button>
                                <button onClick={confirmAndSendCalendarProposal} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">예, 제안할게요</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* ★ [핵심 추가] 브라우저 기본 confirm 대신 띄우는 커스텀 모달 */}
                {/* 일정 확정 확인 모달: "N월 N일 N시 — 이 날짜로 하시겠습니까?" */}
                {pendingCalendarAction && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-2xl w-[320px] shadow-2xl text-center">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-calendar-day text-xl text-blue-600"></i>
                            </div>
                            <h3 className="font-black text-lg mb-2 text-slate-800">이 날짜로 하시겠습니까?</h3>
                            <p className="text-[13px] text-slate-600 mb-1 font-medium break-keep">상담 일정</p>
                            <p className="text-blue-700 font-black text-[17px] mb-6 bg-slate-50 py-3 px-4 rounded-xl">{formatDateTimeClean(pendingCalendarAction)}</p>
                            <div className="flex justify-center gap-2">
                                <button onClick={() => setPendingCalendarAction(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm font-black hover:bg-slate-200 transition">아니오</button>
                                <button onClick={executeCalendarAccept} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-md hover:bg-blue-700 transition">예, 이 날짜로 할게요</button>
                            </div>
                        </div>
                    </div>
                )}
                {pendingCalendarRejectDate && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-2xl w-[340px] shadow-2xl">
                            <h3 className="font-black text-lg mb-2 text-slate-800">일정 취소</h3>
                            <p className="text-slate-600 text-sm mb-1">제안 일정</p>
                            <p className="text-blue-700 font-bold text-sm mb-3">{formatDateTimeClean(pendingCalendarRejectDate)}</p>
                            <textarea
                                value={calendarRejectReason}
                                onChange={(e) => setCalendarRejectReason(e.target.value)}
                                placeholder="취소 사유를 입력하세요 (선택)"
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none h-20 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setPendingCalendarRejectDate(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">취소</button>
                                <button onClick={executeCalendarReject} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold">취소 전송</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 상담 종료 후 의뢰인 → 변호사 리뷰 작성 모달 (페이지 베이스 색상) */}
                {showReviewModal && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-2xl w-[340px] shadow-2xl border border-slate-200">
                            <h3 className="font-black text-lg mb-3 text-slate-800">변호사 리뷰 작성</h3>
                            <p className="text-slate-600 text-sm mb-3">상담은 어떠셨나요? 별점과 한마디를 남겨주세요.</p>
                            <div className="flex gap-1 mb-4">
                                {[1,2,3,4,5].map((n) => (
                                    <button key={n} type="button" onClick={() => setReviewRating(n)}
                                            className={`w-10 h-10 rounded-full border-2 transition ${reviewRating >= n ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                        <i className="fas fa-star text-sm"></i>
                                    </button>
                                ))}
                            </div>
                            <textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
                                      placeholder="한마디 남기기 (선택)"
                                      disabled={isSubmittingReview}
                                      className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none h-20 mb-4 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] disabled:opacity-60" />
                            <div className="flex gap-2">
                                <button onClick={() => setShowReviewModal(false)} disabled={isSubmittingReview} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 disabled:opacity-60">취소</button>
                                <button onClick={submitReview} disabled={isSubmittingReview} className="flex-1 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-bold hover:bg-[#2d4a6f] disabled:opacity-60 disabled:cursor-not-allowed">
                                    {isSubmittingReview ? (
                                        <span><i className="fas fa-spinner fa-spin mr-1.5"></i>등록 중...</span>
                                    ) : (
                                        '등록'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 토스트 알림 */}
                {toastMsg && (
                    <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-bounce">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-black text-sm shrink-0">
                            {toastMsg.senderName?.substring(0, 1) || '알'}
                        </div>
                        <div>
                            <p className="text-xs font-black">{toastMsg.senderName || '새 메시지'}</p>
                            <p className="text-xs text-slate-300 truncate max-w-[200px]">{toastMsg.message}</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatList;