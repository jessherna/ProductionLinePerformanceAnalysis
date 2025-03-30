@echo off
echo Starting Production Line API in a dedicated console...
cd backend\csharp\ProductionLineAPI
start "Production Line API" cmd /k "dotnet run --launch-profile Console"
echo Backend API started. Do not close this window.
echo You can access the API at http://localhost:5028
echo.
echo The API will remain running as long as the new console window is open.
pause 