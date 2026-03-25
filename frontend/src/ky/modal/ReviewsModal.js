import { useState } from "react";
import { useNavigate } from "react-router-dom";

const FONT = "'Pretendard', 'Noto Sans KR', sans-serif";
const BLUE = "#1D4ED8";

// stars: 백엔드에서 Double로 오므로 Math.round 처리
function Stars({ count }) {
    const rounded = Math.round(count || 0);
    return (
        <span style={{ color: "#facc15", fontSize: 14 }}>
            {"★".repeat(rounded)}{"☆".repeat(5 - rounded)}
        </span>
    );
}
export { Stars };

// 백엔드 ReviewDTO 필드: writerNm, stars, content, regDate
const PAGE_SIZE = 3;

export default function ReviewsModal({ isOpen, onClose, reviews }) {
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(0);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const filteredReviews = filter === "all"
        ? reviews
        : reviews.filter(r => Math.round(r.stars) === Number(filter));

    const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);
    const pagedReviews = filteredReviews.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const handleFilterChange = (f) => {
        setFilter(f);
        setPage(0); // 필터 바뀌면 1페이지로
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / reviews.length).toFixed(1)
        : "0.0";

    const starCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => Math.round(r.stars) === star).length,
    }));

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, fontFamily: FONT,
        }}>
            <div style={{
                background: "#fff", borderRadius: 16, width: 640, height: "80vh",
                overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                display: "flex", flexDirection: "column",
            }}>
                {/* 헤더 */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 24px", borderBottom: "1px solid #f3f4f6", flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>의뢰인 후기</h2>
                    <button onClick={onClose} style={{
                        background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af",
                    }}>✕</button>
                </div>

                <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
                    {/* 평점 요약 */}
                    <div style={{
                        display: "flex", gap: 24, padding: 20, borderRadius: 12,
                        background: "#F9FAFB", marginBottom: 20,
                    }}>
                        <div style={{ textAlign: "center", minWidth: 100 }}>
                            <div style={{ fontSize: 40, fontWeight: 800, color: "#111827" }}>{avgRating}</div>
                            <Stars count={Math.round(Number(avgRating))} />
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>총 {reviews.length}개 후기</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            {starCounts.map(({ star, count }) => (
                                <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", width: 20 }}>{star}점</span>
                                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e5e7eb" }}>
                                        <div style={{
                                            height: "100%", borderRadius: 4, background: "#facc15",
                                            width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%",
                                            transition: "width 0.3s",
                                        }} />
                                    </div>
                                    <span style={{ fontSize: 12, color: "#9ca3af", width: 24, textAlign: "right" }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 필터 */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {["all", "5", "4", "3", "2", "1"].map(f => (
                            <button key={f} onClick={() => handleFilterChange(f)} style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                border: "none", cursor: "pointer", fontFamily: FONT,
                                background: filter === f ? BLUE : "#f3f4f6",
                                color: filter === f ? "#fff" : "#6b7280",
                                transition: "all 0.2s",
                            }}>
                                {f === "all" ? "전체" : `${f}점`}
                            </button>
                        ))}
                    </div>

                    {/* 후기 목록 (3개씩 페이징) */}
                    {filteredReviews.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {pagedReviews.map((r, i) => (
                                <div
                                    key={r.reviewNo ?? i}
                                    onClick={() => r.boardNo && (onClose(), navigate(`/consultation/${r.boardNo}`))}
                                    style={{
                                        padding: 16, borderRadius: 12, background: "#F9FAFB",
                                        border: "1px solid #f3f4f6",
                                        cursor: r.boardNo ? "pointer" : "default",
                                        transition: "box-shadow 0.2s",
                                    }}
                                    onMouseEnter={e => { if (r.boardNo) e.currentTarget.style.boxShadow = "0 4px 12px rgba(29,78,216,0.12)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: "50%", background: BLUE,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "#fff", fontWeight: 700, fontSize: 14,
                                            }}>
                                                {(r.writerNm || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{r.writerNm || '익명'}</div>
                                                <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.regDate || ""}</div>
                                            </div>
                                        </div>
                                        <Stars count={r.stars} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, color: "#4b5563", lineHeight: 1.7 }}>{r.content}</p>
                                </div>
                            ))}
                            {/* 페이징 */}
                            {totalPages > 1 && (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, paddingTop: 8 }}>
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: page === 0 ? "not-allowed" : "pointer", background: page === 0 ? "#f9fafb" : "#fff", color: page === 0 ? "#d1d5db" : "#374151" }}
                                    >‹</button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i)}
                                            style={{ border: "1px solid", borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: "pointer", borderColor: page === i ? BLUE : "#e5e7eb", background: page === i ? BLUE : "#fff", color: page === i ? "#fff" : "#374151", fontWeight: page === i ? 700 : 400 }}
                                        >{i + 1}</button>
                                    ))}
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", background: page >= totalPages - 1 ? "#f9fafb" : "#fff", color: page >= totalPages - 1 ? "#d1d5db" : "#374151" }}
                                    >›</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
                            해당 조건의 후기가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
