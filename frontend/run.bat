@echo off
chcp 65001 > nul
echo React 프론트엔드 시작 중...

set "FRONT_DIR=%~dp0"
cd /d "%FRONT_DIR%"
set HOST=0.0.0.0
set PORT=3000
npm start