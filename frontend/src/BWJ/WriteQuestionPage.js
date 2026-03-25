import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../common/api/axiosConfig';
import { AttachedFilesFromAiContext } from '../common/context/AttachedFilesFromAiContext';
import { LayoutGrid, CheckCircle, CloudUpload, X, FileText } from 'lucide-react';

const CATEGORIES = [
    { id: 1, name: '형사범죄' }, { id: 2, name: '교통사고' },
    { id: 3, name: '부동산' }, { id: 4, name: '임대차' },
    { id: 5, name: '손해배상' }, { id: 6, name: '대여금' },
    { id: 7, name: '미수금' }, { id: 8, name: '채권추심' },
    { id: 9, name: '이혼' }, { id: 10, name: '상속/가사' },
    { id: 11, name: '노동' }, { id: 12, name: '기업' },
    { id: 13, name: '지식재산권' }, { id: 14, name: '회생/파산' },
    { id: 15, name: '계약서 검토' }, { id: 16, name: '기타' },
];

const WriteQuestionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { filesFromAi, clearFilesFromAi } = useContext(AttachedFilesFromAiContext);
    const aiPrefillAppliedRef = useRef(false);

    // AI 채팅에서 '상담내용으로 글쓰기'로 넘어올 때 제목/내용 및 첨부 파일 반영
    useEffect(() => {
        if (aiPrefillAppliedRef.current) return;
        const state = location.state;
        if (state?.title) setTitle(state.title);
        if (state?.content) setContent(state.content);
        const routedFiles = Array.isArray(state?.filesFromAi) ? state.filesFromAi : [];
        const merged = routedFiles.length > 0 ? routedFiles : (filesFromAi || []);
        if (state?.fromAiChatWithFiles && merged?.length > 0) {
            setFiles(prev => [...prev, ...merged]);
            clearFilesFromAi();
        }
        // location/state 변화로 effect가 반복 실행되며 파일이 누적되는 것을 방지
        if (state?.fromAiChatWithFiles) aiPrefillAppliedRef.current = true;
    }, [location, filesFromAi, clearFilesFromAi]);

    // [리액트] useRef는 DOM 요소에 직접 접근할 때 사용해요.
    // 여기서는 숨겨진 <input type="file">을 클릭하기 위해 사용합니다.
    const fileInputRef = useRef(null);

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSecret, setIsSecret] = useState(false);

    // [상태] 첨부된 파일들을 담는 리스트입니다.
    const [files, setFiles] = useState([]);
    // [상태] 드래그 중인지 여부를 판단하여 UI를 변경할 때 사용합니다.
    const [isDragging, setIsDragging] = useState(false);

    // [함수] 파일을 리스트에 추가하는 공통 로직
    const addFiles = (newFiles) => {
        const fileArray = Array.from(newFiles);
        setFiles((prevFiles) => [...prevFiles, ...fileArray]);
    };

    // [이벤트] 파일 선택창(input)을 통해 파일이 선택되었을 때
    const handleFileChange = (e) => {
        if (e.target.files) {
            addFiles(e.target.files);
        }
    };

    // [이벤트] 드래그 영역 위로 파일이 올라왔을 때
    const handleDragOver = (e) => {
        e.preventDefault(); // 브라우저가 파일을 직접 여는 것을 막습니다.
        setIsDragging(true);
    };

    // [이벤트] 드래그 영역에서 마우스가 나갔을 때
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    // [이벤트] 파일을 영역에 떨어뜨렸을 때
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            addFiles(e.dataTransfer.files);
        }
    };

    // [함수] 특정 파일을 목록에서 제거
    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleCategoryClick = (catName) => {
        if (selectedCategories.includes(catName)) {
            setSelectedCategories(selectedCategories.filter(c => c !== catName));
        } else {
            if (selectedCategories.length < 3) {
                setSelectedCategories([...selectedCategories, catName]);
            } else {
                alert("카테고리는 최대 3개까지만 선택할 수 있습니다.");
            }
        }
    };

    const handleSubmit = async () => {
        if (selectedCategories.length === 0) return alert("카테고리를 최소 1개 선택해주세요.");
        if (!title.trim()) return alert("제목을 입력해주세요.");
        if (!content.trim()) return alert("내용을 입력해주세요.");

        const userNo = localStorage.getItem('userNo');

        if(!userNo){
            alert("로그인 정보가 없습니다. 다시 로그인 해주세요.")
            return navigate("/login");
        }

        // [중요] 파일을 서버로 보낼 때는 JSON 형식이 아니라 FormData 객체를 사용해야 합니다.
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('categories', selectedCategories.join(',')); // 리스트를 콤마로 연결된 문자열로 전송
        formData.append('userNo', userNo);
        formData.append('secretYn', isSecret); // 비밀글 여부 (true/false)

        // 파일을 하나씩 FormData에 추가합니다. Key값인 'files'는 백엔드와 맞춰야 합니다.
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            // [중요] axios 전송 시 헤더에 multipart/form-data를 설정합니다.
            await api.post('/api/boards', formData);
            alert("질문이 등록되었습니다.");
            navigate('/consultation');
        } catch (error) {
            console.error("등록 에러:", error);
            alert("등록 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-gray-50 font-sans">
            <div className="bg-[#1a2b4b] text-white py-12 text-center">
                <h1 className="text-3xl font-bold mb-2">질문 등록하기</h1>
                <p className="text-blue-200 text-sm">비슷한 사례를 찾아보거나 직접 질문하여 해결책을 얻으세요.</p>
            </div>

            <main className="max-w-4xl mx-auto px-4 mt-10">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">

                    <div className="mb-10 text-left">
                        <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <LayoutGrid className="text-blue-600" size={24} />
                            카테고리 선택 <span className="text-red-500 text-sm font-normal">* 필수 (최대 3개)</span>
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.name)}
                                    className={`relative px-1 py-3 rounded-lg border text-sm font-medium transition-all duration-200 break-keep
                                    ${selectedCategories.includes(cat.name)
                                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {cat.name}
                                    {selectedCategories.includes(cat.name) && (
                                        <div className="absolute -top-2 -right-2 bg-white rounded-full">
                                            <CheckCircle className="text-blue-600 fill-white" size={20} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-gray-100 my-8" />

                    <div className="space-y-8 text-left">
                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3">
                                제목 <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                   placeholder="제목을 입력하세요"
                                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3">
                                내용 <span className="text-red-500">*</span>
                            </label>
                            <textarea rows="12" value={content} onChange={(e) => setContent(e.target.value)}
                                      placeholder="내용을 입력하세요"
                                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 resize-none" />
                        </div>

                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3">파일 첨부</label>

                            {/* 실제 파일 선택창은 숨겨둡니다 */}
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />

                            {/* 드래그 앤 드롭 영역 겸 클릭 영역 */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current.click()} // 클릭 시 숨겨진 input을 대신 클릭해줌
                                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
                                ${isDragging
                                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <CloudUpload className={`${isDragging ? 'text-blue-500' : 'text-gray-400'} mb-2`} size={40} />
                                <p className="text-gray-600 font-medium">파일을 드래그해서 놓거나 클릭하여 선택하세요</p>
                                <p className="text-gray-400 text-xs mt-1">이미지, 문서 파일 등을 여러 개 올릴 수 있습니다.</p>
                            </div>

                            {/* 첨부된 파일 목록 표시 */}
                            {files.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="text-blue-500 shrink-0" size={18} />
                                                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // 영역 클릭 이벤트가 실행되지 않도록 막음
                                                    removeFile(index);
                                                }}
                                                className="p-1 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-10 mb-20">
                    <div className="flex items-center gap-2 pl-2">
                        <input
                            type="checkbox"
                            id="secretYn"
                            checked={isSecret}
                            onChange={(e) => setIsSecret(e.target.checked)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="secretYn" className="text-gray-700 font-bold cursor-pointer">
                            비밀글
                        </label>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => navigate('/')} className="px-10 py-3.5 rounded-lg border border-gray-300 bg-white font-bold">취소</button>
                        <button onClick={handleSubmit} className="px-10 py-3.5 rounded-lg bg-blue-600 text-white font-bold shadow-lg">질문 등록</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WriteQuestionPage;