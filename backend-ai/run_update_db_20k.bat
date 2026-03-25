@echo off
REM KLAID ~20k source records: segment 1 (0-9999) then segment 2 (10000-19999)
REM TOTAL_RECORDS in update_db.py must be 20000
cd /d "%~dp0"

if exist venv\Scripts\activate.bat (
  call venv\Scripts\activate.bat
) else (
  echo [WARN] venv not found, using system Python.
)

echo.
echo [prep] chromadb import patch (skip default ONNX; Gemini embeddings only) ...
python tools\patch_chromadb_skip_default_onnx.py
if errorlevel 1 (
  echo [ERROR] tools\patch_chromadb_skip_default_onnx.py failed.
  pause
  exit /b 1
)

echo.
echo [1/2] update_db.py 1 ...
python update_db.py 1
if errorlevel 1 (
  echo [ERROR] segment 1 failed.
  pause
  exit /b 1
)

echo.
echo [2/2] update_db.py 2 ...
python update_db.py 2
if errorlevel 1 (
  echo [ERROR] segment 2 failed.
  pause
  exit /b 1
)

echo.
echo Done. Chroma DB is under .\db (about 20k source rows embedded as chunks).
pause
