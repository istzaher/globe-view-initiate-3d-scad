# Globe View 3D - Interactive 3D Map Application

A full-stack 3D globe visualization application powered by ArcGIS JavaScript API with natural language query capabilities and real-time data visualization.

## 🚀 Features

- **3D Globe Visualization**: Interactive 3D globe using ArcGIS SceneView
- **Natural Language Queries**: Query geographic data using plain English powered by spaCy NLP
- **Real-time Data**: Live integration with ArcGIS services (EV charging stations, utility infrastructure)
- **Multiple Datasets**: Support for various geographic datasets
- **Routing & Navigation**: Route calculation and turn-by-turn directions
- **Incident Reporting**: Report incidents with location-based data

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **ArcGIS JavaScript API 4.32** for 3D mapping
- **Tailwind CSS + shadcn/ui** for modern UI components
- **React Query** for state management

### Backend
- **FastAPI** Python web framework
- **spaCy** for natural language processing
- **uvicorn** ASGI server
- **ArcGIS REST API** integration

## 📦 Quick Setup

### Prerequisites
- **Python 3.8+**
- **Node.js 18+**
- **npm** or **yarn**

### 🔧 Automated Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd globe-view-initiate-3d
   ```

2. **Run the setup script**:
   ```bash
   python setup.py
   ```
   This will:
   - Install Python dependencies
   - Download spaCy English model
   - Install Node.js dependencies
   - Build the frontend
   - Create environment configuration

3. **Start development servers**:
   ```bash
   python start_dev.py
   ```
   This starts both backend (port 8000) and frontend (port 5173) servers.

### 🔧 Manual Setup

If you prefer manual setup:

#### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start backend server
python main.py
```

#### Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

## 🌐 Usage

### Development
- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

### Natural Language Queries
Try these example queries:
- "Show EV charging stations near Sacramento"
- "Find Tesla stations with fast charging"
- "Display gas meters in La Mesa"
- "Show electrical infrastructure near me"

### API Endpoints
- `POST /api/parse` - Parse natural language queries
- `GET /api/datasets` - List available datasets
- `GET /api/services` - Get service information
- `POST /api/report-incident` - Report incidents

## 🚀 Production Deployment

### Using Render.com (Recommended)

This project is configured for easy deployment on Render.com using the included `render.yaml` file.

#### Step 1: Prepare Repository
1. Ensure all changes are committed to your Git repository
2. Push to GitHub, GitLab, or Bitbucket

#### Step 2: Deploy to Render
1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New" → "Blueprint"
3. Connect your Git repository
4. Select the repository containing this project
5. Render will automatically detect the `render.yaml` file
6. Click "Apply" to deploy

#### Step 3: Configure Environment (if needed)
The deployment will create two services:
- **Backend API**: `globe-esri-api.onrender.com`
- **Frontend**: `globe-esri-frontend.onrender.com`

#### Step 4: Update CORS Settings
After deployment, update the backend's CORS_ORIGINS environment variable:
1. Go to your backend service in Render dashboard
2. Navigate to Environment tab
3. Update `CORS_ORIGINS` to include your frontend URL

### Manual Deployment

#### Backend Deployment
```bash
# Build for production
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Set environment variables
export HOST=0.0.0.0
export PORT=8000
export CORS_ORIGINS=https://your-frontend-domain.com

# Start production server
uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### Frontend Deployment
```bash
# Set API URL
export VITE_API_BASE_URL=https://your-backend-api.com

# Build for production
npm run build

# Serve static files (dist/ directory)
npx vite preview --host 0.0.0.0 --port $PORT
```

## 🗄️ Datasets

### Available Datasets
1. **EV Charging Stations** (SACOG Transportation)
   - 721+ public charging stations
   - Real-time availability data
   - Multiple connector types

2. **La Mesa Electrical Infrastructure**
   - Electrical meters and panels
   - Service equipment locations
   - Utility infrastructure

3. **La Mesa Gas Infrastructure**
   - Gas meter locations
   - Utility service areas

### Adding New Datasets
1. Add service configuration to `SERVICES_CONFIG` in `main.py`
2. Restart the application to discover new layers
3. Use `/api/refresh-datasets` to reload without restart

## 🔧 Development

### Project Structure
```
globe-view-initiate-3d/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── services/          # API services
│   ├── hooks/             # React hooks
│   └── pages/             # Page components
├── query_parser/          # Python NLP parser
├── main.py               # FastAPI backend
├── service_discovery.py  # Dataset discovery
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
├── render.yaml          # Deployment configuration
└── setup.py             # Setup script
```

### Key Technologies
- **Mapping**: ArcGIS JavaScript API 4.32
- **3D Rendering**: WebGL via ArcGIS SceneView
- **NLP**: spaCy with English model
- **UI Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **Backend**: FastAPI + uvicorn

### Development Scripts
- `python start_dev.py` - Start both servers in development mode
- `npm run dev` - Start frontend development server only
- `npm run build` - Build frontend for production
- `python main.py` - Start backend server only

## 🐛 Troubleshooting

### Common Issues

#### spaCy Model Not Found
```bash
python -m spacy download en_core_web_sm
```

#### CORS Errors
Ensure `CORS_ORIGINS` environment variable includes your frontend URL.

#### Build Failures
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear Python cache: `find . -name "__pycache__" -exec rm -rf {} +`

#### Port Conflicts
Change ports in `.env` file or use environment variables:
```bash
export PORT=8001
export VITE_PORT=5174
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation at `/docs`
3. Open an issue on GitHub