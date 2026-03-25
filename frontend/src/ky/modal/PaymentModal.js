import React, { useState } from 'react';
import api from '../../common/api/axiosConfig';

const PaymentModal = ({ isOpen, onClose, onPaymentSuccess, email = '', phone = '' }) => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [agreeTerms, setAgreeTerms] = useState(false);

    if (!isOpen) return null;

    const handlePayment = async () => {
        if (!agreeTerms) {
            alert('이용약관에 동의해주세요.');
            return;
        }

        // 🔥 포트원 V2 결제
        if (!window.PortOne) {
            alert('포트원 SDK를 불러올 수 없습니다.\n index.html을 확인해주세요.'
            );
            return;
        }

        try {
            // 유효한 이메일 확보 (없으면 고정 임시값 사용)
            const userEmail = email && email.includes('@') ? email : 'payment@lawpartner.com';

            const response = await window.PortOne.requestPayment({
                storeId: 'store-f9cf8251-06cc-4fb4-a661-e66b17586cc2',
                channelKey: 'channel-key-a008c4fe-fed4-4574-a8c1-d90a18cc8c0c',
                paymentId: `lawpartner_${new Date().getTime()}`,
                orderName: 'LawPartner 프리미엄 구독',
                totalAmount: 10000,
                currency: 'CURRENCY_KRW',
                payMethod: 'CARD',
                customer: {
                    fullName: localStorage.getItem('userNm') || '사용자',
                    email: userEmail,
                    phoneNumber: phone || '01000000000',
                },
            });

            if (response.code != null) {
                // 결제 실패
                alert(`결제 실패: ${response.message}`);
                return;
            }

            // ✅ 포트원 결제 성공 → 백엔드에 검증 요청
            const verifyResponse = await api.post('/api/payment/verify', {
                paymentId: response.paymentId,
            });

            if (verifyResponse.data.success) {
                alert('✅ 결제가 완료되었습니다!');
                onPaymentSuccess();
                onClose();
            } else {
                alert(`결제 검증 실패: ${verifyResponse.data.message}`);
            }

        } catch (error) {
            console.error('결제 에러:', error);
            alert('결제 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ height: '80vh' }}>
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">LawPartner 구독</h2>
                            <p className="text-blue-100 text-sm">프리미엄 법률 서비스를 이용하세요</p>
                        </div>
                        <button onClick={onClose} className="text-white hover:text-blue-200 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* 요금 플랜 */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">LawPartner 프리미엄</h3>
                                <p className="text-sm text-gray-600 mt-1">무제한 법률 상담 + 프리미엄 기능</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-blue-600">₩20,000</p>
                                <p className="text-sm text-gray-500">/ 월</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>무제한 변호사 상담</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>AI 법률 문서 자동 작성</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>우선 답변 서비스</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>전문 변호사 매칭</span>
                            </div>
                        </div>
                    </div>

                    {/* 🧪 테스트 안내 */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">!</div>
                            <div>
                                <p className="font-bold text-green-900 mb-1">🧪 테스트 모드</p>
                                <p className="text-sm text-green-700">
                                    테스트 결제입니다. 실제 금액(10,000원)이 결제됩니다. 테스트 후 포트원 대시보드에서 수동으로 취소해주세요.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 약관 동의 */}
                    <div className="mb-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                                <span className="font-semibold">[필수]</span> 구독 서비스 이용약관, 개인정보 처리방침에 모두 동의합니다.
                            </span>
                        </label>
                    </div>

                    {/* 결제 금액 안내 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">상품 금액</span>
                            <span className="font-semibold text-gray-900">₩20,000</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">할인</span>
                            <span className="font-semibold text-red-600">-₩10,000</span>
                        </div>
                        <div className="border-t border-gray-300 my-3"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900">최종 결제 금액</span>
                            <span className="text-2xl font-bold text-blue-600">₩10,000</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">* 테스트 결제는 자동 취소되지 않습니다. 포트원 대시보드에서 수동 취소 필요</p>
                    </div>

                    {/* 결제 버튼 */}
                    <button
                        onClick={handlePayment}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        ₩10,000 결제하기
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        포트원 V2 테스트 환경입니다.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;