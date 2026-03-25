@echo off
chcp 65001 > nul
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
if not exist venv python -m venv venv
call venv\Scripts\activate
python -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --reload --port 8000
pause
