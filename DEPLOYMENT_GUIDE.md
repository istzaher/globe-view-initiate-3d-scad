# 🚀 Enhanced GIS Application Deployment Guide - Vercel

This guide provides step-by-step instructions for deploying your enhanced Abu Dhabi GIS application (frontend + backend) to Vercel.com.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Python 3.8+ installed  
- ✅ Vercel CLI installed (`npm i -g vercel`)
- ✅ Git repository with your application code
- ✅ Vercel account (free tier available)

## 🏗️ Project Structure Overview

Your application consists of:
```
globe-view-initiate-3d/
├── src/                    # React/TypeScript frontend
├── query_parser/           # Enhanced GIS tools (Python)
├── main.py                # FastAPI backend
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── vite.config.ts        # Vite configuration
└── public/data/          # Abu Dhabi GeoJSON datasets
```

## 🎯 Deployment Strategy

We'll deploy using Vercel's **hybrid approach**:
- **Frontend**: Static React app (Vite build)
- **Backend**: Python FastAPI as Vercel serverless functions

---

## 📝 Step 1: Prepare Your Project

### 1.1 Update package.json

Ensure your `package.json` has the correct build scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "start": "vite preview --port $PORT"
  }
}
```

### 1.2 Create vercel.json Configuration

Create a `vercel.json` file in your project root:

```json
{
  "version": 2,
  "name": "abu-dhabi-gis-app",
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    },
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "main.py"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "PYTHON_VERSION": "3.9"
  },
  "functions": {
    "main.py": {
      "runtime": "python3.9"
    }
  }
}
```

### 1.3 Update Backend for Serverless

Modify your `main.py` to work with Vercel:

```python
# Add this at the top of main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Your existing FastAPI app
app = FastAPI(title="Enhanced Abu Dhabi GIS API")

# Update CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",  # Allow Vercel preview deployments
        "https://your-domain.vercel.app"  # Your production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing routes...

# Add this at the bottom for Vercel compatibility
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

# Export app for Vercel
handler = app
```

### 1.4 Update Frontend Environment Variables

Create a `.env.production` file:

```env
VITE_PYTHON_API_URL=https://your-app-name.vercel.app/api
VITE_NODE_ENV=production
```

Update your frontend services to use environment variables:

```typescript
// src/services/enhancedQueryService.ts
export class EnhancedQueryService {
  private baseUrl: string;

  constructor() {
    // Use environment variable with fallback
    this.baseUrl = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
  }
  
  // ... rest of your service
}
```

---

## 🚀 Step 2: Deploy to Vercel

### 2.1 Login to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to your Vercel account
vercel login
```

### 2.2 Initialize Vercel Project

```bash
# In your project root directory
vercel

# Follow the prompts:
# ? Set up and deploy "~/path/to/your-project"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? abu-dhabi-gis-app
# ? In which directory is your code located? ./
```

### 2.3 Configure Build Settings

During setup, Vercel will ask about framework detection:

- **Framework Preset**: Vite
- **Root Directory**: `./` (current directory)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.4 Set Environment Variables

```bash
# Set production environment variables
vercel env add VITE_PYTHON_API_URL production
# Enter: https://your-app-name.vercel.app/api

vercel env add VITE_NODE_ENV production  
# Enter: production
```

### 2.5 Deploy

```bash
# Deploy to production
vercel --prod
```

---

## 🔧 Step 3: Backend Serverless Configuration

### 3.1 Create API Directory Structure

Create an `api/` directory and move your Python files:

```bash
mkdir api
cp main.py api/index.py
cp -r query_parser api/
cp requirements.txt api/
```

### 3.2 Update vercel.json for API Routes

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 3.3 Update Python Dependencies

Ensure your `api/requirements.txt` includes all dependencies:

```txt
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
requests==2.31.0
spacy==3.7.2
python-multipart==0.0.6
```

---

## 🌐 Step 4: Domain and Environment Setup

### 4.1 Custom Domain (Optional)

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your custom domain
5. Configure DNS records as instructed

### 4.2 Environment Variables in Dashboard

1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Add these variables:
   - `VITE_PYTHON_API_URL`: `https://your-domain.vercel.app/api`
   - `VITE_NODE_ENV`: `production`

### 4.3 Preview Deployments

Every git push to non-main branches creates a preview deployment:

```bash
git checkout -b feature/new-enhancement
git add .
git commit -m "Add new feature"
git push origin feature/new-enhancement
```

---

## 📊 Step 5: Database and Static Assets

### 5.1 Abu Dhabi GeoJSON Data

Your GeoJSON files in `public/data/` will be automatically served:

- `https://your-app.vercel.app/data/bus_stops_query.geojson`
- `https://your-app.vercel.app/data/mosques_query.geojson`
- `https://your-app.vercel.app/data/BuildingStructures.geojson`
- etc.

### 5.2 Static Asset Optimization

Update your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'arcgis': ['@arcgis/core'],
          'vendor': ['react', 'react-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  base: './',
  publicDir: 'public'
})
```

---

## 🔍 Step 6: Testing and Monitoring

### 6.1 Test Deployment

1. **Frontend**: Visit `https://your-app.vercel.app`
2. **API Health**: Visit `https://your-app.vercel.app/api/health`
3. **Test Queries**: Try "Find bus stops in Abu Dhabi"

### 6.2 Monitor Performance

- **Vercel Analytics**: Enable in project settings
- **Function Logs**: Check Vercel dashboard → Functions tab
- **Build Logs**: Monitor deployment logs

### 6.3 Debug Common Issues

**CORS Errors:**
```python
# Update main.py CORS origins
allow_origins=[
    "https://your-actual-domain.vercel.app",
    "https://*.vercel.app"
]
```

**API Path Issues:**
```typescript
// Update service base URLs
const baseUrl = import.meta.env.VITE_PYTHON_API_URL || window.location.origin + '/api';
```

**Build Errors:**
```bash
# Check build logs
vercel logs your-deployment-url
```

---

## 🚀 Step 7: Production Optimization

### 7.1 Performance Optimizations

```typescript
// vite.config.ts - Add compression
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'esri-core': ['@arcgis/core'],
          'react-vendor': ['react', 'react-dom'],
          'utils': ['./src/lib/utils']
        }
      }
    }
  }
})
```

### 7.2 Security Headers

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 📝 Step 8: Deployment Checklist

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] CORS origins updated for production
- [ ] Build scripts working locally
- [ ] GeoJSON data files in `public/data/`
- [ ] API endpoints tested
- [ ] Frontend builds without errors

### Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] API health endpoint responds
- [ ] Natural language queries work
- [ ] Map displays Abu Dhabi data
- [ ] Enhanced GIS tools functional
- [ ] Error handling works
- [ ] Performance acceptable

---

## 🎯 Example Deployment Commands

```bash
# Full deployment workflow
git add .
git commit -m "Deploy enhanced GIS application"
git push origin main

# Deploy specific branch to preview
vercel --target preview

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

**1. Build Failures:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**2. API Not Found:**
- Verify `vercel.json` routes configuration
- Check function deployment in Vercel dashboard
- Ensure `api/index.py` exists

**3. CORS Issues:**
- Update CORS origins in `main.py`
- Check browser network tab for exact error
- Verify API URL in frontend environment variables

**4. Large Asset Issues:**
- Optimize GeoJSON files if too large
- Use Vercel's Edge Network for static assets
- Consider CDN for large datasets

---

## 🎉 Success!

Your enhanced Abu Dhabi GIS application is now deployed to Vercel with:

- ✅ **Frontend**: React/TypeScript with Vite
- ✅ **Backend**: Python FastAPI serverless functions  
- ✅ **Enhanced GIS**: Tool-based natural language processing
- ✅ **Abu Dhabi Data**: All 6 datasets (bus stops, buildings, mosques, parks, parking, roads)
- ✅ **Production Ready**: Optimized, secure, and scalable

**Your app is live at**: `https://your-app-name.vercel.app`

Try queries like:
- "Find bus stops in Abu Dhabi"
- "Show mosques near downtown"
- "List parking areas in the city"

---

## 📞 Support

For deployment issues:
1. Check Vercel dashboard logs
2. Review this guide
3. Test locally first with `npm run build && npm run preview`
4. Check Vercel documentation: https://vercel.com/docs

Happy deploying! 🚀
