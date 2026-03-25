import React, { useRef } from 'react';
import api from '../../common/api/axiosConfig';
import { logout } from '../../common/utils/logout';

const WithdrawTab = () => {
    const withdrawPwRef = useRef(null);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">회원탈퇴</h3>
                <p className="text-sm text-gray-500">탈퇴 시 계정 및 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-700 mb-3">탈퇴 시 삭제되는 정보</h4>
                <ul className="space-y-2 text-sm text-red-600">
                    <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        프로필 정보 및 계정 데이터
                    </li>
                    <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        상담 내역 및 채팅 기록
                    </li>
                    <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        AI 상담 및 판례 검색 기록
                    </li>
                    <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        구독 및 결제 정보 (진행중인 구독은 자동 해지)
                    </li>
                </ul>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">탈퇴 사유 (선택)</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="">선택해주세요</option>
                    <option value="not-useful">서비스가 유용하지 않음</option>
                    <option value="expensive">비용이 부담됨</option>
                    <option value="other-service">다른 서비스 이용</option>
                    <option value="privacy">개인정보 우려</option>
                    <option value="etc">기타</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
                <input
                    ref={withdrawPwRef}
                    type="password"
                    placeholder="현재 비밀번호를 입력해주세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
            </div>

            <button
                onClick={() => {
                    const pw = withdrawPwRef.current?.value;
                    if (!pw) { alert('비밀번호를 입력해주세요.'); return; }
                    if (window.confirm('정말로 탈퇴하시겠습니까?\n탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.')) {
                        api.delete('/api/ky/account', { data: { password: pw } })
                            .then(async (res) => {
                                if (!res.data?.success) {
                                    alert(res.data?.message || '탈퇴 처리에 실패했습니다.');
                                    return;
                                }
                                alert('탈퇴 처리가 완료되었습니다.');
                                await logout();
                            })
                            .catch(err => {
                                const msg = err.response?.data?.message || '탈퇴 처리에 실패했습니다.';
                                alert(msg);
                            });
                    }
                }}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
                회원탈퇴
            </button>

            <p className="text-xs text-gray-400 text-center">
                탈퇴 처리는 즉시 진행되며, 삭제된 데이터는 복구할 수 없습니다.
            </p>
        </div>
    );
};

export default WithdrawTab;
