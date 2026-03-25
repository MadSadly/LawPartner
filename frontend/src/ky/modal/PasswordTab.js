import React, { useState } from 'react';
import api from '../../common/api/axiosConfig';
import { logout } from '../../common/utils/logout';

const PasswordTab = () => {
    const [passwordData, setPasswordData] = useState({

        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    //

    const handleSave = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        try {
            await api.put('/api/mypage/password', {
                oldPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            alert('비밀번호가 변경되었습니다. 보안을 위해 다시 로그인해주세요.');
            await logout();
        } catch (err) {
            const msg = err.response?.data?.message || '비밀번호 변경에 실패했습니다.';
            alert(msg);
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>
            <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                비밀번호 변경하기
            </button>
        </div>
    );
};

export default PasswordTab;
