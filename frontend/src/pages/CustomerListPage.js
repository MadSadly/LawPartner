import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getAccessToken } from "../common/api/axiosConfig";

function isLoggedIn() {
    return !!getAccessToken();
}

function formatDate(iso) {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
}

export default function CustomerListPage() {
    const navigate = useNavigate();
    const blocked = useMemo(() => !isLoggedIn(), []);

    const [list, setList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (blocked) {
            setIsLoading(false);
            return;
        }

        const fetchInquiries = async () => {
            const token = getAccessToken();
            if (!token) {
                setList([]);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                const res = await api.get("/api/customer/inquiries");

                console.log("문의 목록 응답:", res.data);

                setList(Array.isArray(res.data?.data) ? res.data.data : []);
            } catch (err) {
                console.error("문의 목록 조회 실패:", err);
                console.error("응답 상태:", err.response?.status);
                console.error("응답 데이터:", err.response?.data);
                setList([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInquiries();
    }, [blocked]);

    if (blocked) {
        return (
            <main style={page}>
                <div style={container}>
                    <h1 style={title}>문의 내역</h1>

                    <div style={card}>
                        <div style={emptyTitle}>로그인이 필요합니다.</div>
                        <div style={emptyDesc}>
                            로그인한 사용자만 문의 내역 조회가 가능합니다.
                        </div>
                        <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
                            <button style={btnPrimary} onClick={() => navigate("/login")}>
                                로그인
                            </button>
                            <button style={btnGhost} onClick={() => navigate("/customer")}>
                                고객센터로
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={page}>
            <div style={container}>
                <div style={topArea}>
                    <div>
                        <h1 style={title}>문의 내역</h1>
                        <div style={metaText}>
                            총 <b>{list.length}</b>건
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <button style={btnGhost} onClick={() => navigate("/customer")}>
                            고객센터
                        </button>
                        <button style={btnPrimary} onClick={() => navigate("/customer/write")}>
                            + 문의 작성
                        </button>
                    </div>
                </div>

                <div style={card}>
                    {isLoading ? (
                        <div style={emptyState}>
                            <div style={emptyTitle}>불러오는 중...</div>
                            <div style={emptyDesc}>문의 내역을 조회하고 있습니다.</div>
                        </div>
                    ) : list.length === 0 ? (
                        <div style={emptyState}>
                            <div style={emptyTitle}>등록된 문의가 없습니다.</div>
                            <div style={emptyDesc}>첫 문의를 등록해 보세요.</div>
                            <div style={{ marginTop: 20 }}>
                                <button style={btnPrimary} onClick={() => navigate("/customer/write")}>
                                    문의 작성하러 가기
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={tableWrap}>
                            <table style={table}>
                                <thead>
                                <tr>
                                    <th style={th}>상태</th>
                                    <th style={th}>유형</th>
                                    <th style={th}>제목</th>
                                    <th style={th}>작성일</th>
                                </tr>
                                </thead>
                                <tbody>
                                {list.map((it) => (
                                    <tr
                                        key={it.id}
                                        style={row}
                                        onClick={() => navigate(`/customer/detail/${it.id}`)}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background = "transparent")
                                        }
                                    >
                                        <td style={td}>
                                                <span
                                                    style={
                                                        it.status === "답변완료"
                                                            ? badgeDone
                                                            : badgeWait
                                                    }
                                                >
                                                    {it.status}
                                                </span>
                                        </td>
                                        <td style={td}>{it.type}</td>
                                        <td style={tdTitle}>
                                            {it.title}
                                            <span style={chev}>›</span>
                                        </td>
                                        <td style={td}>{formatDate(it.createdAt)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

/* ======================
   통일된 레이아웃
====================== */

const page = {
    minHeight: "100vh",
    background: "#0f172a",
    paddingTop: "130px",
    paddingBottom: "120px",
    paddingLeft: 24,
    paddingRight: 24,
};

const container = {
    maxWidth: 1040,
    margin: "0 auto",
    color: "#fff",
};

const topArea = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 40,
    flexWrap: "wrap",
    gap: 16,
};

const title = {
    fontSize: 36,
    fontWeight: 900,
    marginBottom: 6,
    letterSpacing: "-0.5px",
};

const metaText = {
    fontSize: 14,
    opacity: 0.7,
};

const card = {
    background: "#111c34",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 32,
    boxShadow: "0 12px 50px rgba(0,0,0,0.35)",
};

const tableWrap = {
    overflowX: "auto",
};

const table = {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 760,
};

const th = {
    textAlign: "left",
    padding: "16px 12px",
    fontSize: 13,
    opacity: 0.7,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
};

const td = {
    padding: "18px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: 15,
};

const tdTitle = {
    ...td,
    fontWeight: 800,
    cursor: "pointer",
};

const row = {
    cursor: "pointer",
    transition: "background 120ms ease",
};

const chev = {
    float: "right",
    opacity: 0.5,
    fontWeight: 900,
};

const badgeWait = {
    padding: "5px 12px",
    borderRadius: 999,
    background: "rgba(245,158,11,0.18)",
    border: "1px solid rgba(245,158,11,0.35)",
    fontWeight: 900,
    fontSize: 12,
};

const badgeDone = {
    padding: "5px 12px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.18)",
    border: "1px solid rgba(34,197,94,0.35)",
    fontWeight: 900,
    fontSize: 12,
};

const emptyState = {
    textAlign: "center",
    padding: "40px 0",
};

const emptyTitle = {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 8,
};

const emptyDesc = {
    fontSize: 14,
    opacity: 0.7,
};

const btnPrimary = {
    padding: "14px 20px",
    borderRadius: 14,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
};

const btnGhost = {
    padding: "14px 20px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
};