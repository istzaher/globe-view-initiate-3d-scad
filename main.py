#!/usr/bin/env python3
"""
Simplified Globe View 3D Backend Server
Fast startup with basic dataset support and ArcGIS authentication
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
import logging
import time
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware - Allow frontend on ports 3000-3010 and legacy 8080
cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:8080",  # Legacy support
    "http://localhost:5173",  # Vite default
    "*"  # Allow all for development
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = Path(__file__).parent / "dist"

class QueryRequest(BaseModel):
    query: str
    dataset: str = "education_0"
    token: Optional[str] = None  # ArcGIS authentication token

class IncidentLocation(BaseModel):
    latitude: float
    longitude: float
    address: str = None

class ReportTo(BaseModel):
    name: str
    phone: str

class IncidentUser(BaseModel):
    userId: str
    name: str
    contact: str
    email: str

class IncidentReport(BaseModel):
    incidentId: str
    location: IncidentLocation
    time: str
    type: str
    additionalDetails: str = None
    reportTo: ReportTo
    user: IncidentUser

class AuthRequest(BaseModel):
    username: str
    password: str
    server_url: str

# SCAD GenAI Tool - Enhanced dataset configuration for POC demonstration
# Agriculture, Education, and Public Safety datasets with advanced spatial analysis capabilities
DATASETS = {
    # AGRICULTURE DATASETS - 6 layers for comprehensive agricultural analysis
    "agriculture_0": {
        "name": "Abu Dhabi Crop Fields",
        "description": "Agricultural crop fields and farming areas in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 0,
        "service_name": "agriculture",
        "geometry_type": "Polygon",
        "requires_auth": False,
        "category": "Agriculture",
        "fields": ["CropType", "Area_HA", "Yield_Ton", "IrrigationType", "District", "FarmSize", "ProductionYear"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "agriculture_1": {
        "name": "Abu Dhabi Irrigation Systems",
        "description": "Agricultural irrigation infrastructure and water distribution in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 1,
        "service_name": "agriculture",
        "geometry_type": "Polyline",
        "requires_auth": False,
        "category": "Agriculture",
        "fields": ["SystemType", "Capacity_L", "Coverage_HA", "Status", "District", "InstallYear", "Efficiency"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "agriculture_2": {
        "name": "Abu Dhabi Farming Equipment",
        "description": "Agricultural machinery and equipment locations in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 2,
        "service_name": "agriculture",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Agriculture",
        "fields": ["EquipmentType", "Capacity", "Status", "District", "Owner", "LastMaintenance", "FuelType"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "agriculture_3": {
        "name": "Abu Dhabi Storage Facilities",
        "description": "Agricultural storage and processing facilities in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 3,
        "service_name": "agriculture",
        "geometry_type": "Polygon",
        "requires_auth": False,
        "category": "Agriculture",
        "fields": ["FacilityType", "Capacity_Ton", "StorageType", "District", "Owner", "Capacity_Used", "Temperature"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "agriculture_4": {
        "name": "Abu Dhabi Soil Quality Zones",
        "description": "Soil quality and fertility assessment areas in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 4,
        "service_name": "agriculture",
        "geometry_type": "Polygon",
        "requires_auth": False,
        "category": "Agriculture",
        "fields": ["SoilType", "Quality_Index", "pH_Level", "Nutrients", "District", "SurveyYear", "Recommendations"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "agriculture_5": {
        "name": "Abu Dhabi Weather Stations",
        "description": "Agricultural weather monitoring stations in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 5,
        "service_name": "agriculture",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Agriculture",
        "fields": ["StationType", "DataTypes", "District", "Altitude", "LastUpdate", "Coverage_Radius", "Status"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    
    # EDUCATION DATASETS - 6 layers for comprehensive educational analysis
    "education_0": {
        "name": "Abu Dhabi Schools",
        "description": "Educational institutions and schools in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 0,
        "service_name": "education",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Education",
        "fields": ["SchoolName", "SchoolType", "GradeLevels", "StudentCount", "District", "Rating", "Capacity", "Language"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "education_1": {
        "name": "Abu Dhabi Universities",
        "description": "Higher education institutions and universities in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 1,
        "service_name": "education",
        "geometry_type": "Polygon",
        "requires_auth": False,
        "category": "Education",
        "fields": ["UniversityName", "Type", "Programs", "StudentCount", "District", "Ranking", "Campus_Area", "Faculties"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "education_2": {
        "name": "Abu Dhabi Libraries",
        "description": "Public and educational libraries in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 2,
        "service_name": "education",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Education",
        "fields": ["LibraryName", "Type", "BookCount", "District", "Services", "OpeningHours", "Capacity", "DigitalResources"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "education_3": {
        "name": "Abu Dhabi Training Centers",
        "description": "Professional and vocational training facilities in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 3,
        "service_name": "education",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Education",
        "fields": ["CenterName", "Specialization", "Programs", "Capacity", "District", "Certification", "Duration", "Language"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "education_4": {
        "name": "Abu Dhabi Research Facilities",
        "description": "Research institutions and laboratories in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 4,
        "service_name": "education",
        "geometry_type": "Polygon",
        "requires_auth": False,
        "category": "Education",
        "fields": ["FacilityName", "ResearchArea", "Equipment", "District", "Funding", "Publications", "Collaborations", "Status"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "education_5": {
        "name": "Abu Dhabi Student Housing",
        "description": "Student accommodation and dormitories in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 5,
        "service_name": "education",
        "geometry_type": "Polygon",
        "requires_auth": False,
        "category": "Education",
        "fields": ["HousingName", "Type", "Capacity", "District", "Amenities", "Rent", "Availability", "NearbySchools"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    
    # PUBLIC SAFETY DATASETS - 6 layers for comprehensive safety analysis
    "public_safety_0": {
        "name": "Abu Dhabi Police Stations",
        "description": "Law enforcement facilities and police stations in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 0,
        "service_name": "public_safety",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Public Safety",
        "fields": ["StationName", "Type", "OfficerCount", "District", "Services", "ResponseTime", "Coverage_Area", "Equipment"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "public_safety_1": {
        "name": "Abu Dhabi Fire Stations",
        "description": "Fire and rescue service facilities in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 1,
        "service_name": "public_safety",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Public Safety",
        "fields": ["StationName", "Type", "FirefighterCount", "District", "Equipment", "ResponseTime", "Coverage_Area", "Specializations"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "public_safety_2": {
        "name": "Abu Dhabi Hospitals",
        "description": "Medical facilities and hospitals in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 2,
        "service_name": "public_safety",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Public Safety",
        "fields": ["HospitalName", "Type", "BedCount", "District", "Specialties", "EmergencyServices", "Capacity", "Rating"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "public_safety_3": {
        "name": "Abu Dhabi Emergency Services",
        "description": "Emergency response and ambulance services in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 3,
        "service_name": "public_safety",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Public Safety",
        "fields": ["ServiceName", "Type", "VehicleCount", "District", "ResponseTime", "Coverage_Area", "Specializations", "Status"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "public_safety_4": {
        "name": "Abu Dhabi Safety Zones",
        "description": "Designated safety and emergency zones in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 4,
        "service_name": "public_safety",
        "geometry_type": "Polygon",
        "requires_auth": False,
        "category": "Public Safety",
        "fields": ["ZoneName", "Type", "Area_HA", "District", "SafetyLevel", "Regulations", "Capacity", "Accessibility"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    },
    "public_safety_5": {
        "name": "Abu Dhabi Surveillance Systems",
        "description": "Security cameras and monitoring systems in Abu Dhabi",
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0/query",
        "layer_id": 5,
        "service_name": "public_safety",
        "geometry_type": "Point",
        "requires_auth": False,
        "category": "Public Safety",
        "fields": ["CameraID", "Type", "Coverage_Radius", "District", "Resolution", "Status", "Recording", "Location"],
        "mock_data": True,
        "focus_area": "Abu Dhabi, UAE"
    }
}

# Dataset configurations are now handled within the parse_simple_query function
# for better dataset-aware keyword matching

def get_dataset_config(dataset_name: str):
    """Get dataset configuration by name."""
    if dataset_name not in DATASETS:
        raise HTTPException(status_code=400, detail=f"Unknown dataset: {dataset_name}")
    return DATASETS[dataset_name]

def generate_abu_dhabi_mock_data(dataset_config: dict, query: str) -> dict:
    """Generate mock Abu Dhabi data for SCAD POC demonstration."""
    import random
    import time
    
    # Abu Dhabi districts
    abu_dhabi_districts = [
        "Central Abu Dhabi", "Al Ain", "Western Region", "Eastern Region", "Al Dhafra"
    ]
    
    # Generate realistic mock features based on dataset type
    features = []
    feature_count = random.randint(15, 50)  # Vary feature count for realism
    
    for i in range(feature_count):
        # Generate coordinates around Abu Dhabi city in Web Mercator (EPSG:3857)
        # Abu Dhabi center in Web Mercator: x=6050000, y=2800000
        base_x = 6050000
        base_y = 2800000
        x = base_x + (random.random() - 0.5) * 50000  # Spread around Abu Dhabi
        y = base_y + (random.random() - 0.5) * 50000
        
        # Generate attributes based on dataset type
        attributes = {}
        for field in dataset_config.get("fields", []):
            if field == "District":
                attributes[field] = random.choice(abu_dhabi_districts)
            elif field in ["CropType", "EquipmentType", "SchoolType", "StationName", "HospitalName"]:
                attributes[field] = f"Abu Dhabi {field.replace('Type', '').replace('Name', '')} {i+1}"
            elif field in ["StudentCount", "OfficerCount", "FirefighterCount", "BedCount"]:
                attributes[field] = random.randint(50, 500)
            elif field in ["Area_HA", "Capacity_Ton", "Campus_Area"]:
                attributes[field] = round(random.uniform(10, 1000), 2)
            elif field in ["Rating", "Quality_Index", "SafetyLevel"]:
                attributes[field] = round(random.uniform(1, 10), 1)
            elif field in ["ResponseTime", "Coverage_Radius"]:
                attributes[field] = f"{random.randint(5, 15)} minutes"
            elif field == "Status":
                attributes[field] = random.choice(["Active", "Operational", "Maintenance"])
            elif field == "Language":
                attributes[field] = random.choice(["Arabic", "English", "Bilingual"])
            else:
                attributes[field] = f"Value_{i+1}"
        
        # Generate geometry based on type
        if dataset_config.get("geometry_type") == "Point":
            geometry = {
                "x": x,
                "y": y,
                "spatialReference": {"wkid": 3857}
            }
        elif dataset_config.get("geometry_type") == "Polygon":
            # Create a small polygon around the point
            buffer = 0.001  # Small buffer for polygon
            geometry = {
                "rings": [[
                    [x - buffer, y - buffer],
                    [x + buffer, y - buffer],
                    [x + buffer, y + buffer],
                    [x - buffer, y + buffer],
                    [x - buffer, y - buffer]
                ]],
                "spatialReference": {"wkid": 3857}
            }
        else:  # Polyline
            geometry = {
                "paths": [[
                    [x - 0.001, y - 0.001],
                    [x + 0.001, y + 0.001]
                ]],
                "spatialReference": {"wkid": 3857}
            }
        
        features.append({
            "attributes": attributes,
            "geometry": geometry
        })
    
    return {
        "features": features,
        "spatialReference": {"wkid": 3857},
        "fields": [
            {
                "name": field,
                "type": "esriFieldTypeString" if field in ["District", "Status", "Language"] else "esriFieldTypeDouble",
                "alias": field
            } for field in dataset_config.get("fields", [])
        ],
        "exceededTransferLimit": False,
        "queryMetadata": {
            "where_clause": "OBJECTID IS NOT NULL",
            "feature_count": len(features),
            "dataset": dataset_config.get("service_name", "unknown"),
            "dataset_name": dataset_config.get("name", "Unknown Dataset"),
            "spatial_reference": 3857
        }
    }

def parse_simple_query(query: str, dataset: str) -> str:
    """Enhanced query parsing with dataset-aware keyword matching."""
    query_lower = query.lower()
    logger.info(f"Parsing query: '{query_lower}' for dataset: {dataset}")
    
    # Dataset-specific mappings for SCAD Abu Dhabi datasets
    if dataset.startswith('education'):
        # Education specific mappings
        education_mappings = {
            "school": "SchoolType LIKE '%School%'",
            "university": "SchoolType LIKE '%University%'",
            "library": "SchoolType LIKE '%Library%'",
            "training": "SchoolType LIKE '%Training%'",
            "research": "SchoolType LIKE '%Research%'",
            "housing": "SchoolType LIKE '%Housing%'",
            "student": "StudentCount > 0",
            "capacity": "Capacity > 0",
            "rating": "Rating > 0",
            "abu dhabi": "District = 'Central Abu Dhabi' OR District = 'Al Ain' OR District = 'Western Region' OR District = 'Eastern Region' OR District = 'Al Dhafra'",
            "central": "District = 'Central Abu Dhabi'",
            "al ain": "District = 'Al Ain'",
            "western": "District = 'Western Region'",
            "eastern": "District = 'Eastern Region'",
            "dhafra": "District = 'Al Dhafra'",
            "show all": "1=1",
            "all": "1=1",
            "everything": "1=1",
            "show": "1=1",
            "find": "1=1",
            "list": "1=1",
            "get": "1=1",
            "display": "1=1"
        }
        
        keywords_by_length = sorted(education_mappings.keys(), key=len, reverse=True)
        for keyword in keywords_by_length:
            if keyword in query_lower:
                logger.info(f"Matched Education keyword: '{keyword}' -> {education_mappings[keyword]}")
                return education_mappings[keyword]
                
    elif dataset.startswith('public_safety'):
        # Public Safety specific mappings
        safety_mappings = {
            "police": "StationName LIKE '%Police%'",
            "fire": "StationName LIKE '%Fire%'",
            "hospital": "StationName LIKE '%Hospital%'",
            "emergency": "StationName LIKE '%Emergency%'",
            "safety": "StationName LIKE '%Safety%'",
            "surveillance": "StationName LIKE '%Surveillance%'",
            "officer": "OfficerCount > 0",
            "firefighter": "FirefighterCount > 0",
            "bed": "BedCount > 0",
            "response": "ResponseTime IS NOT NULL",
            "coverage": "Coverage_Area IS NOT NULL",
            "abu dhabi": "District = 'Central Abu Dhabi' OR District = 'Al Ain' OR District = 'Western Region' OR District = 'Eastern Region' OR District = 'Al Dhafra'",
            "central": "District = 'Central Abu Dhabi'",
            "al ain": "District = 'Al Ain'",
            "western": "District = 'Western Region'",
            "eastern": "District = 'Eastern Region'",
            "dhafra": "District = 'Al Dhafra'",
            "show all": "1=1",
            "all": "1=1",
            "everything": "1=1",
            "show": "1=1",
            "find": "1=1",
            "list": "1=1",
            "get": "1=1",
            "display": "1=1"
        }
        
        keywords_by_length = sorted(safety_mappings.keys(), key=len, reverse=True)
        for keyword in keywords_by_length:
            if keyword in query_lower:
                logger.info(f"Matched Public Safety keyword: '{keyword}' -> {safety_mappings[keyword]}")
                return safety_mappings[keyword]
                
    elif dataset.startswith('agriculture'):
        # Agriculture specific mappings
        agriculture_mappings = {
            "crop": "CropType IS NOT NULL",
            "irrigation": "SystemType IS NOT NULL",
            "equipment": "EquipmentType IS NOT NULL",
            "storage": "FacilityType IS NOT NULL",
            "soil": "SoilType IS NOT NULL",
            "weather": "StationType IS NOT NULL",
            "farm": "CropType IS NOT NULL",
            "yield": "Yield_Ton > 0",
            "productivity": "Yield_Ton > 0",
            "capacity": "Capacity_Ton > 0",
            "quality": "Quality_Index > 0",
            "abu dhabi": "District = 'Central Abu Dhabi' OR District = 'Al Ain' OR District = 'Western Region' OR District = 'Eastern Region' OR District = 'Al Dhafra'",
            "central": "District = 'Central Abu Dhabi'",
            "al ain": "District = 'Al Ain'",
            "western": "District = 'Western Region'",
            "eastern": "District = 'Eastern Region'",
            "dhafra": "District = 'Al Dhafra'",
            "show all": "1=1",
            "all": "1=1",
            "everything": "1=1",
            "show": "1=1",
            "find": "1=1",
            "list": "1=1",
            "get": "1=1",
            "display": "1=1"
        }
        
        keywords_by_length = sorted(agriculture_mappings.keys(), key=len, reverse=True)
        for keyword in keywords_by_length:
            if keyword in query_lower:
                logger.info(f"Matched Agriculture keyword: '{keyword}' -> {agriculture_mappings[keyword]}")
                return agriculture_mappings[keyword]
    
    elif dataset.startswith('water_un'):
        # Water datasets - use general queries that work for all water features
        water_mappings = {
            "water": "OBJECTID IS NOT NULL",
            "assembly": "OBJECTID IS NOT NULL",
            "junction": "OBJECTID IS NOT NULL", 
            "network": "OBJECTID IS NOT NULL",
            "structure": "OBJECTID IS NOT NULL",
            "boundary": "OBJECTID IS NOT NULL",
            "dirty": "OBJECTID IS NOT NULL",
            "device": "OBJECTID IS NOT NULL",
            "monitoring": "OBJECTID IS NOT NULL",
            "equipment": "OBJECTID IS NOT NULL",
            "operational": "OBJECTID IS NOT NULL",
            "main": "OBJECTID IS NOT NULL",
            "critical": "OBJECTID IS NOT NULL",
            "primary": "OBJECTID IS NOT NULL",
            "transmission": "OBJECTID IS NOT NULL",
            "distribution": "OBJECTID IS NOT NULL",
            "pipeline": "OBJECTID IS NOT NULL",
            "infrastructure": "OBJECTID IS NOT NULL",
            "maintenance": "OBJECTID IS NOT NULL",
            "cleanup": "OBJECTID IS NOT NULL",
            "contaminated": "OBJECTID IS NOT NULL",
            "show all": "OBJECTID IS NOT NULL",  # For water datasets, show all features
            "lines": "OBJECTID IS NOT NULL",
            "points": "OBJECTID IS NOT NULL",
            "areas": "OBJECTID IS NOT NULL",
        }
        
        keywords_by_length = sorted(water_mappings.keys(), key=len, reverse=True)
        for keyword in keywords_by_length:
            if keyword in query_lower:
                logger.info(f"Matched water keyword: '{keyword}' -> {water_mappings[keyword]}")
                return water_mappings[keyword]
    
    elif dataset.startswith('la_mesa'):
        # La Mesa datasets - use general infrastructure queries
        la_mesa_mappings = {
            "residential": "ServiceType1 LIKE '%Residential%'",
            "commercial": "ServiceType1 LIKE '%Commercial%'",
            "electrical": "OBJECTID IS NOT NULL",
            "meter": "OBJECTID IS NOT NULL",
            "gas": "OBJECTID IS NOT NULL",
            "service": "OBJECTID IS NOT NULL",
            "panel": "OBJECTID IS NOT NULL",
            "outlet": "OBJECTID IS NOT NULL",
            "acorn": "OBJECTID IS NOT NULL",
            "light": "OBJECTID IS NOT NULL",
            "tree": "OBJECTID IS NOT NULL",
            "well": "OBJECTID IS NOT NULL",
            "heritage": "OBJECTID IS NOT NULL",
            "decorative": "OBJECTID IS NOT NULL",
            "ornamental": "OBJECTID IS NOT NULL",
            "vintage": "OBJECTID IS NOT NULL",
            "show all": "OBJECTID IS NOT NULL",  # For La Mesa datasets, show all features
        }
        
        keywords_by_length = sorted(la_mesa_mappings.keys(), key=len, reverse=True)
        for keyword in keywords_by_length:
            if keyword in query_lower:
                logger.info(f"Matched La Mesa keyword: '{keyword}' -> {la_mesa_mappings[keyword]}")
                return la_mesa_mappings[keyword]
    
    # Default query - return all records for any dataset
    logger.info(f"No keywords matched, using default: OBJECTID IS NOT NULL")
    return "OBJECTID IS NOT NULL"

def make_arcgis_request(service_url: str, params, auth_token: Optional[str] = None, max_retries=3):
    """Make request to ArcGIS service with retry logic and optional authentication"""
    # Add authentication token if provided
    if auth_token:
        params["token"] = auth_token
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting ArcGIS request to {service_url} (attempt {attempt + 1}/{max_retries})")
            if auth_token:
                logger.info("Using authentication token for request")
            
            response = requests.get(service_url, params=params, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            
            # Check for ArcGIS-specific authentication errors
            if 'error' in result:
                error_code = result['error'].get('code', 0)
                error_message = result['error'].get('message', 'Unknown error')
                
                # Handle authentication-related errors
                if error_code in [499, 498]:  # Token required or invalid token
                    logger.error(f"Authentication error: {error_message}")
                    raise HTTPException(
                        status_code=401, 
                        detail=f"Authentication required: {error_message}"
                    )
                elif error_code == 400:
                    logger.error(f"Bad request: {error_message}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid request: {error_message}"
                    )
                else:
                    logger.error(f"ArcGIS service error: {error_message}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Service error: {error_message}"
                    )
            
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to connect to service after {max_retries} attempts: {str(e)}"
                )
        except HTTPException:
            # Re-raise HTTP exceptions (authentication, etc.)
            raise
        except Exception as e:
            logger.error(f"Unexpected error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Unexpected error: {str(e)}"
                )

# API Routes
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Globe View 3D Backend is running"}

@app.get("/api/datasets")
async def get_available_datasets():
    """Get list of available datasets with authentication requirements."""
    return {
        "datasets": [
            {
                "id": dataset_id,
                "name": config["name"],
                "description": config["description"],
                "layer_id": config.get("layer_id"),
                "service_name": config.get("service_name"),
                "geometry_type": config.get("geometry_type"),
                "requires_auth": config.get("requires_auth", False),
                "auth_server": config.get("auth_server") if config.get("requires_auth") else None
            }
            for dataset_id, config in DATASETS.items()
        ]
    }

@app.get("/api/services")
async def get_services_info():
    """Get information about configured services."""
    services = {}
    for dataset_id, config in DATASETS.items():
        service_name = config["service_name"]
        if service_name not in services:
            services[service_name] = {
                "name": service_name,
                "url": config["url"].replace(f"/{config['layer_id']}/query", ""),
                "description": f"Service for {service_name}",
                "discovered_layers": [],
                "requires_auth": config.get("requires_auth", False),
                "auth_server": config.get("auth_server")
            }
        services[service_name]["discovered_layers"].append(dataset_id)
    
    return {
        "services": list(services.values()),
        "total_datasets": len(DATASETS)
    }

@app.post("/api/parse")
async def parse_query(request: QueryRequest):
    """Parse natural language query and return ArcGIS query results with authentication support."""
    try:
        logger.info(f"Received query: {request.query} for dataset: {request.dataset}")
        
        # Get dataset configuration
        dataset_config = get_dataset_config(request.dataset)
        
        # Check if authentication is required
        if dataset_config.get("requires_auth", False):
            if not request.token:
                raise HTTPException(
                    status_code=401, 
                    detail=f"Authentication token required for dataset: {dataset_config['name']}"
                )
            logger.info("Using provided authentication token for secured dataset")
        
        # Parse the query using simple keyword matching
        where_clause = parse_simple_query(request.query, request.dataset)
        logger.info(f"Generated where clause: {where_clause}")
        
        # Build ArcGIS query parameters
        arcgis_params = {
            "where": where_clause,
            "outFields": "*",
            "f": "json",
            "returnGeometry": "true",
            "outSR": "3857",  # Web Mercator
            "maxRecordCount": 1000
        }
        
        # Check if this is a mock dataset for Abu Dhabi POC
        if dataset_config.get("mock_data", False):
            logger.info(f"🎭 Generating mock Abu Dhabi data for {dataset_config['name']}")
            arcgis_data = generate_abu_dhabi_mock_data(dataset_config, request.query)
        else:
            # Execute the ArcGIS query with optional authentication
            arcgis_data = make_arcgis_request(
                dataset_config["url"], 
                arcgis_params, 
                auth_token=request.token
            )
        
        # Log results summary
        feature_count = len(arcgis_data.get('features', []))
        logger.info(f"Found {feature_count} features from {dataset_config['name']}")
        
        # Debug: Log spatial reference and sample coordinates for water devices
        source_spatial_ref = arcgis_data.get('spatialReference', {})
        if request.dataset.startswith('water_un') and feature_count > 0:
            logger.info(f"🗺️ Water dataset spatial reference: {source_spatial_ref}")
            
            # Log first few coordinate samples
            sample_features = arcgis_data.get('features', [])[:3]
            for i, feature in enumerate(sample_features):
                geometry = feature.get('geometry', {})
                if 'paths' in geometry:
                    first_path = geometry['paths'][0] if geometry['paths'] else []
                    first_point = first_path[0] if first_path else []
                    logger.info(f"💧 Sample {i+1} path coordinates: {first_point}")
                    logger.info(f"💧 Sample {i+1} ASSETGROUP: {feature.get('attributes', {}).get('ASSETGROUP')}")
                elif geometry.get('x') is not None and geometry.get('y') is not None:
                    logger.info(f"💧 Sample {i+1} point coordinates: [{geometry['x']}, {geometry['y']}]")
                    logger.info(f"💧 Sample {i+1} ASSETGROUP: {feature.get('attributes', {}).get('ASSETGROUP')}")
                    
                    # Special check for Illinois State Plane coordinates
                    x, y = geometry['x'], geometry['y']
                    if 1000000 <= x <= 1100000 and 1800000 <= y <= 1900000:
                        logger.info(f"🗺️ DETECTED: Illinois State Plane coordinates in {request.dataset}: {x}, {y}")
        
        # Determine the actual source spatial reference
        # Many water datasets use Illinois State Plane (EPSG:3435/102671)
        detected_source_sr = 3857  # Default to Web Mercator
        if source_spatial_ref:
            detected_source_sr = source_spatial_ref.get('wkid', source_spatial_ref.get('latestWkid', 3857))
        
        # Check for Illinois State Plane coordinates in the data
        if request.dataset.startswith('water_un') and feature_count > 0:
            first_feature = arcgis_data.get('features', [{}])[0]
            geometry = first_feature.get('geometry', {})
            if geometry.get('x') is not None and geometry.get('y') is not None:
                x, y = geometry['x'], geometry['y']
                if 1000000 <= x <= 1100000 and 1800000 <= y <= 1900000:
                    logger.info(f"🗺️ Override: Detected Illinois State Plane coordinates, setting source SR to 3435")
                    detected_source_sr = 3435  # Illinois State Plane East
        
        # Return the ArcGIS response with query metadata
        response = {
            "features": arcgis_data.get('features', []),
            "queryMetadata": {
                "where_clause": where_clause,
                "feature_count": feature_count,
                "dataset": request.dataset,
                "dataset_name": dataset_config["name"],
                "spatial_reference": detected_source_sr,  # Use detected source SR instead of output SR
                "output_spatial_reference": 3857,  # What we requested from ArcGIS
                "source_spatial_reference": source_spatial_ref,  # Original SR from ArcGIS response
                "requires_auth": dataset_config.get("requires_auth", False),
                "authenticated": bool(request.token) if dataset_config.get("requires_auth", False) else None
            }
        }
        
        # Include spatialReference if present in the data
        if 'spatialReference' in arcgis_data:
            response['spatialReference'] = arcgis_data['spatialReference']
            
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions (authentication, validation, etc.)
        raise
    except requests.RequestException as e:
        logger.error(f"Request error: {e}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

class WebhookPayload(BaseModel):
    incident: IncidentReport
    timestamp: str
    source: str
    priority: str

@app.post("/api/report-incident")
async def report_incident(payload: WebhookPayload):
    """
    Forward incident report to the external webhook with unified payload structure.
    """
    try:
        # Extract the incident from the payload
        incident = payload.incident
        
        logger.info(f"Received incident report: {incident.incidentId} from {payload.source} with {payload.priority} priority")
        
        # Convert the entire payload to dict for JSON serialization
        payload_data = payload.dict()
        
        # Forward to the external webhook
        webhook_url = "https://zman.app.n8n.cloud/webhook/incidents-call"
        
        logger.info(f"Forwarding incident {incident.incidentId} to webhook: {webhook_url}")
        
        response = requests.post(
            webhook_url,
            json=payload_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        # Check if the webhook request was successful
        response.raise_for_status()
        
        logger.info(f"✅ Successfully forwarded incident {incident.incidentId} to webhook")
        
        return {
            "success": True,
            "incidentId": incident.incidentId,
            "source": payload.source,
            "priority": payload.priority,
            "message": "Incident reported successfully"
        }
        
    except requests.exceptions.Timeout:
        logger.error(f"❌ Timeout forwarding incident {incident.incidentId}")
        raise HTTPException(status_code=408, detail="Webhook request timed out")
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Error forwarding incident {incident.incidentId}: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to forward incident: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error reporting incident {incident.incidentId}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/api/auth/arcgis")
async def authenticate_arcgis(auth_request: AuthRequest):
    """Proxy ArcGIS authentication to avoid CORS issues."""
    try:
        logger.info(f"Authenticating with ArcGIS server: {auth_request.server_url}")
        
        # Determine the token endpoint based on server type
        base_url = auth_request.server_url.rstrip('/').split('/rest/services')[0]
        
        if 'arcgis.com' in base_url or '/sharing/' in base_url or '/portal' in base_url:
            token_url = f"{base_url}/sharing/rest/generateToken"
        else:
            token_url = f"{base_url}/tokens/generateToken"
        
        # Prepare authentication parameters
        auth_params = {
            'username': auth_request.username,
            'password': auth_request.password,
            'client': 'referer',
            'referer': 'http://localhost:3000',  # Our frontend domain
            'expiration': '60',  # 60 minutes
            'f': 'json'
        }
        
        logger.info(f"Making token request to: {token_url}")
        
        # Make the authentication request
        response = requests.post(token_url, data=auth_params, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        if 'error' in result:
            logger.error(f"Authentication failed: {result['error']}")
            raise HTTPException(
                status_code=401,
                detail=f"Authentication failed: {result['error'].get('message', 'Invalid credentials')}"
            )
        
        if 'token' not in result:
            logger.error("No token in response")
            raise HTTPException(
                status_code=401,
                detail="Authentication failed: No token received"
            )
        
        logger.info("✅ Authentication successful")
        
        return {
            "success": True,
            "token": result['token'],
            "expires": result.get('expires', int(time.time() * 1000) + (60 * 60 * 1000))  # Default 1 hour
        }
        
    except requests.RequestException as e:
        logger.error(f"Network error during authentication: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Network error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Authentication error: {str(e)}"
        )

@app.post("/api/parse-complex")
async def parse_complex_scad_query(request: dict):
    """Parse complex SCAD queries with advanced spatial analysis capabilities."""
    try:
        start_time = time.time()
        query_text = request.get("query", "")
        datasets = request.get("datasets", [])
        
        logger.info(f"Received complex SCAD query: {query_text} for datasets: {datasets}")
        
        # Import the enhanced parser
        from query_parser.spacy_parser import SpacyQueryParser
        parser = SpacyQueryParser()
        
        # Parse the complex query
        complex_result = parser.parse_complex_scad_query(query_text, datasets)
        
        # Determine analysis type and suggest appropriate datasets
        analysis_type = complex_result.get("analysis_type", "general_analysis")
        suggested_datasets = complex_result.get("suggested_datasets", datasets)
        
        # Mock complex analysis results for POC
        mock_analysis_results = {
            "population_healthcare_analysis": {
                "summary": "Abu Dhabi District Pulse: Analysis of population density vs healthcare access across Abu Dhabi districts",
                "findings": [
                    "High population density areas in Central Abu Dhabi and Al Ain",
                    "Healthcare facilities concentrated in Abu Dhabi city center",
                    "Western Region shows lower healthcare accessibility",
                    "Correlation coefficient: 0.73 between density and access in Abu Dhabi",
                    "Al Ain district shows balanced population-healthcare ratio"
                ],
                "recommendations": [
                    "Expand healthcare infrastructure in high-density areas",
                    "Improve rural healthcare access through mobile units",
                    "Consider population growth projections for future planning"
                ],
                "statistics": {
                    "total_population": 9500000,
                    "healthcare_facilities": 245,
                    "average_access_time": "12.5 minutes",
                    "coverage_percentage": 78.3
                }
            },
            "education_safety_analysis": {
                "summary": "Abu Dhabi Educational institution proximity to safety facilities analysis",
                "findings": [
                    "95% of Abu Dhabi schools within 5km of police stations",
                    "88% of Abu Dhabi universities have fire station coverage",
                    "Emergency response time averages 8.2 minutes in Abu Dhabi",
                    "Safety zones effectively cover Abu Dhabi educational districts",
                    "Al Ain educational facilities show excellent safety coverage"
                ],
                "recommendations": [
                    "Enhance surveillance systems near schools",
                    "Improve emergency response coordination",
                    "Regular safety drills and training programs"
                ],
                "statistics": {
                    "total_schools": 1250,
                    "safety_coverage": 94.2,
                    "average_response_time": "8.2 minutes",
                    "safety_rating": "A+"
                }
            },
            "agricultural_productivity_analysis": {
                "summary": "Abu Dhabi Agricultural productivity and infrastructure analysis",
                "findings": [
                    "Abu Dhabi leads in crop yield per hectare across all districts",
                    "Irrigation systems cover 85% of Abu Dhabi agricultural land",
                    "Weather stations provide comprehensive coverage in Abu Dhabi",
                    "Storage facilities efficiently distributed across Abu Dhabi",
                    "Al Ain shows highest agricultural productivity in Abu Dhabi",
                    "Western Region has potential for agricultural expansion"
                ],
                "recommendations": [
                    "Expand irrigation to underutilized areas",
                    "Implement precision agriculture technologies",
                    "Improve storage capacity for seasonal crops"
                ],
                "statistics": {
                    "total_crop_area": 125000,
                    "irrigation_coverage": 85.3,
                    "average_yield": "4.2 tons/hectare",
                    "productivity_index": 87.5
                }
            }
        }
        
        # Get analysis results
        analysis_results = mock_analysis_results.get(analysis_type, {
            "summary": f"Complex analysis of {query_text}",
            "findings": ["Analysis completed successfully"],
            "recommendations": ["Continue monitoring and analysis"],
            "statistics": {"total_features": 150, "analysis_confidence": 0.92}
        })
        
        return {
            "query_analysis": complex_result,
            "analysis_results": analysis_results,
            "suggested_datasets": suggested_datasets,
            "spatial_operations": complex_result.get("spatial_operations", []),
            "comparison_areas": complex_result.get("comparison_areas", []),
            "indicators": complex_result.get("indicators", []),
            "processing_metadata": {
                "query_complexity": complex_result.get("query_complexity", "low"),
                "requires_multiple_datasets": complex_result.get("requires_multiple_datasets", False),
                "spatial_relationships": complex_result.get("spatial_relationships", []),
                "processing_time": time.time() - start_time
            }
        }
        
    except Exception as e:
        logger.error(f"Complex SCAD query processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Complex query processing failed: {str(e)}")

# Chatbot endpoints for GenAI conversation
class ChatbotRequest(BaseModel):
    message: str
    sessionId: str
    currentDataset: Optional[str] = None
    spatialContext: Optional[Dict[str, Any]] = None

class ChatbotResponse(BaseModel):
    message: str
    type: str
    followUpSuggestions: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None

# In-memory conversation storage (in production, use Redis or database)
conversation_memory = {}

@app.post("/api/chatbot/query", response_model=ChatbotResponse)
async def chatbot_query(request: ChatbotRequest):
    """
    Process a conversational query with GenAI chatbot capabilities
    """
    try:
        logger.info(f"🤖 Chatbot query: {request.message} (Session: {request.sessionId})")
        
        # Get or create conversation context
        if request.sessionId not in conversation_memory:
            conversation_memory[request.sessionId] = {
                "messages": [],
                "currentDataset": request.currentDataset,
                "lastQuery": None,
                "spatialContext": request.spatialContext,
                "timestamp": time.time()
            }
        
        context = conversation_memory[request.sessionId]
        
        # Analyze query type
        query_type = analyze_query_type(request.message)
        
        # Generate contextual response
        response = generate_chatbot_response(request.message, query_type, context, request)
        
        # Update conversation context
        context["messages"].append({
            "type": "user",
            "content": request.message,
            "timestamp": time.time()
        })
        
        context["messages"].append({
            "type": "assistant", 
            "content": response["message"],
            "timestamp": time.time()
        })
        
        # Keep only last 20 messages
        if len(context["messages"]) > 20:
            context["messages"] = context["messages"][-20:]
        
        context["currentDataset"] = request.currentDataset
        context["lastQuery"] = request.message
        context["spatialContext"] = request.spatialContext
        context["timestamp"] = time.time()
        
        return ChatbotResponse(**response)
        
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return ChatbotResponse(
            message="I apologize, but I encountered an error processing your request. Please try again.",
            type="error",
            followUpSuggestions=get_default_suggestions()
        )

@app.get("/api/chatbot/suggestions/{session_id}")
async def get_followup_suggestions(session_id: str):
    """
    Get follow-up suggestions based on conversation context
    """
    try:
        if session_id not in conversation_memory:
            return {"suggestions": get_default_suggestions()}
        
        context = conversation_memory[session_id]
        suggestions = generate_followup_suggestions(context)
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Suggestions error: {e}")
        return {"suggestions": get_default_suggestions()}

@app.delete("/api/chatbot/clear/{session_id}")
async def clear_conversation(session_id: str):
    """
    Clear conversation history for a session
    """
    try:
        if session_id in conversation_memory:
            del conversation_memory[session_id]
        return {"message": "Conversation cleared successfully"}
    except Exception as e:
        logger.error(f"Clear conversation error: {e}")
        return {"message": "Error clearing conversation"}

def analyze_query_type(message: str) -> str:
    """Analyze the type of query being asked"""
    lower_message = message.lower()
    
    if any(word in lower_message for word in ['analyze', 'analysis', 'compare', 'comparison']):
        return 'analysis'
    elif any(word in lower_message for word in ['show', 'find', 'display', 'list']):
        return 'spatial'
    elif any(word in lower_message for word in ['near', 'within', 'distance', 'close']):
        return 'proximity'
    elif any(word in lower_message for word in ['what', 'how', 'why', 'explain']):
        return 'exploratory'
    elif any(word in lower_message for word in ['hello', 'hi', 'hey', 'help']):
        return 'greeting'
    else:
        return 'general'

def generate_chatbot_response(message: str, query_type: str, context: dict, request: ChatbotRequest) -> dict:
    """Generate contextual chatbot response"""
    lower_message = message.lower()
    
    # Handle greetings
    if query_type == 'greeting':
        return {
            "message": "Hello! I'm the SCAD GenAI Assistant. I can help you analyze Abu Dhabi's spatial data including education, public safety, and agriculture datasets. I can also assist with Abu Dhabi District Pulse livability indicators. What would you like to explore?",
            "type": "suggestion",
            "followUpSuggestions": get_default_suggestions()
        }
    
    # Handle help requests
    if 'help' in lower_message or 'what can you do' in lower_message:
        return {
            "message": "I can help you with:\n\n• **Spatial Queries**: 'Show me all schools in Abu Dhabi', 'Find hospitals near police stations'\n• **Analysis**: 'Analyze education accessibility', 'Compare agricultural productivity'\n• **District Pulse**: 'Show livability indicators', 'Compare districts'\n• **Multi-dataset**: 'Find schools within 2km of hospitals'\n\nWhat would you like to explore?",
            "type": "explanation",
            "followUpSuggestions": get_default_suggestions()
        }
    
    # Handle dataset inquiries
    if 'dataset' in lower_message or 'available data' in lower_message:
        return {
            "message": "Here are the available datasets for Abu Dhabi analysis:\n\n**Education (6 layers):**\n• Schools, Universities, Libraries\n• Training Centers, Research Facilities, Student Housing\n\n**Public Safety (6 layers):**\n• Police Stations, Fire Stations, Hospitals\n• Emergency Services, Safety Zones, Surveillance Systems\n\n**Agriculture (6 layers):**\n• Crop Fields, Irrigation Systems, Farming Equipment\n• Storage Facilities, Soil Quality Zones, Weather Stations\n\nWhich dataset interests you?",
            "type": "explanation",
            "followUpSuggestions": get_default_suggestions()
        }
    
    # Handle spatial queries
    if query_type in ['spatial', 'proximity']:
        return {
            "message": f"I'll help you with that spatial query. {get_spatial_guidance(message)}",
            "type": "query",
            "metadata": {
                "queryType": "spatial",
                "spatialOperation": extract_spatial_operation(message),
                "confidence": 0.9
            },
            "followUpSuggestions": generate_followup_suggestions(context)
        }
    
    # Handle analysis queries
    if query_type == 'analysis':
        return {
            "message": f"I'll perform that analysis for you. {get_analysis_guidance(message)}",
            "type": "analysis",
            "metadata": {
                "queryType": "analysis",
                "confidence": 0.9
            },
            "followUpSuggestions": generate_followup_suggestions(context)
        }
    
    # Handle follow-up questions with context
    if len(context.get("messages", [])) > 2:
        return handle_followup_query(message, context, request)
    
    # Default response
    return {
        "message": f"I understand you're asking about '{message}'. Let me help you with that. Could you be more specific about what you'd like to explore? For example:\n\n• 'Show me all schools in Abu Dhabi'\n• 'Analyze healthcare accessibility'\n• 'Find agricultural areas near water sources'",
        "type": "suggestion",
        "metadata": {
            "queryType": "general",
            "confidence": 0.7
        },
        "followUpSuggestions": get_default_suggestions()
    }

def handle_followup_query(message: str, context: dict, request: ChatbotRequest) -> dict:
    """Handle follow-up questions with conversation context"""
    lower_message = message.lower()
    
    # Check for references to previous results
    if any(word in lower_message for word in ['these', 'those', 'them']):
        return {
            "message": f"I'll analyze the data from your previous query. {get_contextual_guidance(message, context)}",
            "type": "query",
            "context": {
                "previousQuery": context.get("lastQuery"),
                "dataset": context.get("currentDataset"),
                "resultsCount": context.get("lastResults", [])
            },
            "metadata": {
                "queryType": "follow-up",
                "confidence": 0.8
            },
            "followUpSuggestions": generate_followup_suggestions(context)
        }
    
    # Default follow-up response
    return {
        "message": f"I'll help you with that follow-up question. {get_general_followup_guidance(message, context)}",
        "type": "query",
        "metadata": {
            "queryType": "follow-up",
            "confidence": 0.7
        },
        "followUpSuggestions": generate_followup_suggestions(context)
    }

def get_spatial_guidance(message: str) -> str:
    """Get spatial query guidance"""
    if 'school' in message.lower():
        return "I'll show you the education facilities and their spatial distribution."
    elif any(word in message.lower() for word in ['hospital', 'health']):
        return "I'll display the healthcare facilities and their coverage areas."
    elif any(word in message.lower() for word in ['police', 'safety']):
        return "I'll show you the public safety infrastructure and response coverage."
    elif any(word in message.lower() for word in ['agriculture', 'farm']):
        return "I'll display the agricultural areas and farming infrastructure."
    
    return "I'll process your spatial query and display the relevant features on the map."

def get_analysis_guidance(message: str) -> str:
    """Get analysis guidance"""
    if any(word in message.lower() for word in ['district pulse', 'livability']):
        return "I'll analyze the Abu Dhabi District Pulse livability indicators across different districts."
    elif 'compare' in message.lower():
        return "I'll perform a comparative analysis between the specified areas or datasets."
    elif any(word in message.lower() for word in ['trend', 'over time']):
        return "I'll analyze the temporal trends and patterns in the data."
    
    return "I'll perform a comprehensive analysis of the requested data."

def get_contextual_guidance(message: str, context: dict) -> str:
    """Get contextual guidance for follow-up queries"""
    dataset = context.get("currentDataset")
    if dataset:
        dataset_type = dataset.split('_')[0]
        return f"I'll analyze the {dataset_type} data from your previous query and provide additional insights."
    return "I'll build upon your previous analysis and provide more detailed information."

def get_general_followup_guidance(message: str, context: dict) -> str:
    """Get general follow-up guidance"""
    return "I'll process your follow-up question using the context from our conversation."

def extract_spatial_operation(message: str) -> str:
    """Extract spatial operation from message"""
    lower_message = message.lower()
    
    if any(word in lower_message for word in ['within', 'inside']):
        return 'within'
    elif any(word in lower_message for word in ['near', 'close to']):
        return 'proximity'
    elif any(word in lower_message for word in ['buffer', 'around']):
        return 'buffer'
    elif any(word in lower_message for word in ['overlay', 'intersect']):
        return 'overlay'
    
    return 'spatial'

def get_default_suggestions() -> List[Dict[str, Any]]:
    """Get default follow-up suggestions"""
    return [
        {
            "question": "Show me all schools in Abu Dhabi",
            "type": "spatial",
            "confidence": 0.9
        },
        {
            "question": "Analyze Abu Dhabi District Pulse livability indicators",
            "type": "analytical",
            "confidence": 0.9
        },
        {
            "question": "Find police stations near hospitals",
            "type": "spatial",
            "confidence": 0.8
        },
        {
            "question": "Compare agricultural productivity across districts",
            "type": "comparative",
            "confidence": 0.8
        },
        {
            "question": "What datasets are available for analysis?",
            "type": "exploratory",
            "confidence": 0.7
        }
    ]

def generate_followup_suggestions(context: dict) -> List[Dict[str, Any]]:
    """Generate contextual follow-up suggestions"""
    suggestions = []
    
    # Get current dataset type
    current_dataset = context.get("currentDataset", "")
    if current_dataset:
        dataset_type = current_dataset.split('_')[0]
        
        if dataset_type == 'education':
            suggestions.extend([
                {
                    "question": "Show me the nearest hospitals to these schools",
                    "type": "spatial",
                    "confidence": 0.9
                },
                {
                    "question": "What's the student capacity of these institutions?",
                    "type": "analytical",
                    "confidence": 0.8
                }
            ])
        elif dataset_type == 'public_safety':
            suggestions.extend([
                {
                    "question": "Show me the coverage area of these facilities",
                    "type": "spatial",
                    "confidence": 0.9
                },
                {
                    "question": "What's the response time for these services?",
                    "type": "analytical",
                    "confidence": 0.8
                }
            ])
        elif dataset_type == 'agriculture':
            suggestions.extend([
                {
                    "question": "Show me the soil quality in these areas",
                    "type": "spatial",
                    "confidence": 0.9
                },
                {
                    "question": "What's the productivity of these farms?",
                    "type": "analytical",
                    "confidence": 0.8
                }
            ])
    
    # Add general suggestions
    suggestions.extend([
        {
            "question": "Tell me more about Abu Dhabi District Pulse indicators",
            "type": "exploratory",
            "confidence": 0.7
        },
        {
            "question": "What other datasets are available?",
            "type": "exploratory",
            "confidence": 0.6
        }
    ])
    
    return suggestions[:5]  # Return top 5 suggestions

# --- Geodatabase Layer Endpoints ---

@app.get("/api/geodatabase/{layer_name}")
async def get_geodatabase_layer_info(layer_name: str):
    """Get geodatabase layer information in ArcGIS FeatureServer format"""
    layer_configs = {
        "education_facilities": {
            "id": 0,
            "name": "Education Facilities (GDB)",
            "type": "Feature Layer",
            "description": "Educational facilities from SCAD geodatabase",
            "geometryType": "esriGeometryPoint",
            "spatialReference": {"wkid": 4326, "latestWkid": 4326},
            "fields": [
                {"name": "OBJECTID", "type": "esriFieldTypeOID", "alias": "Object ID"},
                {"name": "Name", "type": "esriFieldTypeString", "alias": "Facility Name", "length": 255},
                {"name": "Type", "type": "esriFieldTypeString", "alias": "Facility Type", "length": 100},
                {"name": "District", "type": "esriFieldTypeString", "alias": "District", "length": 100},
                {"name": "Capacity", "type": "esriFieldTypeInteger", "alias": "Student Capacity"},
                {"name": "Address", "type": "esriFieldTypeString", "alias": "Address", "length": 500}
            ]
        },
        "healthcare_facilities": {
            "id": 0,
            "name": "Healthcare Facilities (GDB)",
            "type": "Feature Layer", 
            "description": "Healthcare facilities from SCAD geodatabase",
            "geometryType": "esriGeometryPoint",
            "spatialReference": {"wkid": 4326, "latestWkid": 4326},
            "fields": [
                {"name": "OBJECTID", "type": "esriFieldTypeOID", "alias": "Object ID"},
                {"name": "Name", "type": "esriFieldTypeString", "alias": "Facility Name", "length": 255},
                {"name": "Type", "type": "esriFieldTypeString", "alias": "Facility Type", "length": 100},
                {"name": "District", "type": "esriFieldTypeString", "alias": "District", "length": 100},
                {"name": "Beds", "type": "esriFieldTypeInteger", "alias": "Number of Beds"},
                {"name": "Specialties", "type": "esriFieldTypeString", "alias": "Medical Specialties", "length": 500}
            ]
        },
        "infrastructure": {
            "id": 0,
            "name": "Infrastructure (GDB)",
            "type": "Feature Layer",
            "description": "Public infrastructure from SCAD geodatabase", 
            "geometryType": "esriGeometryPoint",
            "spatialReference": {"wkid": 4326, "latestWkid": 4326},
            "fields": [
                {"name": "OBJECTID", "type": "esriFieldTypeOID", "alias": "Object ID"},
                {"name": "Name", "type": "esriFieldTypeString", "alias": "Infrastructure Name", "length": 255},
                {"name": "Type", "type": "esriFieldTypeString", "alias": "Infrastructure Type", "length": 100},
                {"name": "Status", "type": "esriFieldTypeString", "alias": "Operational Status", "length": 50},
                {"name": "District", "type": "esriFieldTypeString", "alias": "District", "length": 100}
            ]
        }
    }
    
    if layer_name not in layer_configs:
        raise HTTPException(status_code=404, detail=f"Geodatabase layer '{layer_name}' not found")
    
    return layer_configs[layer_name]

@app.get("/api/geodatabase/{layer_name}/query")
async def query_geodatabase_layer(
    layer_name: str,
    where: str = "1=1",
    outFields: str = "*",
    f: str = "json",
    returnGeometry: bool = True
):
    """Query geodatabase layer features in ArcGIS format"""
    if layer_name not in ["education_facilities", "healthcare_facilities", "infrastructure"]:
        raise HTTPException(status_code=404, detail=f"Geodatabase layer '{layer_name}' not found")
    
    # Generate mock features for the requested layer
    mock_features = generate_mock_geodatabase_features(layer_name, where)
    
    return {
        "objectIdFieldName": "OBJECTID",
        "uniqueIdField": {"name": "OBJECTID", "isSystemMaintained": True},
        "globalIdFieldName": "",
        "geometryType": "esriGeometryPoint",
        "spatialReference": {"wkid": 4326, "latestWkid": 4326},
        "fields": [
            {"name": "OBJECTID", "type": "esriFieldTypeOID", "alias": "Object ID"},
            {"name": "Name", "type": "esriFieldTypeString", "alias": "Facility Name", "length": 255},
            {"name": "Type", "type": "esriFieldTypeString", "alias": "Facility Type", "length": 100},
            {"name": "District", "type": "esriFieldTypeString", "alias": "District", "length": 100}
        ],
        "features": mock_features
    }

def generate_mock_geodatabase_features(layer_name: str, where_clause: str) -> List[Dict]:
    """Generate mock features for geodatabase layer"""
    import random
    
    # Abu Dhabi coordinates
    center_lat = 24.2992
    center_lon = 54.3773
    feature_count = random.randint(5, 15)
    
    abu_dhabi_districts = [
        "Central Abu Dhabi", "Al Ain", "Western Region", "Eastern Region",
        "Al Dhafra", "Khalifa City", "Mohammed Bin Zayed City", "Al Raha"
    ]
    
    facility_types = {
        "education_facilities": ["Primary School", "Secondary School", "University", "Technical Institute"],
        "healthcare_facilities": ["General Hospital", "Clinic", "Emergency Center", "Specialist Hospital"],
        "infrastructure": ["Power Station", "Water Treatment", "Waste Management", "Communication Tower"]
    }
    
    features = []
    for i in range(feature_count):
        # Generate point geometry
        geometry = {
            "x": center_lon + (random.random() - 0.5) * 2,
            "y": center_lat + (random.random() - 0.5) * 2
        }
        
        # Generate attributes
        attributes = {"OBJECTID": i + 1}
        
        if layer_name in facility_types:
            attributes["Name"] = f"{layer_name.replace('_', ' ').title()} {i + 1}"
            attributes["Type"] = random.choice(facility_types[layer_name])
            attributes["District"] = random.choice(abu_dhabi_districts)
            
            if layer_name == "education_facilities":
                attributes["Capacity"] = random.randint(100, 2000)
                attributes["Address"] = f"Street {i + 1}, {attributes['District']}, Abu Dhabi, UAE"
            elif layer_name == "healthcare_facilities":
                attributes["Beds"] = random.randint(50, 500)
                attributes["Specialties"] = "General Medicine, Emergency Care"
            elif layer_name == "infrastructure":
                attributes["Status"] = random.choice(["Operational", "Maintenance", "Planned"])
        
        features.append({
            "attributes": attributes,
            "geometry": geometry
        })
    
    return features

# Serve static files
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    # Serve React app
    @app.get("/{path:path}")
    async def serve_react_app(path: str):
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        file_path = static_dir / path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Default to index.html for React routing
        return FileResponse(static_dir / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 