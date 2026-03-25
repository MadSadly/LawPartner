import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { API_BASE_URL, getAccessToken } from "../common/api/axiosConfig";
import {
    Sparkles,
    Gavel,
    Car,
    Home,
    Key,
    HandCoins,
    CircleDollarSign,
    Calculator,
    HeartCrack,
    Briefcase,
    Copyright,
    TrendingDown,
    FileText,
    MoreHorizontal,
    Search,
    Medal,
    CheckCircle,
    Star,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

const PAGE_SIZE = 6;

/** ✅ 카테고리 설정 */
const CATEGORY_GRID = [
    { key: "ALL", label: "전체보기", icon: <Sparkles size={20} /> },
    { key: "형사범죄", label: "형사범죄", icon: <Gavel size={20} /> },
    { key: "교통사고", label: "교통사고", icon: <Car size={20} /> },
    { key: "부동산", label: "부동산", icon: <Home size={20} /> },
    { key: "임대차", label: "임대차", icon: <Key size={20} /> },
    { key: "손해배상", label: "손해배상", icon: <HandCoins size={20} /> },
    { key: "대여금", label: "대여금", icon: <CircleDollarSign size={20} /> },
    { key: "미수금", label: "미수금", icon: <Calculator size={20} /> },
    { key: "채권추심", label: "채권추심", icon: <Calculator size={20} /> },
    { key: "이혼", label: "이혼", icon: <HeartCrack size={20} /> },
    { key: "상속/가사", label: "상속/가사", icon: <HeartCrack size={20} /> },
    { key: "노동", label: "노동", icon: <Briefcase size={20} /> },
    { key: "기업", label: "기업", icon: <Briefcase size={20} /> },
    { key: "지식재산권", label: "지식재산권", icon: <Copyright size={20} /> },
    { key: "회생/파산", label: "회생/파산", icon: <TrendingDown size={20} /> },
    { key: "계약서 검토", label: "계약서 검토", icon: <FileText size={20} /> },
    { key: "기타", label: "기타", icon: <MoreHorizontal size={20} /> },
];

const CATEGORY_MAP = {
    형사범죄: ["형사", "성범죄", "마약", "폭행", "사기", "보이스피싱", "구속영장", "형사합의", "명예훼손", "해킹"],
    교통사고: ["교통사고", "음주운전", "보험", "합의", "휴업손해", "벌점", "진단서"],
    부동산: ["부동산", "매매", "재개발", "분양", "등기", "명도"],
    임대차: ["임대차", "전세", "월세"],
    손해배상: ["손해배상", "위자료", "과실"],
    대여금: ["대여금", "보증", "채무불이행", "대출"],
    미수금: ["미수금"],
    채권추심: ["채권추심", "가압류", "가처분"],
    이혼: ["이혼", "재산분할", "양육권", "협의이혼"],
    "상속/가사": ["상속", "유류분", "상속세", "가사"],
    노동: ["노동", "부당해고", "임금체불", "산재", "노동위원회", "취업규칙", "직장내괴롭힘"],
    기업: ["기업", "법인", "스타트업", "주주총회"],
    지식재산권: ["특허", "저작권", "상표"],
    "회생/파산": ["회생", "파산", "개인회생"],
    "계약서 검토": ["계약서", "계약검토", "합의서", "내용증명"],
    기타: []
};

const SORTS = [
    { key: "RECOMMEND", label: "추천순" },
    { key: "RATING", label: "평점순" },
    { key: "REVIEWS", label: "후기순" },
    { key: "SPECIALTIES", label: "전문분야순" },
];

/** ✅ 유틸리티 함수 */
function containsKoreanInsensitive(haystack, needle) {
    if (!needle) return true;
    return (haystack || "").toLowerCase().includes(needle.toLowerCase());
}

function recommendScore(expert) {
    const rating = Number(expert.rating || 0);
    const reviews = Number(expert.reviewCount || 0);
    const specialtiesCount = Number(expert.specialtiesCount || 0);

    return rating * 60 + reviews * 2 + specialtiesCount * 8;
}

function splitTags(specialtyStr) {
    if (!specialtyStr) return [];
    return String(specialtyStr)
        .split(/[,/|]/g)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8);
}

function inferMainCategory(tags) {
    const tagSet = new Set((tags || []).map((t) => String(t)));
    for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
        if (cat === "기타") continue;
        const hit = (keywords || []).some((kw) => {
            for (const t of tagSet) {
                if (t.includes(kw) || kw.includes(t)) return true;
            }
            return false;
        });
        if (hit) return cat;
    }
    return "기타";
}

function safeImage(url) {
    const u = (url || "").trim();
    if (!u) return "";
    const base = API_BASE_URL;
    if (u.startsWith("/")) return `${base}${u}`;
    return u;
}

function pickArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    const candidates = [payload.data, payload.result, payload.list, payload.content, payload.items];
    for (const c of candidates) {
        if (Array.isArray(c)) return c;
    }
    return [];
}

function getVisibleTags(tags) {
    const safeTags = Array.isArray(tags) ? tags : [];
    const visibleTags = safeTags.slice(0, 3);
    const hiddenCount = Math.max(0, safeTags.length - 3);
    return { visibleTags, hiddenCount };
}

function getInitial(name) {
    const safeName = String(name || "").trim();
    if (!safeName) return "법";
    return safeName.charAt(0);
}

function Avatar({ image, name, size = "md", rounded = "xl", clickable = false, onClick }) {
    const [imgError, setImgError] = useState(false);

    const sizeClass =
        size === "lg"
            ? "w-20 h-20 text-2xl"
            : "w-16 h-16 text-xl";

    const roundedClass =
        rounded === "2xl"
            ? "rounded-2xl"
            : "rounded-xl";

    const canShowImage = !!image && !imgError;

    if (canShowImage) {
        return (
            <div
                className={`${sizeClass} ${roundedClass} overflow-hidden shadow-md flex-shrink-0 ${
                    clickable ? "cursor-pointer" : ""
                }`}
                onClick={onClick}
            >
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    return (
        <div
            className={`${sizeClass} ${roundedClass} flex items-center justify-center flex-shrink-0 ${
                clickable ? "cursor-pointer" : ""
            } bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-black border border-slate-200 shadow-sm select-none`}
            onClick={onClick}
            title={name}
        >
            {getInitial(name)}
        </div>
    );
}

export default function ExpertsPage() {
    const recommendRef = useRef(null);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialCategory = searchParams.get("category") || "ALL";
    const initialRole = searchParams.get("role") || "LAWYER";
    const initialPage = Math.max(1, Number(searchParams.get("page") || 1));

    const [selectedRole] = useState(initialRole);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [keyword, setKeyword] = useState(searchParams.get("q") || "");
    const [sortKey, setSortKey] = useState(searchParams.get("sort") || "RECOMMEND");
    const [currentPage, setCurrentPage] = useState(initialPage);

    const [experts, setExperts] = useState([]);
    const [loadMsg, setLoadMsg] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const isLoggedIn = () => !!getAccessToken();

    const syncParams = (next) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(next).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") params.delete(k);
            else params.set(k, String(v));
        });
        setSearchParams(params, { replace: true });
    };

    const goToPage = (page) => {
        setCurrentPage(page);
        syncParams({ page });
        recommendRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    useEffect(() => {
        const fetchLawyers = async () => {
            setIsLoading(true);
            try {
                const res = await api.get("/api/lawyers");
                const list = pickArray(res.data);

                if (!Array.isArray(list) || list.length === 0) {
                    setExperts([]);
                    setLoadMsg("조회된 전문가 데이터가 없습니다.");
                    return;
                }

                const mapped = list.map((x) => {
                    const userNo = x.userNo ?? x.user_no ?? x.USER_NO;
                    const name = x.name ?? x.userNm ?? x.user_nm ?? x.USER_NM;
                    const specialtyStr = x.specialtyStr ?? x.specialty_str ?? x.SPECIALTY_STR;
                    const imgUrl = x.imgUrl ?? x.img_url ?? x.IMG_URL;
                    const rating = Number(x.rating || 0);
                    const reviewCount = Number(x.reviewCount || 0);

                    const tags = splitTags(specialtyStr);
                    const mainCategory = inferMainCategory(tags);

                    return {
                        id: userNo,
                        role: "LAWYER",
                        name: name || "변호사",
                        mainCategory,
                        tags,
                        specialtiesCount: tags.length,
                        rating,
                        reviewCount,
                        image: safeImage(imgUrl),
                    };
                });

                setExperts(mapped);
                console.log("=== RAW API DATA ===", res.data);
                console.log("=== MAPPED DATA ===", mapped);
            } catch (e) {
                setLoadMsg("데이터를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLawyers();
    }, []);

    const filtered = useMemo(() => {
        const roleFiltered = experts.filter((e) => e.role === selectedRole);

        const categoryFiltered =
            selectedCategory === "ALL"
                ? roleFiltered
                : roleFiltered.filter((e) => {
                    const keywords = CATEGORY_MAP[selectedCategory] || [];
                    return (
                        e.mainCategory === selectedCategory ||
                        e.tags?.some((tag) =>
                            keywords.some((kw) => String(tag).includes(kw))
                        )
                    );
                });

        const q = keyword.trim();
        if (!q) return categoryFiltered;

        return categoryFiltered.filter((e) => {
            const hay = [
                e.name,
                e.mainCategory,
                (e.tags || []).join(" "),
                `${e.specialtiesCount || 0}개`,
            ].join(" ");
            return containsKoreanInsensitive(hay, q);
        });
    }, [experts, selectedRole, selectedCategory, keyword]);

    const sorted = useMemo(() => {
        const arr = [...filtered];

        if (sortKey === "RATING") {
            arr.sort((a, b) => {
                if (b.rating !== a.rating) return b.rating - a.rating;
                if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
                return b.specialtiesCount - a.specialtiesCount;
            });
        } else if (sortKey === "REVIEWS") {
            arr.sort((a, b) => {
                if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
                if (b.rating !== a.rating) return b.rating - a.rating;
                return b.specialtiesCount - a.specialtiesCount;
            });
        } else if (sortKey === "SPECIALTIES") {
            arr.sort((a, b) => {
                if (b.specialtiesCount !== a.specialtiesCount) return b.specialtiesCount - a.specialtiesCount;
                if (b.rating !== a.rating) return b.rating - a.rating;
                return b.reviewCount - a.reviewCount;
            });
        } else {
            arr.sort((a, b) => recommendScore(b) - recommendScore(a));
        }

        return arr;
    }, [filtered, sortKey]);

    const topRecommended = useMemo(() => {
        return sorted.slice(0, 3);
    }, [sorted]);

    const listOnly = useMemo(() => {
        const topIds = new Set(topRecommended.map((e) => e.id));
        return sorted.filter((e) => !topIds.has(e.id));
    }, [sorted, topRecommended]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(listOnly.length / PAGE_SIZE));
    }, [listOnly.length]);

    const pagedExperts = useMemo(() => {
        const safePage = Math.min(currentPage, totalPages);
        const start = (safePage - 1) * PAGE_SIZE;
        return listOnly.slice(start, start + PAGE_SIZE);
    }, [listOnly, currentPage, totalPages]);

    useEffect(() => {
        setCurrentPage(1);
        syncParams({ page: 1 });
    }, [selectedCategory, keyword, sortKey]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
            syncParams({ page: totalPages });
        }
    }, [currentPage, totalPages]);

    const handleCategoryClick = (catKey) => {
        setSelectedCategory(catKey);
        syncParams({ category: catKey });
        recommendRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleProfile = (id) => navigate(`/experts/${id}`);

    const handleConsult = async (id) => {
        if (!isLoggedIn()) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        const userNo = Number(localStorage.getItem("userNo"));
        const lawyerNo = Number(id);

        if (!userNo) {
            alert("사용자 정보가 없습니다. 다시 로그인해주세요.");
            return;
        }

        if (!lawyerNo) {
            alert("변호사 정보가 올바르지 않습니다.");
            return;
        }

        try {
            const res = await api.post("/api/boards/chat/room", {
                userNo,
                lawyerNo,
            });

            const room = res.data;
            const roomId = room?.roomId ?? room?.id;
            const newlyCreated = room?.newlyCreated === true;

            if (roomId) {
                if (newlyCreated) {
                    api.post("/api/chat/room/notify", { roomId, userNo, lawyerNo }).catch(() => {});
                }
                navigate(`/chatList/${roomId}`);
            } else {
                navigate("/chatList");
            }
        } catch (err) {
            console.error("채팅방 생성 실패:", err);
            alert("채팅방 생성 중 오류가 발생했습니다.");
        }
    };

    const resultLabel = useMemo(() => {
        const catLabel = selectedCategory === "ALL" ? "전체" : selectedCategory;
        return keyword.trim()
            ? `${catLabel} · ‘${keyword}’ ${sorted.length}명`
            : `${catLabel} 전문가 ${sorted.length}명`;
    }, [selectedCategory, keyword, sorted.length]);

    const pageNumbers = useMemo(() => {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }, [totalPages]);

    return (
        <div className="max-w-7xl mx-auto py-14 px-4 bg-slate-50/30">
            {loadMsg && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-sm font-semibold text-red-600 flex items-center gap-2 shadow-sm">
                    <Sparkles size={16} /> {loadMsg}
                </div>
            )}

            <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">전문가 찾기</h2>
                <p className="mt-3 text-slate-500 font-semibold">신뢰할 수 있는 법률 파트너를 만나보세요</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3 mb-10">
                {CATEGORY_GRID.map((c) => (
                    <button
                        key={c.key}
                        onClick={() => handleCategoryClick(c.key)}
                        className={`group bg-white rounded-2xl border p-4 text-center transition-all duration-200 ${
                            selectedCategory === c.key
                                ? "border-slate-900 shadow-lg ring-1 ring-slate-900"
                                : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                        }`}
                    >
                        <div
                            className={`text-2xl mb-2 transition-transform group-hover:scale-110 ${
                                selectedCategory === c.key ? "text-slate-900" : "text-slate-400"
                            }`}
                        >
                            {c.icon}
                        </div>
                        <div
                            className={`text-sm font-bold ${
                                selectedCategory === c.key ? "text-slate-900" : "text-slate-600"
                            }`}
                        >
                            {c.label}
                        </div>
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-10">
                <div className="flex-1 relative group">
                    <Search
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors"
                        size={20}
                    />
                    <input
                        value={keyword}
                        onChange={(e) => {
                            setKeyword(e.target.value);
                            syncParams({ q: e.target.value });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-14 pr-12 py-4 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-semibold shadow-sm transition-all"
                        placeholder="이름 또는 상담 키워드 검색"
                    />
                    {keyword && (
                        <button
                            onClick={() => {
                                setKeyword("");
                                syncParams({ q: "" });
                            }}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between md:w-60 focus-within:border-slate-900 transition-all">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Sort by</span>
                    <select
                        value={sortKey}
                        onChange={(e) => {
                            setSortKey(e.target.value);
                            syncParams({ sort: e.target.value });
                        }}
                        className="outline-none font-bold text-slate-800 bg-transparent cursor-pointer"
                    >
                        {SORTS.map((s) => (
                            <option key={s.key} value={s.key}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {currentPage === 1 && (
                <div
                    ref={recommendRef}
                    className="mb-16 bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 relative z-10 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm text-white shadow-xl rotate-3">
                                <Medal size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">Premium 추천 전문가</h3>
                                <p className="text-slate-300 font-bold mt-1">
                                    {sortKey === "RECOMMEND"
                                        ? "평점, 후기, 전문분야 수를 종합한 추천 전문가"
                                        : `${SORTS.find((s) => s.key === sortKey)?.label || "추천순"} 기준 상위 전문가`}
                                </p>
                            </div>
                        </div>

                        <div className="px-5 py-2 rounded-full bg-white/10 text-white text-sm font-black border border-white/20">
                            {resultLabel}
                        </div>
                    </div>

                    {topRecommended.length === 0 ? (
                        <div className="py-20 text-center text-slate-300 font-bold bg-white/5 rounded-3xl border border-white/10">
                            조건에 맞는 추천 전문가가 없습니다.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {topRecommended.map((e) => {
                                const { visibleTags, hiddenCount } = getVisibleTags(e.tags);

                                return (
                                    <div
                                        key={e.id}
                                        className="group bg-white rounded-[32px] border border-slate-100 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-slate-200 flex flex-col"
                                    >
                                        <div className="flex items-center gap-5 mb-6">
                                            <Avatar
                                                image={e.image}
                                                name={e.name}
                                                size="lg"
                                                rounded="2xl"
                                                clickable
                                                onClick={() => handleProfile(e.id)}
                                            />

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <h4
                                                        className="text-xl font-black text-slate-900 truncate cursor-pointer"
                                                        onClick={() => handleProfile(e.id)}
                                                    >
                                                        {e.name}
                                                    </h4>
                                                    <CheckCircle
                                                        className="text-blue-500 flex-shrink-0"
                                                        size={18}
                                                        fill="#EFF6FF"
                                                    />
                                                </div>
                                                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white uppercase tracking-tighter">
                                                    {e.mainCategory}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                                            <div className="text-center">
                                                <div className="text-[10px] text-slate-400 font-black uppercase">Rating</div>
                                                <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-0.5">
                                                    <Star size={12} fill="#f59e0b" className="text-yellow-500" />
                                                    {e.rating.toFixed(1)}
                                                </div>
                                            </div>
                                            <div className="text-center border-x border-slate-200">
                                                <div className="text-[10px] text-slate-400 font-black uppercase">Reviews</div>
                                                <div className="text-sm font-bold text-slate-900">{e.reviewCount}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] text-slate-400 font-black uppercase">Specialties</div>
                                                <div className="text-sm font-bold text-slate-900">{e.specialtiesCount}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap content-start gap-2 mb-8 min-h-[72px] flex-grow">
                                            {visibleTags.map((t) => (
                                                <span
                                                    key={t}
                                                    className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-bold leading-none whitespace-nowrap"
                                                >
                                                    #{t}
                                                </span>
                                            ))}
                                            {hiddenCount > 0 && (
                                                <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-slate-900 text-white border border-slate-900 text-[11px] font-bold leading-none whitespace-nowrap">
                                                    +{hiddenCount}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleProfile(e.id)}
                                                className="flex-1 py-3.5 rounded-2xl font-black text-xs border-2 border-slate-900 text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                                            >
                                                프로필
                                            </button>
                                            <button
                                                onClick={() => handleConsult(e.id)}
                                                className="flex-1 py-3.5 rounded-2xl font-black text-xs bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95"
                                            >
                                                1:1채팅하기
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {pagedExperts.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pagedExperts.map((e) => {
                            const { visibleTags, hiddenCount } = getVisibleTags(e.tags);

                            return (
                                <div
                                    key={e.id}
                                    className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 hover:shadow-xl transition-all duration-300 flex flex-col"
                                >
                                    <div className="flex items-center gap-5 mb-6">
                                        <Avatar
                                            image={e.image}
                                            name={e.name}
                                            size="md"
                                            rounded="xl"
                                            clickable
                                            onClick={() => handleProfile(e.id)}
                                        />

                                        <div className="min-w-0">
                                            <h4 className="text-lg font-black text-slate-900 truncate">
                                                {e.name} 변호사
                                            </h4>
                                            <p className="text-xs font-bold text-slate-400">
                                                {e.mainCategory} · 전문분야 {e.specialtiesCount}개
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="flex text-yellow-400 text-xs">★★★★★</div>
                                        <span className="font-bold text-slate-800 text-sm">{e.rating.toFixed(1)}</span>
                                        <span className="text-slate-400 text-xs font-bold">
                                            후기 {e.reviewCount} · 전문분야 {e.specialtiesCount}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap content-start gap-2 mb-8 min-h-[64px] flex-grow">
                                        {visibleTags.map((t) => (
                                            <span
                                                key={t}
                                                className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-bold leading-none whitespace-nowrap"
                                            >
                                                #{t}
                                            </span>
                                        ))}
                                        {hiddenCount > 0 && (
                                            <span className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-slate-900 text-white border border-slate-900 text-[11px] font-bold leading-none whitespace-nowrap">
                                                +{hiddenCount}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleProfile(e.id)}
                                            className="flex-1 py-3 rounded-xl font-bold text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        >
                                            프로필
                                        </button>
                                        <button
                                            onClick={() => handleConsult(e.id)}
                                            className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-900 hover:bg-slate-200"
                                        >
                                            1:1채팅하기
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
                            <button
                                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border text-sm font-black transition-all ${
                                    currentPage === 1
                                        ? "border-slate-200 text-slate-300 bg-white cursor-not-allowed"
                                        : "border-slate-300 text-slate-700 bg-white hover:border-slate-900 hover:text-slate-900"
                                }`}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {pageNumbers.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-xl border text-sm font-black transition-all ${
                                        currentPage === page
                                            ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-900 hover:text-slate-900"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border text-sm font-black transition-all ${
                                    currentPage === totalPages
                                        ? "border-slate-200 text-slate-300 bg-white cursor-not-allowed"
                                        : "border-slate-300 text-slate-700 bg-white hover:border-slate-900 hover:text-slate-900"
                                }`}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {sorted.length === 0 && !isLoading && (
                <div className="mt-20 py-20 bg-white border border-slate-200 rounded-[40px] text-center shadow-inner">
                    <div className="text-4xl mb-4">😶</div>
                    <div className="font-black text-slate-900 text-xl mb-2">검색 결과가 없습니다</div>
                    <p className="text-slate-400 font-bold">다른 키워드나 카테고리를 선택해보세요.</p>
                </div>
            )}
        </div>
    );
}