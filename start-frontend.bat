@echo off
echo Starting Production Line Frontend...
cd frontend
start "Production Line Frontend" cmd /k "npm run start"
echo Frontend started. Do not close this window.
echo You can access the application at http://localhost:1234
echo.
echo The frontend will remain running as long as the new console window is open.
pause 