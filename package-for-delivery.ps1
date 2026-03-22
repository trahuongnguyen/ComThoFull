<#
.SYNOPSIS
    Build Docker images and create a delivery package for end customers.

.DESCRIPTION
    1. Builds comtho-backend and comtho-frontend Docker images
    2. Exports them into deploy/images.tar
    3. Zips deploy/ into a versioned delivery archive

.PARAMETER Version
    Version tag for the delivery package (default: current date YYYYMMDD)

.EXAMPLE
    .\package-for-delivery.ps1
    .\package-for-delivery.ps1 -Version "1.0.0"
#>

param(
    [string]$Version = (Get-Date -Format "yyyyMMdd")
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ComTho — Tao goi phan phoi cho khach hang" -ForegroundColor Cyan
Write-Host "  Phien ban: $Version" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Kiem tra file .env ────────────────────────────────────────────────────
Write-Host "[0/4] Kiem tra file .env..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "  [LOI] Khong tim thay file .env o thu muc goc!" -ForegroundColor Red
    Write-Host "  Chay lenh sau de tao file .env tu mau:" -ForegroundColor Yellow
    Write-Host "    Copy-Item .env.example .env" -ForegroundColor White
    Write-Host "  Sau do chinh sua .env voi mat khau thuc te." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if (-not (Test-Path "deploy\.env")) {
    Write-Host ""
    Write-Host "  [LOI] Khong tim thay file deploy\.env!" -ForegroundColor Red
    Write-Host "  Chay lenh sau de tao file tu mau:" -ForegroundColor Yellow
    Write-Host "    Copy-Item deploy\.env.example deploy\.env" -ForegroundColor White
    Write-Host "  Sau do chinh sua deploy\.env voi mat khau thuc te." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "  OK: Ca hai file .env deu ton tai." -ForegroundColor Green

# ── 1. Check Docker ──────────────────────────────────────────────────────────
Write-Host "[1/4] Kiem tra Docker..." -ForegroundColor Yellow
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker Desktop chua chay. Vui long mo Docker Desktop truoc."
}
Write-Host "  OK: Docker dang chay." -ForegroundColor Green

# ── 2. Build images ──────────────────────────────────────────────────────────
Write-Host "[2/4] Build Docker images (co the mat 5-15 phut lan dau)..." -ForegroundColor Yellow
docker compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build that bai. Xem loi o tren."
}
Write-Host "  OK: Build thanh cong." -ForegroundColor Green

# ── 3. Export images to tar ──────────────────────────────────────────────────
Write-Host "[3/4] Xuat images ra file tar..." -ForegroundColor Yellow
$tarPath = "deploy\images.tar"
docker save comtho-backend:latest comtho-frontend:latest -o $tarPath
if ($LASTEXITCODE -ne 0) {
    Write-Error "Xuat images that bai."
}
$sizeMB = [math]::Round((Get-Item $tarPath).Length / 1MB, 1)
Write-Host "  OK: Xuat thanh cong ($sizeMB MB)." -ForegroundColor Green

# ── 4. Zip deploy/ folder ────────────────────────────────────────────────────
Write-Host "[4/4] Dong goi thu muc deploy/..." -ForegroundColor Yellow
$zipName = "RestoP0S-v$Version.zip"
if (Test-Path $zipName) { Remove-Item $zipName -Force }
Compress-Archive -Path "deploy\*" -DestinationPath $zipName
Write-Host "  OK: Da tao $zipName" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  HOAN TAT!" -ForegroundColor Green
Write-Host ""
Write-Host "  File giao hang: $zipName"
Write-Host "  Kich thuoc    : $([math]::Round((Get-Item $zipName).Length / 1MB, 1)) MB"
Write-Host ""
Write-Host "  Huong dan giao cho khach hang:"
Write-Host "    1. Gui file $zipName cho khach"
Write-Host "    2. Khach giai nen vao 1 thu muc bat ky"
Write-Host "    3. Khach double-click vao start.bat"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
