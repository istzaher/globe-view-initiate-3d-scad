@echo off
title Globe View 3D Development Environment

echo.
echo 🚀 Starting Globe View 3D Development Environment...
echo =================================================

REM Check if required files exist
if not exist "main.py" (
    echo ❌ main.py not found! Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ❌ package.json not found! Please run this script from the project root directory.
    pause
    exit /b 1
)

echo 🔍 Stopping any existing services...

REM Kill existing processes on ports 8000 and 3000
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":8000.*LISTENING"') do (
    echo 🔄 Stopping existing backend process %%i
    taskkill /PID %%i /F >nul 2>&1
)

for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    echo 🔄 Stopping existing frontend process %%i
    taskkill /PID %%i /F >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo 🐍 Starting Python Backend on http://localhost:8000...
start "Backend Server" /min cmd /c "python main.py"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo ⚛️  Starting React Frontend on http://localhost:3000...
start "Frontend Server" /min cmd /c "npm run dev"

echo ⏳ Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 Both services should now be running!
echo =================================================
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:8000  
echo 📚 API Docs: http://localhost:8000/docs
echo =================================================
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open the application in default browser
start http://localhost:3000

echo.
echo 📝 To stop the servers:
echo    - Close the "Backend Server" and "Frontend Server" windows
echo    - Or run: taskkill /F /IM python.exe && taskkill /F /IM node.exe
echo.
pause 