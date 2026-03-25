import React, { useState, useEffect, useRef } from 'react';
import api from '../common/api/axiosConfig';
import { logout } from '../common/utils/logout';

const RELOGIN_MSG = '이메일이 변경되었습니다. 보안을 위해 다시 로그인해주세요.';

// [초심자 핵심] 부모 컴포넌트에서 onSaveName 이라는 함수를 props로 넘겨줘야 사이드바 렌더링이 됨
const SettingsModal = ({ isOpen, onClose, profileData, onSaveName }) => {
    const [activeTab, setActiveTab] = useState('profile');

    const [nameInput, setNameInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [phoneInput, setPhoneInput] = useState('');

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef(null);

    const [pwInput, setPwInput] = useState({ oldPw: '', newPw: '', confirmPw: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [agreeDelete, setAgreeDelete] = useState(false);
    /** 모달을 열었을 때의 이메일(변경 여부 판별용 — 부모 profileData는 입력 중에는 그대로) */
    const emailBaselineRef = useRef('');

    // [초심자 핵심] 이름 기반 랜덤 배경색 생성기
    const getRandomColor = (name) => {
        if (!name) return 'bg-blue-500';
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    // 모달 열릴 때 초기화
    useEffect(() => {
        if (isOpen && profileData) {
            setNameInput(profileData.name || '');
            setEmailInput(profileData.email || '');
            setPhoneInput(profileData.phone || '');
            emailBaselineRef.current = (profileData.email || '').trim();
            setImagePreview(profileData.profileImage || '');
            setImageFile(null);

            setPwInput({ oldPw: '', newPw: '', confirmPw: '' });
            setActiveTab('profile');

            setAgreeDelete(false);
        }
    }, [isOpen, profileData]);

    // ★ [초심자 핵심] 메모리 누수 방지 (실무 팩트)
    useEffect(() => {
        return () => {
            // 브라우저에 임시로 띄워둔 가상 URL(blob)만 찾아서 메모리에서 날려버림
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    if (!isOpen) return null;

    const handleAction = async (actionFn, successMsg) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await actionFn();
            if (successMsg) alert(successMsg);
        } catch (error) {
            const msg = error.response?.data?.message || "처리 중 오류가 발생했습니다.";
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file)); // 미리보기 URL 생성
        }
    };

    // 1. 프로필 변경 API
    const handleSaveProfile = () => handleAction(async () => {
        if (!nameInput.trim()) throw new Error("이름을 입력해주세요.");
        if (!emailInput.trim()) throw new Error("이메일을 입력해주세요.");
        if (!phoneInput.trim()) throw new Error("전화번호를 입력해주세요.");

        const formData = new FormData();
        formData.append('name', nameInput);   // ProfileUpdateDTO: name, email, phone
        formData.append('email', emailInput);
        formData.append('phone', phoneInput);
        if (imageFile) {
            formData.append('profileImage', imageFile);
        }

        // 서버 쏘기
        const response = await api.post('/api/mypage/profile/update', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });

        const emailChanged = emailInput.trim() !== emailBaselineRef.current;
        if (emailChanged) {
            alert(RELOGIN_MSG);
            await logout();
            return;
        }

        localStorage.setItem('nickNm', nameInput);
        alert("프로필이 성공적으로 변경되었습니다.");

        // ★ [초심자 핵심] 무식한 새로고침(F5) 컷. 부모한테 새 데이터 넘겨서 알아서 렌더링하게 짬처리함.
        if (onSaveName) {
            // 백엔드에서 새 프사 URL을 주면 그거 쓰고, 안 주면 방금 띄운 미리보기 URL이라도 임시로 넘김
            const updatedImageUrl = response.data?.newImageUrl || imagePreview;
            onSaveName(nameInput, updatedImageUrl);
        }

        onClose(); // 모달 깔끔하게 닫기
    }, null);

    // 2. 비밀번호 변경 API (기존 유지)
    const handleSavePassword = () => handleAction(async () => {
        if (!pwInput.oldPw || !pwInput.newPw) throw new Error("모든 비밀번호 필드를 입력해주세요.");
        if (pwInput.newPw !== pwInput.confirmPw) throw new Error("새 비밀번호가 일치하지 않습니다.");

        await api.put('/api/mypage/password', { oldPassword: pwInput.oldPw, newPassword: pwInput.newPw });
        alert("비밀번호가 변경되었습니다. 보안을 위해 다시 로그인해주세요.");
        await logout();
    }, null);

    // 3. 회원 탈퇴 API (기존 유지)
    const handleDeleteAccount = () => handleAction(async () => {
        if (!window.confirm("정말로 탈퇴하시겠습니까?")) throw new Error("탈퇴가 취소되었습니다.");
        await api.delete('/api/mypage/account');
        alert("회원 탈퇴가 완료되었습니다.");
        await logout();
    }, null);

    const TabButton = ({ tabName, icon, label, isDanger = false }) => {
        const isActive = activeTab === tabName;
        let baseClasses = "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200";
        let activeClasses = isActive ? (isDanger ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200" : "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200") : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-700";
        return (
            <button onClick={() => setActiveTab(tabName)} className={`${baseClasses} ${activeClasses}`}>
                <i className={`fas ${icon} ${isActive ? '' : 'opacity-70'}`}></i>{label}
            </button>
        );
    };

    const inputClasses = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors text-slate-700 bg-slate-50/50 font-medium";
    const labelClasses = "block text-sm font-bold text-slate-700 mb-2 ml-1";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 backdrop-blur-sm bg-slate-900/40" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden border border-slate-100 relative" onClick={(e) => e.stopPropagation()}>

                <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-800">계정 설정</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"><i className="fas fa-times"></i></button>
                </div>

                <div className="px-6 py-4 bg-white">
                    <div className="flex p-1 bg-slate-100/70 rounded-xl">
                        <TabButton tabName="profile" icon="fa-user-edit" label="프로필" />
                        <TabButton tabName="password" icon="fa-lock" label="비밀번호" />
                        <TabButton tabName="delete" icon="fa-user-slash" label="탈퇴" isDanger={true} />
                    </div>
                </div>

                <div className="p-6 pt-2 max-h-[60vh] overflow-y-auto custom-scrollbar relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                            <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-5 py-2">
                            {/* ★ 대망의 프사 렌더링 영역 */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                    {/* 프사가 있으면 투명배경, 없으면 랜덤배경색 적용 */}
                                    <div className={`w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center ${imagePreview ? 'bg-slate-100' : getRandomColor(nameInput)}`}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-black text-white">{nameInput ? nameInput.charAt(0) : '?'}</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <i className="fas fa-camera text-white text-xl"></i>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                            </div>

                            <div>
                                <label className={labelClasses}>닉네임</label>
                                <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>이메일</label>
                                <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>전화번호</label>
                                <input type="text" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className={inputClasses} />
                            </div>

                            <button onClick={handleSaveProfile} disabled={isLoading} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 mt-4">
                                변경사항 저장
                            </button>
                        </div>
                    )}

                    {/* 비밀번호 탭 */}
                    {activeTab === 'password' && (
                        <div className="space-y-5 py-2">
                            <div><label className={labelClasses}>현재 비밀번호</label><input type="password" value={pwInput.oldPw} onChange={(e) => setPwInput({...pwInput, oldPw: e.target.value})} className={inputClasses} /></div>
                            <div><label className={labelClasses}>새 비밀번호</label><input type="password" value={pwInput.newPw} onChange={(e) => setPwInput({...pwInput, newPw: e.target.value})} className={inputClasses} /></div>
                            <div><label className={labelClasses}>비밀번호 확인</label><input type="password" value={pwInput.confirmPw} onChange={(e) => setPwInput({...pwInput, confirmPw: e.target.value})} className={inputClasses} /></div>
                            <button onClick={handleSavePassword} disabled={isLoading} className="w-full py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900">비밀번호 변경하기</button>
                        </div>
                    )}

                    {/* 탈퇴 탭 */}
                    {activeTab === 'delete' && (
                        <div className="py-6 px-4 bg-red-50 rounded-2xl border border-red-100 text-left">
                            <h3 className="text-red-700 font-black text-lg mb-3 flex items-center">
                                <i className="fas fa-exclamation-triangle mr-2"></i> 정말 탈퇴하시겠습니까?
                            </h3>

                            <ul className="text-red-600 text-sm space-y-2 mb-6 font-medium leading-relaxed">
                                <li>• 탈퇴 시 귀하의 모든 상담 내역 및 채팅 기록은 즉시 삭제됩니다.</li>
                                <li>• 저장된 캘린더 일정과 개인 설정 데이터는 복구가 불가능합니다.</li>
                                <li>• 현재 진행 중인 상담이 있는 경우, 상담이 강제 종료될 수 있습니다.</li>
                                <li>• 법률 서비스 특성상 일부 데이터는 관련 법령에 따라 일정 기간 보관될 수 있습니다.</li>
                            </ul>

                            <div className="flex items-center space-x-2 mb-6">
                                <input
                                    type="checkbox"
                                    id="deleteConfirm"
                                    onChange={(e) => setAgreeDelete(e.target.checked)} // 상태 하나 만들어라 게이야
                                    className="w-4 h-4 accent-red-500"
                                />
                                <label htmlFor="deleteConfirm" className="text-xs text-slate-600 font-bold cursor-pointer">
                                    위 안내 사항을 모두 숙지하였으며, 영구 탈퇴에 동의합니다.
                                </label>
                            </div>

                            <button
                                onClick={handleDeleteAccount}
                                disabled={isLoading || !agreeDelete} // 동의 안 하면 버튼 안 눌리게 막아라
                                className="w-full py-4 bg-white border-2 border-red-500 text-red-500 font-black rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                영구 탈퇴 진행하기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;