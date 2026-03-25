import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  LayoutDashboard, Users, ShieldAlert, FileText, Settings,
  LogOut, Terminal, UserCheck, Ban, FileSearch, ShieldCheck, ChevronRight, XCircle, Lock, UserPlus
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../common/api/axiosConfig';

// [1] 공통 컴포넌트 및 분리된 뷰 임포트
import {
  getRoleDisplayName, MenuSection, MenuItem
} from './AdminComponents';
import DashboardView from './DashboardView';
import UserManagementView from './UserManagementView';
import LawyerApprovalView from './LawyerApprovalView';
import AuditLogView from './AuditLogView';
import BlacklistView from './BlacklistView';
import SecurityPolicyView from './SecurityPolicyView';
import ContentSecurityView from './ContentSecurityView';
import AdminInquiryManage from './AdminInquiryManage';
import CreateOperatorView from './CreateOperatorView';
import { logout } from '../../common/utils/logout';

const ROLES = {
  USER: 'ROLE_USER',
  LAWYER: 'ROLE_LAWYER',
  OPERATOR: 'ROLE_OPERATOR',
  ADMIN: 'ROLE_ADMIN',
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN'
};


export default function AdminPage() {
  // --- 상태 관리 (State) ---
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const chartRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('ALL');
  const [summary, setSummary] = useState({});
  const [threatLogs, setThreatLogs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contentBoards, setContentBoards] = useState([]);
  const [bannedWords, setBannedWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [period, setPeriod] = useState(7);
  const [blacklist, setBlacklist] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');

  const [searchParams, setSearchParams] = useState({
    startDate: '', endDate: '', keywordType: 'IP', keyword: '', statusType: 'ALL'
  });

  // --- 권한 체크 유틸리티 ---
  // ✅ Step 2: useState의 초기값(Lazy initialization)으로 변경하여 렌더링 성능을 극대화합니다.
  const [currentRole] = useState(() => localStorage.getItem('userRole'));
  const hasPermission = (allowedRoles) => currentRole && allowedRoles.includes(currentRole);

  // =================================================================
  // 🔄 데이터 통신 및 핸들러 (Business Logic)
  // =================================================================

  const fetchDailyStats = async (days) => {
    try {
      const res = await api.get(`/api/admin/status/daily?days=${days}`);
      if (res.data.success) setDailyStats(res.data.data);
    } catch (e) { }
  };

  const fetchBlacklist = async () => {
    try {
      const res = await api.get('/api/admin/blacklist');
      if (res.data.success) setBlacklist(res.data.data);
    } catch (error) {
      toast.error("블랙리스트 로드에 실패했습니다.");
    }
  };

  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    if (!newIp.trim() || !newReason.trim()) return toast.warn("차단할 IP와 사유를 입력해주세요.");
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp.trim())) {
      return toast.warn("올바른 IPv4 형식이 아닙니다. (예: 192.168.0.1)");
    }
    try {
      const res = await api.post('/api/admin/blacklist', { ip: newIp, reason: newReason });
      if (res.data.success) {
        toast.success(res.data.message || "IP가 차단되었습니다.");
        setNewIp(''); setNewReason(''); fetchBlacklist();
      }
    } catch (error) { toast.error(error.response?.data?.message || "차단 중 오류가 발생했습니다."); }
  };

  const handleUnblock = async (ip) => {
    const reason = prompt(`[${ip}] 차단 해제 사유를 입력하세요:`);
    if (!reason?.trim()) return;
    try {
      const res = await api.delete(`/api/admin/blacklist`, { params: { ip, reason } });
      if (res.data.success) {
        toast.success(res.data.message || "IP 차단이 해제되었습니다.");
        fetchBlacklist();
      }
    } catch (error) { toast.error(error.response?.data?.message || "차단 해제 중 오류가 발생했습니다."); }
  };

  const fetchContentBoards = async () => {
    try {
      const res = await api.get('/api/admin/boards');
      if (res.data.success) setContentBoards(res.data.data);
    } catch (e) {
      toast.error("게시글 로드에 실패했습니다.");
    }
  };

  const fetchBannedWords = async () => {
    try {
      const res = await api.get('/api/admin/banned-words');
      if (res.data.success) setBannedWords(res.data.data);
    } catch (e) {
      toast.error("금지어 로드에 실패했습니다.");
    }
  };

  const fetchDashboardData = async () => {
    // ✅ Step 3: setLoading(true); 삭제
    try {
      const userRes = await api.get('/api/admin/users');
      if (userRes.data.success) setUsers(userRes.data.data);
      const summaryRes = await api.get('/api/admin/summary');
      if (summaryRes.data.success) setSummary(summaryRes.data.data);
      const threatRes = await api.get('/api/admin/logs/threats');
      if (threatRes.data.success) setThreatLogs(threatRes.data.data);
    } catch (error) {
      toast.error("대시보드 데이터 로드에 실패했습니다.");
    }
    // ✅ Step 3: finally { setLoading(false); } 삭제
  };

  const fetchAuditLogs = async (params = {}) => {
    try {
      const res = await api.get('/api/admin/logs', { params: { page: currentPage, size: 50, ...params } });
      if (res.data.success) {
        setLogs(res.data.data.content || []);
        setTotalPages(res.data.data.page?.totalPages || 0);
      }
    } catch (error) {
      toast.error("로그 로드에 실패했습니다.");
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchAuditLogs({ ...searchParams, page: 0 });
    setSearchParams(prev => ({ ...prev, keyword: '' }));
  };
  const handleReset = () => {
    const init = { startDate: '', endDate: '', keywordType: 'IP', keyword: '', statusType: 'ALL' };
    setCurrentPage(0);
    setSearchParams(init); fetchAuditLogs({ page: 0 });
  };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handleDownloadChart = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Admin_Dashboard_${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  };

  const handleExcelDownload = async () => {
    const reason = prompt("다운로드 사유를 입력해주세요:");
    if (!reason?.trim()) return;
    try {
      const response = await api.get(`/api/admin/logs/download?reason=${encodeURIComponent(reason)}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Audit_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      toast.success("엑셀 파일이 다운로드되었습니다.");
    } catch (error) { toast.error(error.response?.data?.message || "다운로드 중 오류가 발생했습니다."); }
  };

  const handleUserStatusChange = async (userId, statusCode) => {
    const reason = prompt("상태 변경 사유를 입력해주세요:");
    if (!reason?.trim()) return;
    try {
      const res = await api.put('/api/admin/user/status', { userId, statusCode, reason });
      if (res.data.success) {
        toast.success(res.data.message || "회원 상태가 변경되었습니다.");
        fetchDashboardData(); setShowModal(false);
      }
    } catch (e) { toast.error(e.response?.data?.message || "상태 변경 중 오류가 발생했습니다."); }
  };

  const handleRoleChange = async (userId, roleCode) => {
    const reason = prompt("권한 변경 사유를 입력해주세요:");
    if (!reason?.trim()) return;
    try {
      const res = await api.put('/api/admin/user/role', { userId, roleCode, reason });
      if (res.data.success) {
        toast.success(res.data.message || "회원 권한이 변경되었습니다.");
        fetchDashboardData(); setShowModal(false);
      }
    } catch (e) { toast.error(e.response?.data?.message || "권한 변경 중 오류가 발생했습니다."); }
  };

  const handleCreateOperator = async ({ userId, userNm, phone, email, reason }) => {
    try {
      const res = await api.post('/api/admin/create-operator', {
        userId,
        userNm,
        phone,
        email,
        reason,
      });
      if (res.data.success) {
        toast.success(res.data.message || "관리자 계정이 생성되었습니다.");
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "운영자 생성에 실패했습니다.");
      throw error;
    }
  };

  const handleAddBannedWord = async (e) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    const reason = prompt("금지어 등록 사유를 입력해주세요:");
    if (!reason?.trim()) return;

    try {
      const res = await api.post('/api/admin/banned-words', { word: newWord, reason });
      if (res.data.success) {
        toast.success(res.data.message || "금지어가 등록되었습니다.");
        setNewWord(''); fetchBannedWords();
      }
    } catch (e) { toast.error(e.response?.data?.message || "등록 중 오류가 발생했습니다."); }
  };

  const handleDeleteBannedWord = async (wordNo) => {
    if (!window.confirm("삭제하시겠습니까?")) return;

    const reason = prompt("금지어 삭제 사유를 입력해주세요:");
    if (!reason?.trim()) return;

    try {
      const res = await api.delete(`/api/admin/banned-words/${wordNo}?reason=${encodeURIComponent(reason)}`);
      if (res.data.success) {
        toast.success(res.data.message || "금지어가 삭제되었습니다.");
        fetchBannedWords();
      }
    } catch (e) { toast.error(e.response?.data?.message || "삭제 중 오류가 발생했습니다."); }
  };

  const handleToggleBlind = async (boardNo, currentBlindYn) => {
    const nextStatus = currentBlindYn === 'Y' ? 'N' : 'Y';
    const reasonMessage =
      nextStatus === 'Y'
        ? "블라인드 처리 사유를 입력하세요:"
        : "블라인드 해제 사유를 입력하세요:";
    const reason = prompt(reasonMessage);
    if (!reason?.trim()) return;
    try {
      const res = await api.put(`/api/admin/board/blind`, { boardNo, blindYn: nextStatus, reason });
      if (res.data.success) {
        toast.success(
          res.data.message ||
          (nextStatus === 'Y'
            ? "게시글이 블라인드 처리되었습니다."
            : "게시글이 정상 복구되었습니다.")
        );
        fetchContentBoards();
      }
    } catch (e) { toast.error(e.response?.data?.message || "블라인드 처리 중 오류가 발생했습니다."); }
  };

  const handleViewLicense = async (userNo) => {
    if (!userNo) {
      toast.error("대상 회원 정보를 찾을 수 없습니다.");
      return;
    }
    try {
      const response = await api.get(`/api/admin/lawyers/${userNo}/license`, {
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        toast.error(error.response?.data?.message || "등록된 자격증 파일이 없거나 삭제되었습니다.");
      } else if (status === 403) {
        toast.error("해당 자격증 파일을 볼 수 있는 권한이 없습니다.");
      } else {
        toast.error(error.response?.data?.message || "자격증 파일을 불러오는 중 오류가 발생했습니다.");
      }
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchBlacklist(),
          fetchContentBoards(),
          fetchBannedWords(),
          fetchAuditLogs()
        ]);
      } catch (error) {
        toast.error("일부 데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeMenu === 'audit-log') {
      fetchAuditLogs(searchParams);
    }
  }, [currentPage, activeMenu]);

  // ✅ 2. 삭제되었던 코드 복구! (7일, 30일 버튼 누를 때마다 차트 새로고침)
  useEffect(() => {
    fetchDailyStats(period);
  }, [period]);

  // =================================================================
  // 🖥️ 화면 렌더링 (renderContent)
  // =================================================================

  const renderContent = () => {
    if (loading) return <div className="p-10 font-bold text-slate-500">데이터 로딩 중...</div>;

    const commonProps = { summary, dailyStats, period, setPeriod, chartRef, handleDownloadChart, threatLogs, setActiveMenu, hasPermission };

    switch (activeMenu) {
      case 'dashboard': return <DashboardView {...commonProps} />;
      case 'user-manage': {
        const filteredUsers = filterRole === 'ALL'
          ? users
          : filterRole === 'LAWYER'
            ? users.filter(u => u.roleCode === 'ROLE_LAWYER' || u.roleCode === 'ROLE_ASSOCIATE')
            : filterRole === 'ADMIN'
              ? users.filter(u => ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_OPERATOR'].includes(u.roleCode))
              : users.filter(u => u.roleCode === 'ROLE_USER');
        return <UserManagementView users={filteredUsers} filterRole={filterRole} setFilterRole={setFilterRole} setSelectedItem={setSelectedItem} setShowModal={setShowModal} />;
      }
      case 'lawyer-approve': return <LawyerApprovalView users={users} handleUserStatusChange={handleUserStatusChange} handleViewLicense={handleViewLicense} />;
      case 'create-operator': return <CreateOperatorView handleCreateOperator={handleCreateOperator} />;
      case 'audit-log': return <AuditLogView logs={logs} searchParams={searchParams} setSearchParams={setSearchParams} handleSearch={handleSearch} handleReset={handleReset} handleKeyDown={handleKeyDown} handleExcelDownload={handleExcelDownload} hasPermission={hasPermission} currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />;
      case 'blacklist': return <BlacklistView blacklist={blacklist} newIp={newIp} setNewIp={setNewIp} newReason={newReason} setNewReason={setNewReason} handleAddBlacklist={handleAddBlacklist} handleUnblock={handleUnblock} />;
      case 'security-policy': return <SecurityPolicyView bannedWords={bannedWords} newWord={newWord} setNewWord={setNewWord} handleAddBannedWord={handleAddBannedWord} handleDeleteBannedWord={handleDeleteBannedWord} />;
      case 'content-security': return <ContentSecurityView contentBoards={contentBoards} handleToggleBlind={handleToggleBlind} />;
      case 'inquiry-manage': return <AdminInquiryManage />; 
      default: return <DashboardView {...commonProps} />;
    }
  };

  // --- 레이아웃 (SideBar & Header) ---
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

      {/* 토스트 컨테이너 — 화면 우측 하단에 표시, 3초 후 자동 제거 */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />

      <aside className={`bg-[#0f172a] text-white transition-all duration-300 flex-shrink-0 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic">AI</div>
          {isSidebarOpen && <span className="font-black text-lg">LAW ADMIN</span>}
        </div>
        <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto">
          <MenuSection title="Main" isOpen={isSidebarOpen} />
          <MenuItem icon={<LayoutDashboard size={20} />} label="대시보드" active={activeMenu === 'dashboard'} onClick={() => setActiveMenu('dashboard')} isOpen={isSidebarOpen} />
          <MenuSection title="User Management" isOpen={isSidebarOpen} />
          <MenuItem icon={<Users size={20} />} label="회원 통합 관리" active={activeMenu === 'user-manage'} onClick={() => setActiveMenu('user-manage')} isOpen={isSidebarOpen} />
          <MenuItem icon={<FileText size={20} />} label="문의 답변 관리" active={activeMenu==='inquiry-manage'} onClick={()=>setActiveMenu('inquiry-manage')} isOpen={isSidebarOpen} />
          {hasPermission([ROLES.SUPER_ADMIN]) && (
            <MenuItem
              icon={<UserPlus size={20} />}
              label="관리자 계정 생성"
              active={activeMenu === 'create-operator'}
              onClick={() => setActiveMenu('create-operator')}
              isOpen={isSidebarOpen}
            />
          )}
          {hasPermission([ROLES.SUPER_ADMIN, ROLES.ADMIN]) && (
            <>
              <MenuItem icon={<UserCheck size={20} />} label="변호사 승인" active={activeMenu === 'lawyer-approve'} onClick={() => setActiveMenu('lawyer-approve')} isOpen={isSidebarOpen} />
              <MenuItem icon={<Ban size={20} />} label="블랙리스트 관리" active={activeMenu === 'blacklist'} onClick={() => setActiveMenu('blacklist')} isOpen={isSidebarOpen} />
            </>
          )}
          <MenuSection title="Security Center" isOpen={isSidebarOpen} highlight />
          <MenuItem icon={<Terminal size={20} />} label="시스템 감사 로그" active={activeMenu === 'audit-log'} onClick={() => setActiveMenu('audit-log')} isOpen={isSidebarOpen} />
          <MenuItem icon={<ShieldCheck size={20} />} label="보안 정책 설정" active={activeMenu === 'security-policy'} onClick={() => setActiveMenu('security-policy')} isOpen={isSidebarOpen} />
          <MenuItem icon={<FileSearch size={20} />} label="콘텐츠 보안 관리" active={activeMenu === 'content-security'} onClick={() => setActiveMenu('content-security')} isOpen={isSidebarOpen} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="flex items-center gap-3 text-slate-400 hover:text-white w-full px-4 py-2">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-bold">로그아웃</span>}
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col max-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronRight className={isSidebarOpen ? 'rotate-180' : ''} />
            </button>
            <h2 className="font-black text-xl text-slate-800 uppercase">{activeMenu.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><ShieldAlert size={16} /></div>
            <div className="text-sm">
              <span className="font-bold text-slate-800">{localStorage.getItem('userNm')}</span>
              <span className="ml-1 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{getRoleDisplayName(currentRole)}</span>
            </div>
          </div>
        </header>
        <div className="flex-grow p-8 overflow-y-auto">{renderContent()}</div>
      </main>

      {/* 회원 상세 모달 */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-xl text-slate-800">회원 상세 정보</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><XCircle /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                {selectedItem.profileImg ? (
                  <img
                    src={`http://192.168.0.43:8080${selectedItem.profileImg}`}
                    alt="프로필"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Users size={28} className="text-slate-400" />
                  </div>
                )}
                <div>
                  <h4 className="text-2xl font-black text-slate-800">{selectedItem.userNm}</h4>
                  <p className="text-slate-500">@{selectedItem.userId}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded">현재: {getRoleDisplayName(selectedItem.roleCode)}</span>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm font-bold text-amber-900 flex items-center gap-2"><Lock size={16} /> 보안 로그 기록 중</p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 [&>div]:min-w-0">
                <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">이메일</div>
                    <div className="text-sm font-bold text-slate-700 break-all min-w-0">{hasPermission(['ROLE_SUPER_ADMIN'])
                      ? (selectedItem.email || '-')
                      : (selectedItem.email
                          ? selectedItem.email.replace(/(?<=.{3}).(?=[^@]*@)/g, '*')
                          : '-')}</div>
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">전화번호</div>
                    <div className="text-sm font-bold text-slate-700 font-mono break-all min-w-0">{hasPermission(['ROLE_SUPER_ADMIN'])
                      ? (selectedItem.phone || '-')
                      : (selectedItem.phone
                          ? selectedItem.phone.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3')
                          : '-')}</div>
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">가입일</div>
                    <div className="text-sm font-bold text-slate-700">
                        {selectedItem.joinDt ? new Date(selectedItem.joinDt).toLocaleDateString() : '-'}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">닉네임</div>
                    <div className="text-sm font-bold text-slate-700">{selectedItem.nickNm || '-'}</div>
                </div>
              </div>   
              <div className="p-5 bg-slate-50 rounded-xl border">
                <h5 className="font-bold text-sm text-slate-600 mb-3 flex items-center gap-2"><Settings size={14} /> 권한 및 상태 설정</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">부여 권한</span>
                    <select className="px-3 py-2 border rounded-lg text-sm bg-white" value={selectedItem.roleCode} onChange={(e) => handleRoleChange(selectedItem.userId, e.target.value)} disabled={!hasPermission(['ROLE_SUPER_ADMIN'])}>
                      <option value="ROLE_USER">일반 회원</option>
                      <option value="ROLE_LAWYER">변호사</option>
                      <option value="ROLE_OPERATOR">운영자</option>
                      <option value="ROLE_ADMIN">관리자</option>
                      <option value="ROLE_SUPER_ADMIN">슈퍼 관리자</option>
                    </select>
                  </div>
                  {hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']) && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs font-bold text-slate-500">계정 제어</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleUserStatusChange(selectedItem.userId, 'S03')} className="px-3 py-1.5 bg-rose-100 text-rose-600 rounded-lg text-xs font-bold">정지</button>
                        {selectedItem.statusCode === 'S03' && <button onClick={() => handleUserStatusChange(selectedItem.userId, 'S01')} className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold">복구</button>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}