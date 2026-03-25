import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../common/api/axiosConfig';

const MainPage = () => {
  const navigate = useNavigate();
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredLawyers, setFeaturedLawyers] = useState([]);

  useEffect(() => {
    api.get('/api/lawyers')
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setFeaturedLawyers(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setFeaturedLawyers([]));
  }, []);

  // 상단 검색: 카테고리 + 질문 입력 후 AI 페이지로 이동하여 자동 질의
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery?.trim() || '';
    const params = new URLSearchParams();
    if (searchCategory && searchCategory !== 'all') params.set('category', searchCategory);
    if (query) params.set('question', query);
    navigate(`/ai-chat?${params.toString()}`);
  };

  return (
    <main className="flex-grow font-sans">

      {/* 1. 히어로 섹션 */}
      <section className="law-gradient py-16 md:py-24 px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* 통합 검색 바 — 제출 시 /ai-chat?category=...&question=... 로 이동, AI 페이지에서 자동 전송 */}
          <div className="max-w-4xl mx-auto mb-20">
            <form onSubmit={handleSearchSubmit} className="bg-white rounded-2xl p-2 flex items-center search-focus transition-all duration-300 shadow-2xl">
              <div className="hidden md:flex items-center px-4 border-r border-gray-200 cursor-pointer hover:bg-gray-50 h-full rounded-l-xl transition">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="text-sm font-bold text-gray-700 whitespace-nowrap mr-2"
                >
                  <option value="all">전체 검색</option>
                  <option value="lawyer">변호사</option>
                  <option value="JP">판례</option>
                  <option value="lawterm">법률 용어</option>
                </select>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="변호사, 판례, 법률 용어를 검색해 보세요"
                className="flex-1 px-6 py-4 text-gray-700 focus:outline-none placeholder:text-gray-400 font-medium bg-transparent min-w-0"
              />
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center whitespace-nowrap shadow-lg">
                <i className="fas fa-search mr-2"></i> 검색
              </button>
            </form>
            <div className="mt-4 flex justify-center space-x-6 text-blue-200 text-xs font-medium">
              <span className="text-gray-400 font-bold">인기 검색어</span>
              <Link to="/search?q=전세사기" className="hover:text-white transition underline underline-offset-4">#전세사기대응</Link>
              <Link to="/search?q=명예훼손" className="hover:text-white transition underline underline-offset-4">#명예훼손고소</Link>
              <Link to="/search?q=이혼" className="hover:text-white transition underline underline-offset-4">#이혼재산분할</Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 좌측: 메인 카피 */}
            <div className="text-white space-y-8 text-center lg:text-left">
              <div className="inline-block px-5 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold tracking-wide">
                24시간 실시간 AI 법률가이드
              </div>
              <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                복잡한 법률 고민,<br className="hidden md:block"/>
                <span className="text-blue-400">AI 및 변호사</span>와 상담하세요
              </h2>
              <p className="text-lg text-blue-100/80 max-w-lg font-light leading-relaxed mx-auto lg:mx-0">
                생활 법률 문제 및 전문 법률 데이터를 학습한 AI가<br/>
                당신의 상황을 분석하고 최적의 변호사를 추천해줍니다.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <div className="flex items-center space-x-2 text-sm font-bold text-blue-200">
                  <i className="fas fa-check-circle text-blue-400"></i> <span>무료 상담 제공</span>
                </div>
                <div className="flex items-center space-x-2 text-sm font-bold text-blue-200">
                  <i className="fas fa-check-circle text-blue-400"></i> <span>전문 데이터 기반</span>
                </div>
                <div className="flex items-center space-x-2 text-sm font-bold text-blue-200">
                  <i className="fas fa-check-circle text-blue-400"></i> <span>변호사 연결 지원</span>
                </div>
              </div>
            </div>

            {/* 우측: 챗봇 UI 시뮬레이션 */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[2rem] blur opacity-30"></div>
              <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden relative border border-white/10">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">AI 상담</span>
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <div className="p-6 space-y-4 bg-white h-[320px] overflow-hidden relative">
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-2xl rounded-tl-none text-sm font-bold inline-block max-w-[80%]">
                    고민하시는 문제를 설명해주세요
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-900 text-white p-3 rounded-2xl rounded-tr-none text-sm font-medium inline-block max-w-[80%] shadow-md">
                      전세 사기를 당했어요. 어떤 방법이 있을까요?
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none text-sm space-y-2 border border-gray-200">
                    <p className="font-black text-blue-900 mb-1">AI 분석 결과</p>
                    <div className="h-2 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-2 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                    <p className="text-blue-600 text-xs font-bold mt-2 cursor-pointer hover:underline">추천 변호사 목록 보기...</p>
                  </div>
                  
                  {/* 입력창 가짜 UI */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-xl p-2 flex items-center shadow-lg">
                    <span className="text-gray-400 text-xs ml-3">상담할 내용을 입력하세요..</span>
                    <button className="ml-auto bg-blue-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold">전송</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 숏컷 */}
          <div className="grid md:grid-cols-2 gap-20 mt-16 max-w-7xl mx-auto">
            <Link to="/consultation" className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-between hover:scale-[1.02] transition duration-300 no-underline group">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-1">상담 게시판 가기</h3>
                <p className="text-sm text-gray-500 font-medium">다른 사람들의 사례를 확인하고 직접 질문하세요.</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 text-xl group-hover:bg-orange-500 group-hover:text-white transition">
                <i className="fas fa-clipboard-list"></i>
              </div>
            </Link>
            <Link to="/experts" className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-between hover:scale-[1.02] transition duration-300 no-underline group">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-1">전문가 찾기</h3>
                <p className="text-sm text-gray-500 font-medium">분야별 베스트 변호사에게 1:1 상담을 요청하세요.</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 text-xl group-hover:bg-blue-600 group-hover:text-white transition">
                <i className="fas fa-balance-scale"></i>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. 카테고리 섹션 */}
      <section className="max-w-7xl mx-auto py-20 px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-black text-gray-900 mb-3">어떤 도움이 필요하신가요?</h3>
          <p className="text-gray-500 font-medium">상황에 맞는 카테고리를 선택하여 상담을 시작하세요.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {[
              { icon: 'fa-gavel', label: '형사범죄', color: 'text-slate-700' },
              { icon: 'fa-car', label: '교통사고', color: 'text-red-500' },
              { icon: 'fa-home', label: '부동산', color: 'text-amber-600' },
              { icon: 'fa-key', label: '임대차', color: 'text-blue-500' },
              { icon: 'fa-hand-holding-usd', label: '손해배상', color: 'text-green-600' },
              { icon: 'fa-coins', label: '대여금', color: 'text-yellow-500' },
              { icon: 'fa-calculator', label: '미수금', color: 'text-gray-600' },
              { icon: 'fa-balance-scale', label: '채권추심', color: 'text-indigo-600' },
              { icon: 'fa-heart-broken', label: '이혼', color: 'text-rose-500' },
              { icon: 'fa-users', label: '상속/가사', color: 'text-teal-600' },
              { icon: 'fa-briefcase', label: '노동', color: 'text-blue-800' },
              { icon: 'fa-building', label: '기업', color: 'text-blue-600' },
              { icon: 'fa-copyright', label: '지식재산권', color: 'text-yellow-400' },
              { icon: 'fa-file-invoice-dollar', label: '회생/파산', color: 'text-red-600' },
              { icon: 'fa-file-alt', label: '계약서 검토', color: 'text-gray-700' },
              { icon: 'fa-ellipsis-h', label: '기타', color: 'text-gray-400' },
          ].map((cat, idx) => (
            // 실무(Jitsumu): 카테고리 클릭 시 전문가 찾기 페이지로 이동하면서 
            // 쿼리 스트링(?category=...)을 넘겨줍니다. '기타'는 전체보기를 위해 파라미터 없이 이동합니다.
            <Link 
              to={cat.label === '기타' ? '/experts' : `/experts?category=${cat.label}`} 
              key={idx} 
              className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-xl hover:border-blue-300 transition cursor-pointer group flex flex-col items-center justify-center h-40 decoration-0 no-underline"
            >
              <div className={`text-4xl mb-4 ${cat.color} group-hover:scale-110 transition duration-300`}>
                <i className={`fas ${cat.icon}`}></i>
              </div>
              <span className="font-bold text-gray-800 text-lg">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. 전문가 찾기 및 후기 섹션 */}
      <section className="bg-[#0f172a] py-20 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
          
          {/* 좌측 텍스트 영역 */}
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-block px-4 py-1 bg-blue-600/30 rounded-full border border-blue-500/50 text-blue-300 text-xs font-bold uppercase tracking-widest">
              최적의 변호사 찾기
            </div>
            <h3 className="text-4xl md:text-5xl font-black leading-tight">
              후기 및 평점으로<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">최고의 변호사</span>를<br/>
              찾아보세요.
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed font-light">
              사용자들이 입력한 후기 및 평점을 보고 자신에게 맞는 변호사를 찾아보세요.<br/>
              데이터가 증명하는 실력, 사용자들이 검증한 최고의 파트너입니다.
            </p>
            <div className="pt-4">
              <p className="text-sm text-gray-500 mb-2 font-medium">
                <i className="fas fa-check text-blue-500 mr-2"></i>광고 없는 실제 상담 후기
              </p>
              <p className="text-sm text-gray-500 font-medium">
                <i className="fas fa-check text-blue-500 mr-2"></i>나와 유사한 사례 해결 전문가 매칭
              </p>
            </div>
          </div>

          {/* 우측: 최적의 변호사 카드 (실제 평점·후기 데이터, 클릭 시 해당 변호사 상세 페이지) */}
          <div className="lg:w-1/2 w-full space-y-4">
            {featuredLawyers.length > 0 ? (
              featuredLawyers.slice(0, 3).map((lawyer) => {
                const id = lawyer.userNo ?? lawyer.user_no ?? lawyer.id;
                const name = lawyer.userNm ?? lawyer.user_nm ?? lawyer.name ?? '변호사';
                const rating = Number(lawyer.rating ?? lawyer.reviewAvg ?? 0);
                const reviewCount = Number(lawyer.reviewCount ?? lawyer.review_count ?? 0);
                const imgUrl = lawyer.imgUrl ?? lawyer.img_url ?? '';
                const specialty = lawyer.specialtyStr ?? lawyer.specialty_str ?? '일반 법률 상담';
                return (
                  <Link to={id ? `/experts/${id}` : '/experts'} key={id || lawyer.name || lawyer.userNm} className="block group">
                    <div className="bg-white rounded-3xl p-6 text-gray-900 shadow-2xl relative hover:shadow-xl hover:ring-2 hover:ring-blue-400/50 transition-all">
                      <div className="absolute top-4 right-4 text-gray-200 text-4xl opacity-20">
                        <i className="fas fa-quote-right"></i>
                      </div>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-50 shadow-md bg-slate-200 shrink-0">
                          {imgUrl ? (
                            <img src={imgUrl.startsWith('http') ? imgUrl : `${API_BASE_URL}${imgUrl}`} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-black text-slate-400">{name.substring(0, 1)}</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg font-black text-gray-900 truncate">{name} 변호사</h4>
                          <p className="text-blue-600 font-bold text-xs mb-0.5">자격증: 변호사</p>
                          <p className="text-gray-500 text-xs font-medium truncate">전문분야: {specialty}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex text-yellow-400 text-sm">
                          {[1,2,3,4,5].map((i) => <i key={i} className={`fas fa-star ${i <= Math.round(rating) ? '' : 'opacity-30'}`}></i>)}
                        </div>
                        <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
                        <span className="text-gray-400 text-xs font-medium">(후기 {reviewCount}건)</span>
                      </div>
                      <p className="text-gray-500 text-xs font-medium">실제 후기·평점 데이터 반영 · 클릭 시 상세 보기</p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="bg-white rounded-3xl p-8 text-gray-500 shadow-2xl text-center">
                <p className="font-bold">등록된 변호사가 없습니다.</p>
                <Link to="/experts" className="inline-block mt-4 text-blue-600 font-bold text-sm hover:underline">전문가 찾기</Link>
              </div>
            )}
            {featuredLawyers.length > 3 && (
              <div className="text-center">
                <Link to="/experts" className="text-blue-400 hover:text-white font-bold text-sm inline-flex items-center gap-1">
                  더 많은 변호사 보기 <i className="fas fa-chevron-right text-xs"></i>
                </Link>
              </div>
            )}
          </div>

        </div>
      </section>
    </main>
  );
};
export default MainPage