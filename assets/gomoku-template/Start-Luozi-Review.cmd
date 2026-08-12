@echo off
setlocal
set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js 22 or newer, then run this file again.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm was not found. Run: npm install -g pnpm
  pause
  exit /b 1
)

echo Preparing required packages...
call pnpm install --frozen-lockfile --config.strict-dep-builds=false
if errorlevel 1 (
  echo Installation failed.
  pause
  exit /b 1
)

call pnpm rebuild --pending
if errorlevel 1 (
  echo Dependency setup failed.
  pause
  exit /b 1
)

start "Rapfi Engine PV5" cmd /k "cd /d ""%~dp0"" && pnpm bridge:pv5"
timeout /t 2 /nobreak >nul
start "Luozi Review PV5" cmd /k "cd /d ""%~dp0"" && pnpm dev:pv5"
timeout /t 4 /nobreak >nul
start "" http://localhost:3015
