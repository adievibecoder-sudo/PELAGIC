@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required. Install it from https://nodejs.org/
  pause
  exit /b 1
)
echo Open http://127.0.0.1:8080/ in current Chrome or Edge.
echo Press Ctrl+C here to stop the local server.
node server.mjs
pause
