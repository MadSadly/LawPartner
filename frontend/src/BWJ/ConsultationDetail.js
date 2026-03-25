import React, { useState, useEffect } from 'react';
// useParams: URL에 있는 값(예: /boards/1 에서 1)을 뽑아오는 리액트 훅입니다.
// useNavigate: 다른 페이지로 이동시켜주는(링크 역할) 리액트 훅입니다.
import { useParams, useNavigate } from 'react-router-dom';
// axios: 스프링 서버랑 통신(데이터 주고받기)하기 위한 라이브러리입니다.
import api, { getAccessToken } from '../common/api/axiosConfig';
import {
    CaretLeft, ChatCircleDots, Star, PencilSimple, Trash,
    CheckCircle, User, PaperPlaneRight, Siren, X, FileText, DownloadSimple
} from '@phosphor-icons/react';

const ConsultationDetail = () => {
    // [기본 훅] URL 파라미터와 페이지 이동 훅
    const { id } = useParams();
    const navigate = useNavigate();

    // [상태 관리] useState는 리액트에서 데이터를 담아두는 바구니 같은 겁니다.
    // 이 바구니(상태)의 값이 바뀌면 화면이 알아서 새로고침(렌더링) 됩니다.
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    const [replyContent, setReplyContent] = useState('');
    const [editingReplyId, setEditingReplyId] = useState(null);
    const [editingReplyContent, setEditingReplyContent] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedLawyer, setSelectedLawyer] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewContent, setReviewContent] = useState('');

    // 토큰입니다.
    const token = getAccessToken();

    // [로그인 정보] 로컬스토리지(브라우저 저장소)에서 로그인한 유저 정보를 가져옵니다.
    const currentUser = {
        userNo: localStorage.getItem('userNo'),
        role: localStorage.getItem('userRole'),
        name: localStorage.getItem('userNm') || localStorage.getItem('nickNm')
    };

    // [초기 데이터 로드] useEffect는 화면이 처음 켜질 때 한 번만 실행되는 함수입니다.
    // 여기서 스프링 백엔드에서 글 상세정보를 가져옵니다.
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(`/api/boards/${id}`, {
                    params: { userNo: currentUser.userNo || undefined }
                });
                setPost(res.data?.data ?? res.data);
                setLoading(false);
            } catch (err) {
                console.error("게시글 로딩 실패", err);
                alert("존재하지 않는 게시글입니다.");
                navigate('/consultation');
            }
        };
        fetchPost();
    }, [id, navigate]);

    // [기능 1] 파일 다운로드
    const handleFileDownload = async (file) => {
        try {
            const fileNo = (typeof file === 'object') ? (file.fileNo || file.file_no) : file;
            const response = await api.get(`/api/boards/download/${fileNo}`, {
                params: { userNo: currentUser.userNo || undefined },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.originName || `download_file_${fileNo}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("다운로드 실패:", error);
            alert("파일을 다운로드하는 중 문제가 발생했습니다.");
        }
    };

    // [기능 2] 게시글 수정
    const handleUpdate = async () => {
        if (!editTitle.trim()) return alert("제목을 입력해주세요.");
        if (!editContent.trim()) return alert("내용을 입력해주세요.");
        try {
            await api.put(`/api/boards/${id}`, {
                title: editTitle,
                content: editContent
            });
            alert("게시글이 성공적으로 수정되었습니다.");
            setIsEditing(false);
            setPost({ ...post, title: editTitle, content: editContent });
        } catch (err) {
            alert("게시글 수정 중 오류가 발생했습니다.");
        }
    };

    // [기능 3] 게시글 삭제
    const handleDelete = async () => {
        if (window.confirm("정말 이 게시글을 삭제하시겠습니까? (달린 답변도 모두 삭제됩니다)")) {
            try {
                await api.delete(`/api/boards/${id}`);
                alert("삭제되었습니다.");
                navigate('/consultation');
            } catch (err) {
                alert("게시글 삭제 중 오류가 발생했습니다.");
            }
        }
    };

    // [기능 4] 매칭 완료
    const handleMatchComplete = async () => {
        if (window.confirm("상담을 완료하시겠습니까?")) {
            try {
                await api.put(`/api/boards/${id}/match`);
                alert("상담이 완료되었습니다.");
                window.location.reload();
            } catch (err) {
                alert("상담 완료 처리 중 오류가 발생했습니다.");
            }
        }
    };

    // [기능 5] 답변 등록
    const handleReplySubmit = async () => {
        if (!replyContent.trim()) return alert("답변 내용을 입력해주세요.");
        try {
            await api.post(`/api/boards/${id}/replies`, {
                content: replyContent,
                lawyerNo: currentUser.userNo
            });
            alert("답변이 등록되었습니다.");
            window.location.reload(); // 등록 후 새로고침
        } catch (err) {
            alert("답변 등록 중 오류가 발생했습니다.");
        }
    };

    // [기능 6] 답변 삭제
    const handleReplyDelete = async (replyId) => {
        if (window.confirm("정말 이 답변을 삭제하시겠습니까?")) {
            try {
                await api.delete(`/api/boards/replies/${replyId}`);
                alert("답변이 삭제되었습니다.");
                window.location.reload();
            } catch (err) {
                alert("답변 삭제 중 오류가 발생했습니다.");
            }
        }
    };

    // [기능 7] 답변 수정 모드 시작
    const startEditReply = (reply) => {
        setEditingReplyId(reply.replyNo);
        setEditingReplyContent(reply.content);
    };

    // [기능 8] 답변 수정 완료
    const handleReplyUpdate = async (replyId) => {
        if (!editingReplyContent.trim()) return alert("내용을 입력해주세요.");
        try {
            await api.put(`/api/boards/replies/${replyId}`, {
                content: editingReplyContent
            });
            alert("답변이 수정되었습니다.");
            setEditingReplyId(null);
            window.location.reload();
        } catch (err) {
            alert("답변 수정 중 오류가 발생했습니다.");
        }
    };

    // [기능 9] 후기 등록
    const handleReviewSubmit = async () => {
        if (rating === 0) return alert("별점을 선택해주세요.");
        if (!reviewContent.trim()) return alert("후기 내용을 입력해주세요.");
        try {
            await api.post(`/api/boards/${id}/reviews`, {
                lawyerNo: selectedLawyer.lawyerNo,
                writerNo: currentUser.userNo,
                writerNm: currentUser.name || "익명",
                stars: rating,
                content: reviewContent,
                replyNo: selectedLawyer.replyNo
            });
            alert("후기가 등록되었습니다.");
            setIsReviewModalOpen(false);
            setRating(0);
            setReviewContent('');
        } catch (err) {
            alert("후기 등록 중 오류가 발생했습니다.");
        }
    };

    // [기능 10] 1:1 대화방 생성 (★ 여기서 백엔드랑 통신합니다)
    const handleCreateChatRoom = async (lawyerNo) => {
        if (!currentUser.userNo) {
            alert("로그인이 필요한 서비스입니다.");
            return;
        }

        try {
            const response = await api.post(`/api/boards/chat/room`, {
                userNo: Number(currentUser.userNo),
                lawyerNo: lawyerNo
            });

            const room = response.data;
            const roomId = room?.roomId ?? room?.id ?? response.data;
            const newlyCreated = room?.newlyCreated === true;

            if (response.status === 200 && roomId) {
                if (newlyCreated) {
                    api.post("/api/chat/room/notify", {
                        roomId,
                        userNo: Number(currentUser.userNo),
                        lawyerNo
                    }).catch(() => {});
                }
                alert("1:1 대화 요청이 완료되었습니다!");
                navigate(`/chatList/${roomId}`);
            }
        } catch (err) {
            console.error("채팅방 생성 중 오류:", err);
            alert("대화 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
    };

    // 데이터를 가져오는 중일 때 보여줄 로딩 화면입니다.
    if (loading) return <div className="text-center py-20 font-bold text-gray-500">데이터를 불러오는 중입니다...</div>;

    const isMyPost = currentUser.role === 'ROLE_USER' && String(post.writerNo) === String(currentUser.userNo);
    const isLawyer = currentUser.role === 'ROLE_LAWYER';

    // Tailwind CSS를 이용해 화면을 그리는 부분(JSX)입니다.
    return (
        <div className="min-h-screen bg-gray-50 pt-8 pb-20 px-4 font-sans text-left">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/consultation')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors">
                    <CaretLeft size={20} /> 목록으로 돌아가기
                </button>

                {/* 1. 메인 게시글 영역 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-5">
                            <span className="bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                                {post.categoryCode}
                            </span>
                            {isMyPost && !isEditing && (
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <button onClick={() => { setEditTitle(post.title); setEditContent(post.content); setIsEditing(true); }} className="hover:text-blue-600 flex items-center gap-1">
                                        <PencilSimple /> 수정
                                    </button>
                                    <button onClick={handleDelete} className="hover:text-red-600 flex items-center gap-1">
                                        <Trash /> 삭제
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-2xl font-bold mb-4 border-b pb-2 outline-none" />
                        ) : (
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <User weight="fill" className="text-gray-400" />
                            <span className="text-gray-700 font-medium">{post.nickNm}</span>
                            <span>{post.regDt?.substring(0, 10)}</span>
                        </div>
                    </div>

                    <div className="p-8">
                        {isEditing ? (
                            <div>
                                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-48 p-4 border rounded-xl resize-none mb-4"></textarea>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setIsEditing(false)} className="px-6 py-2 border rounded-lg">취소</button>
                                    <button onClick={handleUpdate} className="px-6 py-2 bg-blue-600 text-white rounded-lg">저장 완료</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed mb-10">{post.content}</div>
                                {post.files && post.files.length > 0 && (
                                    <div className="mt-10 pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2"><FileText size={20} /> 첨부파일 ({post.files.length})</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {post.files.map((file, index) => (
                                                <div key={index} onClick={() => handleFileDownload(file)} className="flex justify-between p-4 bg-gray-50 border rounded-xl hover:bg-blue-50 cursor-pointer group">
                                                    <span className="text-sm text-gray-700 truncate">{file.originName}</span>
                                                    <DownloadSimple size={20} className="text-gray-400 group-hover:text-blue-500" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* 2. 전문가 답변 영역 */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b-2 border-gray-900 pb-3">
                        전문가 답변 <span className="text-blue-600">{post.replies ? post.replies.length : 0}</span>
                    </h3>

                    {post.replies && post.replies.length > 0 ? (
                        post.replies.map((reply) => {
                            const isMyReply = String(currentUser.userNo) === String(reply.lawyerNo);

                            return (
                                <div
                                    key={reply.replyNo}
                                    className={`rounded-xl p-8 border shadow-sm transition-all 
                                        ${isMyReply
                                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100'
                                        : 'bg-white border-gray-200 hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                                                {reply.lawyerNm ? reply.lawyerNm[0] : '변'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 flex items-center gap-1 text-lg">
                                                    {reply.lawyerNm} 변호사
                                                    <CheckCircle size={16} className="text-blue-500" weight="fill" />
                                                    {isMyReply && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full ml-2">ME</span>}
                                                </div>
                                                <div className="text-sm text-gray-400">{reply.regDt?.substring(0, 10)}</div>
                                            </div>
                                        </div>

                                        {isMyReply && !editingReplyId && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => startEditReply(reply)}
                                                    className="text-sm text-gray-500 hover:text-blue-600 hover:underline underline-offset-4 transition-colors font-medium"
                                                >
                                                    수정
                                                </button>
                                                <span className="text-gray-300 text-sm">|</span>
                                                <button
                                                    onClick={() => handleReplyDelete(reply.replyNo)}
                                                    className="text-sm text-gray-500 hover:text-red-600 hover:underline underline-offset-4 transition-colors font-medium"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {editingReplyId === reply.replyNo ? (
                                        <div className="animate-fadeIn">
                                            <textarea
                                                value={editingReplyContent}
                                                onChange={(e) => setEditingReplyContent(e.target.value)}
                                                className="w-full h-32 p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 bg-white"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingReplyId(null)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                                                <button onClick={() => handleReplyUpdate(reply.replyNo)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">수정 완료</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg mb-8">{reply.content}</p>
                                    )}

                                    {isMyPost && !isMyReply && (
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => handleCreateChatRoom(reply.lawyerNo)} className="w-full py-3.5 rounded-lg border border-blue-500 text-blue-600 font-bold flex justify-center gap-2 hover:bg-blue-50">
                                                <ChatCircleDots size={20} /> 1:1 대화 요청하기
                                            </button>
                                            <button onClick={() => { setSelectedLawyer(reply); setIsReviewModalOpen(true); }} className="w-full py-3.5 rounded-lg border border-gray-300 text-gray-700 font-bold flex justify-center gap-2 hover:bg-gray-50">
                                                <Star size={20} /> 평점 및 후기 입력
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border text-gray-400">
                            <Siren size={32} className="mx-auto mb-2" />
                            <p>아직 등록된 전문가 답변이 없습니다.</p>
                        </div>
                    )}
                </div>

                {/* 3. 하단 버튼들 */}
                {isMyPost && post.matchYn !== 'Y' && (
                    <div className="mt-12 flex justify-center">
                        <button onClick={handleMatchComplete} className="bg-[#1c2438] text-white px-12 py-4 rounded-lg font-bold text-lg shadow-md hover:bg-black">상담 완료하기</button>
                    </div>
                )}

                {isLawyer && post.matchYn !== 'Y' && (
                    <div className="mt-10 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} className="w-full h-32 p-4 border rounded-lg focus:border-blue-500 outline-none resize-none mb-4" placeholder="답변을 남겨주세요."></textarea>
                        <div className="flex justify-end">
                            <button onClick={handleReplySubmit} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md">
                                <PaperPlaneRight size={18} weight="bold" /> 답변 등록
                            </button>
                        </div>
                    </div>
                )}

                {isLawyer && post.matchYn === 'Y' && (
                    <div className="mt-10 p-6 bg-gray-100 text-center rounded-xl text-gray-500 font-bold border">상담 완료된 글입니다.</div>
                )}
            </div>

            {/* 4. 모달창 */}
            {isReviewModalOpen && selectedLawyer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="flex justify-between items-center p-5 border-b">
                            <h2 className="text-xl font-bold">후기 작성</h2>
                            <button onClick={() => setIsReviewModalOpen(false)}><X size={24} className="text-gray-400 hover:text-black"/></button>
                        </div>
                        <div className="p-6">
                            <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
                                <p className="text-blue-600 text-sm font-bold mb-1">상담 받은 글</p>
                                <p className="text-gray-800 text-sm font-medium truncate">{post.title}</p>
                            </div>
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setRating(star)}>
                                        <Star size={40} weight={star <= rating ? "fill" : "regular"} className={star <= rating ? "text-yellow-400" : "text-gray-300"} />
                                    </button>
                                ))}
                            </div>
                            <textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} placeholder="후기를 남겨주세요." className="w-full h-32 p-4 border rounded-xl resize-none mb-6"></textarea>
                            <button onClick={handleReviewSubmit} className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700">등록하기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultationDetail;