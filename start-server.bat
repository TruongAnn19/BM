@echo off
title AES Cipher Tool - Server
color 0A
cd /d "%~dp0"

echo.
echo  ========================================
echo    AES CIPHER TOOL - SERVER
echo  ========================================
echo    http://localhost:8080
echo    Giu cua so nay mo de server hoat dong
echo  ========================================
echo.

:: Check aes.exe
if not exist "%~dp0aes.exe" (
    echo  [CANH BAO] aes.exe chua ton tai, dang build...
    powershell -ExecutionPolicy Bypass -File "%~dp0compile.ps1"
    if errorlevel 1 (
        echo  [LOI] Build that bai!
        pause
        exit /b 1
    )
)

echo  [OK] aes.exe san sang

:: Auto open browser after 2 seconds
start "" /b cmd /c "timeout /t 2 /nobreak >nul 2>&1 && start http://localhost:8080"

:: Start server using full path to NVM node
echo  [OK] Dang khoi dong server (Ctrl+C de dung)...
echo.
"C:\nvm4w\nodejs\node.exe" "%~dp0server.js"

echo.
echo  Server da dung.
pause
