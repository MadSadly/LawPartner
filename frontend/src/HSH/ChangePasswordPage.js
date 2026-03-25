import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../common/api/axiosConfig';
import { clearClientAuth } from '../common/utils/logout';
import './LoginPage.css';

const ChangePasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // location.state에 userNo가 없는 경우 로그인 페이지로 이동
    const state = location.state;
    if (!state || !state.userNo) {
      navigate('/login', { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/auth/change-password', {
        newPassword,
      });
      setSuccessMsg('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
      try {
        await api.delete('/api/auth/logout');
      } catch {
        /* 쿠키/세션 없어도 클라이언트 정리는 진행 */
      }
      clearClientAuth();
      setCountdown(3);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return prev;
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            navigate('/login', { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    'w-full px-4 py-3 bg-slate-100/50 border border-transparent rounded-2xl input-focus outline-none transition-all font-bold text-sm text-slate-700 placeholder:text-slate-400';
  const buttonStyle =
    'w-full bg-blue-900 text-white py-3 rounded-2xl font-black text-base shadow-[0_10px_30px_rgba(30,58,138,0.25)] hover:bg-slate-900 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <main id="login-page" className="w-full flex items-center justify-center py-12 relative overflow-hidden bg-mesh">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-[500px] w-full glass-login rounded-[2.5rem] shadow-[0_20px_50px_rgba(30,58,138,0.12)] p-10 border border-white relative z-10 fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg rotate-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">비밀번호 변경</h3>
          <p className="text-slate-500 font-medium text-sm">
            임시 비밀번호로 로그인하셨습니다. 새 비밀번호를 설정해주세요.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl text-center">
            <p className="text-sm text-red-600 font-bold">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-center">
            <p className="text-sm text-blue-700 font-bold">{successMsg}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
              NEW PASSWORD
            </label>
            <input
              type="password"
              required
              placeholder="새 비밀번호를 입력하세요 (8자 이상)"
              className={inputStyle}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              required
              placeholder="새 비밀번호를 다시 입력하세요"
              className={inputStyle}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className={buttonStyle} disabled={loading}>
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
      {countdown !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div style={{ color: '#ffffff', fontSize: '80px', fontWeight: 800, lineHeight: 1 }}>
            {countdown}
          </div>
          <div style={{ color: '#ffffff', marginTop: '16px', fontSize: '18px', fontWeight: 600 }}>
            잠시 후 로그인 페이지로 이동합니다.
          </div>
        </div>
      )}
    </main>
  );
};

export default ChangePasswordPage;

