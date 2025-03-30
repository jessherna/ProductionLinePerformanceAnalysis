@echo off
echo.
echo Starting Production Line Control and Analysis System...
echo.

rem Check if the Python environment exists and is activated
if not exist "venv\Scripts\activate.bat" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating Python environment...
call venv\Scripts\activate.bat

echo Checking dependencies...
pip install -r analysis/requirements.txt
pip install -r backend/python/AnalysisAPI/requirements.txt

echo.
echo Starting services...
echo.

echo 1. Starting Python Analysis API with Advanced Analysis...
start "Python Analysis API" cmd /c "title Python Analysis API && cd backend\python\AnalysisAPI && python app.py"

timeout /t 5 /nobreak > nul

echo 2. Starting C# Production Line API...
start "Production Line API" cmd /c "title Production Line API && cd backend\csharp\ProductionLineAPI && dotnet run"

timeout /t 5 /nobreak > nul

echo 3. Starting React Frontend...
start "React Frontend" cmd /c "title React Frontend && cd frontend && npm start"

echo.
echo All services started!
echo.
echo Open your browser to http://localhost:1234 to access the application.
echo.
echo Press any key to stop all services...
pause > nul

echo.
echo Stopping all services...
echo.

taskkill /FI "WINDOWTITLE eq Python Analysis API" /T /F
taskkill /FI "WINDOWTITLE eq Production Line API" /T /F
taskkill /FI "WINDOWTITLE eq React Frontend" /T /F

echo.
echo All services stopped.
echo.

exit /b 0 