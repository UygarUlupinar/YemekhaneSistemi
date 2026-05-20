@echo off
echo Eski sunucu islemleri temizleniyor...
taskkill /F /IM node.exe >nul 2>&1
echo Yemekhane Backend Sunucusu Baslatiliyor...
echo.
cd /d "%~dp0"
call npm run dev
pause
