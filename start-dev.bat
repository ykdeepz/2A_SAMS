@echo off
echo Starting Student Attendance System...
echo.
echo Starting JSON Server on port 3000...
start cmd /k "npm run json-server"
timeout /t 3 /nobreak > nul
echo.
echo Starting Angular Dev Server on port 4200...
start cmd /k "npm start"
echo.
echo Both servers are starting...
echo JSON Server: http://localhost:3000
echo Angular App: http://localhost:4200
echo.
echo Login with: admin@school.com / admin123
echo.
pause
