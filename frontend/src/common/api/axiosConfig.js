import axios from 'axios';

// 공통: 백엔드 주소 (API 호출·WebSocket·이미지 URL 등 한 곳에서 관리)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.43:8080';

let accessToken = null;
export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => { accessToken = token; };

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // 요청이 장시간 멈출 때 프론트가 무한 로딩 상태에 빠지지 않도록 제한
    timeout: 65000,
    // 🔑 핵심 1: 쿠키(RefreshToken)를 주고받기 위해 반드시 true 설정
    withCredentials: true,
});

// 1. 요청 인터셉터 (AccessToken 부착)
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. 응답 인터셉터 (Silent Refresh 로직)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401(만료) 에러 발생 시 작동
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/api/auth/refresh')
        ) {
            originalRequest._retry = true;

            try {
                // 🔑 핵심 2: 본문에 refreshToken을 담지 않습니다.
                // 쿠키에 담겨 자동으로 날아가기 때문에 빈 객체{}만 보냅니다.
                // 인터셉터가 없는 순수 axios를 사용합니다.
                const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
                    withCredentials: true // 여기서도 쿠키 전송은 필수!
                });

                if (res.data && res.data.success) {
                    const newAccessToken = res.data.data.accessToken;

                    // 새 액세스 토큰만 업데이트 (리프레시 토큰은 백엔드가 Set-Cookie로 갱신해줌)
                    setAccessToken(newAccessToken);

                    // 원래 실패했던 요청 재시도
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // ✅ 백엔드가 실제로 400/401 응답한 경우만 세션 만료 처리
                // 네트워크 단절, 서버 다운 등의 에러는 로그아웃하지 않음
                if (refreshError.response) {
                    setAccessToken(null);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('userNo');
                    localStorage.removeItem('userNm');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('nickNm');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

export const initAuth = async () => {
  try {
    const response = await axios.post(API_BASE_URL + '/api/auth/refresh', {}, { withCredentials: true });
    const token = response.data?.data?.accessToken;
    if (token) {
      setAccessToken(token);
      const role = response.data?.data?.role;
      if (role) localStorage.setItem('userRole', role);
    }
  } catch {
    // 비로그인 상태 → 조용히 종료
  }
};