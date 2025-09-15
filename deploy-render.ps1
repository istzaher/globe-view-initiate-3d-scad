# 3D World Explorer Render.com Deployment Script (PowerShell)
Write-Host "🚀 Starting Render.com deployment process..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git repository not initialized. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check if all required files exist
Write-Host "📋 Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "render.yaml",
    "Dockerfile", 
    "package.json",
    "requirements.txt",
    "main.py",
    "src/lib/utils.ts"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing required file: $file" -ForegroundColor Red
        exit 1
    }
}

# Check if .env file exists (warn if not)
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found. Please create one based on env.example" -ForegroundColor Yellow
}

# Build frontend
Write-Host "🏗️ Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

# Check if dist folder was created
if (-not (Test-Path "dist")) {
    Write-Host "❌ Dist folder not created. Build failed." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend build completed successfully" -ForegroundColor Green

# Git operations
Write-Host "📝 Committing changes..." -ForegroundColor Yellow
git add .
$commitMessage = "Deploy: Prepare for Render.com deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m $commitMessage

Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor White
    Write-Host "2. Create a new Web Service for backend" -ForegroundColor White
    Write-Host "3. Create a new Static Site for frontend" -ForegroundColor White
    Write-Host "4. Set environment variables as described in RENDER_DEPLOYMENT_GUIDE.md" -ForegroundColor White
    Write-Host "5. Deploy backend first, then frontend" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Expected URLs after deployment:" -ForegroundColor Cyan
    Write-Host "   Backend: https://globe-esri-backend.onrender.com" -ForegroundColor White
    Write-Host "   Frontend: https://globe-esri-frontend.onrender.com" -ForegroundColor White
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}
