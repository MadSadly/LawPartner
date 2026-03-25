// UserManagementView.js
import React, { useState } from 'react';
import { Card, Badge } from './AdminComponents';

export default function UserManagementView({ users, setSelectedItem, setShowModal, filterRole, setFilterRole }) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const filteredUsers = normalizedKeyword
    ? users.filter((user) =>
        (user.userId || '').toLowerCase().includes(normalizedKeyword) ||
        (user.userNm || '').toLowerCase().includes(normalizedKeyword) ||
        (user.nickNm || '').toLowerCase().includes(normalizedKeyword)
      )
    : users;

  return (
    <Card title="일반 회원 관리 (전체 명부)">
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={() => setFilterRole('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterRole === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          전체
        </button>
        <button
          type="button"
          onClick={() => setFilterRole('USER')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterRole === 'USER' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          일반회원
        </button>
        <button
          type="button"
          onClick={() => setFilterRole('LAWYER')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterRole === 'LAWYER' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          변호사
        </button>
        <button
          type="button"
          onClick={() => setFilterRole('ADMIN')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterRole === 'ADMIN' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          관리자
        </button>
      </div>
      <div className="mt-3">
        <input
          type="text"
          placeholder="아이디 / 이름 / 닉네임 검색"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
        />
      </div>
      <div className="overflow-x-auto mt-4 w-full">
        <table className="w-full text-left table-auto whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-4 py-3 w-16">No</th>
              <th className="px-4 py-3">아이디</th>
              <th className="px-4 py-3">이름 (닉네임)</th>
              <th className="px-4 py-3">가입일</th>
              <th className="px-4 py-3">권한</th>
              <th className="px-4 py-3">상태</th>
              {/* 🗑️ '관리' 헤더 제거됨 */}
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr 
                  key={user.userNo} 
                  // [핵심] 더블 클릭으로 상세 모달 열기
                  onDoubleClick={() => {
                    setSelectedItem(user);
                    setShowModal(true);
                  }}
                  // UX: 행 전체에 인터랙션 강조
                  className="border-b border-slate-50 hover:bg-blue-50/70 transition-colors cursor-pointer select-none group"
                  title="더블 클릭 시 상세 정보 수정 가능"
                >
                  <td className="px-4 py-4 text-slate-400 font-mono group-hover:text-blue-500 transition-colors">
                    {user.userNo}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-700">{user.userId}</td>
                  <td className="px-4 py-4">
                    {user.userNm} <span className="text-xs text-slate-400">({user.nickNm || '-'})</span>
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    {new Date(user.joinDt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    {user.roleCode === 'ROLE_SUPER_ADMIN' ? <Badge variant="amber">슈퍼 관리자</Badge> :
                     user.roleCode === 'ROLE_ADMIN' ? <Badge variant="blue">관리자</Badge> :
                     user.roleCode === 'ROLE_OPERATOR' ? <Badge variant="green">운영자</Badge> :
                     user.roleCode === 'ROLE_LAWYER' ? <Badge variant="purple">변호사</Badge> :
                     user.roleCode === 'ROLE_ASSOCIATE' ? <Badge variant="amber">준회원</Badge> :
                     <Badge variant="gray">일반 회원</Badge>}
                  </td>
                  <td className="px-4 py-4">
                    {user.statusCode === 'S03' ? <Badge variant="red">정지</Badge> :
                     user.statusCode === 'S02' ? <Badge variant="amber">승인 대기</Badge> :
                     user.statusCode === 'S99' ? <Badge variant="orange">탈퇴</Badge> :
                     <Badge variant="green">활동중</Badge>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400 font-bold">
                  조회된 회원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 하단 안내 문구 강조 */}
      <div className="mt-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs text-slate-400 italic">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
          회원 목록을 <strong>더블 클릭</strong>하여 상세 정보 관리 및 권한 설정을 할 수 있습니다.
        </div>
        <div className="text-[10px] text-slate-300 font-medium">
          Total: {filteredUsers.length} Users
        </div>
      </div>
    </Card>
  );
}