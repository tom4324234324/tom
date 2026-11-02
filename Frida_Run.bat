@echo off
setlocal enabledelayedexpansion
title Frida Server & Script Launcher

:: ============================================
:: Configuration file to remember paths
:: ============================================
set "CONFIG_FILE=%~dp0frida_config.txt"

:: ============================================
:: Load saved paths if config exists
:: ============================================
set "SCRIPT_PATH="
set "FRIDA_PATH="

if exist "%CONFIG_FILE%" (
    for /f "usebackq tokens=1,* delims==" %%A in ("%CONFIG_FILE%") do (
        if /i "%%A"=="SCRIPT" set "SCRIPT_PATH=%%B"
        if /i "%%A"=="FRIDA" set "FRIDA_PATH=%%B"
    )
)

:: ============================================
:: Ask for script path if not set
:: ============================================
if not defined SCRIPT_PATH (
    echo.
    echo ============================================
    echo   First time setup - Script path
    echo ============================================
    set /p "SCRIPT_PATH=Enter full path of your Frida script (.js): "
)

:: Validate script
if not exist "!SCRIPT_PATH!" (
    echo.
    echo [!] Script not found at: !SCRIPT_PATH!
    set /p "SCRIPT_PATH=Enter correct path of Frida script: "
    if not exist "!SCRIPT_PATH!" (
        echo [X] Script still not found. Exiting.
        pause
        exit /b 1
    )
)

:: ============================================
:: Check if frida-server exists in script folder
:: ============================================
set "SCRIPT_DIR=%~dp1"
for %%F in ("!SCRIPT_PATH!") do set "SCRIPT_DIR=%%~dpF"

set "FRIDA_EXE="
:: Look for common frida-server names in script directory
for %%N in (frida-server.exe frida-server frida-server-*.exe) do (
    if exist "!SCRIPT_DIR!%%N" (
        set "FRIDA_EXE=!SCRIPT_DIR!%%N"
        goto :frida_found
    )
)

:: Check saved frida path
if defined FRIDA_PATH (
    if exist "!FRIDA_PATH!" (
        set "FRIDA_EXE=!FRIDA_PATH!"
        goto :frida_found
    )
)

:: ============================================
:: Ask for frida-server path if not found
:: ============================================
echo.
echo ============================================
echo   Frida server not found in script folder
echo ============================================
set /p "FRIDA_PATH=Enter full path of frida-server.exe: "

if not exist "!FRIDA_PATH!" (
    echo.
    echo [X] Frida server not found at: !FRIDA_PATH!
    pause
    exit /b 1
)
set "FRIDA_EXE=!FRIDA_PATH!"

:frida_found
echo.
echo [OK] Script  : !SCRIPT_PATH!
echo [OK] Frida   : !FRIDA_EXE!

:: Save config for next run
(
    echo SCRIPT=!SCRIPT_PATH!
    echo FRIDA=!FRIDA_EXE!
) > "%CONFIG_FILE%"

:: ============================================
:: Check ADB
:: ============================================
where adb >nul 2>&1
if errorlevel 1 (
    echo.
    echo [X] ADB not found in PATH. Please install platform-tools.
    pause
    exit /b 1
)

:: ============================================
:: Check device connected
:: ============================================
echo.
echo [*] Checking connected devices...
for /f "skip=1 tokens=1,2" %%D in ('adb devices') do (
    if "%%E"=="device" set "DEVICE=%%D"
)

if not defined DEVICE (
    echo [X] No device connected via ADB. Exiting.
    pause
    exit /b 1
)
echo [OK] Device: !DEVICE!

:: ============================================
:: Push frida-server to device
:: ============================================
echo.
echo [*] Pushing frida-server to /data/local/tmp/...
adb push "!FRIDA_EXE!" /data/local/tmp/frida-server >nul
if errorlevel 1 (
    echo [X] Failed to push frida-server
    pause
    exit /b 1
)

adb shell "chmod 755 /data/local/tmp/frida-server"

:: ============================================
:: Kill old frida-server & start new one
:: ============================================
echo [*] Starting frida-server on device...
adb shell "su -c 'pkill -f frida-server' 2>nul"
timeout /t 1 /nobreak >nul
start "Frida Server" cmd /k "adb shell su -c /data/local/tmp/frida-server"

:: Wait for server to come up
timeout /t 3 /nobreak >nul

:: ============================================
:: List installed packages
:: ============================================
echo.
echo ============================================
echo   Installed packages
echo ============================================
echo.

set /a COUNT=0
set "PKG_LIST="
for /f "tokens=2 delims=:" %%P in ('adb shell pm list packages 2^>nul') do (
    set /a COUNT+=1
    set "PKG_!COUNT!=%%P"
    set "PKG_LIST=!PKG_LIST! !COUNT!=%%P"
    echo   !COUNT!. %%P
)

if !COUNT! EQU 0 (
    echo [X] No packages found
    pause
    exit /b 1
)

:: ============================================
:: Ask user to select package
:: ============================================
echo.
set /p "CHOICE=Enter package number [1-!COUNT!]: "

:: Validate input
set "SELECTED="
for /l %%I in (1,1,!COUNT!) do (
    if "!CHOICE!"=="%%I" set "SELECTED=!PKG_%%I!"
)

if not defined SELECTED (
    echo.
    echo [X] Invalid selection: !CHOICE!
    pause
    exit /b 1
)

echo.
echo [OK] Selected package: !SELECTED!

:: ============================================
:: Run frida script on selected package
:: ============================================
echo.
echo [*] Launching Frida script...
echo ============================================
frida -U -f "!SELECTED!" -l "!SCRIPT_PATH!" 

echo.
echo [*] Frida session ended.
pause
endlocal