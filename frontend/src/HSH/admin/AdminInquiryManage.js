import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../common/api/axiosConfig';
import {
    MessageSquareMore, RefreshCw, Trash2, SendHorizonal,
    Search, Clock3, AlertCircle, 
    Inbox, CheckCircle2, ChevronRight, UserCircle
} from 'lucide-react';

// ==================================================================================
// 🔧 유틸리티
// ==================================================================================
function formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getStatusStyle(status) {
    const s = String(status || '').trim();
    if (s.includes('완료')) return 'bg-emerald-100 text-emerald-700';
    if (s.includes('진행')) return 'bg-blue-100 text-blue-700';
    if (s.includes('반려') || s.includes('거절')) return 'bg-rose-100 text-rose-700';
    return 'bg-amber-100 text-amber-700';
}

// ==================================================================================
// 🖥️ 최상위 프로 컴포넌트 (Zendesk 스타일)
// ==================================================================================
export default function AdminInquiryPro() {
    const [list, setList] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);

    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchKeyword, setSearchKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('대기'); 
    const [answerText, setAnswerText] = useState('');

    const adminName = localStorage.getItem('userNm') || '관리자';

    // 🔄 API
    const fetchList = async () => {
        setIsLoadingList(true);
        try {
            const res = await api.get('/api/admin/customer/inquiries');
            if (res.data.success) setList(res.data.data || []);
        } catch (e) {
            toast.error(e.response?.data?.message || "목록을 불러오지 못했습니다.");
        } finally {
            setIsLoadingList(false);
        }
    };

    const fetchDetail = async (id) => {
        if (!id) return;
        setIsLoadingDetail(true);
        try {
            const res = await api.get(`/api/admin/customer/inquiries/${id}`);
            if (res.data.success) {
                setDetail(res.data.data);
                setAnswerText(res.data.data?.answerContent || '');
            }
        } catch (e) {
            toast.error("상세 정보를 불러올 수 없습니다.");
            setDetail(null);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleSaveAnswer = async () => {
        if (!detail?.id) return;
        if (!answerText.trim()) return toast.warn('답변 내용을 입력하세요.');
        setIsSaving(true);
        try {
            const res = await api.put(`/api/admin/customer/inquiries/${detail.id}/answer`, {
                answerContent: answerText.trim(),
                answeredBy: adminName,
            });
            if (res.data.success) {
                toast.success('성공적으로 전송되었습니다.');
                await fetchDetail(detail.id);
                await fetchList();
                setStatusFilter('답변완료');
            }
        } catch (e) {
            toast.error('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInquiry = async () => {
        if (!detail?.id) return;
        if (!window.confirm('문의를 영구 삭제합니다. 계속하시겠습니까?')) return;
        setIsDeleting(true);
        try {
            const res = await api.delete(`/api/admin/customer/inquiries/${detail.id}`);
            if (res.data.success) {
                toast.success('삭제 완료');
                setSelectedId(null); setDetail(null);
                fetchList();
            }
        } catch (e) {
            toast.error('삭제 실패');
        } finally {
            setIsDeleting(false);
        }
    };

    // 📊 필터 데이터
    const filteredList = useMemo(() => {
        return (list || []).filter(item => {
            const kw = searchKeyword.trim().toLowerCase();
            const matchKw = !kw || String(item.title).toLowerCase().includes(kw) || String(item.type).toLowerCase().includes(kw);
            const matchSt = statusFilter === 'ALL' ? true : statusFilter === '답변완료' ? String(item.status).includes('완료') : item.status === statusFilter;
            return matchKw && matchSt;
        });
    }, [list, searchKeyword, statusFilter]);

    const waitingCount = (list || []).filter(i => i.status === '대기').length;
    const doneCount = (list || []).filter(i => String(i.status).includes('완료')).length;

    useEffect(() => { fetchList(); }, []);
    useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId]);

    // 첫 진입 시 리스트 선택 자동화
    useEffect(() => {
        if (filteredList.length > 0 && !selectedId) setSelectedId(filteredList[0].id);
        if (filteredList.length === 0) setSelectedId(null);
    }, [filteredList, selectedId]);

    return (
        <div className="h-[820px] flex flex-col gap-4 font-sans">
            
            {/* 1. 최상단 네비게이션 & 통합 필터 탭 (현대적 세그먼트 컨트롤) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
                        <MessageSquareMore size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800">고객 지원 센터</h2>
                        <p className="text-xs text-slate-500 font-medium">받은 편지함 및 처리 현황</p>
                    </div>
                </div>

                {/* S급 UI: 애플 스타일 세그먼트 탭 필터 */}
                <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                    <button onClick={() => setStatusFilter('ALL')} className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Inbox size={16} /> 전체 <span className="opacity-60">({list?.length || 0})</span>
                    </button>
                    <button onClick={() => setStatusFilter('대기')} className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${statusFilter === '대기' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Clock3 size={16} /> 대기 <span className="opacity-60">({waitingCount})</span>
                    </button>
                    <button onClick={() => setStatusFilter('답변완료')} className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${statusFilter === '답변완료' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                        <CheckCircle2 size={16} /> 완료 <span className="opacity-60">({doneCount})</span>
                    </button>
                </div>

                <button onClick={fetchList} className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="새로고침">
                    <RefreshCw size={18} className={isLoadingList ? "animate-spin" : ""} />
                </button>
            </div>

            {/* 2. 메인 워크스페이스 (좌측 큐 리스트 + 우측 디테일/에디터) */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                
                {/* 📌 좌측: Inbox (Queue) Panel */}
                <div className="w-[380px] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col shrink-0 overflow-hidden">
                    {/* 검색바 (고정) */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="제목, 유형 검색..."
                                value={searchKeyword}
                                onChange={e => setSearchKeyword(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* 목록 (스크롤) */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30 custom-scrollbar">
                        {isLoadingList ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold">목록 동기화 중...</div>
                        ) : filteredList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <AlertCircle size={32} className="mb-2 opacity-30" />
                                <p className="text-sm font-bold">비어 있습니다.</p>
                            </div>
                        ) : (
                            filteredList.map(item => {
                                const isActive = selectedId === item.id;
                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => setSelectedId(item.id)}
                                        className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border ${isActive ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${getStatusStyle(item.status)}`}>{item.status}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{formatDateTime(item.createdAt)}</span>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-500 mb-1">[{item.type}]</div>
                                        <div className={`text-sm font-black line-clamp-1 pr-6 ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                                            {item.title}
                                        </div>
                                        {/* 우측 화살표 인디케이터 */}
                                        <ChevronRight size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${isActive ? 'text-blue-500 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* 📌 우측: Workspace Panel */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
                    {!selectedId ? (
                        <div className="m-auto flex flex-col items-center text-slate-300">
                            <Inbox size={64} className="mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-slate-400">선택된 문의가 없습니다</h3>
                            <p className="text-sm">좌측 목록에서 처리할 항목을 선택해주세요.</p>
                        </div>
                    ) : isLoadingDetail ? (
                        <div className="m-auto"><RefreshCw size={32} className="text-blue-500 animate-spin" /></div>
                    ) : !detail ? (
                        <div className="m-auto text-rose-500 font-bold">오류: 데이터를 읽을 수 없습니다.</div>
                    ) : (
                        <>
                            {/* 상단: 고객 원문 (Scrollable) */}
                            <div className="flex-1 overflow-y-auto bg-slate-50/30">
                                {/* 디테일 헤더 */}
                                <div className="p-8 border-b border-slate-100 bg-white">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UserCircle size={28} /></div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 mb-0.5">작성자: {detail.nickNm || detail.writerNm || '-'}</div>
                                                <div className="text-sm font-black text-slate-800">{detail.type} 분야</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] font-bold text-slate-400 mb-1">작성 일시</div>
                                            <div className="text-sm font-mono font-bold text-slate-600">{formatDateTime(detail.createdAt)}</div>
                                        </div>
                                    </div>
                                    <h1 className="text-2xl font-black text-slate-900 leading-snug mb-6">{detail.title}</h1>
                                    
                                    {/* 본문 내용 */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-loose whitespace-pre-wrap">
                                        {detail.content}
                                    </div>
                                </div>
                            </div>

                            {/* 하단: 에디터 폼 (Sticky) */}
                            <div className="h-[280px] bg-white border-t border-slate-200 flex flex-col shrink-0 p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> 공식 답변 작성
                                    </label>
                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">담당: {detail?.answeredBy || adminName}</span>
                                </div>
                                <textarea 
                                    value={answerText} 
                                    onChange={e => setAnswerText(e.target.value)}
                                    placeholder="고객에게 발송될 답변을 입력해주세요..."
                                    className="flex-1 w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none mb-4"
                                />
                                <div className="flex justify-between items-center shrink-0">
                                    <button onClick={handleDeleteInquiry} disabled={isDeleting} className="px-4 py-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                                        <Trash2 size={16} /> 영구 삭제
                                    </button>
                                    <button onClick={handleSaveAnswer} disabled={isSaving} className="px-8 py-2.5 bg-slate-900 text-white hover:bg-blue-600 rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                                        <SendHorizonal size={16} /> {detail.status === '대기' ? '답변 전송 및 완료처리' : '답변 내용 수정하기'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 스크롤바 숨기기 스타일 (index.css나 App.css에 넣어도 되지만 컴포넌트 내장형으로 방어) */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
}