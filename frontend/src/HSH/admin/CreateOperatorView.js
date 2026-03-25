import React, { useState } from 'react';
import { Card, Badge } from './AdminComponents';
import { 
  UserPlus, 
  User, 
  Phone, 
  Mail, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function CreateOperatorView({ handleCreateOperator }) {
  const [form, setForm] = useState({
    userId: '',
    userNm: '',
    phone: '',
    email: '',
    reason: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const input = e.target;
    const cursorPos = input.selectionStart ?? 0;
    const oldVal = input.value;
    const oldHyphens = (oldVal.slice(0, cursorPos).match(/-/g) || []).length;

    let val = oldVal.replace(/[^0-9]/g, '');
    if (val.length > 11) val = val.slice(0, 11);

    let formatted = val;
    if (val.length > 3 && val.length <= 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (val.length > 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7)}`;
    }

    if (formatted.length > 13) {
      formatted = formatted.slice(0, 13);
    }

    const newHyphens = (formatted.slice(0, cursorPos).match(/-/g) || []).length;
    const newPos = Math.min(formatted.length, cursorPos + (newHyphens - oldHyphens));

    setForm((prev) => ({ ...prev, phone: formatted }));

    requestAnimationFrame(() => {
      input.setSelectionRange(newPos, newPos);
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!handleCreateOperator) return;

    if (!form.userId || !form.userNm || !form.phone || !form.email || !form.reason) {
      alert('모든 필드를 입력해주세요. (생성 사유 포함)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return alert("올바른 이메일 형식이 아닙니다.");
    }
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(form.phone)) {
      return alert("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
    }

    setSubmitting(true);
    try {
      await handleCreateOperator(form);
    } catch (error) {
      toast.error("운영자 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 공통 스타일 정의
  const inputWrapperClass = "relative group";
  const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors";
  const inputClass = 
    "pl-10 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all";
  const labelClass = "block text-xs font-bold text-slate-600 mb-1.5 ml-1 uppercase tracking-wider";

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card 
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <span>관리자 운영 계정 생성</span>
          </div>
        }
      >
        {/* 상단 안내 문구 */}
        <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-amber-900 text-sm">보안 주의사항</span>
              <Badge variant="amber">Super Admin Only</Badge>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              새로운 운영자 계정은 시스템의 민감한 데이터에 접근할 수 있습니다. 
              반드시 신원이 확인된 담당자에게만 계정을 발급하시기 바랍니다.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* 섹션 1: 계정 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
              <h3 className="font-bold text-slate-800">계정 보안 정보</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={inputWrapperClass}>
                <label className={labelClass} htmlFor="userId">아이디</label>
                <div className="relative">
                  <User className={iconClass} />
                  <input
                    id="userId"
                    name="userId"
                    type="text"
                    required
                    className={inputClass}
                    placeholder="접속용 아이디 입력"
                    value={form.userId}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={inputWrapperClass}>
                <label className={labelClass} htmlFor="reason">생성 사유</label>
                <div className="relative">
                  <ShieldAlert className={iconClass} />
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    required
                    className={inputClass + ' resize-none min-h-[96px]'}
                    placeholder="해당 운영자 계정을 생성하는 사유를 입력해주세요."
                    value={form.reason}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 섹션 2: 담당자 상세 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
              <h3 className="font-bold text-slate-800">담당자 인적 사항</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={inputWrapperClass}>
                  <label className={labelClass} htmlFor="userNm">성명</label>
                  <div className="relative">
                    <User className={iconClass} />
                    <input
                      id="userNm"
                      name="userNm"
                      type="text"
                      required
                      className={inputClass}
                      placeholder="담당자 실명"
                      value={form.userNm}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={inputWrapperClass}>
                  <label className={labelClass} htmlFor="phone">연락처</label>
                  <div className="relative">
                    <Phone className={iconClass} />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className={inputClass}
                      placeholder="010-0000-0000"
                      value={form.phone}
                      onChange={handlePhoneChange}
                    />
                  </div>
                </div>
              </div>

              <div className={inputWrapperClass}>
                <label className={labelClass} htmlFor="email">이메일 주소</label>
                <div className="relative">
                  <Mail className={iconClass} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={inputClass}
                    placeholder="official@company.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 하단 액션 버튼 */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              * 모든 항목은 필수 입력 사항입니다.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="group relative inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 disabled:bg-slate-300 disabled:active:scale-100 shadow-lg shadow-blue-500/20 transition-all cursor-pointer overflow-hidden"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <span>관리자 계정 생성하기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
      {/* 도움말 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2"> 
        {[
          { title: "권한 관리", desc: "생성 후 권한 그룹 설정 가능" },
          { title: "로그 기록", desc: "모든 생성 이력은 감사 로그에 기록" },
          { title: "계정 활성화", desc: "이메일 인증 후 사용 가능" }
        ].map((item, idx) => (
          <div key={idx} className="p-4 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl flex flex-col gap-1">
            <span className="text-[10px] font-black text-blue-600 uppercase">{item.title}</span>
            <span className="text-xs text-slate-500 font-medium">{item.desc}</span>
          </div>
        ))}
      </div>

    </div>
  );
}