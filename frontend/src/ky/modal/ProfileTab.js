import React, { useRef } from 'react';
import api from '../../common/api/axiosConfig';
import { logout } from '../../common/utils/logout';

const SPECIALTIES = ['형사범죄', '교통사고', '부동산', '임대차', '손해배상', '대여금', '미수금', '채권추심', '이혼', '상속/가사', '노동', '기업', '지식재산권', '회생/파산', '계약서 검토', '기타'];

const RELOGIN_EMAIL_MSG = '이메일이 변경되었습니다. 보안을 위해 다시 로그인해주세요.';

const ProfileTab = ({ profileData, setProfileData, profileImage, setProfileImage, userRole, loadedEmail = '' }) => {
    const fileInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('파일 크기는 5MB 이하여야 합니다.'); return; }
        if (!file.type.startsWith('image/')) { alert('이미지 파일만 업로드 가능합니다.'); return; }

        const reader = new FileReader();
        reader.onloadend = () => setProfileImage(reader.result);
        reader.readAsDataURL(file);

        if (userRole?.includes('ROLE_LAWYER')) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                await api.post('/api/ky/profile/image', formData);
                alert('프로필 사진이 저장되었습니다.');
            } catch (err) {
                alert('사진 업로드에 실패했습니다.');
                console.error(err);
            }
        }
    };

    const handleImageRemove = () => {
        setProfileImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async () => {
        const emailBefore = (loadedEmail || '').trim();
        const emailAfter = (profileData.email || '').trim();
        const emailChanged = emailBefore !== emailAfter;

        try {
            const formData = new FormData();
            formData.append('name', profileData.name || '');
            formData.append('email', profileData.email || '');
            formData.append('phone', profileData.phone || '');
            await api.post('/api/mypage/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } catch (err) {
            const msg = err.response?.data?.message || '기본 정보 저장에 실패했습니다.';
            alert(msg);
            console.error('기본 정보 저장 실패:', err);
            return;
        }

        if (userRole?.includes('ROLE_LAWYER')) {
            try {
                await api.put('/api/ky/profile', {
                    specialties: profileData.specialties || [],
                    bio: profileData.bio || ''
                });
            } catch (err) {
                alert('소개글/전문분야 저장에 실패했습니다.');
                console.error(err);
                return;
            }
        }

        if (emailChanged) {
            alert(RELOGIN_EMAIL_MSG);
            await logout();
            return;
        }

        alert('프로필이 저장되었습니다.');
        localStorage.setItem('userNm', profileData.name);
    };

    return (
        <div className="space-y-6">
            {/* 프로필 사진 */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">프로필 사진</h3>
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center text-white text-3xl font-semibold overflow-hidden">
                        {profileImage ? (
                            <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
                        ) : (
                            profileData.name.charAt(0)
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            사진 업로드
                        </button>
                        {profileImage && (
                            <button onClick={handleImageRemove} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-colors">
                                사진 삭제
                            </button>
                        )}
                        <p className="text-xs text-gray-500">JPG, PNG 파일 (최대 5MB)</p>
                    </div>
                </div>
            </div>

            {/* 프로필 정보 */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">프로필 정보</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            이름 <span className="ml-2 text-xs text-gray-400 font-normal">변경 불가</span>
                        </label>
                        <input type="text" value={profileData.name} readOnly className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                        <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            전화번호 <span className="ml-2 text-xs text-gray-400 font-normal">변경 불가</span>
                        </label>
                        <input type="tel" value={profileData.phone} readOnly className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                    </div>

                    {/* 전문분야 - 변호사 전용 */}
                    {userRole?.includes('ROLE_LAWYER') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">전문 분야</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {SPECIALTIES.map((field) => (
                                    <button
                                        key={field}
                                        type="button"
                                        onClick={() => {
                                            const current = profileData.specialties || [];
                                            const updated = current.includes(field)
                                                ? current.filter(f => f !== field)
                                                : [...current, field];
                                            setProfileData({ ...profileData, specialties: updated });
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                            (profileData.specialties || []).includes(field)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {field}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">해당하는 전문 분야를 선택하세요</p>
                        </div>
                    )}

                    {/* 소개글 - 변호사 전용 */}
                    {userRole?.includes('ROLE_LAWYER') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">소개글</label>
                            <textarea
                                value={profileData.bio || ''}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                placeholder="변호사님을 소개해주세요. (전문 분야, 경력, 상담 방식 등)"
                                rows={4}
                                maxLength={300}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-gray-500 text-right mt-1">{(profileData.bio || '').length} / 300</p>
                        </div>
                    )}
                </div>
            </div>

            <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                저장하기
            </button>
        </div>
    );
};

export default ProfileTab;
