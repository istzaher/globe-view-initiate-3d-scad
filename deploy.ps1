# 3D World Explorer Deployment Script (PowerShell)
Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git repository not initialized. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check if all required files exist
Write-Host "📋 Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "vercel.json",
    "backend-vercel.json", 
    "package.json",
    "requirements.txt",
    "env.example",
    "DEPLOYMENT_GUIDE.md"
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
$commitMessage = "Deploy: Prepare for Vercel deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m $commitMessage

Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Import your GitHub repository" -ForegroundColor White
    Write-Host "3. Deploy backend first using backend-vercel.json" -ForegroundColor White
    Write-Host "4. Deploy frontend using vercel.json" -ForegroundColor White
    Write-Host "5. Set environment variables as described in DEPLOYMENT_GUIDE.md" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}
