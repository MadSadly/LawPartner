import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card, Badge } from './AdminComponents';

export default function ContentSecurityView({ contentBoards, handleToggleBlind }) {
  return (
    <Card title="게시판 콘텐츠 보안 제어 (블라인드 관리)">
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-bold">게시글 번호</th>
              <th className="px-4 py-3 font-bold">제목</th>
              <th className="px-4 py-3 font-bold">작성자 번호</th>
              <th className="px-4 py-3 font-bold text-center">상태</th>
              <th className="px-4 py-3 font-bold text-center">제어</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contentBoards.length > 0 ? contentBoards.map(board => (
              <tr key={board.boardNo} className={`transition-colors ${board.blindYn === 'Y' ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
                <td className="px-4 py-3 text-slate-500 font-mono">No.{board.boardNo}</td>
                <td className="px-4 py-3 font-bold text-slate-700 max-w-xs truncate">{board.title}</td>
                <td className="px-4 py-3 text-blue-600 font-mono font-bold">User {board.writerNo}</td>
                <td className="px-4 py-3 text-center">
                  {board.blindYn === 'Y' ? (
                    <Badge variant="red">블라인드됨</Badge>
                  ) : (
                    <Badge variant="green">정상 게시</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button
                    onClick={() => handleToggleBlind(board.boardNo, board.blindYn)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      board.blindYn === 'Y'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    }`}
                  >
                    {board.blindYn === 'Y' ? <><Eye size={14}/> 정상 복구</> : <><EyeOff size={14}/> 강제 블라인드</>}
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="py-10 text-center text-slate-400 font-bold">조회된 게시글이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}