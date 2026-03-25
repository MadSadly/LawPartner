import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getAccessToken } from '../common/api/axiosConfig';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import './SignupPage.css'; // CSS 임포트

const SignupPage = () => {
    const navigate = useNavigate();
    const phoneRef = useRef(null);

    useEffect(() => {
        if (getAccessToken()) {
            navigate('/');
        }
    }, []);

    // 1. 상태 관리 (Role, Form Data, UI Status)
    const [role, setRole] = useState('client'); // 'client' or 'lawyer'
    const [formData, setFormData] = useState({
        userId: '', 
        userPw: '', 
        confirmPassword: '',
        userNm: '', 
        phone: '', 
        email: '',
        nickNm: '',
        // 변호사 전용 필드
        licenseNo: '', 
        examType: '', 
        officeName: '', 
        officeAddr: '', 
        introText: '' // 초기값 이름
    });
    const [specialties, setSpecialties] = useState([]); // 전문분야 배열
    const [selectedFile, setSelectedFile] = useState(null); // 자격증 파일
    
    // 카테고리
    const legalCategories = [
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
    ];

    // 제출 버튼 
    const [isSubmitting, setIsSubmitting] = useState(false);
    // 검증 상태
    const [isIdChecked, setIsIdChecked] = useState(false);
    const [idMsg, setIdMsg] = useState({ text: '아이디 중복 확인을 해주세요.', color: 'text-slate-500' });
    const [pwMsg, setPwMsg] = useState('');
    // 이메일, 휴대폰 입력
    const [emailMsg, setEmailMsg] = useState({ text: '', color: '' });
    const [phoneMsg, setPhoneMsg] = useState({ text: '', color: '' });
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    
    // 2. 핸들러 함수들
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // 비밀번호 실시간 체크
        if (name === 'userPw' || name === 'confirmPassword') {
            const pw = name === 'userPw' ? value : formData.userPw;
            const confirm = name === 'confirmPassword' ? value : formData.confirmPassword;
            
            if (confirm && pw !== confirm) setPwMsg('비밀번호가 일치하지 않습니다.');
            else if (confirm && pw === confirm) setPwMsg('비밀번호가 일치합니다.');
            else setPwMsg('');
        }
    };

    // 아이디 중복 체크 (Mock API Call)
    const checkDuplicateID = async() => {
        if(!formData.userId) return alert("아이디를 입력해주세요.");
    
        try {
            const response = await api.get(`/api/auth/check-id`, {
                params : {userId : formData.userId}
            });

            // ★ [수정] ResultVO의 success 필드로 확인
            if (response.data.success) { 
                // ResultVO.ok("ID-AVAILABLE", ...)인 경우 여기로 들어옴
                setIdMsg({ text: "사용 가능한 아이디입니다.", color: "text-green-600"});
                setIsIdChecked(true);
            } else {
                // ResultVO.fail("ID-DUPLICATE", ...)인 경우 여기로 들어옴
                setIdMsg({ text : "이미 사용중인 아이디입니다.", color: "text-red-500"});
                setIsIdChecked(false);
            }
        } catch (error) {
        setIdMsg({ text: '서버 통신 오류가 발생했습니다.', color: 'text-red-500' });
        }
    };

    const handleEmailCheck = async () => {
        if (!formData.email) return;
        
        // 이메일 형식 검사 (간단한 정규식)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setEmailMsg({ text: "⚠️ 올바른 이메일 형식이 아닙니다. ⚠️", color: "text-red-500" });
            return;
        }

        try {
            const response = await api.get('/api/auth/check-email', { params: { email: formData.email } });
            if (response.data.success) {
                setEmailMsg({ text: "사용 가능한 이메일입니다.", color: "text-green-600" });
            } else {
                setEmailMsg({ text: response.data.message, color: "text-red-500" });
            }
        } catch (e) {
            setEmailMsg({ text: "⚠️ 중복 확인 중 오류 발생 ⚠️", color: "text-red-500" });
        }
    };
    
    // 휴대폰 번호 포맷팅
    const handlePhoneFormat = (e) => {
        const input = e.target;
        const cursorPos = input.selectionStart;
        const oldVal = input.value;
        const oldHyphens = (oldVal.slice(0, cursorPos).match(/-/g) || []).length;

        let val = e.target.value.replace(/[^0-9]/g, "");
        if (val.length > 3 && val.length <= 7) val = val.slice(0, 3) + "-" + val.slice(3);
        else if (val.length > 7) val = val.slice(0, 3) + "-" + val.slice(3, 7) + "-" + val.slice(7);

        const newHyphens = (val.slice(0, cursorPos).match(/-/g) || []).length;
        const newPos = cursorPos + (newHyphens - oldHyphens);

        setFormData({ ...formData, phone: val });
        // ★ 최적화: 13자(포맷 완료)가 되면 자동으로 중복 체크 실행
        if (val.length === 13) {
            checkDuplicatePhone(val);
        } else {
            setPhoneMsg({ text: '', color: '' }); // 번호 지우면 메시지도 삭제
        }

        requestAnimationFrame(() => {
            if (phoneRef.current) {
                phoneRef.current.setSelectionRange(newPos, newPos);
            }
        });
    };
    // 자격증 번호 5자리 숫자 고정 핸들러
    const handleLicenseChange = (e) => {
        const { value } = e.target;
        // 1. 숫자가 아닌 값은 들어오지 않겠지만, 혹시 모를 상황을 대비해 빈 값 처리
        // 2. 최대 5자리까지만 상태값(state) 업데이트
        if (value.length <= 5){
            setFormData({
                ...formData,
                licenseNo: value
            });
        }
    };

    const checkDuplicatePhone = async (phoneVal) => {
        try {
            const response = await api.get('/api/auth/check-phone', { params: { phone: phoneVal } });
            if (response.data.success) {
                setPhoneMsg({ text: "가입 가능한 번호입니다.", color: "text-green-600" });
            } else {
                setPhoneMsg({ text: response.data.message, color: "text-red-500" });
            }
        } catch (e) {
            setPhoneMsg({ text: "번호 중복 확인 실패", color: "text-red-500" });
        }
    };

    // 전문분야 체크박스 처리 
    const handleSpecialtyChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setSpecialties([...specialties, value]);
        } else {
            setSpecialties(specialties.filter(item => item !== value));
        }
    };

    // 파일 업로드 처리
    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // 최종 회원가입 요청
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isIdChecked) return alert("아이디 중복 확인이 필요합니다.");
        if (formData.userPw !== formData.confirmPassword) return alert("비밀번호가 일치하지 않습니다.");
        if (role === 'lawyer') {
            if (formData.licenseNo.length !== 5) {
                alert("자격증 번호 5자리를 정확하게 입력해야 회원가입이 가능합니다.");
                return; // API 호출 중단
            }
        }
        setIsSubmitting(true); // 로딩 시작

        // FormData 객체 생성 (파일 업로드 때문에 필수!)
        const submitData = new FormData();
        // 기본 정보 append
        submitData.append("userId", formData.userId);
        submitData.append("userPw", formData.userPw);
        submitData.append("userNm", formData.userNm);
        submitData.append("phone", formData.phone);
        submitData.append("email", formData.email);
        submitData.append("roleCode", role === 'client' ? 'ROLE_USER' : 'ROLE_LAWYER'); 

        // ★  일반 유저일 때만 닉네임 전송 ★
        if (role === 'client') {
            if (!formData.nickNm) return alert("닉네임을 입력해주세요.");
            submitData.append("nickNm", formData.nickNm);
        }

        // 변호사일 경우 추가 정보 append
        if (role === 'lawyer') {
            submitData.append("licenseNo", formData.licenseNo);
            submitData.append("examType", formData.examType);
            submitData.append("officeName", formData.officeName);
            submitData.append("officeAddr", formData.officeAddr);
            // 자기소개를 자동 인사말로 처리하기..
            const defaultIntro = `안녕하세요. 변호사 ${formData.userNm}입니다.`;
            submitData.append("introText", defaultIntro);
            submitData.append("specialtyStr", specialties.join(",")); // 배열을 문자열로
            if (selectedFile) {
                submitData.append("licenseFile", selectedFile); // 파일 객체
            }
        }


            // Content-Type은 axios가 알아서 multipart/form-data로 설정함
            try {
            // 3. axios 호출 시 헤더를 명시적으로 설정해줍니다.
            await api.post('/api/auth/join', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data' // ★ JSON이 아닌 Form-Data임을 명시! ★ 제일 중요함..
                }
            });

            alert(role === 'lawyer' ? "전문가 심사 요청이 완료되었습니다." : "회원가입이 완료되었습니다!");
            navigate('/');
        } catch (error) {
            // 에러 로그 확인용
            toast.error(error.response?.data?.message || "회원가입에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ★ 스타일 변수 (LoginPage와 크기 통일 - Golden Ratio)
    const inputStyle = "w-full px-4 py-3 bg-slate-100/50 border border-transparent rounded-2xl input-focus outline-none transition-all font-bold text-sm text-slate-700 placeholder:text-slate-400";
    const labelStyle = "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1";

    return (
        <main className="w-full flex flex-col items-center justify-start py-12 relative bg-mesh min-h-screen">
            {/* 배경 장식 */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>

            {/* 카드 박스 (max-w-[500px]로 로그인 페이지와 폭 통일) */}
            <div className="max-w-[500px] w-full glass-card p-10 border border-white relative z-10 animate-fade-in">
                
                {/* 아이콘 */}
                <div className="flex justify-center items-center mb-6">
                    <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 8L15 13M30 8L25 13M20 18V32M12 25C12 25 15 28 20 28C25 28 28 25 28 25M8 15L32 15" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">회원가입</h2>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Premium Legal Tech Platform</p>
                </div>

                {/* 1. 회원 유형 선택 (Segmented Control) */}
                <div className="relative flex mb-8 p-1 bg-slate-100 rounded-2xl w-full h-12">
                    {/* ★ 무빙 배경 바 (이 녀석이 움직입니다) */}
                    <div 
                        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out z-0 ${
                            role === 'lawyer' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'
                        }`}
                    ></div>
                    
                    {/* 버튼들: z-10을 줘서 글씨가 배경 바 위로 올라오게 합니다. */}
                    <button 
                        type="button"
                        onClick={() => setRole('client')} 
                        className={`flex-1 relative z-10 text-xs font-black transition-colors duration-300 ${
                            role === 'client' ? 'text-slate-900' : 'text-slate-400'
                        }`}
                    >
                        의뢰인 가입
                    </button>
                    <button 
                        type="button"
                        onClick={() => setRole('lawyer')} 
                        className={`flex-1 relative z-10 text-xs font-black transition-colors duration-300 ${
                            role === 'lawyer' ? 'text-slate-900' : 'text-slate-400'
                        }`}
                    >
                        변호사 회원 가입
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* [공통 정보] */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">기본 정보</h3>
                        
                        {/* 아이디 */}
                        <div className="space-y-1">
                            <label className={labelStyle}>User ID</label>
                            <div className="flex gap-2">
                                <input type="text" name="userId" required placeholder="영문/숫자 조합" className={inputStyle} onChange={handleChange} />
                                <button type="button" onClick={checkDuplicateID} className="px-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold hover:bg-blue-900 whitespace-nowrap">중복 확인</button>
                            </div>
                            <p className={`text-[10px] font-bold ml-1 mt-1 ${idMsg.color}`}>{idMsg.text}</p>
                        </div>

                        {/* 비밀번호 & 확인 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className={labelStyle}>Password</label>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        name="userPw"
                                        required
                                        placeholder="8자 이상"
                                        className={inputStyle}
                                        style={{ WebkitAppearance: 'none' }}
                                        onChange={handleChange}
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className={labelStyle}>Confirm</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPw ? 'text' : 'password'}
                                        name="confirmPassword"
                                        required
                                        placeholder="재입력"
                                        className={inputStyle}
                                        style={{ WebkitAppearance: 'none' }}
                                        onChange={handleChange}
                                    />
                                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        {showConfirmPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {pwMsg && <p className={`text-[10px] font-bold ml-1 ${pwMsg.includes('일치합니다') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>}

                        {/* 이름 & 전화번호 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className={labelStyle}>Name</label>
                                <input type="text" name="userNm" required placeholder="성함" className={inputStyle} onChange={handleChange} />
                            </div>
                            <div className="space-y-1">
                                <label className={labelStyle}>Phone</label>
                                <input 
                                    type="text" 
                                    name="phone" 
                                    required 
                                    placeholder="010-0000-0000" 
                                    value={formData.phone} 
                                    className={inputStyle} 
                                    onChange={handlePhoneFormat} // ★ 입력 중 포맷팅 + 자동 체크
                                    maxLength="13"
                                    ref={phoneRef}
                                />
                                {phoneMsg.text && <p className={`text-[10px] font-bold ml-1 ${phoneMsg.color}`}>{phoneMsg.text}</p>}
                            </div>
                        </div>

                        {role === 'client' && (
                            <div className="space-y-1 animate-fade-in">
                                <label className={labelStyle}>Nickname</label>
                                <input 
                                    type="text" 
                                    name="nickNm" 
                                    required 
                                    placeholder="활동명 (별명)" 
                                    className={inputStyle} 
                                    onChange={handleChange} 
                                />
                                <p className="text-[10px] text-slate-400 ml-1 font-bold">
                                    * 커뮤니티 활동 시 사용될 별명입니다.
                                </p>
                            </div>
                        )}
                        {/* 이메일 */}
                        <div className="space-y-1">
                            <label className={labelStyle}>Email Address</label>
                            <input 
                                type="email" 
                                name="email" 
                                required 
                                placeholder="example@email.ai" 
                                className={inputStyle} 
                                onChange={handleChange}
                                onBlur={handleEmailCheck} // ★ 칸을 벗어날 때 실행!
                            />
                            {emailMsg.text && <p className={`text-[10px] font-bold ml-1 ${emailMsg.color}`}>{emailMsg.text}</p>}
                        </div>

                    </div>


                    {/* [변호사 전용 정보] - role이 lawyer일 때만 보임 */}
                    {role === 'lawyer' && (
                        <div className="space-y-4 pt-4 border-t-2 border-blue-50 animate-fade-in">
                            <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest border-b border-blue-50 pb-2">전문가 상세 정보</h3>
                            
                            <div className="grid grid-cols-2 gap-3">

                                <div className="space-y-1">
                                    <label className={`${labelStyle} text-blue-900`}>License No</label>
                                    <input 
                                        type="number" 
                                        name="licenseNo" 
                                        placeholder="5자리 숫자" 
                                        className={inputStyle}
                                        value={formData.licenseNo} 
                                        onChange={handleLicenseChange}
                                        // onInput을 사용하면 화살표 버튼으로 숫자를 올릴 때도 5자리 제한이 가능합니다.
                                        onInput={(e) => {
                                            if (e.target.value.length > 5) {
                                                e.target.value = e.target.value.slice(0, 5);
                                            }
                                        }}
                                    />
                                    <p className="text-[10px] text-slate-400 ml-1 font-bold">
                                        * 자격증 번호 5자리를 반드시 입력해 주세요.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <label className={`${labelStyle} text-blue-900`}>Origin</label>
                                    <select name="examType" className={inputStyle} onChange={handleChange}>
                                        <option value="">출신 선택</option>
                                        <option value="BAR EXAM">사법고시</option>
                                        <option value="LAW SCHOOL">로스쿨</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={`${labelStyle} text-blue-900`}>Office Name</label>
                                <input type="text" name="officeName" placeholder="법률사무소 명칭" className={inputStyle} onChange={handleChange} />
                            </div>

                            <div className="space-y-1">
                                <label className={`${labelStyle} text-blue-900`}>Office Address</label>
                                <input type="text" name="officeAddr" placeholder="법률사무소 주소" className={inputStyle} onChange={handleChange} />
                            </div>
                            
                            {/* 전문 분야 (4열 그리드) */}
                            <div className="grid grid-cols-4 gap-3">
                                {legalCategories.map((field) => (
                                    <label key={field.label} className="relative cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        value={field.label} 
                                        checked={specialties.includes(field.label)} 
                                        onChange={handleSpecialtyChange} 
                                        className="hidden peer" 
                                    />
                                    
                                    {/* 메인 카드 박스 */}
                                    <div className="flex flex-col items-center justify-center p-3 h-24 rounded-2xl border-2 border-slate-100 bg-white transition-all duration-300
                                        hover:border-blue-200 hover:bg-blue-50/20
                                        peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:ring-4 peer-checked:ring-blue-100/50 peer-checked:scale-[1.02]">
                                        
                                        {/* 선택 시 나타나는 우측 상단 체크 배지 */}
                                        <div className="absolute top-2 right-2 opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-300 z-10">
                                        <div className="bg-blue-600 rounded-full p-1 shadow-sm">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                        </div>

                                        {/* 아이콘: 선택 시 테마 색상 적용 */}
                                        <div className={`mb-1.5 transition-transform duration-300 ${field.color} peer-checked:text-blue-800`}>
                                            <i className={`fas ${field.icon} text-xl`}></i>
                                        </div>
                                        
                                        {/* 라벨 텍스트: 선택 시 강조 */}
                                        <span className="text-[11.5px] font-bold leading-tight text-center text-slate-700 peer-checked:text-blue-900 tracking-tight transition-colors">
                                        {field.label}
                                        </span>
                                    </div>
                                    </label>
                                ))}
                            </div>


                            {/* 파일 업로드 */}
                            <div className="space-y-1">
                                <label className={`${labelStyle} text-blue-900`}>License File</label>
                                <div className="flex items-center gap-3">
                                    <label htmlFor="license-file" className="bg-blue-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold cursor-pointer hover:bg-black transition-all">
                                        파일 선택
                                    </label>
                                    <input type="file" id="license-file" className="hidden" accept=".jpg,.png,.pdf" onChange={handleFileChange} />
                                    <span className="text-xs font-bold text-slate-400 truncate max-w-[200px]">
                                        {selectedFile ? selectedFile.name : "IMG, JPG, PDF 파일만 업로드 가능합니다."}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 약관 동의 */}
                    <div className="pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" required className="w-4 h-4 rounded border-slate-300 text-blue-900" />
                            <span className="text-[10px] font-bold text-slate-600">(필수) 서비스 이용약관 동의</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" required className="w-4 h-4 rounded border-slate-300 text-blue-900" />
                            <span className="text-[10px] font-bold text-slate-600">(필수) 개인정보 수집 동의</span>
                        </label>
                    </div>

                    {/* 제출 버튼 */}
                    <button 
                        type="submit" 
                        // 제출 중 버튼 비활성화
                        disabled={isSubmitting} 
                        className="w-full bg-blue-900 text-white py-3.5 rounded-2xl font-black text-base shadow-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? '처리 중...' : (role === 'lawyer' ? '전문가 심사 요청하기' : '회원가입 하기')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-xs font-medium">이미 계정이 있으신가요? 
                        <button onClick={() => navigate('/')} className="ml-2 font-black text-blue-900 hover:underline underline-offset-4">로그인하기</button>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default SignupPage;
