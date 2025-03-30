@echo off
setlocal enabledelayedexpansion

echo =============================================================
echo    Production Line Performance Analysis System Startup
echo =============================================================
echo.

REM Set success flag
set SUCCESS=1

REM Check if services are already running
set PYTHON_RUNNING=0
set DOTNET_RUNNING=0
set FRONTEND_RUNNING=0

REM Check if Python API is running (port 5000)
netstat -ano | find ":5000" | find "LISTENING" > nul
if !ERRORLEVEL! EQU 0 set PYTHON_RUNNING=1

REM Check if .NET API is running (port 5028)
netstat -ano | find ":5028" | find "LISTENING" > nul
if !ERRORLEVEL! EQU 0 set DOTNET_RUNNING=1

REM Check if Frontend is running (port 1234)
netstat -ano | find ":1234" | find "LISTENING" > nul
if !ERRORLEVEL! EQU 0 set FRONTEND_RUNNING=1

REM Define service paths
set PYTHON_API_PATH=backend\python\AnalysisAPI
set DOTNET_API_PATH=backend\csharp\ProductionLineAPI
set FRONTEND_PATH=frontend

REM Check if paths exist
if not exist "%PYTHON_API_PATH%" (
    echo ERROR: Python API path not found: %PYTHON_API_PATH%
    set SUCCESS=0
) else if not exist "%DOTNET_API_PATH%" (
    echo ERROR: .NET API path not found: %DOTNET_API_PATH%
    set SUCCESS=0
) else if not exist "%FRONTEND_PATH%" (
    echo ERROR: Frontend path not found: %FRONTEND_PATH%
    set SUCCESS=0
)

REM Continue only if all paths exist
if !SUCCESS! EQU 0 goto ERROR_EXIT

REM Start Python API if not already running
if !PYTHON_RUNNING! EQU 1 (
    echo Step 1/3: Python Analysis API is already running on port 5000
) else (
    echo Step 1/3: Starting Python Analysis API...
    start "Python Analysis API" cmd /k "cd %PYTHON_API_PATH% && python app.py"
    echo Waiting for Python API to initialize...
    timeout /t 5 /nobreak > nul
)

REM Start .NET API if not already running
if !DOTNET_RUNNING! EQU 1 (
    echo Step 2/3: .NET Production Line API is already running on port 5028
) else (
    echo Step 2/3: Starting .NET Production Line API...
    start "Production Line API" cmd /k "cd %DOTNET_API_PATH% && dotnet run --launch-profile Console"
    echo Waiting for .NET API to initialize...
    timeout /t 5 /nobreak > nul
)

REM Start Frontend if not already running
if !FRONTEND_RUNNING! EQU 1 (
    echo Step 3/3: Frontend is already running on port 1234
) else (
    echo Step 3/3: Starting React Frontend...
    start "Production Line Frontend" cmd /k "cd %FRONTEND_PATH% && npm run start"
)

echo.
echo =============================================================
echo              All services started successfully!
echo =============================================================
echo.
echo The application should be available at:
echo http://localhost:1234
echo.
echo NOTE: Do not close this window until you want to shut down all services.
echo.
echo Press any key to shut down all services...
pause > nul

:CLEANUP
echo.
echo Shutting down all services...
taskkill /FI "WINDOWTITLE eq Python Analysis API*" /F 2>NUL
taskkill /FI "WINDOWTITLE eq Production Line API*" /F 2>NUL
taskkill /FI "WINDOWTITLE eq Production Line Frontend*" /F 2>NUL
echo All services have been terminated.
goto EXIT

:ERROR_EXIT
echo.
echo Startup failed. Please check the error messages above.
echo.
echo Press any key to exit...
pause > nul

:EXIT
timeout /t 3 > nul
exit /b 0 