import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import DashboardSidebar from '../common/components/DashboardSidebar';
import api, { getAccessToken } from "../common/api/axiosConfig";
import { logout } from '../common/utils/logout';

/**
 * 백엔드에서 오는 start 값("YYYY-MM-DD" 또는 "YYYY-MM-DD HH:mm")을
 * FullCalendar가 인식하는 ISO 형식으로 통일합니다.
 */
const normalizeCalendarEvent = (event) => {
    if (!event) return event;
    let start = event.start;
    if (typeof start === 'string' && start.includes(' ')) {
        start = start.replace(' ', 'T');
        if (!/T\d{2}:\d{2}:\d{2}/.test(start)) start = start + ':00';
    }
    return { ...event, start };
};

/** FullCalendar startStr(ISO) → 수정/저장 API용 "YYYY-MM-DD HH:mm" */
const toBackendDateStr = (isoOrDateStr) => {
    if (!isoOrDateStr) return '';
    const s = String(isoOrDateStr).trim().replace('T', ' ');
    return s.length > 16 ? s.slice(0, 16) : s;
};

const GeneralMyPage = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ★ 1. 데이터를 저장할 State 생성 (초기값 null 또는 기본 구조)
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // ============== [ 캘린더 모달 상태 관리 (State)] ===================
    const [isModalOpen, setIsModalOpen] = useState(false); // 모달창 열림/닫힘
    const [modalMode, setModalMode] = useState('create'); // 'create'(생성)
    const [eventInput, setEventInput] = useState({
        id : '',
        title : '',
        start : '',
        backgroundColor : '#1e3a8a' // 기본 색상 (네이비)
    })

    // ============== [ 상담 전체보기 모달 상태 관리 ] ===================
    const [isAllConsultModalOpen, setIsAllConsultModalOpen] = useState(false);

    // FullCalendar에 넘길 이벤트: start를 ISO 형식으로 정규화 (백엔드 "YYYY-MM-DD HH:mm" 호환)
    const normalizedCalendarEvents = useMemo(
        () => (dashboardData?.calendarEvents || []).map(normalizeCalendarEvent),
        [dashboardData?.calendarEvents]
    );

    // 2. 데이터 가져오기 (API 호출)
    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = getAccessToken();
            const role = localStorage.getItem('userRole');

            if (!token || role !== 'ROLE_USER') {
                alert("일반 회원만 이용 가능한 페이지입니다.");
                navigate('/login');
                return;
            }

            try {
                // ★ 백엔드 API 호출 (포트번호 확인 필요)
                const response = await api.get('/api/mypage/general');

                setDashboardData(response.data.data); // 받아온 데이터 저장
                setLoading(false);

            } catch (error) {
                console.error("대시보드 데이터 로딩 실패:", error);
                // 에러 처리 (로그아웃 시키거나 에러 메시지 표시)
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    // handleLogout 제거 (요청사항): 버튼 교체는 없음

    /** 내가 적은 리뷰 삭제 */
    const handleDeleteReview = async (reviewNo, e) => {
        if (e) e.preventDefault();
        if (e) e.stopPropagation();
        if (!window.confirm("이 리뷰를 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/api/mypage/review/${reviewNo}`);
            setDashboardData(prev => ({
                ...prev,
                myReviews: (prev.myReviews || []).filter(r => r.reviewNo !== reviewNo)
            }));
            alert("리뷰가 삭제되었습니다.");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "삭제에 실패했습니다.";
            alert(msg);
        }
    };

    // =========== [캘린더 이벤트 핸들러] ==============

    // 1. 빈 날짜 클릭 시(새 일정 추가 모드)
    const handleDateClick = (arg) => {
        setModalMode('create');
        setEventInput({
            id : '',
            title : '',
            start : arg.dateStr,
            backgroundColor: '#1e3a8a'
        });
        setIsModalOpen(true);
    };

    // 2. 기존 일정 클릭 시 (일정 수정/삭제 모드) — startStr(ISO)을 API 형식으로 변환
    const handleEventClick = (arg) => {
        setModalMode('edit');
        setEventInput({
            id : arg.event.id,
            title : arg.event.title,
            start : toBackendDateStr(arg.event.startStr),
            backgroundColor: arg.event.backgroundColor || '#1e3a8a'
        });
        setIsModalOpen(true);
    };
    const CloseModal = () => {
        setIsModalOpen(false);
        setEventInput({
            id : '',
            title : '',
            start : '',
            backgroundColor : "#1e3a8a"
        });
    };

    // 4. 일정 저장 (추가 또는 수정)
    const handleSaveEvent = async () => {
      if (!eventInput.title.trim()){
          alert('일정 제목을 입력해주세요.')
          return;
      }

      const token = getAccessToken();

      try {
          if (modalMode === 'create'){
              // HTTP 'POST' 메서드는 서버에 새로운 데이터를 만들어달라고 요청할 때 씁니다.
              // 전송할 데이터로 제목, 날짜, 색상을 객체 형태로 묶어서 보냅니다.
              const response = await api.post('/api/mypage/calendar', {
                  title: eventInput.title,
                  start: eventInput.start,
                  backgroundColor: eventInput.backgroundColor,
                  allDay: true
              });

              const newEvent = {
                  id : response.data.data, // Controller가 리턴한 savedEventNo (ResultVO 구조에 맞춤)
                  title : eventInput.title,
                  start : eventInput.start,
                  backgroundColor : eventInput.backgroundColor,
                  allDay : true
              };

              setDashboardData(prevData => ({
                  ...prevData,
                  calendarEvents : [...prevData.calendarEvents, newEvent]
              }));
              alert('일정이 추가되었습니다.');
          } else {
              // HTTP 'PUT' 또는 'PATCH' 메서드는 '기존 데이터를 수정해달라'고 요청 할 때 씁니다.
              // 어떤 일정을 수정할 지 서버가 알아야 하므로 URL 끝에 해당 일정의 고유 ID를 붙여서 보냅니다.
              await api.put(`/api/mypage/calendar/${eventInput.id}`, {
                  title: eventInput.title,
                  backgroundColor: eventInput.backgroundColor,
                  start: eventInput.start
              });

              // 화면 업데이트
              setDashboardData(prevData => {
                  const updatedEvents = (prevData.calendarEvents || []).map(event =>
                  String(event.id) === String(eventInput.id) ? {
                      ...event,
                      title: eventInput.title,
                      backgroundColor: eventInput.backgroundColor
                  } : event
              );
              return {...prevData, calendarEvents: updatedEvents};
              });
              alert('일정이 수정되었습니다.');
          }

          CloseModal(); // 저장 성공시 모달창 닫기

          } catch (error) {
              // 서버가 죽었거나, 권한이 없거나, 백엔드가 주소가 틀렸을 때
              console.error('일정 저장 실패',error);
              alert('일정 저장에 실패했습니다. 서버 상태를 확인해주세요.');
          }
      };


    // 5. 일정 삭제
    const handleDeleteEvent = async () => {
       if (!window.confirm('일정을 삭제하시겠습니까?')) return;

       const token = getAccessToken();

       try {
           // HTTP 'DELETE' 메서드는 데이터를 삭제할 때 씁니다.
           // URL에 삭제할 ID만 명시해서 보내면 되기 때문에, 별도의 전송 데이터가 필요없습니다.
           await api.delete(`/api/mypage/calendar/${eventInput.id}`);

           // 프론트엔드 화면에서 해당 일정 날리기
           setDashboardData(prevData =>({
               ...prevData,
               calendarEvents : (prevData.calendarEvents || []).filter(event => String(event.id) !== String(eventInput.id))
           }));
           alert("일정이 삭제되었습니다.");
           CloseModal();
       } catch (error) {
            console.error('일정 삭제 실패 :',error);
            alert('일정 삭제에 실패했습니다.');
       }

    };

    const handleCancelConsult = async (roomId) => {
        if (!window.confirm("상담 요청을 취소하시겠습니까?")) return;

        try {
            // ★ api 객체(axiosConfig)를 믿어라. headers 수동 추가 금지.
            await api.delete(`/api/mypage/chat/room/${roomId}`);

            setDashboardData(prev => ({
                ...prev,
                recentConsultations: prev.recentConsultations.filter(item => item.roomId !== roomId)
            }));
            alert("상담 요청이 취소되었습니다.");
        } catch (error) {
            console.error("삭제 실패:", error);
            alert("삭제 실패! 서버 로그를 확인하세요.");
        }
    };


    // ★ 로딩 중일 때 보여줄 화면
    if (loading) {
        return <div className="flex h-screen items-center justify-center">로딩 중...</div>;
    }

    // 데이터가 없을 경우 방어 코드
    if (!dashboardData) return null;

    return (
        <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans">

            <DashboardSidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* 환영 문구 - 데이터 바인딩 */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">
                            안녕하세요, {dashboardData.userName}님!
                        </h1>
                    </div>

                    {/* 최근 상담 요청 현황 (Table) - map 사용 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-lg">최근 상담 요청 현황</h3>
                            <button
                                onClick={() => setIsAllConsultModalOpen(true)}
                                className="text-xs text-blue-600 font-bold hover:underline">전체 보기</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3">상담 변호사</th>
                                    <th className="px-6 py-3">카테고리</th>
                                    <th className="px-6 py-3">진행 상태</th>
                                    <th className="px-6 py-3">접수 날짜</th>
                                    <th className="px-6 py-3">관리</th>
                                </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100 font-medium">
                                {/* ★ 데이터 매핑 */}
                                {dashboardData.recentConsultations && dashboardData.recentConsultations.length > 0 ? (
                                    dashboardData.recentConsultations.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900">{item.lawyerName}</td>
                                            <td className="px-6 py-4 text-blue-600 font-bold">{item.category}</td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${item.status === '대기' ? 'text-orange-500' : item.status === '상담중' ? 'text-blue-500' : 'text-slate-500'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{item.regDate}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleCancelConsult(item.roomId)} // DTO에 roomId가 있어야 함
                                                    className="text-red-500 hover:text-red-700 font-bold text-xs"
                                                >
                                                    취소
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="px-6 py-4 text-center">상담 내역이 없습니다.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 최근 내 게시글 - map 사용 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-md mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-lg">최근 내 게시판</h3>
                            <Link to="/consultation" className="text-xs text-blue-600 font-bold hover:underline">
                                전체 게시판
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dashboardData.recentPosts && dashboardData.recentPosts.length > 0 ? (
                                dashboardData.recentPosts.map((post) => (
                                    <Link to={`/consultation/${post.boardNo}`} key={post.boardNo} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{post.title}</span>
                                            <span className="text-xs text-slate-400 mt-1">{post.regDate}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-bold">
                                            <i className="fas fa-comment-dots mr-1"></i> 답변 {post.replyCount}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center w-full col-span-2 text-slate-400">작성한 게시글이 없습니다.</div>
                            )}
                        </div>
                    </div>

                    {/* 캘린더 — 고정 높이로 스크롤 한 곳만, 터치/클릭 편하게 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-md mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 text-lg">내 재판/상담 일정</h3>
                            <p className="text-xs text-slate-400 font-medium">날짜 클릭: 새 일정 · 일정 클릭: 수정/삭제</p>
                        </div>
                        <div className="calendar-container min-h-[380px]">
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                locale="ko"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: ''
                                }}
                                events={normalizedCalendarEvents}
                                dateClick={handleDateClick}
                                eventClick={handleEventClick}
                                eventDidMount={({ event }) => {
                                    const el = event.el;
                                    if (el) el.setAttribute('title', event.title || '');
                                }}
                                dayMaxEvents={3}
                                moreLinkClick="popover"
                                height="auto"
                                contentHeight="auto"
                                aspectRatio={2.5}
                            />
                        </div>
                    </div>

                    {/* 내가 적은 리뷰 — 캘린더 아래, 기존 섹션과 동일 스타일 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-md mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-lg">내가 적은 리뷰</h3>
                            <span className="text-xs text-slate-400 font-medium">상담한 변호사에게 남긴 후기</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dashboardData.myReviews && dashboardData.myReviews.length > 0 ? (
                                dashboardData.myReviews.map((review) => (
                                    <div
                                        key={review.reviewNo}
                                        className="flex items-start gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition"
                                    >
                                        <Link
                                            to={review.lawyerNo ? `/experts/${review.lawyerNo}` : '#'}
                                            className="flex-1 min-w-0 flex flex-col cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-800 truncate">{review.lawyerName}</span>
                                                <span className="flex items-center text-amber-500 text-xs font-bold shrink-0 ml-2">
                                                    {[1,2,3,4,5].map((i) => (
                                                        <i key={i} className={`fas fa-star ${i <= Math.round(review.stars || 0) ? '' : 'opacity-30'}`}></i>
                                                    ))}
                                                    <span className="ml-1 text-slate-600">{(review.stars || 0).toFixed(1)}</span>
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-1">{review.content || '(내용 없음)'}</p>
                                            <span className="text-[10px] text-slate-400 font-medium">{review.regDate}</span>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteReview(review.reviewNo, e)}
                                            className="shrink-0 text-slate-400 hover:text-red-500 text-xs font-bold px-2 py-1 rounded transition"
                                            title="리뷰 삭제"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-8 text-slate-400 text-sm">작성한 리뷰가 없습니다.</div>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* ================= [커스텀 모달 UI 영역] ================= */}
            {/* 초심자를 위한 핵심: isModalOpen이 true일 때만 화면에 렌더링되도록 조건부 처리합니다. */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-96 max-w-full m-4 border border-slate-200">
                        <h2 className="text-xl font-black text-slate-800 mb-4 border-b pb-2">
                            {modalMode === 'create' ? '새 일정 추가' : '일정 수정'}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-600 mb-1">날짜</label>
                            <input
                                type="text"
                                value={eventInput.start}
                                disabled
                                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium cursor-not-allowed"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-600 mb-1">일정 제목</label>
                            <input
                                type="text"
                                value={eventInput.title}
                                onChange={(e) => setEventInput({...eventInput, title: e.target.value})}
                                placeholder="상담이나 재판 내용을 입력하세요"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-600 mb-2">카테고리 색상</label>
                            <div className="flex gap-2">
                                {/* 색상 선택 버튼들 */}
                                {[
                                    { color: '#1e3a8a', label: '네이비' },
                                    { color: '#f97316', label: '오렌지' },
                                    { color: '#10b981', label: '그린' },
                                    { color: '#ef4444', label: '레드' }
                                ].map(item => (
                                    <button
                                        key={item.color}
                                        onClick={() => setEventInput({...eventInput, backgroundColor: item.color})}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${eventInput.backgroundColor === item.color ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent'}`}
                                        style={{ backgroundColor: item.color }}
                                        title={item.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                            {/* 초심자를 위한 핵심: 수정 모드일 때만 삭제 버튼이 보입니다. */}
                            {modalMode === 'edit' ? (
                                <button onClick={handleDeleteEvent} className="px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition">
                                    삭제
                                </button>
                            ) : <div></div> /* 레이아웃 유지를 위한 빈 div */}

                            <div className="flex space-x-2">
                                <button onClick={CloseModal} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                                    취소
                                </button>
                                <button onClick={handleSaveEvent} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition">
                                    저장
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= [최근 상담 전체보기 모달 영역] ================= */}
            {isAllConsultModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsAllConsultModalOpen(false)}>
                    {/* 모달 내용물 (클릭 시 안 닫히게 e.stopPropagation() 처리) */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-[800px] max-w-[90%] max-h-[80vh] flex flex-col m-4 border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-4">
                            <h2 className="text-xl font-black text-slate-800">
                                전체 상담 요청 내역
                            </h2>
                            <button onClick={() => setIsAllConsultModalOpen(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl transition">
                                &times;
                            </button>
                        </div>

                        {/* 스크롤 가능한 테이블 영역 */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3">상담 변호사</th>
                                    <th className="px-6 py-3">카테고리</th>
                                    <th className="px-6 py-3">진행 상태</th>
                                    <th className="px-6 py-3">접수 날짜</th>
                                    <th className="px-6 py-3">상담</th>
                                </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100 font-medium">
                                {dashboardData.recentConsultations && dashboardData.recentConsultations.length > 0 ? (
                                    dashboardData.recentConsultations.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-900">{item.lawyerName}</td>
                                            <td className="px-6 py-4 text-blue-600 font-bold">{item.category}</td>
                                            <td className="px-6 py-4">
                                                {/* 상태에 따라 팩트 있게 색깔 다르게 칠해줌 */}
                                                <span className={`font-bold ${item.status === '대기' ? 'text-orange-500' : item.status === '상담중' ? 'text-blue-500' : 'text-slate-500'}`}>
                                            {item.status}
                                        </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{item.regDate}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleCancelConsult(item.roomId)} // DTO에 roomId가 있어야 함
                                                    className="text-red-500 hover:text-red-700 font-bold text-xs"
                                                >
                                                    취소
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="px-6 py-4 text-center text-slate-400">상담 내역이 없습니다.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setIsAllConsultModalOpen(false)} className="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition shadow-md">
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneralMyPage;