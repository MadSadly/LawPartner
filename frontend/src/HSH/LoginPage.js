import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getAccessToken, setAccessToken } from '../common/api/axiosConfig';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();

    const [userId, setUserId] = useState('');           // 아이디 저장용
    const [password, setPassword] = useState('');       // 비밀번호
    const [errorMsg, setErrorMsg] = useState('');       // 에러 메시지
    const [isError, setIsError] = useState(false);      // 에러 유무
    const [isRemember, setIsRemember] = useState(false); // 체크박스 상태용
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    const [recoveryMode, setRecoveryMode] = useState('id');
    const [recoveryForm, setRecoveryForm] = useState({
        userNm: '',
        userId: '',
        email: '',
    });
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoveryMessage, setRecoveryMessage] = useState('');
    const [recoveryError, setRecoveryError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 페이지 진입 시 로직 (이미 로그인 체크 + 접속 로그)

    useEffect(() => {
        // 1-1. 이미 로그인된 사용자는 메인으로 돌려보냄
        if (getAccessToken()) {
            navigate('/');
            return;
        }
        // 1-2 브라우저 저장소에서 기억된 아이디 가져오기
        const savedId = localStorage.getItem('savedUserId');
        if(savedId){
            // 설정한 State 함수 이름 사용하기
            setUserId(savedId)
            // 체크박스도 체크됨으로 변경
            setIsRemember(true)
        }
    }, [navigate]);


    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsError(false);
        setIsSubmitting(true);

        try {
            const response = await api.post('/api/auth/login', {
                userId: userId,
                userPw: password
            });

            const tokenData = response.data.data;

            if (tokenData && tokenData.accessToken) {
                // 모든 정보를 로컬 스토리지에 저장 (RBAC 연동의 핵심)
                // axios 인터셉터가 즉시 Authorization 헤더를 붙일 수 있도록 메모리 토큰도 동기화
                setAccessToken(tokenData.accessToken);
                localStorage.setItem('userNm', tokenData.userNm || "사용자");
                // ★ 추가 저장: 이메일과 유저 번호
                localStorage.setItem('userEmail', tokenData.email);
                localStorage.setItem('userNo', tokenData.userNo);
                // ★ 이 부분이 있어야 Header.js에서 '마이페이지' vs '워크스페이스'를 구분함
                localStorage.setItem('userRole', tokenData.role || 'ROLE_USER');
                // 유저 닉네임 추가
                localStorage.setItem('nickNm', tokenData.nickNm)

                if (isRemember) {
                    // 체크되어 있다면 아이디 저장
                    localStorage.setItem('savedUserId', userId);
                } else {
                    // 체크 해제되어 있다면 저장된 아이디 삭제
                    localStorage.removeItem('savedUserId');
                }
                
                const role = tokenData.role || 'ROLE_USER';
                const nickname = tokenData.userNm || tokenData.nickNm || '관리자';
                
                alert(`${nickname}님 환영합니다!`);

                if (tokenData.passwordChangeRequired) {
                    navigate('/change-password', { state: { userNo: tokenData.userNo } });
                    return;
                }

                // 관리자 계열이면 무조건 관리자 페이지로, 그 외 나머지는 무조건 메인 홈페이지로!
                if (role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_ADMIN' || role === 'ROLE_OPERATOR') {
                    window.location.href = '/admin'; 
                } else {
                    window.location.href = '/'; 
                }

            } else {
                throw new Error("토큰 응답 오류");
            }
            
        } catch (error) {
            setErrorMsg("아이디 또는 비밀번호가 틀렸습니다!"); 
            setIsError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openRecoveryModal = () => {
        setRecoveryMode('id');
        setRecoveryForm({ userNm: '', userId: '', email: '' });
        setRecoveryMessage('');
        setRecoveryError('');
        setIsRecoveryModalOpen(true);
    };

    const closeRecoveryModal = () => {
        if (recoveryLoading) return;
        setIsRecoveryModalOpen(false);
        setRecoveryMode('id');
        setRecoveryForm({ userNm: '', userId: '', email: '' });
        setRecoveryMessage('');
        setRecoveryError('');
    };

    const handleRecoveryChange = (e) => {
        const { name, value } = e.target;
        setRecoveryForm((prev) => ({ ...prev, [name]: value }));
    };

    const setRecoveryTab = (mode) => {
        setRecoveryMode(mode);
        setRecoveryMessage('');
        setRecoveryError('');
    };

    const handleRecoverySubmit = async (e) => {
        e.preventDefault();
        setRecoveryLoading(true);
        setRecoveryMessage('');
        setRecoveryError('');

        try {
            if (recoveryMode === 'id') {
                const res = await api.post('/api/auth/find-id', {
                    userNm: recoveryForm.userNm,
                    email: recoveryForm.email,
                });
                const maskedUserId = res.data?.data;
                const maskedPart = maskedUserId ? ` (아이디: ${maskedUserId})` : '';
                setRecoveryMessage(`등록된 이메일로 아이디가 발송되었습니다.${maskedPart}`);
            } else {
                await api.post('/api/auth/find-password', {
                    userId: recoveryForm.userId,
                    userNm: recoveryForm.userNm,
                    email: recoveryForm.email,
                });
                setRecoveryMessage('임시 비밀번호가 이메일로 발송되었습니다.');
            }
        } catch (error) {
            setRecoveryError(error.response?.data?.message || '계정 찾기 처리 중 오류가 발생했습니다.');
        } finally {
            setRecoveryLoading(false);
        }
    };

    // 스타일 변수 (다이어트 버전 그대로 유지)
    const inputStyle = "w-full px-4 py-3 bg-slate-100/50 border border-transparent rounded-2xl input-focus outline-none transition-all font-bold text-sm text-slate-700 placeholder:text-slate-400";
    const buttonStyle = "w-full bg-blue-900 text-white py-3 rounded-2xl font-black text-base shadow-[0_10px_30px_rgba(30,58,138,0.25)] hover:bg-slate-900 hover:-translate-y-1 active:scale-95 transition-all";
    
    return (
        <main id="login-page" className="w-full flex items-center justify-center py-12 relative overflow-hidden bg-mesh">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-[500px] w-full glass-login rounded-[2.5rem] shadow-[0_20px_50px_rgba(30,58,138,0.12)] p-10 border border-white relative z-10 fade-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg rotate-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">법률적 해결의 첫걸음</h3>
                    <p className="text-slate-500 font-medium text-sm">로그인하여 서비스를 시작하세요</p>
                </div>

                {isError && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl text-center shake">
                        <p className="text-sm text-red-600 font-bold">{errorMsg}</p>
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleLoginSubmit}>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">USER ID</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="아이디를 입력하세요" 
                            className={inputStyle} 
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">PASSWORD</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="비밀번호를 입력하세요" 
                            className={inputStyle} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between px-2 pt-1">
                        {/* 왼쪽: 체크박스 + 라벨 세트 */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                // m-0을 추가하여 브라우저 기본 여백을 완전히 제거합니다.
                                className="w-4 h-4 m-0 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer shrink-0"
                                checked={isRemember}
                                onChange={(e) => setIsRemember(e.target.checked)}
                            />
                            <label
                                htmlFor="remember"
                                // relative와 top을 사용해 픽셀 단위로 정밀하게 내립니다.
                                // leading-normal을 써서 폰트의 표준 높이를 확보합니다.
                                className="text-xs font-bold text-slate-500 cursor-pointer relative top-[3px] leading-normal"
                            >
                                기억하기
                            </label>
                        </div>

                        {/* 오른쪽: 비밀번호 찾기 버튼 */}
                        <button
                            type="button"
                            // 우측 버튼도 좌측 글자와 동일하게 정렬되도록 미세 조정합니다.
                            className="text-xs font-bold text-blue-900 hover:text-blue-700 transition-colors relative top-[1px]"
                            onClick={openRecoveryModal}
                        >
                            아이디 · 비밀번호 찾기
                        </button>
                    </div>

                    <button type="submit" className={buttonStyle} disabled={isSubmitting}>
                        {isSubmitting ? '로그인 중...' : '계정 로그인'}
                    </button>
                </form>
                
                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm font-medium">아직 회원이 아니신가요? 
                        <button 
                            onClick={() => navigate('/signup')} 
                            className="ml-2 font-black text-blue-900 hover:underline underline-offset-4"
                        >
                            새 계정 만들기
                        </button>
                    </p>
                </div>
            </div>

            {isRecoveryModalOpen && (
                <div className="modal-overlay px-4" onClick={closeRecoveryModal}>
                    <div className="recovery-modal w-full max-w-[480px] glass-login rounded-[2.5rem] shadow-[0_20px_50px_rgba(30,58,138,0.18)] p-8 md:p-10 border border-white relative z-10 fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg rotate-3">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
                                {recoveryMode === 'id' ? '아이디 찾기' : '비밀번호 찾기'}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm">
                                {recoveryMode === 'id' ? '가입 시 등록한 정보로 아이디를 확인하세요.' : '임시 비밀번호를 이메일로 발송해 드립니다.'}
                            </p>
                        </div>

                        <div className="segment-container flex mb-8">
                            <div
                                className="segment-active-bg"
                                style={{ transform: recoveryMode === 'pw' ? 'translateX(100%)' : 'translateX(0)' }}
                            />
                            <button
                                type="button"
                                className={`segment-btn flex-1 py-3 text-xs font-bold transition-all ${recoveryMode === 'id' ? 'text-slate-900' : 'text-slate-400'}`}
                                onClick={() => setRecoveryTab('id')}
                            >
                                아이디 찾기
                            </button>
                            <button
                                type="button"
                                className={`segment-btn flex-1 py-3 text-xs font-bold transition-all ${recoveryMode === 'pw' ? 'text-slate-900' : 'text-slate-400'}`}
                                onClick={() => setRecoveryTab('pw')}
                            >
                                비밀번호 찾기
                            </button>
                        </div>

                        <form className="space-y-5" onSubmit={handleRecoverySubmit}>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">NAME</label>
                                <input
                                    type="text"
                                    name="userNm"
                                    required
                                    placeholder="이름을 입력하세요"
                                    className={inputStyle}
                                    value={recoveryForm.userNm}
                                    onChange={handleRecoveryChange}
                                />
                            </div>

                            {recoveryMode === 'pw' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">USER ID</label>
                                    <input
                                        type="text"
                                        name="userId"
                                        required
                                        placeholder="아이디를 입력하세요"
                                        className={inputStyle}
                                        value={recoveryForm.userId}
                                        onChange={handleRecoveryChange}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">EMAIL</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="example@lex.ai"
                                    className={inputStyle}
                                    value={recoveryForm.email}
                                    onChange={handleRecoveryChange}
                                />
                                <p className="text-[10px] text-blue-600 font-bold ml-1">
                                    ※ 가입 시 입력한 이메일로 본인 확인이 진행됩니다.
                                </p>
                            </div>

                            {(recoveryMessage || recoveryError) && (
                                <div className={`p-3.5 rounded-2xl text-center ${recoveryMessage ? 'bg-blue-50 border border-blue-100' : 'bg-red-50 border border-red-100'}`}>
                                    <p className={`text-sm font-bold ${recoveryMessage ? 'text-blue-700' : 'text-red-600'}`}>
                                        {recoveryMessage || recoveryError}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={recoveryLoading}
                                className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black text-base shadow-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {recoveryLoading ? '처리 중...' : (recoveryMode === 'id' ? '아이디 찾기' : '임시 비밀번호 발송')}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={closeRecoveryModal}
                                className="text-xs font-bold text-slate-400 hover:text-blue-900 transition-colors underline underline-offset-4"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default LoginPage;