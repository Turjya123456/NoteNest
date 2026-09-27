@echo off
TITLE NoteNest - Installer & Launcher
COLOR 0B
cls

echo.
echo  ====================================================
echo      🪺  NoteNest - Personal Notebook App
echo  ====================================================
echo.

:: ── Step 1: Check Node.js ──────────────────────────────
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    echo  [!] Node.js is NOT installed on this computer.
    echo.
    echo  Please follow these steps:
    echo.
    echo  1. Open your browser and go to: https://nodejs.org
    echo  2. Download the LTS version (the green button)
    echo  3. Install it (just click Next, Next, Finish)
    echo  4. Restart your computer
    echo  5. Then double-click this file again
    echo.
    pause
    exit /b 1
)

FOR /F "tokens=*" %%v IN ('node -v') DO SET NODEVER=%%v
echo  [OK] Node.js found: %NODEVER%

:: ── Step 2: Install dependencies (only first time) ──────
IF NOT EXIST "node_modules\" (
    echo.
    echo  [*] First-time setup: Installing app dependencies...
    echo      (This may take 1-2 minutes, please wait...)
    echo.
    call npm install --silent
    IF %ERRORLEVEL% NEQ 0 (
        COLOR 0C
        echo  [!] Failed to install dependencies.
        echo      Make sure you have an internet connection.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed successfully!
) ELSE (
    echo  [OK] Dependencies already installed.
)

:: ── Step 3: Create data folder if missing ───────────────
IF NOT EXIST "data\" mkdir data
echo  [OK] Data folder ready.

:: ── Step 4: Start the server ────────────────────────────
echo.
echo  [*] Starting NoteNest server...
start /B node server.js >nul 2>&1
timeout /t 2 /nobreak >nul

:: ── Step 5: Check server started ok ────────────────────
curl -s http://localhost:2004 >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    timeout /t 2 /nobreak >nul
)

:: ── Step 6: Open browser ────────────────────────────────
echo  [*] Opening NoteNest in your browser...
start http://localhost:2004

echo.
echo  ====================================================
echo   ✅  NoteNest is running!
echo.
echo   📌 Open in browser: http://localhost:2004
echo.
echo   👤 First time? Click "Create Account" to sign up
echo   🔑 Admin login:  admin / admin123
echo.
echo   ⚠️  Keep this window open while using the app.
echo      Close this window to stop the server.
echo  ====================================================
echo.
cmd /k
