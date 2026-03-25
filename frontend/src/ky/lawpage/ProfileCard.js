import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../modal/SettingsModal';
import api, { API_BASE_URL } from '../../common/api/axiosConfig';
import { logout } from '../../common/utils/logout';

const ProfileCard = () => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(
        () => localStorage.getItem('isSubscribed') === 'true'
    );

    useEffect(() => {
        localStorage.setItem('isSubscribed', isSubscribed);
    }, [isSubscribed]);

    const userRole = localStorage.getItem('userRole');

    const user = {
        name: localStorage.getItem('userNm') || '변호사',
        username: '@' + (localStorage.getItem('userId') || ''),
    };

    // 변호사인 경우 초기 프로필 이미지 로드
    useEffect(() => {
        if (!userRole?.includes('ROLE_LAWYER')) return;
        api.get('/api/ky/profile')
            .then(res => {
                const imgUrl = res.data?.data?.imgUrl;
                if (imgUrl) setProfileImage(`${API_BASE_URL}${imgUrl}`);
            })
            .catch(() => {});
    }, [userRole]);

    // handleLogout 제거: 공통 logout 사용

    const [settingsInitialTab, setSettingsInitialTab] = useState('profile');

    // 구독하기 버튼: 설정 모달의 결제탭으로 이동
    const handleSubscribeClick = () => {
        setSettingsInitialTab('payment');
        setIsSettingsModalOpen(true);
    };

    return (
        <>
            <div className="relative">
                {/* 프로필 버튼 */}
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                        {profileImage ? (
                            <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
                        ) : (
                            user.name.charAt(0)
                        )}
                    </div>
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{user.name}</span>
                            {isSubscribed && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">구독중</span>
                            )}
                        </div>
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.username}</span>
                    </div>
                </button>

                {/* 드롭다운 */}
                {isDropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                            <button
                                onClick={() => { setIsDropdownOpen(false); setSettingsInitialTab('profile'); setIsSettingsModalOpen(true); }}
                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-gray-700 font-medium">설정</span>
                            </button>

                            <div className="border-t border-gray-100 my-1" />

                            <button
                                onClick={() => { setIsDropdownOpen(false); logout(); }}
                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="text-gray-700 font-medium">로그아웃</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* 구독 버튼: 설정 모달 구독관리 탭으로 이동 */}
            <button
                onClick={handleSubscribeClick}
                className={`w-full mt-2 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isSubscribed ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
                {isSubscribed ? '✓ 구독중' : '구독하기'}
            </button>

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                profileImage={profileImage}
                setProfileImage={setProfileImage}
                isSubscribed={isSubscribed}
                setIsSubscribed={setIsSubscribed}
                initialTab={settingsInitialTab}
            />
        </>
    );
};

export default ProfileCard;