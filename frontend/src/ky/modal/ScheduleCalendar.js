import { useState, useEffect } from "react";
import api from '../../common/api/axiosConfig';

const FONT = "'Pretendard', 'Noto Sans KR', sans-serif";
const BLUE = "#1D4ED8";
const DAYS    = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const KO_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/* ───────────────────────────────────────────────
   미니 캘린더 (대시보드용)
   props: events=[{ eventNo, title, startDate, colorCode }]
─────────────────────────────────────────────── */
export function Calendar({ events = [], onDayClick }) {
    const now = new Date();
    const [year,  setYear]  = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());

    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const eventDates = new Set(events.map(e => e.startDate));

    return (
        <div style={{ fontSize: 13, fontFamily: FONT }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <button
                    onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>‹</button>
                <span style={{ fontWeight: 700, color: "#111827" }}>{year}년 {month + 1}월</span>
                <button
                    onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>›</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: 2 }}>
                {DAYS.map((d, i) => (
                    <div key={d} style={{ fontWeight: 700, fontSize: 11, color: i === 0 ? "#ef4444" : i === 6 ? BLUE : "#9ca3af", padding: "4px 0" }}>{d}</div>
                ))}
                {cells.map((d, i) => {
                    const col     = i % 7;
                    const isToday = d && year === todayY && month === todayM && d === todayD;
                    const key     = d ? toKey(year, month, d) : null;
                    const hasDot  = key && eventDates.has(key);
                    return (
                        <div key={i}
                            onClick={() => d && onDayClick && onDayClick(year, month, d)}
                            style={{
                                padding: "4px 0", borderRadius: 6, position: "relative",
                                color: !d ? "transparent" : isToday ? "#fff" : col === 0 ? "#ef4444" : col === 6 ? BLUE : "#374151",
                                background: isToday ? BLUE : "transparent",
                                fontWeight: isToday ? 800 : d ? 500 : 400,
                                cursor: d ? "pointer" : "default",
                            }}>
                            {d || ""}
                            {hasDot && (
                                <div style={{
                                    position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)",
                                    width: 4, height: 4, borderRadius: "50%",
                                    background: isToday ? "#fff" : "#f97316",
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ───────────────────────────────────────────────
   일정 관리 모달 (CRUD - API 연동)
   props: isOpen, onClose, onRefresh
─────────────────────────────────────────────── */
export function ScheduleModal({ isOpen, onClose, onRefresh, initialDate }) {
    const now = new Date();
    const [year,           setYear]          = useState(now.getFullYear());
    const [month,          setMonth]         = useState(now.getMonth());
    const [selectedDate,   setSelectedDate]  = useState(null);

    // 날짜 클릭해서 열었을 때 해당 날짜 자동 선택
    useEffect(() => {
        if (!isOpen) return;
        if (initialDate) {
            setYear(initialDate.year);
            setMonth(initialDate.month);
            setSelectedDate(initialDate.day);
        } else {
            setSelectedDate(null);
        }
    }, [isOpen, initialDate]);
    const [newTitle,       setNewTitle]      = useState("");
    const [events,         setEvents]        = useState([]);
    const [loading,        setLoading]       = useState(false);
    const [editingEventNo, setEditingEventNo] = useState(null);

    // 월이 바뀌면 선택 날짜 + 이번달 일정 페이지 초기화
    useEffect(() => {
        setSelectedDate(null);
        setEditingEventNo(null);
        setMonthEventPage(0);
    }, [year, month]);
    const [editTitle,       setEditTitle]      = useState("");
    const [editDate,        setEditDate]       = useState("");
    const [monthEventPage,  setMonthEventPage] = useState(0);
    const MONTH_PAGE_SIZE = 10;

    useEffect(() => {
        if (!isOpen) return;
        api.get('/api/lawyer/dashboard/calendars')
            .then(res => setEvents(res.data.data || []))
            .catch(() => setEvents([]));
    }, [isOpen]);

    const fetchEvents = () => {
        api.get('/api/lawyer/dashboard/calendars')
            .then(res => setEvents(res.data.data || []))
            .catch(() => setEvents([]));
    };

    if (!isOpen) return null;

    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const eventDates     = new Set(events.map(e => e.startDate));
    const selectedKey    = selectedDate ? toKey(year, month, selectedDate) : null;
    const selectedEvents = events.filter(e => e.startDate === selectedKey);

    const handleAdd = async () => {
        if (!newTitle.trim() || !selectedKey) return;
        setLoading(true);
        try {
            await api.post('/api/lawyer/dashboard/calendars', {
                title: newTitle,
                startDate: selectedKey,
            });
            setNewTitle("");
            fetchEvents();
            if (onRefresh) onRefresh();
        } catch {
            alert("일정 추가에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (eventNo) => {
        try {
            await api.delete(`/api/lawyer/dashboard/calendars/${eventNo}`);
            fetchEvents();
            if (onRefresh) onRefresh();
        } catch {
            alert("일정 삭제에 실패했습니다.");
        }
    };

    const handleUpdate = async (eventNo) => {
        if (!editTitle.trim()) { alert("제목을 입력해주세요."); return; }
        try {
            await api.patch(`/api/lawyer/dashboard/calendars/${eventNo}`, {
                title: editTitle,
                startDate: editDate,
            });
            setEditingEventNo(null);
            fetchEvents();
            if (onRefresh) onRefresh();
            // 날짜가 바뀌면 선택 날짜도 업데이트
            if (editDate) setSelectedDate(Number(editDate.slice(8, 10)));
        } catch {
            alert("일정 수정에 실패했습니다.");
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, fontFamily: FONT,
        }}>
            <div style={{ background: "#fff", borderRadius: 16, width: 720, height: "80vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>

                {/* 헤더 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>재판 일정 관리</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af" }}>✕</button>
                </div>

                <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                    {/* 왼쪽: 캘린더 */}
                    <div style={{ width: 320, padding: 20, borderRight: "1px solid #f3f4f6", overflowY: "auto" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <button
                                onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280" }}>‹</button>
                            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{year}년 {month + 1}월</span>
                            <button
                                onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280" }}>›</button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: 2 }}>
                            {DAYS.map((d, i) => (
                                <div key={d} style={{ fontWeight: 700, fontSize: 11, color: i === 0 ? "#ef4444" : i === 6 ? BLUE : "#9ca3af", padding: "6px 0" }}>{d}</div>
                            ))}
                            {cells.map((d, i) => {
                                const col        = i % 7;
                                const isToday    = d && year === todayY && month === todayM && d === todayD;
                                const isSelected = d === selectedDate;
                                const key        = d ? toKey(year, month, d) : null;
                                const hasDot     = key && eventDates.has(key);
                                return (
                                    <div key={i}
                                        onClick={() => d && setSelectedDate(d)}
                                        style={{
                                            padding: "6px 0", borderRadius: 8, position: "relative",
                                            color: !d ? "transparent" : isSelected ? "#fff" : isToday ? BLUE : col === 0 ? "#ef4444" : col === 6 ? BLUE : "#374151",
                                            background: isSelected ? BLUE : isToday ? "#EEF2FF" : "transparent",
                                            fontWeight: isToday || isSelected ? 800 : 500,
                                            cursor: d ? "pointer" : "default",
                                            transition: "all 0.15s",
                                        }}>
                                        {d || ""}
                                        {hasDot && (
                                            <div style={{
                                                position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                                                width: 4, height: 4, borderRadius: "50%",
                                                background: isSelected ? "#fff" : "#f97316",
                                            }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 이번 달 일정 요약 */}
                        {(() => {
                            const monthEvents = events
                                .filter(e => e.startDate && e.startDate.startsWith(toKey(year, month, 1).slice(0, 7)))
                                .sort((a, b) => a.startDate.localeCompare(b.startDate));
                            const totalMonthPages = Math.ceil(monthEvents.length / MONTH_PAGE_SIZE) || 1;
                            const pagedMonthEvents = monthEvents.slice(monthEventPage * MONTH_PAGE_SIZE, monthEventPage * MONTH_PAGE_SIZE + MONTH_PAGE_SIZE);
                            return (
                                <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <span style={{ fontWeight: 700, color: "#111827" }}>이번 달 일정</span>
                                        <span style={{ color: "#9ca3af" }}>{monthEvents.length}건</span>
                                    </div>
                                    {monthEvents.length === 0 ? (
                                        <div style={{ color: "#9ca3af", padding: "8px 0" }}>등록된 일정이 없습니다.</div>
                                    ) : (
                                        <>
                                            {pagedMonthEvents.map(e => (
                                                <div
                                                    key={e.eventNo}
                                                    onClick={() => setSelectedDate(Number(e.startDate.slice(8, 10)))}
                                                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f9fafb", cursor: "pointer", borderRadius: 4 }}
                                                    onMouseEnter={ev => ev.currentTarget.style.background = "#f0f4ff"}
                                                    onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                                                >
                                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: e.colorCode || BLUE, flexShrink: 0 }} />
                                                    <span style={{ color: "#374151", fontWeight: 600 }}>{e.startDate.slice(8)}일</span>
                                                    <span style={{ color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                                                </div>
                                            ))}
                                            {totalMonthPages > 1 && (
                                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 8 }}>
                                                    <button
                                                        onClick={() => setMonthEventPage(p => Math.max(0, p - 1))}
                                                        disabled={monthEventPage === 0}
                                                        style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: monthEventPage === 0 ? "not-allowed" : "pointer", background: monthEventPage === 0 ? "#f9fafb" : "#fff", color: monthEventPage === 0 ? "#d1d5db" : "#374151" }}
                                                    >‹</button>
                                                    <span style={{ fontSize: 11, color: "#6b7280" }}>{monthEventPage + 1} / {totalMonthPages}</span>
                                                    <button
                                                        onClick={() => setMonthEventPage(p => Math.min(totalMonthPages - 1, p + 1))}
                                                        disabled={monthEventPage >= totalMonthPages - 1}
                                                        style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: monthEventPage >= totalMonthPages - 1 ? "not-allowed" : "pointer", background: monthEventPage >= totalMonthPages - 1 ? "#f9fafb" : "#fff", color: monthEventPage >= totalMonthPages - 1 ? "#d1d5db" : "#374151" }}
                                                    >›</button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* 오른쪽: 입력 & 목록 */}
                    <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
                        {selectedDate ? (
                            <>
                                <div style={{ marginBottom: 16 }}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
                                        {month + 1}월 {selectedDate}일
                                    </h3>
                                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
                                        {KO_DAYS[new Date(year, month, selectedDate).getDay()]}요일
                                    </p>
                                </div>

                                {/* 기존 일정 목록 */}
                                {selectedEvents.length > 0 ? (
                                    <div style={{ marginBottom: 20 }}>
                                        {selectedEvents.map(e => (
                                             <div key={e.eventNo} style={{ padding: "12px 14px", marginBottom: 8, borderRadius: 10, background: "#F9FAFB", border: "1px solid #f3f4f6" }}>
                                                {editingEventNo === e.eventNo ? (
                                                    /* 수정 폼 */
                                                    <div>
                                                        <div style={{ marginBottom: 8 }}>
                                                            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>제목</label>
                                                            <input
                                                                value={editTitle}
                                                                onChange={ev => setEditTitle(ev.target.value)}
                                                                style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: `1px solid ${BLUE}`, fontSize: 13, fontFamily: FONT, boxSizing: "border-box", outline: "none" }}
                                                                onKeyDown={ev => ev.key === 'Enter' && handleUpdate(e.eventNo)}
                                                            />
                                                        </div>
                                                        <div style={{ marginBottom: 10 }}>
                                                            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>날짜</label>
                                                            <input
                                                                type="date"
                                                                value={editDate}
                                                                onChange={ev => setEditDate(ev.target.value)}
                                                                style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: `1px solid ${BLUE}`, fontSize: 13, fontFamily: FONT, boxSizing: "border-box", outline: "none" }}
                                                            />
                                                        </div>
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            <button
                                                                onClick={() => handleUpdate(e.eventNo)}
                                                                style={{ flex: 1, padding: "7px 0", borderRadius: 6, background: BLUE, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                                                                저장
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingEventNo(null)}
                                                                style={{ flex: 1, padding: "7px 0", borderRadius: 6, background: "#f3f4f6", color: "#374151", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                                                                취소
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* 일반 보기 */
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{e.title}</div>
                                                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{e.startDate}</div>
                                                        </div>
                                                        <div style={{ display: "flex", gap: 8 }}>
                                                            <button
                                                                onClick={() => { setEditingEventNo(e.eventNo); setEditTitle(e.title); setEditDate(e.startDate); }}
                                                                style={{ background: "none", border: "none", cursor: "pointer", color: BLUE, fontSize: 13, fontWeight: 700 }}>
                                                                수정
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(e.eventNo)}
                                                                style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 13, fontWeight: 700 }}>
                                                                삭제
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>
                                        등록된 일정이 없습니다.
                                    </div>
                                )}

                                {/* 새 일정 추가 폼 */}
                                <div style={{ padding: 16, borderRadius: 12, background: "#F9FAFB", border: "1px solid #f3f4f6" }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 12 }}>새 일정 추가</div>
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>제목 *</label>
                                        <input
                                            value={newTitle}
                                            onChange={e => setNewTitle(e.target.value)}
                                            placeholder="예: 서울중앙지법 제3호 법정"
                                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, fontFamily: FONT, boxSizing: "border-box", outline: "none" }}
                                            onFocus={e => e.target.style.borderColor = BLUE}
                                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAdd}
                                        disabled={loading}
                                        style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: loading ? "#9ca3af" : BLUE, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: FONT }}
                                    >
                                        {loading ? "추가 중..." : "일정 추가"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: 14, textAlign: "center" }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                                <div style={{ fontWeight: 600 }}>날짜를 선택해주세요</div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>캘린더에서 날짜를 클릭하면 일정을 추가할 수 있습니다.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
