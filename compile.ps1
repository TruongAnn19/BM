# compile.ps1
# Biên dịch main.cpp thành aes.exe
# Sử dụng: .\compile.ps1

$ErrorActionPreference = "Stop"
$SRC  = "main.cpp"
$OUT  = "aes.exe"

Write-Host ""
Write-Host "=== AES Cipher Tool - Build Script ===" -ForegroundColor Cyan
Write-Host ""

# 1. Tìm compiler g++
function Find-GPP {
    $candidates = @(
        "g++",
        "C:\msys64\mingw64\bin\g++.exe",
        "C:\msys64\ucrt64\bin\g++.exe",
        "C:\MinGW\bin\g++.exe",
        "C:\MinGW64\bin\g++.exe",
        "C:\Program Files\mingw-w64\x86_64-8.1.0-posix-seh-rt_v6-rev0\mingw64\bin\g++.exe"
    )
    foreach ($c in $candidates) {
        try {
            $v = & $c --version 2>&1 | Select-Object -First 1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Tìm thấy compiler: $c" -ForegroundColor Green
                Write-Host "  Version: $v" -ForegroundColor Gray
                return $c
            }
        } catch {}
    }
    return $null
}

# Add MSYS2 to PATH so g++ DLLs are found
$env:PATH = "C:\msys64\ucrt64\bin;C:\msys64\usr\bin;" + $env:PATH

$gpp = Find-GPP

if (-not $gpp) {
    Write-Host "Không tìm thấy g++. Cài MinGW:" -ForegroundColor Red
    Write-Host "  winget install MSYS2.MSYS2" -ForegroundColor Yellow
    Write-Host "  Rồi trong MSYS2 shell: pacman -S mingw-w64-ucrt-x86_64-gcc" -ForegroundColor Yellow
    exit 1
}

# 2. Biên dịch
Write-Host ""
Write-Host "Đang biên dịch $SRC → $OUT ..." -ForegroundColor Cyan

try {
    & $gpp -O2 -fpermissive -w -o $OUT $SRC 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Biên dịch THẤT BẠI (exit code $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Lỗi khi chạy compiler: $_" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $OUT)) {
    Write-Host "aes.exe không được tạo ra — kiểm tra lỗi compiler ở trên." -ForegroundColor Red
    exit 1
}

$size = (Get-Item $OUT).Length
Write-Host ""
Write-Host "Biên dịch THÀNH CÔNG!" -ForegroundColor Green
Write-Host "  File  : $((Get-Item $OUT).FullName)" -ForegroundColor White
Write-Host "  Size  : $([math]::Round($size/1KB, 1)) KB" -ForegroundColor White
Write-Host ""

# 3. Smoke test
Write-Host "Chạy smoke test..." -ForegroundColor Cyan
$textHex = "48 65 6C 6C 6F 20 41 45 53 21 00 00 00 00 00 00"   # "Hello AES!" + padding
$keyHex  = "61 62 63 64 65 66 67 68 69 6A 6B 6C 6D 6E 6F 70"   # "abcdefghijklmnop"

try {
    $out = & ".\$OUT" encrypt $textHex $keyHex 128 2>&1
    if ($LASTEXITCODE -eq 0) {
        $lines = $out -split "`n"
        Write-Host "  Cipher HEX  : $($lines[0].Trim().Substring(0, [Math]::Min(40, $lines[0].Trim().Length)))..." -ForegroundColor White
        Write-Host "  Time (ns)   : $($lines[1].Trim())" -ForegroundColor White
        Write-Host "  Blocks      : $($lines[2].Trim())" -ForegroundColor White
        Write-Host ""
        Write-Host "Smoke test PASS ✓" -ForegroundColor Green
    } else {
        Write-Host "Smoke test FAIL: $($out)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Không thể chạy smoke test: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Bước tiếp theo ===" -ForegroundColor Cyan
Write-Host "  node server.js" -ForegroundColor Yellow
Write-Host "  Sau đó mở: http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
