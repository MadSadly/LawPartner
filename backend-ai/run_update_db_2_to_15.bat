@echo off
chcp 65001 > nul
echo ========================================
echo [update_db] 세그먼트 2~15 순차 실행
echo 각 세그먼트마다 20분 대기
echo ========================================
echo.

cd /d "%~dp0"

if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo [안내] venv 폴더가 없습니다. 시스템 Python을 사용합니다.
)

for %%i in (2 3 4 5 6 7 8 9 10 11 12 13 14 15) do (
    echo.
    echo [%date% %time%] 세그먼트 %%i 실행 중...
    python update_db.py %%i
    if errorlevel 1 (
        echo [오류] 세그먼트 %%i 실패. 종료합니다.
        pause
        exit /b 1
    )
    if not "%%i"=="15" (
        echo.
        echo [%date% %time%] 다음 세그먼트까지 20분 대기 중... (Ctrl+C로 중단 가능)
        timeout /t 1200 /nobreak
    )
)

echo.
echo ========================================
echo ✅ 세그먼트 2~15 모두 완료!
echo ========================================
pause
