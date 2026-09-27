@echo off
TITLE Create NoteNest Shortcut
COLOR 0B

echo =========================================
echo     CREATING NOTENEST DESKTOP SHORTCUT
echo =========================================
echo.

:: Define the temporary VBS script file
set SCRIPT="%TEMP%\%RANDOM%_shortcut.vbs"

:: Generate the VBScript commands
echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\NoteNest.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0start-windows.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "Start NoteNest Personal Notebook" >> %SCRIPT%
:: Using a built-in Windows icon (a notebook/folder icon from shell32.dll)
echo oLink.IconLocation = "%%SystemRoot%%\System32\shell32.dll,130" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

:: Execute the VBScript silently
cscript /nologo %SCRIPT%

:: Clean up the temporary VBScript
del %SCRIPT%

echo [SUCCESS] A shortcut named "NoteNest" has been created on your Desktop!
echo You can now double-click it anytime to launch the application.
echo.
pause
