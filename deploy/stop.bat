@echo off
chcp 65001 >nul 2>&1
title RestoPOS - Dung he thong

cd /d "%~dp0"

cls
echo.
echo  =========================================================
echo    RESTOPOS - DANG DUNG HE THONG...
echo  =========================================================
echo.

docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  Docker khong chay. He thong co the da duoc tat tu truoc.
    pause
    exit /b 0
)

echo  Dang dung tat ca dich vu...
docker compose down

echo.
echo  =========================================================
echo    He thong da duoc tat thanh cong.
echo    Du lieu cua ban da duoc luu tru an toan.
echo  =========================================================
echo.
echo  De chay lai, mo file: start.bat
echo.
pause
