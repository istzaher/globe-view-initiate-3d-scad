# 🚀 Quick Deployment Guide

## One-Click Deployment

### Option 1: Automated Script (Recommended)
```bash
# Run the deployment script
npm run deploy
```

### Option 2: Manual Steps
```bash
# 1. Build the project
npm run build

# 2. Commit and push to GitHub
git add .
git commit -m "Deploy to Vercel"
git push origin main

# 3. Deploy on Vercel
# - Go to https://vercel.com/dashboard
# - Import your GitHub repository
# - Follow the setup wizard
```

## 📁 Files Created for Deployment

- `vercel.json` - Frontend deployment config
- `backend-vercel.json` - Backend deployment config  
- `deploy.ps1` - PowerShell deployment script
- `deploy.sh` - Bash deployment script
- `env.example` - Environment variables template
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide

## 🔧 Environment Variables Needed

### Frontend (Set in Vercel Dashboard)
```
VITE_API_BASE_URL=https://your-backend-url.vercel.app
VITE_APP_NAME=3D World Explorer
VITE_APP_VERSION=1.0.0
```

### Backend (Set in Vercel Dashboard)
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
PYTHON_ENV=production
PORT=8000
HOST=0.0.0.0
```

## 🌐 Deployment URLs

After deployment, your app will be available at:
- **Frontend**: `https://your-frontend-name.vercel.app`
- **Backend**: `https://your-backend-name.vercel.app`

## 📖 Full Documentation

See `DEPLOYMENT_GUIDE.md` for complete deployment instructions and troubleshooting.

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Environment variables set
- [ ] Backend deployed first
- [ ] Frontend deployed second
- [ ] CORS settings updated
- [ ] Test both frontend and backend

## 🆘 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Verify all files are present in your repository
3. Ensure environment variables are set correctly
4. Test locally before deploying
