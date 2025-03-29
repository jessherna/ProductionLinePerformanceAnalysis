@echo off
echo Production Line Control and Analysis System
echo ==========================================
echo Stopping any existing services...

REM Kill any existing processes that might be using the ports
taskkill /F /FI "WINDOWTITLE eq *python*" > nul 2>&1
taskkill /F /FI "WINDOWTITLE eq *dotnet*" > nul 2>&1
taskkill /F /FI "WINDOWTITLE eq *npm*" > nul 2>&1
taskkill /F /IM dotnet.exe > nul 2>&1
taskkill /F /IM node.exe > nul 2>&1

echo Starting services...

REM Start Python API first
start cmd /k "cd backend\python\AnalysisAPI && python app.py"
echo Python Analysis API started on port 5000
timeout /t 5

REM Start .NET API next
start cmd /k "cd backend\csharp\ProductionLineAPI && dotnet run"
echo .NET Production Line API started on port 5028
timeout /t 5

REM Start frontend last
start cmd /k "cd frontend && npm start"
echo Frontend started on port 1234

echo All services started!
echo.
echo Please open your browser to http://localhost:1234
echo.
echo Press any key to stop all services...
pause > nul

echo Stopping services...
taskkill /F /FI "WINDOWTITLE eq *python*" > nul 2>&1
taskkill /F /FI "WINDOWTITLE eq *dotnet*" > nul 2>&1
taskkill /F /FI "WINDOWTITLE eq *npm*" > nul 2>&1
taskkill /F /IM dotnet.exe > nul 2>&1
taskkill /F /IM node.exe > nul 2>&1
echo Done! 