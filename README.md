# IST GenAI Tool - AI-Powered Spatial Analysis Assistant

A sophisticated GenAI-powered application for natural language interaction with GIS and spatial datasets, specifically designed for IST (Statistics Centre - Abu Dhabi) infrastructure analysis and spatial intelligence.

## 🎯 Project Overview

This is a **Proof of Concept (POC)** application that demonstrates advanced AI-powered spatial analysis capabilities for Abu Dhabi's urban infrastructure. The tool enables authorized users to perform complex geospatial queries using natural language prompts and provides intelligent insights for statistical and operational decision-making.

## ✨ Key Features

### 🤖 **GenAI Chatbot with Memory Context**
- Natural language interaction with spatial datasets
- Contextual conversation memory for follow-up queries
- Dynamic query suggestions based on available layers
- AI-powered spatial analysis and insights

### 🗺️ **Advanced ArcGIS Integration**
- 2D MapView optimized for Abu Dhabi city center
- No authentication required (uses free public basemaps)
- Interactive map tools and widgets
- Custom symbology for different infrastructure types

### 📊 **Multi-Dataset Support**
- **Demo Layers**: Schools, hospitals, universities, police stations
- **Geodatabase Layers**: Educational, healthcare, infrastructure, transportation
- **Mock Spatial Analysis**: Overlays, buffers, spatial joins, density analysis
- **Abu Dhabi Focused**: All data centered on Abu Dhabi coordinates

### 🛠️ **Interactive Map Tools**
- Comprehensive ArcGIS widget suite (measurement, search, basemap gallery)
- Draggable and collapsible tool panels
- Live coordinate display
- Export and analysis capabilities

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **ArcGIS JavaScript API 4.32** for advanced mapping
- **Tailwind CSS** for modern, responsive UI
- **Lucide React** for consistent iconography

### Backend (Python FastAPI)
- **FastAPI** for high-performance API endpoints
- **spaCy** for advanced natural language processing
- **Custom Query Parser** for spatial query interpretation
- **Mock Services** for POC demonstrations

### Core Services
- **NLP Query Service**: Natural language to spatial query translation
- **Geodatabase Service**: Client-side layer management
- **Demo Layer Service**: Mock data generation for Abu Dhabi
- **GenAI Chatbot Service**: Conversational AI with memory
- **Feature Layer Service**: ArcGIS feature layer management

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** (use `python3` command, not `python`)
- **Node.js 18+**
- **npm** package manager

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd globe-view-initiate-3d

# Install Python dependencies
pip install -r requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm

# Install Node.js dependencies  
npm install
```

### 2. Start Development Servers

**Option A: Automated Start (Recommended)**
```bash
# Windows
start-dev.bat

# PowerShell
.\start-simple.ps1

# Python (Cross-platform)
python3 start_dev.py
```

**Option B: Manual Start**
```bash
# Terminal 1: Backend
python3 main.py

# Terminal 2: Frontend
npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## 💬 Using the GenAI Chatbot

### Example Natural Language Queries
```
"Show all schools in Abu Dhabi"
"Find hospitals near Emirates Palace"
"List healthcare facilities in Abu Dhabi Island"
"Show electrical infrastructure in the city center"
"Display all educational facilities from geodatabase"
"Find all infrastructure within 5km of Sheikh Zayed Mosque"
```

### Query Capabilities
- **Location-based queries**: City names, landmarks, addresses
- **Distance-based searches**: "within X km/miles of location"
- **Infrastructure filtering**: Schools, hospitals, utilities, transportation
- **Spatial analysis**: Overlays, buffers, density analysis (mocked)
- **Follow-up questions**: Contextual memory enables conversation flow

## 🗺️ Map Features

### Available Layers
- **Abu Dhabi Schools**: Primary and secondary educational institutions
- **Abu Dhabi Hospitals**: Healthcare facilities and medical centers
- **Universities**: Higher education institutions
- **Police Stations**: Law enforcement facilities
- **Geodatabase Infrastructure**: Educational, healthcare, public infrastructure

### Map Tools
- **Navigation**: Zoom, pan, home, compass
- **Measurement**: Distance, area, coordinates
- **Analysis**: Search, locate, bookmarks
- **Basemaps**: Streets, satellite, terrain options
- **Export**: Screenshots, PDF generation
- **Legend**: Dynamic layer information

## 🔧 Development

### Project Structure
```
globe-view-initiate-3d/
├── src/
│   ├── components/           # React components
│   │   ├── ChatbotInterface.tsx    # Main AI chat interface
│   │   ├── EsriMapTools.tsx       # Map tools and widgets
│   │   ├── MapViewer.tsx          # Core map component
│   │   └── ui/                    # Essential UI components
│   ├── services/             # Frontend services
│   │   ├── nlpQueryService.ts     # Natural language processing
│   │   ├── geodatabaseService.ts   # Geodatabase management
│   │   ├── genAIChatbotService.ts  # AI chatbot logic
│   │   └── demoLayerService.ts     # Demo data generation
│   ├── hooks/               # React hooks
│   └── config/              # Configuration files
├── query_parser/            # Python NLP processing
│   ├── spacy_parser.py      # Advanced spaCy processing
│   ├── parser.py           # Basic query parsing
│   └── models.py           # Data models
├── main.py                 # FastAPI backend server
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
└── render.yaml            # Deployment configuration
```

### Key Technologies
- **AI/ML**: spaCy NLP, custom query parsing algorithms
- **Mapping**: ArcGIS JavaScript API 4.32 (2D MapView)
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: FastAPI, Python 3.8+, uvicorn
- **Styling**: Tailwind CSS with custom Abu Dhabi theme

### Development Scripts
```bash
# Start both servers
python3 start_dev.py

# Frontend only
npm run dev

# Backend only  
python3 main.py

# Build for production
npm run build

# Lint and format
npm run lint
```

## 🚀 Deployment

### Render.com Deployment (Recommended)
The project includes `render.yaml` configuration for easy deployment:

1. Push code to Git repository
2. Connect repository to Render.com
3. Deploy using the Blueprint feature
4. Services will be automatically configured

### Environment Variables
```bash
# Backend
CORS_ORIGINS=https://your-frontend-domain.com
HOST=0.0.0.0
PORT=8000

# Frontend
VITE_API_BASE_URL=https://your-backend-api.com
```

## 🎯 IST Integration Roadmap

### Current POC Features ✅
- Natural language query processing
- Interactive map visualization
- Mock spatial analysis capabilities
- Abu Dhabi-focused datasets
- GenAI chatbot with memory

### Future Integration Points 🔄
- **IST Esri Enterprise** connectivity
- **Bayaan** dataset integration
- **Abu Dhabi District Pulse** livability indicators
- **Tbyaan** platform integration
- **Real spatial analysis** (overlays, buffers, joins)
- **Document processing** (PDFs, methodology documents)
- **Advanced visualization** (charts, comparisons)
- **Spatial benchmarking** between emirates/districts

## 🐛 Troubleshooting

### Common Issues

**Python Version Conflicts**
```bash
# Always use python3, not python
python3 main.py
python3 -m spacy download en_core_web_sm
```

**spaCy Model Missing**
```bash
python3 -m spacy download en_core_web_sm
```

**Port Conflicts**
```bash
# Check and kill processes
netstat -ano | findstr :8000
taskkill /PID [process_id] /F
```

**CORS Errors**
- Ensure backend CORS_ORIGINS includes frontend URL
- Check that both servers are running on correct ports

**Map Loading Issues**
- Clear browser cache
- Check browser console for specific errors
- Verify ArcGIS API loading correctly

## 📄 License

This project is developed for IST (Statistics Centre - Abu Dhabi) as a proof of concept for GenAI-powered spatial analysis capabilities.

## 🤝 Support

For technical issues and questions:
1. Check the troubleshooting section above
2. Review API documentation at http://localhost:8000/docs
3. Examine browser console for frontend errors
4. Check backend logs for server issues

---

**Built with ❤️ for IST's spatial intelligence and urban planning initiatives in Abu Dhabi** 🇦🇪