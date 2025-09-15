# 🚀 Quick Render.com Deployment Guide

## One-Click Deployment

### Option 1: Automated Script (Recommended)
```bash
# Run the Render deployment script
npm run render:deploy
```

### Option 2: Manual Steps
```bash
# 1. Build the project
npm run build

# 2. Commit and push to GitHub
git add .
git commit -m "Deploy to Render.com"
git push origin main

# 3. Deploy on Render.com
# - Go to https://dashboard.render.com
# - Create Web Service for backend
# - Create Static Site for frontend
```

## 📁 Files Created for Render Deployment

- `render.yaml` - Render.com configuration
- `Dockerfile` - Container configuration (alternative)
- `deploy-render.ps1` - PowerShell deployment script
- `RENDER_DEPLOYMENT_GUIDE.md` - Detailed deployment guide

## 🔧 Environment Variables Needed

### Backend (Render Dashboard)
```
PYTHON_ENV=production
PORT=8000
HOST=0.0.0.0
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Frontend (Render Dashboard)
```
VITE_API_BASE_URL=https://globe-esri-backend.onrender.com
VITE_APP_NAME=3D World Explorer
VITE_APP_VERSION=1.0.0
```

## 🌐 Deployment URLs

After deployment, your app will be available at:
- **Backend**: `https://globe-esri-backend.onrender.com`
- **Frontend**: `https://globe-esri-frontend.onrender.com`

## 📖 Full Documentation

See `RENDER_DEPLOYMENT_GUIDE.md` for complete deployment instructions and troubleshooting.

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Environment variables set
- [ ] Backend deployed first (Web Service)
- [ ] Frontend deployed second (Static Site)
- [ ] CORS settings updated
- [ ] Test both frontend and backend

## 🆘 Need Help?

1. Check `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions
2. Verify all files are present in your repository
3. Ensure environment variables are set correctly
4. Test locally before deploying

## 🎯 Render.com Advantages

- **Free Tier**: 750 hours/month for backend
- **Unlimited Static Hosting**: For frontend
- **Auto-Deploy**: From GitHub
- **Easy Scaling**: Upgrade when needed
- **Built-in Monitoring**: Logs and metrics
