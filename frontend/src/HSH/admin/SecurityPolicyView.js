import React from 'react';
import { ShieldAlert, Plus, X } from 'lucide-react';
import { Card } from './AdminComponents';

export default function SecurityPolicyView({ 
  bannedWords, 
  newWord, 
  setNewWord, 
  handleAddBannedWord, 
  handleDeleteBannedWord 
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card title="시스템 금지어 필터링 관리" rightElement={<ShieldAlert className="text-rose-500" size={20} />}>
        <p className="text-sm text-slate-500 mb-6">
          게시판 및 채팅에서 필터링될 욕설, 비방, 스팸 단어를 관리합니다. 등록된 단어는 시스템 전반에 즉시 적용됩니다.
        </p>

        {/* 금지어 입력 폼 */}
        <form onSubmit={handleAddBannedWord} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="추가할 금지어를 입력하세요 (예: 도박, 불법)"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm font-bold"
          />
          <button type="submit" className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
            <Plus size={16} /> 금지어 등록
          </button>
        </form>

        {/* 금지어 태그 목록 */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h4 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">
            현재 등록된 금지어 목록 ({bannedWords.length}개)
          </h4>
          <div className="flex flex-wrap gap-2">
            {bannedWords.length > 0 ? bannedWords.map(item => (
              <span key={item.wordNo} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-sm font-bold shadow-sm group hover:border-rose-400 transition-colors">
                {item.word}
                <button onClick={() => handleDeleteBannedWord(item.wordNo)} className="text-rose-300 hover:text-rose-600 transition-colors p-0.5 rounded-md hover:bg-rose-50">
                  <X size={14} />
                </button>
              </span>
            )) : (
              <span className="text-sm text-slate-400 font-bold">등록된 금지어가 없습니다.</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}