#!/bin/bash

# 3D World Explorer Deployment Script
echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Please run 'git init' first."
    exit 1
fi

# Check if all required files exist
echo "📋 Checking required files..."

required_files=(
    "vercel.json"
    "backend-vercel.json"
    "package.json"
    "requirements.txt"
    "env.example"
    "DEPLOYMENT_GUIDE.md"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# Check if .env file exists (warn if not)
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create one based on env.example"
fi

# Build frontend
echo "🏗️ Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Check if dist folder was created
if [ ! -d "dist" ]; then
    echo "❌ Dist folder not created. Build failed."
    exit 1
fi

echo "✅ Frontend build completed successfully"

# Git operations
echo "📝 Committing changes..."
git add .
git commit -m "Deploy: Prepare for Vercel deployment $(date)"

echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub"
    echo ""
    echo "🎉 Deployment preparation complete!"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Import your GitHub repository"
    echo "3. Deploy backend first using backend-vercel.json"
    echo "4. Deploy frontend using vercel.json"
    echo "5. Set environment variables as described in DEPLOYMENT_GUIDE.md"
    echo ""
    echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi
