import React from 'react';
import { Terminal, FileText, Search, RotateCcw } from 'lucide-react';
import { Card } from './AdminComponents';

export default function AuditLogView({ 
  logs, 
  searchParams, 
  setSearchParams, 
  handleSearch, 
  handleReset, 
  handleKeyDown, 
  handleExcelDownload, 
  hasPermission,
  currentPage,
  totalPages,
  setCurrentPage
}) {
  return (
    <Card>
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-end">
           <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
             <Terminal size={20} className="text-blue-600" /> 통합 로그 검색 시스템
           </h3>
           {hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']) && (
              <button onClick={handleExcelDownload} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm">
                <FileText size={16} /> 결과 엑셀 저장
              </button>
           )}
        </div>
        
        {/* 🔍 검색 컨트롤 패널 - 원본 코드 그대로 */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">기간</label>
            <div className="flex gap-2">
              <input type="date" className="px-2 py-2 border rounded-lg text-sm" value={searchParams.startDate} onChange={(e) => setSearchParams({...searchParams, startDate: e.target.value})} />
              <input type="date" className="px-2 py-2 border rounded-lg text-sm" value={searchParams.endDate} onChange={(e) => setSearchParams({...searchParams, endDate: e.target.value})} />
            </div>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">조건</label>
             <div className="flex gap-2">
              <select className="px-2 py-2 border rounded-lg text-sm" value={searchParams.keywordType} onChange={(e) => setSearchParams({...searchParams, keywordType: e.target.value})}>
                <option value="IP">IP 주소</option>
                <option value="TRACE_ID">Trace ID</option>
                <option value="URI">요청 URI</option>
                <option value="USER_NO">회원 번호</option>
              </select>
              <input type="text" placeholder="검색어" className="px-3 py-2 border rounded-lg text-sm w-32" value={searchParams.keyword} onChange={(e) => setSearchParams({...searchParams, keyword: e.target.value})} onKeyDown={handleKeyDown} />
             </div>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">상태</label>
             <select className="px-2 py-2 border rounded-lg text-sm" value={searchParams.statusType} onChange={(e) => setSearchParams({...searchParams, statusType: e.target.value})}>
                <option value="ALL">전체</option>
                <option value="ERROR">에러(4xx~)</option>
             </select>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 transition-colors">
               <Search size={16} /> 검색
            </button>
            <button onClick={handleReset} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-300 flex items-center gap-2 transition-colors" title="조건 초기화">
               <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm font-mono">
          <thead className="bg-slate-800 text-slate-300 text-left">
            <tr>
              <th className="px-4 py-3">Trace ID</th>
              <th className="px-4 py-3">시간</th>
              <th className="px-4 py-3 text-center">발생자</th>
              <th className="px-4 py-3">IP / URI</th>
              <th className="px-4 py-3 text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => {
              const isError = log.statusCode >= 400;
              return (
                <tr key={log.logNo} className={`border-b border-slate-50 hover:bg-slate-100 ${isError ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-3 text-xs text-slate-400" title={log.userAgent}>{log.traceId}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(log.regDt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-xs">
                     {log.userNo ? <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">No.{log.userNo}</span> : <span className="text-slate-400">비회원</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-bold text-slate-700">{log.reqIp}</div>
                    <div className={`truncate max-w-xs ${isError ? 'text-red-600' : 'text-blue-600'}`}>{log.reqUri}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                     <span className={`px-2 py-1 rounded text-[10px] font-black border ${isError ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`} title={log.errorMsg}>
                       {log.statusCode}
                     </span>
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && <tr><td colSpan="5" className="py-10 text-center text-slate-400">검색된 로그가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage <= 0}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          이전
        </button>
        <span className="text-xs font-bold text-slate-500">
          {currentPage + 1} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          다음
        </button>
      </div>
    </Card>
  );
}