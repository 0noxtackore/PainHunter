@echo off
title Mr Hunter - Local AI (Python)
cd /d "%~dp0"

if not exist venv (
    echo Creating Python virtual environment...
    py -m venv venv
)

call venv\Scripts\activate.bat

echo Installing dependencies (first time takes a few minutes)...
python -m pip install --quiet --upgrade pip
python -m pip install --quiet --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu "llama-cpp-python"
python -m pip install --quiet -r requirements.txt

if not exist models\qwen2.5-0.5b-instruct-q4_k_m.gguf (
    echo.
    echo Downloading the Qwen 0.5B model, about 470 MB...
    python scripts\download_model.py 0.5b
)

echo.
echo Starting Mr Hunter (local AI) at http://localhost:8000
echo Keep this window open while you use the app.
echo.
python app.py

pause
