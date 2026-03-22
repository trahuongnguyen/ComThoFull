@echo off
chcp 65001 >nul 2>&1
title RestoPOS - Khoi dong he thong

cls
echo.
echo  =========================================================
echo    RESTOPOS - HE THONG QUAN LY NHA HANG
echo  =========================================================
echo.

cd /d "%~dp0"

:: ────────────────────────────────────────────────────────────
:: BUOC 1 — Kiem tra Docker Desktop da duoc cai dat chua
:: ────────────────────────────────────────────────────────────
echo  [1/5] Kiem tra Docker Desktop...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [LOI] Docker Desktop chua duoc cai dat!
    echo.
    echo  Vui long lam theo cac buoc sau:
    echo    1. Truy cap: https://www.docker.com/products/docker-desktop
    echo    2. Nhan "Download for Windows" va cai dat
    echo    3. Khoi dong lai may tinh
    echo    4. Mo lai file nay
    echo.
    start https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo     Docker Desktop da duoc cai dat.

:: ────────────────────────────────────────────────────────────
:: BUOC 2 — Kiem tra Docker Engine dang chay
:: ────────────────────────────────────────────────────────────
echo  [2/5] Kiem tra Docker dang chay...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo     Docker chua chay. Dang mo Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" >nul 2>&1

    set /a WAITED=0
    :WAIT_DOCKER
        timeout /t 4 /nobreak >nul
        docker info >nul 2>&1
        if %ERRORLEVEL% EQU 0 goto DOCKER_OK
        set /a WAITED+=4
        if %WAITED% LSS 3 echo     Dang cho Docker khoi dong...
        if %WAITED% EQU 12 echo     Dang cho Docker khoi dong (co the mat 1-2 phut lan dau)...
        if %WAITED% EQU 40 echo     Van dang cho, vui long doi them...
        if %WAITED% LSS 90 goto WAIT_DOCKER

    echo.
    echo  [LOI] Khong the ket noi toi Docker Desktop sau 90 giay.
    echo.
    echo  Vui long:
    echo    1. Mo Docker Desktop thu cong (bieu tuong Docker tren Desktop)
    echo    2. Doi cho den khi bieu tuong Docker trong thanh taskbar hien
    echo       chu "Docker Desktop is running"
    echo    3. Chay lai file nay
    echo.
    pause
    exit /b 1
)
:DOCKER_OK
echo     Docker dang chay.

:: ────────────────────────────────────────────────────────────
:: BUOC 3 — Nan anh ung dung (chi can 1 lan)
:: ────────────────────────────────────────────────────────────
echo  [3/5] Kiem tra image ung dung...
docker image inspect comtho-backend:latest >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if not exist "images.tar" (
        echo.
        echo  [LOI] Khong tim thay file images.tar!
        echo.
        echo  File nay can nam cung thu muc voi start.bat.
        echo  Vui long lien he ky thuat vien de duoc cung cap lai file.
        echo.
        pause
        exit /b 1
    )
    echo     Lan dau chay: dang nan du lieu ung dung (co the mat 3-5 phut)...
    echo     Vui long KHONG tat cua so nay...
    docker load -i images.tar
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  [LOI] Nan du lieu that bai!
        echo  Vui long lien he ky thuat vien.
        pause
        exit /b 1
    )
    echo     Nan du lieu thanh cong.
) else (
    echo     Image ung dung san sang.
)

:: ────────────────────────────────────────────────────────────
:: BUOC 4 — Khoi dong ung dung
:: ────────────────────────────────────────────────────────────
echo  [4/5] Khoi dong RestoPOS...
docker compose up -d >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [LOI] Khoi dong that bai. Chi tiet loi:
    docker compose up -d
    echo.
    echo  Vui long chup man hinh va lien he ky thuat vien.
    pause
    exit /b 1
)
echo     Cac dich vu da duoc khoi dong.

:: ────────────────────────────────────────────────────────────
:: BUOC 5 — Cho ung dung san sang
:: ────────────────────────────────────────────────────────────
echo  [5/5] Dang cho he thong khoi tao...
set /a WAITED=0
:WAIT_APP
    timeout /t 3 /nobreak >nul
    curl -s -o nul -w "%%{http_code}" http://localhost/health 2>nul | findstr /R "^200$" >nul 2>&1
    if %ERRORLEVEL% EQU 0 goto APP_READY
    set /a WAITED+=3
    if %WAITED% EQU 15 echo     Dang khoi tao co so du lieu...
    if %WAITED% EQU 30 echo     Dang tai du lieu ban dau...
    if %WAITED% EQU 60 echo     Gan xong roi, vui long cho them...
    if %WAITED% LSS 120 goto WAIT_APP

    echo     He thong mat nhieu thoi gian khoi dong. Dang mo trinh duyet...

:APP_READY
echo.
echo  =========================================================
echo    HE THONG DA SAN SANG!
echo  =========================================================
echo.
echo    Dia chi truy cap : http://localhost
echo.
echo    Tai khoan quan tri : systemAdmin / systemAdmin
echo    Tai khoan nhan vien: employee   / employee
echo.
echo    De TAT he thong, chay file: stop.bat
echo  =========================================================
echo.

timeout /t 2 /nobreak >nul
start http://localhost

echo  Nhan phim bat ky de dong cua so nay...
echo  (He thong van chay binh thuong o nen)
pause >nul
