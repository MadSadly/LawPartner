import api from '../api/axiosConfig';
import { setAccessToken } from '../api/axiosConfig';

/**
 * 메모리 accessToken + 로그인 세션용 localStorage 제거 (아이디 저장 savedUserId 유지)
 */
export const clearClientAuth = () => {
  setAccessToken(null);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userNo');
  localStorage.removeItem('userNm');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.removeItem('nickNm');
};

export const logout = async () => {
  try {
    await api.delete('/api/auth/logout');
  } finally {
    clearClientAuth();
    window.location.href = '/login';
  }
};
