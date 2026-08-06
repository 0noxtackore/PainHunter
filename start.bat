@echo off
title PainHunter - Mr Hunter
cd /d "%~dp0"

if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting local AI (Mr Hunter)...
start "Mr Hunter - Local AI" cmd /k "cd /d %~dp0server && call start-ai.bat"

echo.
echo Starting the app at http://localhost:5173
echo Wait for the local AI to finish starting up in its window.
echo.
call npm run dev
