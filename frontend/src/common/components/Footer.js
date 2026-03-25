import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        // py-6 -> py-4 (전체 높이 축소)
        <footer className="bg-[#0f172a] text-white py-4 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">

                {/* 1. 사이트 명 & 로고 (여백 mb-4 -> mb-1로 축소) */}
                <div className="mb-1 flex flex-col items-center">
                    <Link to="/" className="flex items-center gap-2 group decoration-0">
                        {/* 폰트 크기 살짝 조정 text-2xl -> text-xl */}
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter group-hover:opacity-80 transition whitespace-nowrap">
                            LAW PARTNER
                        </h2>
                    </Link>
                    {/* 서브 텍스트 크기 축소 및 여백 제거 */}
                    <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase -mt-0.5">
                        AI & Professional Legal Service
                    </p>
                </div>

                {/* 2. 법적 고지 (Disclaimer) - ★ 높이 줄이기 핵심 ★ */}
                {/* 두꺼운 박스(p-4)를 제거하고, 얇은 선과 텍스트 위주로 변경 */}
                <div className="w-full max-w-2xl border-y border-slate-800/50 py-2 my-2">
                    <p className="text-[12px] text-slate-500 leading-tight font-light break-keep">
                        본 서비스의 모든 상담 내용은 참고용이며 법적 효력을 갖지 않습니다. 
                        정확한 판단을 위해서는 전문가와의 대면 상담을 권장합니다.
                    </p>
                </div>

                {/* 3. Copyright & Links - (세로 배치 -> 가로 통합 배치 시도) */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4 mt-1">
                    {/* 링크들 */}
                    <div className="flex gap-4 text-[10px] text-slate-400 font-bold">
                        <Link to="/terms" className="hover:text-white transition decoration-0">이용약관</Link>
                        <span className="text-slate-700">|</span>
                        <Link to="/privacy" className="hover:text-white transition decoration-0">개인정보처리방침</Link>
                        <span className="text-slate-700">|</span>
                        <Link to="/contact" className="hover:text-white transition decoration-0">제휴문의</Link>
                    </div>

                    {/* 저작권 표기 (모바일엔 줄바꿈, PC엔 옆으로 붙이기 가능하지만 깔끔하게 아래로 둠) */}
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                        Copyright © LAW PARTNER. All rights reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
};

export default Footer;