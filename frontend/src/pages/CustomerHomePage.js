import React from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerHomePage() {
    const navigate = useNavigate();

    const TYPES = [
        "서비스 이용 문의",
        "결제 / 환불 문의",
        "계정 / 로그인",
        "전문가 관련 문의",
        "신고 / 권리침해",
        "AI 작성 문의",
        "버그 제보",
        "기타 문의"
    ];

    return (
        <main style={main}>
            <div style={container}>

                <div style={headerArea}>
                    <h1 style={title}>고객센터</h1>
                    <p style={subText}>
                        궁금한 사항이 있으시면 문의 유형을 선택하세요.
                    </p>
                </div>

                <div style={card}>

                    {/* 일반 작성 버튼 (기본값으로 이동) */}
                    <button
                        onClick={() => navigate("/customer/write")}
                        style={btnPrimary}
                    >
                        1:1 문의 작성하기
                    </button>

                    <div style={divider} />

                    <div style={sectionTitle}>문의 유형</div>

                    <div style={grid}>
                        {TYPES.map((item, idx) => (
                            <div
                                key={idx}
                                style={typeCard}
                                onClick={() =>
                                    navigate("/customer/write", {
                                        state: { type: item }
                                    })
                                }
                            >
                                {item}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 40 }}>
                        <button
                            onClick={() => navigate("/customer/list")}
                            style={btnSecondary}
                        >
                            문의 내역 보기
                        </button>
                    </div>

                </div>

            </div>
        </main>
    );
}

/* ====== 레이아웃 ====== */

const main = {
    minHeight: "100vh",
    background: "#0f172a",
    paddingTop: "130px",
    paddingBottom: "120px",
    paddingLeft: "24px",
    paddingRight: "24px",
};

const container = {
    maxWidth: 1000,
    margin: "0 auto",
};

const headerArea = {
    marginBottom: 40,
};

const title = {
    fontSize: 36,
    fontWeight: 900,
    color: "#fff",
    marginBottom: 8,
    letterSpacing: "-0.5px"
};

const subText = {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)"
};

const card = {
    background: "#111c34",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 40,
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
};

const btnBase = {
    width: "100%",
    padding: "18px",
    borderRadius: 16,
    fontWeight: 800,
    fontSize: 17,
    cursor: "pointer",
};

const btnPrimary = {
    ...btnBase,
    border: "none",
    background: "#2563eb",
    color: "white",
};

const btnSecondary = {
    ...btnBase,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "white",
};

const divider = {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "40px 0",
};

const sectionTitle = {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 20,
    color: "#fff"
};

const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
};

const typeCard = {
    background: "#0b1224",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "22px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
    color: "#ffffff",
};
