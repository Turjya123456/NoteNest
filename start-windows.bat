@echo off
TITLE NoteNest Launcher
COLOR 0A

echo =========================================
echo          NOTENEST APP LAUNCHER
echo =========================================
echo.

:: 1. Check if Node.js is installed
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    echo ERROR: Node.js is not installed or not found in PATH!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b
)

:: 2. Check if dependencies are installed
IF NOT EXIST "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
)

:: 3. Start the server
echo [INFO] Starting the local server on port 3000...
:: We use start /B to run it in the background of this command window
start /B npm run start >nul 2>&1

:: 4. Wait briefly for the server to start
echo [INFO] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

:: 5. Open the browser
echo [INFO] Opening NoteNest in your default browser...
start http://localhost:3000

echo.
echo =========================================
echo   NoteNest is successfully running!
echo   Keep this window open to use the app.
echo.
echo   To stop the server, close this window
echo   or run stop-windows.bat.
echo =========================================
echo.

:: Keep the command window open so the background task continues running
cmd /k
