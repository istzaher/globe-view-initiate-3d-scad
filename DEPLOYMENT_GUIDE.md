# 3D World Explorer - Deployment Guide

This guide will help you deploy the 3D World Explorer application on Vercel with GitHub integration.

## 🏗️ Architecture Overview

- **Frontend**: React + Vite + TypeScript (deployed on Vercel)
- **Backend**: FastAPI + Python (deployed on Vercel as serverless functions)
- **Data**: Static GeoJSON files served from public folder

## 📋 Prerequisites

1. **GitHub Account**: For code repository
2. **Vercel Account**: For deployment
3. **OpenRouter API Key**: For LLM functionality

## 🚀 Deployment Steps

### Step 1: Prepare GitHub Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Ensure these files are in your repository**:
   - `vercel.json` (frontend config)
   - `backend-vercel.json` (backend config)
   - `package.json` (with build scripts)
   - `requirements.txt` (Python dependencies)
   - `env.example` (environment variables template)

### Step 2: Deploy Backend on Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the backend**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root)
   - **Build Command**: `pip install -r requirements.txt`
   - **Output Directory**: Leave empty
   - **Install Command**: `pip install -r requirements.txt`

5. **Set Environment Variables**:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PYTHON_ENV=production
   PORT=8000
   HOST=0.0.0.0
   ```

6. **Deploy the backend**

7. **Note the backend URL** (e.g., `https://your-backend-name.vercel.app`)

### Step 3: Deploy Frontend on Vercel

1. **Create a new Vercel project for frontend**
2. **Import the same GitHub repository**
3. **Configure the frontend**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-name.vercel.app
   VITE_APP_NAME=3D World Explorer
   VITE_APP_VERSION=1.0.0
   ```

5. **Deploy the frontend**

### Step 4: Update CORS Settings

1. **Update the backend CORS settings** in `main.py`:
   ```python
   cors_origins = [
       "https://your-frontend-name.vercel.app",
       "https://globe-esri-ist.vercel.app",
       # ... other origins
   ]
   ```

2. **Redeploy the backend** after updating CORS

## 🔧 Configuration Files

### Frontend (vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.vercel.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Backend (backend-vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}
```

## 🌐 Environment Variables

### Frontend (.env.local)
```env
VITE_API_BASE_URL=https://your-backend-name.vercel.app
VITE_APP_NAME=3D World Explorer
VITE_APP_VERSION=1.0.0
```

### Backend (Vercel Environment Variables)
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
PYTHON_ENV=production
PORT=8000
HOST=0.0.0.0
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure backend CORS includes your frontend domain
   - Check that environment variables are set correctly

2. **API Connection Issues**:
   - Verify `VITE_API_BASE_URL` points to correct backend URL
   - Check backend logs in Vercel dashboard

3. **Build Failures**:
   - Ensure all dependencies are in `package.json` and `requirements.txt`
   - Check Node.js and Python versions in Vercel

4. **Static Files Not Loading**:
   - Verify `public` folder is included in deployment
   - Check file paths in your code

### Debugging Steps

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Functions tab
   - Look for error messages

2. **Test API Endpoints**:
   - Use browser dev tools Network tab
   - Test backend URL directly

3. **Verify Environment Variables**:
   - Check Vercel project settings
   - Ensure variables are set for correct environment

## 📊 Monitoring

- **Frontend**: Vercel Analytics (if enabled)
- **Backend**: Vercel Function logs
- **Performance**: Vercel Speed Insights

## 🔄 Updates and Maintenance

1. **Code Updates**:
   - Push changes to GitHub
   - Vercel will auto-deploy

2. **Environment Variable Changes**:
   - Update in Vercel dashboard
   - Redeploy if needed

3. **Dependencies Updates**:
   - Update `package.json` or `requirements.txt`
   - Push to GitHub for auto-deployment

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all configuration files are correct
3. Ensure environment variables are set
4. Test locally first before deploying

## 🎉 Success!

Once deployed, your application will be available at:
- **Frontend**: `https://your-frontend-name.vercel.app`
- **Backend**: `https://your-backend-name.vercel.app`

The application will automatically sync with your GitHub repository for continuous deployment.