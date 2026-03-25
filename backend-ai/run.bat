@echo off
REM Avoid chcp 65001 and non-ASCII echo: Korean Windows cmd can mangle UTF-8 and break the next line.
REM run_all.bat은 새 cmd 창에서 실행됨 → 지연 확장(!VAR!)은 꺼져 있을 수 있음 → %~dp0 직접 사용, if () 대신 goto
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
:: Chroma/ONNX 등 네이티브 라이브러리가 Windows에서 불안정할 때 완화
set OMP_NUM_THREADS=1
set TOKENIZERS_PARALLELISM=false
:: Chroma similarity_search 직후 Uvicorn이 죽는다면 아래 주석 제거(판례 검색 없이 LLM만 사용):
:: set RAG_DISABLE=1
if not exist venv python -m venv venv
call venv\Scripts\activate

REM First run only: pip (delete .deps_ok if requirements.txt changed)
if exist ".deps_ok" goto skip_pip
echo [backend-ai] First run: pip install -r requirements.txt ...
"%~dp0venv\Scripts\python.exe" -m pip install -r requirements.txt
echo ok> .deps_ok
goto after_pip
:skip_pip
echo [backend-ai] pip skipped - .deps_ok exists. Delete .deps_ok to reinstall deps.
:after_pip

REM No --reload. Auto-restart on exit.
:loop
"%~dp0venv\Scripts\python.exe" "%~dp0tools\patch_chromadb_skip_default_onnx.py"
echo [backend-ai] Starting Uvicorn 0.0.0.0:8000 ...
"%~dp0venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
echo [WARN] Uvicorn exited. Restart in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop
