import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../../common/api/axiosConfig';
import ProfileTab from './ProfileTab';
import PasswordTab from './PasswordTab';
import PaymentTab from './PaymentTab';
import WithdrawTab from './WithdrawTab';

const SettingsModal = ({ isOpen, onClose, profileImage, setProfileImage, isSubscribed, setIsSubscribed, initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'profile');

    useEffect(() => {
        if (isOpen) setActiveTab(initialTab || 'profile');
    }, [isOpen, initialTab]);
    const userRole = localStorage.getItem('userRole');

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        specialties: [],
        bio: '',
        imgUrl: ''
    });
    /** 서버에서 불러온 직후 이메일 — 변경 시 재로그인 안내용 */
    const [loadedEmail, setLoadedEmail] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            try {
                const res = await api.get('/api/mypage/general');
                const d = res.data.data;
                const em = d.email || '';
                setLoadedEmail(em);
                setProfileData(prev => ({
                    ...prev,
                    name:  d.userName || '',
                    email: em,
                    phone: d.phone    || ''
                }));
            } catch (err) {
                console.error('기본 프로필 로딩 실패:', err);
            }
            if (userRole?.includes('ROLE_LAWYER')) {
                try {
                    const kyRes = await api.get('/api/ky/profile');
                    const kd = kyRes.data.data || {};
                    setProfileData(prev => ({
                        ...prev,
                        specialties: kd.specialties || [],
                        bio: kd.bio || ''
                    }));
                    if (kd.imgUrl) {
                        setProfileImage(`${API_BASE_URL}${kd.imgUrl}`);
                    }
                } catch (err) {
                    console.error('변호사 프로필 로딩 실패:', err);
                }
            }
        };
        load();
    }, [isOpen]);

    if (!isOpen) return null;

    const tabs = [
        {
            key: 'profile',
            label: '프로필 변경',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
        },
        {
            key: 'password',
            label: '비밀번호 변경',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />,
        },
        {
            key: 'payment',
            label: '구독관리',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
        },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 py-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ height: '80vh' }}>
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">설정</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* 사이드바 메뉴 */}
                    <div className="w-52 bg-gray-50 border-r border-gray-200 p-3 flex-shrink-0">
                        <nav className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                                        activeTab === tab.key
                                            ? 'bg-white text-blue-600 font-semibold shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {tab.icon}
                                    </svg>
                                    {tab.label}
                                </button>
                            ))}

                            <div className="border-t border-gray-200 my-3" />

                            <button
                                onClick={() => setActiveTab('withdraw')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                                    activeTab === 'withdraw'
                                        ? 'bg-red-50 text-red-600 font-semibold shadow-sm'
                                        : 'text-red-400 hover:bg-red-50'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                </svg>
                                회원탈퇴
                            </button>
                        </nav>
                    </div>

                    {/* 콘텐츠 영역 */}
                    <div className="flex-1 p-5 overflow-y-auto">
                        {activeTab === 'profile' && (
                            <ProfileTab
                                profileData={profileData}
                                setProfileData={setProfileData}
                                profileImage={profileImage}
                                setProfileImage={setProfileImage}
                                userRole={userRole}
                                loadedEmail={loadedEmail}
                            />
                        )}
                        {activeTab === 'password' && <PasswordTab />}
                        {activeTab === 'payment' && (
                            <PaymentTab
                                isSubscribed={isSubscribed}
                                setIsSubscribed={setIsSubscribed}
                                email={profileData.email}
                                phone={profileData.phone}
                            />
                        )}
                        {activeTab === 'withdraw' && <WithdrawTab />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
