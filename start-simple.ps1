#!/usr/bin/env pwsh
# Simple Globe View 3D Development Launcher
# Starts backend and frontend in separate windows for easy monitoring

Write-Host "🚀 Starting Globe View 3D Development Environment..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

# Check if required files exist
if (-not (Test-Path "main.py")) {
    Write-Host "❌ main.py not found! Please run this script from the project root directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found! Please run this script from the project root directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Kill any existing processes on ports 8000 and 3000
Write-Host "🔍 Stopping any existing services..." -ForegroundColor Yellow

$backendProcess = netstat -ano | Select-String ":8000.*LISTENING"
if ($backendProcess) {
    $processId = ($backendProcess -split '\s+')[-1]
    Write-Host "🔄 Stopping existing backend process (PID: $processId)" -ForegroundColor Yellow
    taskkill /PID $processId /F | Out-Null
}

$frontendProcess = netstat -ano | Select-String ":3000.*LISTENING"  
if ($frontendProcess) {
    $processId = ($frontendProcess -split '\s+')[-1]
    Write-Host "🔄 Stopping existing frontend process (PID: $processId)" -ForegroundColor Yellow
    taskkill /PID $processId /F | Out-Null
}

Start-Sleep -Seconds 2

# Start Backend in new window
Write-Host "🐍 Starting Python Backend..." -ForegroundColor Blue
$backendWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Backend Server - Globe View 3D' -ForegroundColor Green; python main.py" -PassThru
Write-Host "   Backend PID: $($backendWindow.Id)" -ForegroundColor Gray

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend in new window  
Write-Host "⚛️  Starting React Frontend..." -ForegroundColor Blue
$frontendWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend Server - Globe View 3D' -ForegroundColor Green; npm run dev" -PassThru
Write-Host "   Frontend PID: $($frontendWindow.Id)" -ForegroundColor Gray

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Check service health
$backendReady = $false
$frontendReady = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $backendReady = $true
        Write-Host "✅ Backend is ready on http://localhost:8000" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend may still be starting..." -ForegroundColor Yellow
}

# Check if frontend port is listening (enough to confirm it's running)
$frontendCheck = netstat -ano | Select-String ":3000.*LISTENING"
if ($frontendCheck) {
    $frontendReady = $true
    Write-Host "✅ Frontend is ready on http://localhost:3000" -ForegroundColor Green
}

Write-Host "`n🎉 Development environment started!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🌐 Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend:     http://localhost:8000" -ForegroundColor Cyan  
Write-Host "📚 API Docs:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "💾 Health:      http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

if ($backendReady -and $frontendReady) {
    Write-Host "🚀 Both services are running successfully!" -ForegroundColor Green
    
    # Ask if user wants to open the application
    $openApp = Read-Host "`nOpen the application in your browser? (y/N)"
    if ($openApp -eq 'y' -or $openApp -eq 'Y') {
        Start-Process "http://localhost:3000"
    }
} else {
    Write-Host "⚠️  Some services may still be starting. Check the server windows." -ForegroundColor Yellow
}

Write-Host "`n📝 To stop the servers:" -ForegroundColor White
Write-Host "   - Close the Backend and Frontend PowerShell windows" -ForegroundColor Gray
Write-Host "   - Or use: taskkill /PID $($backendWindow.Id) /F && taskkill /PID $($frontendWindow.Id) /F" -ForegroundColor Gray

Write-Host "`n✨ Happy coding!" -ForegroundColor Magenta
Read-Host "`nPress Enter to exit this launcher" 