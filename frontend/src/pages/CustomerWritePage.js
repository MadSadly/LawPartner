import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { getAccessToken } from "../common/api/axiosConfig";

function isLoggedIn() {
    return !!getAccessToken();
}

export default function CustomerWritePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [type, setType] = useState(
        location.state?.type || "서비스 이용 문의"
    );

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const blocked = useMemo(() => !isLoggedIn(), []);

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) return alert("문의 제목을 입력하세요.");
        if (!content.trim()) return alert("문의 내용을 입력하세요.");

        const token = getAccessToken();
        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        try {
            const res = await api.post("/api/customer/inquiries", {
                type,
                title: title.trim(),
                content: content.trim(),
            });

            if (res.data?.success !== true) {
                throw new Error(res.data?.message || "문의 등록 실패");
            }

            alert("문의가 등록되었습니다.");
            navigate("/customer/list");
        } catch (err) {
            console.error("문의 등록 실패:", err);
            console.error("응답 상태:", err.response?.status);
            console.error("응답 데이터:", err.response?.data);
            alert(
                err.response?.data?.message ||
                err.message ||
                "문의 등록 중 오류가 발생했습니다."
            );
        }
    };

    return (
        <main style={main}>
            <div style={container}>
                <div style={topBar}>
                    <div>
                        <h2 style={h2}>1:1 문의 작성</h2>
                        <p style={subText}>
                            문의 유형을 선택하고 내용을 작성해주세요.
                        </p>
                    </div>

                    <button
                        style={miniBtn}
                        onClick={() => navigate("/customer/list")}
                    >
                        문의 목록
                    </button>
                </div>

                {blocked ? (
                    <div style={card}>
                        <p style={{ marginBottom: 20 }}>
                            로그인한 사용자만 작성 가능합니다.
                        </p>
                        <button
                            style={btnPrimary}
                            onClick={() => navigate("/login")}
                        >
                            로그인 하러가기
                        </button>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} style={card}>
                        <div style={field}>
                            <label style={label}>문의 유형</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                style={control}
                            >
                                <option value="서비스 이용 문의">서비스 이용 문의</option>
                                <option value="결제 / 환불 문의">결제 / 환불 문의</option>
                                <option value="계정 / 로그인">계정 / 로그인</option>
                                <option value="전문가 관련 문의">전문가 관련 문의</option>
                                <option value="신고 / 권리침해">신고 / 권리침해</option>
                                <option value="AI 작성 문의">AI 작성 문의</option>
                                <option value="버그 제보">버그 제보</option>
                                <option value="기타 문의">기타 문의</option>
                            </select>
                        </div>

                        <div style={field}>
                            <label style={label}>문의 제목</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={control}
                                placeholder="제목을 입력하세요"
                            />
                        </div>

                        <div style={field}>
                            <label style={label}>문의 내용</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                style={{ ...control, minHeight: 240 }}
                                placeholder="내용을 입력하세요"
                            />
                        </div>

                        <div style={btnRow}>
                            <button type="submit" style={btnPrimary}>
                                문의 등록
                            </button>
                            <button
                                type="button"
                                style={btnGhost}
                                onClick={() => navigate("/customer")}
                            >
                                취소
                            </button>
                        </div>

                        <div style={hintBox}>
                            <strong>안내</strong><br />
                            등록 후 상태는 기본 “대기”로 표시됩니다.
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}

/* ================= 스타일 정의 ================= */

const main = {
    background: "#0f172a",
    paddingTop: "130px",
    paddingBottom: "120px",
    paddingLeft: "24px",
    paddingRight: "24px",
    minHeight: "100vh",
};

const container = {
    maxWidth: 960,
    margin: "0 auto",
};

const topBar = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
};

const h2 = {
    fontSize: 32,
    fontWeight: 900,
    color: "#fff",
    marginBottom: 6,
};

const subText = {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15
};

const card = {
    background: "#111c34",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 32,
    color: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
};

const field = { marginBottom: 20 };

const label = {
    display: "block",
    marginBottom: 8,
    fontWeight: 700,
};

const control = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#0b1224",
    color: "white",
};

const btnRow = { display: "flex", gap: 14, marginTop: 24 };

const btnPrimary = {
    flex: 1,
    padding: "16px",
    borderRadius: 14,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 800,
    cursor: "pointer"
};

const btnGhost = {
    flex: 1,
    padding: "16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "white",
    cursor: "pointer"
};

const miniBtn = {
    padding: "10px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#1e293b",
    color: "white",
    cursor: "pointer"
};

const hintBox = {
    marginTop: 28,
    padding: 16,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)"
};