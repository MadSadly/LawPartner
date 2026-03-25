// LawyerApprovalView.js
import React from 'react';
import { Users } from 'lucide-react';
import { Card } from './AdminComponents';

export default function LawyerApprovalView({ users, handleUserStatusChange, handleViewLicense }) {
  const applicants = users.filter(u => u.statusCode === 'S02' || u.roleCode === 'ROLE_ASSOCIATE');

  return (
    <Card title="변호사 자격 승인 처리 (워크플로우)">
      <div className="space-y-4 mt-4">
        {applicants.map(user => (
          <div key={user.userNo} className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-300 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Users size={24} />
              </div>
              <div>
                <div className="font-bold text-slate-800">{user.userNm} (승인 대기자)</div>
                <div className="text-xs text-slate-500">
                  ID: {user.userId} | 가입일: {new Date(user.joinDt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewLicense && handleViewLicense(user.userNo)}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
              >
                자격증 확인하기
              </button>
              <button 
                onClick={() => handleUserStatusChange(user.userId, 'S01')} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
              >
                자격 검증 및 승인 (S01)
              </button>
            </div>
          </div>
        ))}
        {applicants.length === 0 && (
          <div className="text-center py-8 text-slate-400 font-bold">
            대기 중인 승인 요청이 없습니다.
          </div>
        )}
      </div>
    </Card>
  );
}