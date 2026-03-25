import React from 'react';
import { Ban } from 'lucide-react';
import { Card } from './AdminComponents';

export default function BlacklistView({ 
  blacklist, 
  newIp, 
  setNewIp, 
  newReason, 
  setNewReason, 
  handleAddBlacklist, 
  handleUnblock 
}) {
  return (
    <Card title="보안 위협 IP 관리 (블랙리스트)">
      <div className="space-y-6 mt-2">
        {/* 💥 [수동 차단 폼 영역] - 원본 스타일 그대로 */}
        <form onSubmit={handleAddBlacklist} className="flex flex-wrap gap-3 bg-rose-50 p-5 rounded-xl border border-rose-100 items-end shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black text-rose-700 mb-1.5 ml-1">차단할 IP 주소</label>
            <input 
              type="text" 
              placeholder="예: 192.168.0.123" 
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm transition-shadow"
            />
          </div>
          <div className="flex-[2] min-w-[300px]">
            <label className="block text-xs font-black text-rose-700 mb-1.5 ml-1">차단 사유 (필수)</label>
            <input 
              type="text" 
              placeholder="비정상적인 트래픽 감지, DDoS 공격 의심 등" 
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm transition-shadow"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2 h-[38px] bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Ban size={16} /> IP 원천 차단
          </button>
        </form>

        {/* 📋 [블랙리스트 목록 테이블 영역] - 원본 구조 그대로 */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="px-5 py-3 font-bold">차단된 IP</th>
                <th className="px-5 py-3 font-bold">차단 사유</th>
                <th className="px-5 py-3 font-bold text-center">처리자 (번호)</th>
                <th className="px-5 py-3 font-bold">차단 일시</th>
                <th className="px-5 py-3 font-bold text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {blacklist.length > 0 ? (
                blacklist.map((item) => (
                  <tr key={item.ipAddress} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono font-black text-rose-600">
                      {item.ipAddress}
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-bold">
                      {item.reason}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-black">
                        No.{item.adminNo}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs font-medium">
                      {new Date(item.blockDt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button 
                        onClick={() => handleUnblock(item.ipAddress)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                      >
                        정상 복구
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-400 font-bold">
                    차단된 IP가 없습니다. 보안 상태가 평화롭습니다! 🕊️
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}