@echo off
TITLE Stop NoteNest
COLOR 0C

echo =========================================
echo          STOPPING NOTENEST
echo =========================================
echo.

echo [INFO] Stopping all Node.js server instances...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo NoteNest server stopped successfully!
echo.
pause
