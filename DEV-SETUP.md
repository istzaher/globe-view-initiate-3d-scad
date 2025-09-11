# 🚀 Globe View 3D - Development Setup

This guide helps you run both the frontend and backend services for local development.

## ✅ Current Status
- ✅ **Backend**: Running on http://localhost:8000
- ✅ **Frontend**: Running on http://localhost:3000
- ✅ **Webhook**: Configured to forward incidents to n8n

## 🎯 Quick Start Options

### Option 1: Automated Scripts (Recommended)

#### PowerShell Script (Windows)
```powershell
./start-dev.ps1
```

#### Batch File (Windows)
```batch
start-dev.bat
```

### Option 2: Manual Start (Two Terminals)

#### Terminal 1 - Backend
```bash
python main.py
```
**Expected Output:**
```
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Terminal 2 - Frontend  
```bash
npm run dev
```
**Expected Output:**
```
VITE v5.4.10  ready in XXXms
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

### Option 3: Background Processes
```powershell
# Start backend in background
Start-Process powershell -ArgumentList "-Command", "python main.py"

# Start frontend in background  
Start-Process powershell -ArgumentList "-Command", "npm run dev"
```

## 🔗 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main application interface |
| Backend API | http://localhost:8000 | REST API endpoints |
| API Documentation | http://localhost:8000/docs | FastAPI auto-generated docs |
| Health Check | http://localhost:8000/api/health | Backend health status |

## 🧪 Test the Setup

### 1. Backend Test
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing
```
**Expected Response:** `200 OK` with health status

### 2. Frontend Test
Open http://localhost:3000 in your browser

### 3. Full Integration Test
1. Select a dataset (e.g., `ev_charging_0`)
2. Run a query (e.g., "Show all charging stations")
3. Switch to water dataset (`water_un_0`) to see Trace tab
4. Test incident reporting to verify webhook

## 🛠️ Troubleshooting

### Port Already in Use
```powershell
# Check what's using the ports
netstat -ano | findstr ":8000 :3000"

# Kill processes if needed
taskkill /PID <PROCESS_ID> /F
```

### Services Won't Start
1. **Check Python**: `python --version` (should be 3.8+)
2. **Check Node**: `npm --version` (should be 16+)
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   npm install
   ```

### Webhook Not Working
- Verify the backend is using the updated `main.py` with webhook code
- Check the terminal logs for webhook forwarding messages
- Ensure n8n endpoint is accessible: https://zman.app.n8n.cloud/webhook/incidents-call

## 🔧 Development Features

### Water Database Trace Functionality
- **Conditional Tabs**: Trace tab only appears for water databases (`water_un_*`)
- **Dynamic Layout**: 3 tabs for regular datasets, 4 tabs for water datasets
- **Interface**: Inputs/Results tabs, trace types dropdown, starting points, barriers, Run button

### Incident Reporting
- **Location Picking**: Click on map or use current location
- **Webhook Integration**: Forwards to n8n endpoint automatically
- **Form Validation**: Comprehensive validation for all required fields

### Dataset Support
- **EV Charging**: Sacramento region EV stations
- **La Mesa Infrastructure**: Electrical and gas meters
- **Water Infrastructure**: UN water systems with authentication

## 📝 Stopping Services

### Using Scripts
- **PowerShell**: Press `Ctrl+C` in the script terminal
- **Batch**: Close the terminal windows or press `Ctrl+C`

### Manual Cleanup
```powershell
# Stop all Python processes
Get-Process python | Stop-Process -Force

# Stop all Node processes  
Get-Process node | Stop-Process -Force

# Or target specific PIDs
taskkill /PID <BACKEND_PID> /F
taskkill /PID <FRONTEND_PID> /F
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Backend Logs**: API requests, dataset queries, incident forwarding
2. **Frontend**: React app loads with map and sidebar
3. **Network**: Data loading in the browser network tab
4. **Console**: No critical errors in browser console

---

**Happy Coding! 🚀** 