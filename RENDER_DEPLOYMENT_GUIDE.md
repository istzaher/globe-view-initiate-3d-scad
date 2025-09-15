# 3D World Explorer - Render.com Deployment Guide

This guide will help you deploy the 3D World Explorer application on Render.com with GitHub integration.

## 🏗️ Architecture Overview

- **Backend**: FastAPI + Python (Web Service on Render)
- **Frontend**: React + Vite + TypeScript (Static Site on Render)
- **Data**: Static GeoJSON files served from public folder
- **Deployment**: Two separate services that communicate via HTTP

## 📋 Prerequisites

1. **GitHub Account**: For code repository
2. **Render.com Account**: For deployment
3. **OpenRouter API Key**: For LLM functionality

## 🚀 Deployment Steps

### Step 1: Prepare GitHub Repository

1. **Ensure all files are committed and pushed**:
   ```bash
   git add .
   git commit -m "Prepare for Render.com deployment"
   git push origin main
   ```

2. **Required files in repository**:
   - `render.yaml` (Render configuration)
   - `Dockerfile` (Container configuration)
   - `package.json` (with Render scripts)
   - `requirements.txt` (Python dependencies)
   - `main.py` (FastAPI backend)
   - `src/` (React frontend)

### Step 2: Deploy Backend on Render.com

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the backend service**:
   - **Name**: `globe-esri-backend`
   - **Environment**: `Python 3`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`

5. **Set Environment Variables**:
   ```
   PYTHON_ENV=production
   PORT=8000
   HOST=0.0.0.0
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

6. **Deploy the backend**
7. **Note the backend URL** (e.g., `https://globe-esri-backend.onrender.com`)

### Step 3: Deploy Frontend on Render.com

1. **Go to Render Dashboard**
2. **Click "New +" → "Static Site"**
3. **Connect the same GitHub repository**
4. **Configure the frontend service**:
   - **Name**: `globe-esri-frontend`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. **Set Environment Variables**:
   ```
   VITE_API_BASE_URL=https://globe-esri-backend.onrender.com
   VITE_APP_NAME=3D World Explorer
   VITE_APP_VERSION=1.0.0
   ```

6. **Deploy the frontend**

### Step 4: Update Backend CORS (if needed)

1. **Update the backend CORS settings** in `main.py` if your URLs are different:
   ```python
   cors_origins = [
       "https://globe-esri-frontend.onrender.com",
       "https://globe-esri-backend.onrender.com",
       # ... other origins
   ]
   ```

2. **Redeploy the backend** after updating CORS

## 🔧 Configuration Files

### Render Configuration (render.yaml)
```yaml
services:
  # Backend Service (FastAPI)
  - type: web
    name: globe-esri-backend
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: python main.py
    envVars:
      - key: PYTHON_ENV
        value: production
      - key: PORT
        value: 8000
      - key: HOST
        value: 0.0.0.0
      - key: OPENROUTER_API_KEY
        sync: false  # Set this in Render dashboard
    healthCheckPath: /health
    autoDeploy: true
    branch: main

  # Frontend Service (Static Site)
  - type: web
    name: globe-esri-frontend
    env: static
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://globe-esri-backend.onrender.com
      - key: VITE_APP_NAME
        value: 3D World Explorer
      - key: VITE_APP_VERSION
        value: 1.0.0
    autoDeploy: true
    branch: main
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### Dockerfile (Alternative deployment method)
```dockerfile
# Multi-stage build for 3D World Explorer
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY --from=frontend-build /app/dist ./dist
EXPOSE 8000
ENV PYTHON_ENV=production
ENV PORT=8000
ENV HOST=0.0.0.0
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
CMD ["python", "main.py"]
```

## 🌐 Environment Variables

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

## 📋 Deployment Order

1. **Deploy Backend First** (Web Service)
2. **Get Backend URL** (e.g., `https://globe-esri-backend.onrender.com`)
3. **Update Frontend Environment** (set `VITE_API_BASE_URL`)
4. **Deploy Frontend** (Static Site)

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure backend CORS includes your frontend domain
   - Check that environment variables are set correctly

2. **API Connection Issues**:
   - Verify `VITE_API_BASE_URL` points to correct backend URL
   - Check backend logs in Render dashboard

3. **Build Failures**:
   - Ensure all dependencies are in `package.json` and `requirements.txt`
   - Check Node.js and Python versions in Render

4. **Static Files Not Loading**:
   - Verify `dist` folder is generated correctly
   - Check build command and publish directory

### Debugging Steps

1. **Check Render Logs**:
   - Go to Render Dashboard → Your Service → Logs
   - Look for error messages

2. **Test API Endpoints**:
   - Use browser dev tools Network tab
   - Test backend URL directly

3. **Verify Environment Variables**:
   - Check Render service settings
   - Ensure variables are set for correct environment

## 📊 Monitoring

- **Backend**: Render service logs and metrics
- **Frontend**: Render static site analytics
- **Performance**: Render performance monitoring

## 🔄 Updates and Maintenance

1. **Code Updates**:
   - Push changes to GitHub
   - Render will auto-deploy

2. **Environment Variable Changes**:
   - Update in Render dashboard
   - Redeploy if needed

3. **Dependencies Updates**:
   - Update `package.json` or `requirements.txt`
   - Push to GitHub for auto-deployment

## 💰 Pricing

- **Free Tier**: Available for both services
- **Backend**: 750 hours/month free
- **Frontend**: Unlimited static site hosting
- **Upgrade**: Available for more resources

## 🆘 Support

If you encounter issues:
1. Check Render deployment logs
2. Verify all configuration files are correct
3. Ensure environment variables are set
4. Test locally first before deploying

## 🎉 Success!

Once deployed, your application will be available at:
- **Frontend**: `https://globe-esri-frontend.onrender.com`
- **Backend**: `https://globe-esri-backend.onrender.com`

The application will automatically sync with your GitHub repository for continuous deployment.

## 🔄 Alternative: Single Service Deployment

If you prefer a single service deployment:

1. **Use the Dockerfile approach**
2. **Deploy as a single Web Service**
3. **Set build command**: `docker build -t globe-esri .`
4. **Set start command**: `docker run -p 8000:8000 globe-esri`

This approach combines both frontend and backend in a single container.
