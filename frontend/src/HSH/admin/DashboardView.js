// DashboardView.js
import React, { useMemo } from 'react';
import { Users, UserCheck, ShieldCheck, Eye, ShieldAlert, Activity, Download, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, StatCard } from './AdminComponents';

export default function DashboardView({ 
  summary, 
  dailyStats, 
  period, 
  setPeriod, 
  chartRef, 
  handleDownloadChart, 
  threatLogs, 
  setActiveMenu,
  hasPermission 
}) {
  // 📈 차트 데이터 가공 로직 (무결성을 위해 컴포넌트 내부에서 처리)
  const chartData = useMemo(() => { 
    if (!dailyStats || dailyStats.length === 0) return [];
    
    let processedData = dailyStats.map(stat => ({
      name: stat.date.substring(5),
      visitors: stat.visitors !== undefined ? stat.visitors : (stat.count || 0),
      users: stat.users || 0 
    }));

    if (period === 2 && processedData.length === 1) {
      const todayStr = dailyStats[0].date;
      const todayObj = new Date(todayStr);
      todayObj.setDate(todayObj.getDate() - 1);
      const dummyYesterday = `${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
      processedData = [{ name: dummyYesterday, visitors: 0, users: 0 }, processedData[0]];
    }
    return processedData;
  }, [dailyStats, period]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 상단 통계 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="총 회원 수" value={summary.totalUsers || 0} growth={`${summary.totalUsersGrowth || '+0%'} 전일 대비`} icon={<Users className="text-blue-600" />} />
        <StatCard title="오늘 신규 가입" value={summary.newUsersToday || 0} growth={`${summary.newUsersGrowth || '+0%'} 전일 대비`} icon={<UserCheck className="text-emerald-600" />} color="emerald" />
        <StatCard title="승인 대기 (변호사)" value={summary.pendingLawyers || 0} growth="확인 필요" icon={<ShieldCheck className="text-amber-600" />} color="amber" />
        <StatCard title="오늘 접속자 수" value={summary.todayVisitors || 0} growth={`${summary.visitorsGrowth || '+0%'} 전일 대비`} icon={<Eye className="text-purple-600" />} color="purple" />
        <StatCard title="오늘의 보안 위협" value={summary.securityThreats || 0} growth={`${summary.threatsGrowth || '0%'} 전일 대비`} icon={<ShieldAlert className="text-red-600" />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 추이 그래프 카드 */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-blue-600"/> 가입자 및 방문자 추이
            </h3>
            <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
              {[{ label: '오늘', v: 2 }, { label: '1주일', v: 7 }, { label: '1개월', v: 30 }].map((opt) => (
                <button key={opt.v} onClick={() => setPeriod(opt.v)} className={`px-3 py-1.5 rounded-md transition-all ${period === opt.v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full">
            <div className="h-64 w-full bg-white" ref={chartRef}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} width={30} />
                   <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                   <Area type="monotone" dataKey="users" name="신규 가입" stroke="#2563eb" fill="url(#colorUsers)" strokeWidth={3} fillOpacity={1} />
                   <Area type="monotone" dataKey="visitors" name="방문자" stroke="#8b5cf6" fill="url(#colorVisitors)" strokeWidth={3} fillOpacity={1} />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center mt-2 px-2">
              <div className="flex items-center gap-4 text-xs font-bold text-[#64748b]">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span> 신규 가입</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span> 방문자</div>
              </div>
              {hasPermission(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERATOR']) && (
                <button onClick={handleDownloadChart} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors text-xs border border-blue-100 shadow-sm">
                  <Download size={14} /> 차트 캡처
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* 최근 보안 위협 로그 카드 */}
        <Card title="최근 보안 위협 로그 (최신 5건)">
          <div className="space-y-4">
            {threatLogs && threatLogs.length > 0 ? (
              threatLogs.map(log => (
                <div key={log.logNo} className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full text-red-600"><AlertTriangle size={18} /></div>
                    <div>
                      <div className="text-sm font-bold text-red-900">{log.reqIp}</div>
                      <div className="text-xs text-red-700 truncate w-48">{log.reqUri}</div>
                    </div>
                  </div>
                  <div className="text-xs text-red-500 font-mono font-bold">{log.statusCode}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 font-bold">감지된 보안 위협이 없습니다.</div>
            )}
            <button onClick={() => setActiveMenu('audit-log')} className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
              전체 로그 보러가기
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}