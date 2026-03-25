// AdminComponents.js
import React from 'react';

// =================================================================
// 🎨 공통 UI 컴포넌트
// =================================================================

export const Card = ({ title, children, className = "", rightElement = null }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <span className="font-bold text-slate-800">{title}</span>
        {rightElement && <div>{rightElement}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// 🏷️ 상태나 권한을 표시하는 배지 컴포넌트
export const Badge = ({ variant = "blue", children }) => {
  const styles = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-emerald-100 text-emerald-700",
    gray: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-700",
    purple: "bg-indigo-100 text-indigo-700",
    orange: "bg-orange-100 text-orange-700"
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${styles[variant]}`}>{children}</span>;
};

// 📊 통계 수치를 강조해서 보여주는 카드 컴포넌트
export const StatCard = ({ title, value, growth, icon, color = "blue" }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600"
  };

  const isNegative = growth && growth.startsWith('-');
  let growthClass = "text-slate-400";
  
  if (title === "오늘의 보안 위협") {
    growthClass = isNegative ? 'text-emerald-500' : 'text-rose-500';
  } else {
    growthClass = isNegative ? 'text-rose-500' : 'text-emerald-500';
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-bold text-slate-400 mb-2">{title}</p>
        <div className="text-3xl font-black text-slate-800">
          {typeof value === 'number' ? value.toLocaleString() : value} 
        </div>
        <div className={`mt-2 text-xs font-bold ${growthClass}`}>
          {growth}
        </div>
      </div>
      <div className={`p-3 rounded-2xl ${colorMap[color] || colorMap.blue}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
    </div>
  );
};

// 🛠️ 역할 코드를 한글 명칭으로 변환하는 유틸리티
export const getRoleDisplayName = (roleCode) => {
  switch (roleCode) {
    case 'ROLE_SUPER_ADMIN': return '슈퍼 관리자';
    case 'ROLE_ADMIN': return '일반 관리자';
    case 'ROLE_OPERATOR': return '운영자';
    case 'ROLE_LAWYER': return '변호사';
    default: return '관리자';
  }
};

// AdminComponents.js 맨 아래에 추가

// 사이드바 그룹 제목 컴포넌트
export function MenuSection({ title, isOpen, highlight = false }) {
  if (!isOpen) return <div className="h-px bg-slate-800 my-4" />;
  return (
    <div className={`px-4 pt-6 pb-2 text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-blue-400' : 'text-slate-600'}`}>
      {title}
    </div>
  );
}

// 사이드바 개별 메뉴 버튼 컴포넌트
export function MenuItem({ icon, label, active, onClick, isOpen }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-bold' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <div className={active ? 'scale-110 duration-200' : ''}>{icon}</div>
      {isOpen && <span className="text-sm">{label}</span>}
      {active && isOpen && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );
}