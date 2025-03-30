@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo        Production Line Service Status Check
echo ======================================================
echo.

set TOTAL_SERVICES=3
set RUNNING_SERVICES=0

echo Checking Python Analysis API...
netstat -ano | find ":5000" | find "LISTENING" > nul
if !ERRORLEVEL! EQU 0 (
    echo [RUNNING] Python Analysis API (port 5000)
    set /a RUNNING_SERVICES+=1
) else (
    echo [STOPPED] Python Analysis API (port 5000)
)

echo.
echo Checking .NET Production Line API...
netstat -ano | find ":5028" | find "LISTENING" > nul
if !ERRORLEVEL! EQU 0 (
    echo [RUNNING] .NET Production Line API (port 5028)
    set /a RUNNING_SERVICES+=1
) else (
    echo [STOPPED] .NET Production Line API (port 5028)
)

echo.
echo Checking Frontend Server...
netstat -ano | find ":1234" | find "LISTENING" > nul
if !ERRORLEVEL! EQU 0 (
    echo [RUNNING] Frontend Server (port 1234)
    set /a RUNNING_SERVICES+=1
) else (
    echo [STOPPED] Frontend Server (port 1234)
)

echo.
echo ======================================================
echo Summary: !RUNNING_SERVICES! of !TOTAL_SERVICES! services running
echo ======================================================

if !RUNNING_SERVICES! LSS !TOTAL_SERVICES! (
    echo.
    echo ATTENTION: Some services are not running.
    echo To start all services, run 'startup.bat'
    echo To start just the backend API, run 'start-backend.bat'
)

echo.
pause 