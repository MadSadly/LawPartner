import React, { useState, useEffect } from 'react'; // ★ useState 필수 추가
import { Link, useLocation, useNavigate } from 'react-router-dom';
// ★ 절대경로(/frontend...) 대신 상대경로로 수정. 경로 안 맞으면 에러 나니까 네 폴더 구조에 맞게 조절해라
import SettingsModal from '../../KImMinSU/SettingsModal';
import LawyerSettingsModal from '../../ky/modal/SettingsModal';
import api from '../../common/api/axiosConfig';
import { logout } from '../utils/logout';

const DashboardSidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // ============== [ 프로필 카드 상태 관리 ] ==============
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);


    const isLawyerChat = location.pathname.startsWith('/lawyer-chat');
    const [userName, setUserName] = useState(localStorage.getItem('userNm') || '일반유저');
    const [nickName, setNickName] = useState(localStorage.getItem('nickNm') || localStorage.getItem('userNm') || '일반유저')
    const userId = localStorage.getItem('userId') || 'guest';
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/api/mypage/general');
                setDashboardData(res.data.data);

                if (res.data.data?.nickName) {
                    setNickName(res.data.data.nickName);
                }
                // ★ [핵심] 백엔드가 DTO에 profileImage를 담아 보내면 여기서 받아서 세팅!
                if (res.data.data?.profileImage) {
                    setProfileImage(res.data.data.profileImage);
                }
            } catch (error) {
                console.error("대시보드 데이터 로딩 실패:", error);
            }
        };
        fetchDashboardData();
    }, []);

    // handleLogout 제거: 공통 logout 사용

    // 이름 기반으로 고정된 랜덤 배경색을 만들어주는 팩트 함수
    const getRandomColor = (name) => {
        if (!name) return 'bg-blue-600'; // 이름 없으면 기본 파란색
        const colors = [
            'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
            'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500',
            'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-rose-500'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };




    // 내부 메뉴 아이템 컴포넌트
    const SidebarItem = ({ to, icon, label }) => {
        const isActive = location.pathname === to;

        return (
            <Link
                to={to}
                className={`
          relative flex items-center h-12 mb-2 rounded-xl transition-all duration-300 ease-in-out decoration-0 no-underline group
          ${isSidebarOpen ? 'px-4 mx-2' : 'px-0 mx-2 justify-center'} 
          ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
        `}
            >
                <div className={`flex items-center justify-center text-lg transition-all duration-300 ${isSidebarOpen ? '' : 'mx-auto'}`}>
                    <i className={icon}></i>
                </div>

                <span
                    className={`
            font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0'}
          `}
                >
          {label}
        </span>

                {!isSidebarOpen && (
                    <div className="absolute left-[calc(100%+10px)] top-1/2 transform -translate-y-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none whitespace-nowrap border border-slate-700 before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-slate-700">
                        {label}
                    </div>
                )}
            </Link>
        );
    };

    return (
        <>
            <aside
                className={`
          relative h-screen bg-[#0f172a] text-slate-400 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-slate-800 flex-shrink-0
          ${isSidebarOpen ? 'w-64' : 'w-20'}
        `}
            >
                {/* 1. 중앙 토글 버튼 */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white border border-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm z-50 focus:outline-none"
                >
                    <i className={`fas fa-chevron-${isSidebarOpen ? 'left' : 'right'} text-[10px]`}></i>
                </button>

                {/* 2. 로고 영역 */}
                <div className="h-20 flex items-center justify-center border-b border-slate-800/50 shrink-0 overflow-hidden relative">
          <span className={`text-xl font-black text-white italic tracking-tighter whitespace-nowrap transition-all duration-300 absolute ${isSidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
              LAW PARTNER
          </span>
                    <span className={`text-xl font-black text-white italic transition-all duration-300 absolute ${!isSidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
              LP
          </span>
                </div>

                {/* 3. 메뉴 영역 */}
                <nav className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-6">
                        <div className={`text-[10px] font-bold text-slate-500 uppercase mb-2 px-6 tracking-wider transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                            Main Menu
                        </div>
                        <SidebarItem to="/mypage" icon="fas fa-columns" label="대시보드" />
                        <SidebarItem to="/consultation" icon="fas fa-clipboard-list" label="법률 게시판" />
                        <SidebarItem to="/chatList" icon="fas fa-comments" label="1:1 채팅 목록" />
                        {/* ★ 요청한 고객센터 메뉴 추가 */}
                        <SidebarItem to="/customer" icon="fas fa-headset" label="고객센터" />
                    </div>
                </nav>

                {/* 4. 하단 프로필 & 드롭다운 영역 */}
                <div className="relative p-3 bg-slate-900/50 border-t border-slate-800 shrink-0">

                    {/* 드롭다운 메뉴 (사이드바가 열려있을 때만 정상적으로 렌더링되게 처리) */}
                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                            <div className={`absolute bottom-full left-3 mb-2 bg-slate-800 rounded-xl shadow-lg border border-slate-700 py-2 z-20 transition-all ${isSidebarOpen ? 'w-[calc(100%-1.5rem)]' : 'w-48 left-16'}`}>
                                <button
                                    onClick={() => { setIsDropdownOpen(false); setIsSettingsModalOpen(true); }}
                                    className="w-full px-4 py-2.5 text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-3 font-bold text-sm"
                                >
                                    <i className="fas fa-user-cog w-4 text-center"></i> 프로필 설정
                                </button>
                                <div className="border-t border-slate-700 my-1" />
                                <button
                                    onClick={() => { setIsDropdownOpen(false); logout(); }}
                                    className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors flex items-center gap-3 font-bold text-sm"
                                >
                                    <i className="fas fa-sign-out-alt w-4 text-center"></i> 로그아웃
                                </button>
                            </div>
                        </>
                    )}

                    {/* 프로필 버튼 */}
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`flex items-center w-full transition-all duration-300 rounded-xl hover:bg-slate-800 ${isSidebarOpen ? 'p-2 gap-3' : 'p-2 justify-center'}`}
                    >
                        {/* ★ 배경색을 profileImage가 없을 때만 랜덤 함수로 지정 */}
                        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg flex-shrink-0 cursor-pointer ${profileImage ? '' : getRandomColor(nickName || userName)}`}>
                            {profileImage ? (
                                <img src={profileImage} alt="프로필" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                /* ★ 이미지가 없으면 닉네임이나 이름의 무조건 첫 번째 글자 1개만 추출 */
                                (nickName || userName).charAt(0)
                            )}
                            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0f172a] rounded-full"></span>
                        </div>

                        <div className={`flex-1 text-left overflow-hidden min-w-0 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                            <p className="text-sm font-bold text-white truncate">{nickName !== userName ? `${nickName} (${userName})` : userName}
                            </p>

                            <p className="text-[10px] text-slate-500 truncate font-medium">@{userId}</p>
                        </div>

                        {isSidebarOpen && (
                            <i className={`fas fa-chevron-up text-slate-500 text-xs shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                        )}
                    </button>
                </div>
            </aside>

            {/* 5. 모달창 렌더링 - 변호사/일반인 구분 */}
            {isLawyerChat ? (
                <LawyerSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    profileImage={profileImage}
                    setProfileImage={setProfileImage}
                />
            ) : (
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    profileData={{
                        name: nickName,
                        email: dashboardData?.email || '이메일 정보 없음',
                        phone: dashboardData?.phone || '전화번호 정보 없음',
                        profileImage: profileImage
                    }}
                    onSaveName={(newName, newImage) => {
                        setNickName(newName);
                        localStorage.setItem('nickNm', newName);
                        if (newImage) setProfileImage(newImage);
                    }}
                />
            )}
        </>
    );
};

export default DashboardSidebar;