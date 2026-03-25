import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileCard from './ProfileCard';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            icon: 'fas fa-home',
            label: '마이페이지',
            path: '/lawyer-dashboard'
        },
        {
            icon: 'fas fa-comments',
            label: '1:1 채팅',
            path: '/lawyer-chat'
        },
        {
            icon: 'fas fa-clipboard-list',
            label: '상담게시판',
            path: '/consultation'
        },

        {
            icon: 'fas fa-headset',
            label: '고객센터',
            path: '/customer'
        }
    ];

    // 내부 메뉴 아이템 컴포넌트
    const SidebarItem = ({ icon, label, path }) => {
        const isActive = location.pathname === path;

        return (
            <button
                onClick={() => navigate(path)}
                style={{ fontFamily: "'Pretendard', sans-serif" }}
                className={`
                    relative flex items-center h-12 mb-2 rounded-xl transition-all duration-300 ease-in-out group w-full
                    ${isCollapsed ? 'px-0 mx-2 justify-center' : 'px-4 mx-2'}
                    ${isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-400 hover:text-white'}
                `}
                {...(isActive
                    ? { style: { fontFamily: "'Pretendard', sans-serif", background: '#1D4ED8' } }
                    : { style: { fontFamily: "'Pretendard', sans-serif" },
                        onMouseEnter: (e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)',
                        onMouseLeave: (e) => e.currentTarget.style.background = 'transparent'
                    }
                )}
            >
                {/* 아이콘 */}
                <div className={`flex items-center justify-center text-lg transition-all duration-300 ${isCollapsed ? 'mx-auto' : ''}`}>
                    <i className={icon}></i>
                </div>

                {/* 텍스트 */}
                <span
                    className={`
                        font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
                        ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}
                    `}
                >
                    {label}
                </span>

                {/* 툴팁: 사이드바가 닫혔을 때만 우측에 표시 */}
                {isCollapsed && (
                    <div className="absolute left-[calc(100%+10px)] top-1/2 transform -translate-y-1/2 text-white text-xs font-bold px-3 py-2 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none whitespace-nowrap"
                         style={{ background: '#1D4ED8' }}>
                        {label}
                    </div>
                )}
            </button>
        );
    };

    return (
        <aside
            style={{
                background: '#111827',
                fontFamily: "'Pretendard', sans-serif",
                width: isCollapsed ? 80 : 256,
                minWidth: isCollapsed ? 80 : 256,
                maxWidth: isCollapsed ? 80 : 256,
                transition: 'width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease',
                flexShrink: 0,
            }}
            className="relative flex flex-col shadow-lg self-stretch"
        >
            {/* 중앙 토글 버튼 */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-md z-50 focus:outline-none"
                style={{ background: '#1D4ED8', color: '#fff', border: 'none' }}
            >
                <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'} text-[10px]`}></i>
            </button>

            {/* 로고 영역 */}
            <div className="h-16 flex items-center justify-center relative overflow-hidden shrink-0"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h1
                    className={`
                        text-xl font-extrabold text-white whitespace-nowrap transition-all duration-300
                        ${isCollapsed ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}
                    `}
                >
                    LawPartner
                </h1>
                <span
                    className={`
                        text-xl font-black absolute transition-all duration-300
                        ${isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                    `}
                    style={{ color: '#1D4ED8' }}
                >
                    LP
                </span>
            </div>

            {/* 메뉴 영역 */}
            <nav className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
                    <div className={`text-[10px] font-bold uppercase mb-2 px-6 tracking-wider transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
                         style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Main Menu
                    </div>
                    {menuItems.map((item, index) => (
                        <SidebarItem
                            key={index}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                        />
                    ))}
                </div>
            </nav>

            {/* 프로필 영역 */}
            {!isCollapsed && (
                <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <ProfileCard />
                </div>
            )}

            {/* 프로필 아이콘만 (접혔을 때) */}
            {isCollapsed && (
                <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold mx-auto cursor-pointer transition-colors"
                         style={{ background: '#1D4ED8' }}>
                        {(localStorage.getItem('userNm') || '?').charAt(0)}
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
