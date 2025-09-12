"""
Enhanced GIS Tools Module
Based on the advanced ArcGIS + AI chatbot patterns for natural language geo queries.

This module implements the tool-based pattern where each GIS operation is wrapped
as a "tool" that returns standardized responses with text + GeoJSON.
"""

import logging
import requests
import time
from typing import Optional, Tuple, Dict, Any, List, Union
from dataclasses import dataclass
from query_parser.geocoding import geocode_location, lat_lon_to_web_mercator
from query_parser.models import QueryResult

logger = logging.getLogger(__name__)

@dataclass
class GISToolResult:
    """Standardized result format for all GIS tools"""
    text: str
    geojson: Optional[Dict[str, Any]] = None
    center: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    statistics: Optional[Dict[str, Any]] = None

class EnhancedGISTools:
    """
    Enhanced GIS tools that implement the fastest patterns from the ArcGIS + AI document.
    Each tool returns standardized results with text + GeoJSON.
    """
    
    def __init__(self):
        """Initialize the enhanced GIS tools"""
        self.logger = logger
        
        # Abu Dhabi Real Datasets Configuration
        # These are the actual datasets available in your system
        self.service_configs = {
            # Abu Dhabi Real Datasets - handled by frontend via GeoJSON files
            "bus_stops_real": {
                "name": "Abu Dhabi Bus Stops",
                "description": "ITC public transportation stops with routes and schedules",
                "file": "bus_stops_query.geojson",
                "geometry_type": "Point",
                "category": "Transportation",
                "features": 76,
                "frontend_only": True
            },
            "mosques_real": {
                "name": "Abu Dhabi Mosques",
                "description": "Islamic places of worship and prayer facilities", 
                "file": "mosques_query.geojson",
                "geometry_type": "Polygon",
                "category": "Religious",
                "features": 35,
                "frontend_only": True
            },
            "parks_real": {
                "name": "Abu Dhabi Parks",
                "description": "Public parks, green spaces, and recreational areas",
                "file": "Parks_In_Bbox.geojson", 
                "geometry_type": "Polygon",
                "category": "Recreation",
                "features": 15,
                "frontend_only": True
            },
            "parking_real": {
                "name": "Abu Dhabi Parking",
                "description": "Parking facilities and lots throughout the city",
                "file": "Parking_Areas.geojson",
                "geometry_type": "Polygon", 
                "category": "Infrastructure",
                "features": 91,
                "frontend_only": True
            },
            "buildings_real": {
                "name": "Abu Dhabi Buildings", 
                "description": "Building structures, landmarks, and architectural features",
                "file": "BuildingStructures.geojson",
                "geometry_type": "Polygon",
                "category": "Urban", 
                "features": 1398,
                "frontend_only": True
            },
            "roads_real": {
                "name": "Abu Dhabi Roads",
                "description": "Street and road network throughout the city",
                "file": "Roads_Query.geojson",
                "geometry_type": "Polyline",
                "category": "Transportation", 
                "features": 0,  # Large dataset
                "frontend_only": True
            }
        }

    def geocode_place(self, location_query: str) -> Optional[Dict[str, Any]]:
        """
        Geocode a place name to GeoJSON Point.
        Returns GeoJSON Point geometry or None if geocoding fails.
        """
        coords = geocode_location(location_query)
        if not coords:
            return None
        
        lat, lon = coords
        return {
            "type": "Point",
            "coordinates": [lon, lat]  # GeoJSON uses [lon, lat] order
        }

    def query_within_distance(self, 
                            service_url: str,
                            center_geojson: Dict[str, Any],
                            distance_km: float,
                            where_clause: str = "1=1",
                            layer_id: Optional[int] = None,
                            auth_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Query features within a distance from a center point.
        Returns list of features as dictionaries with geometry and attributes.
        """
        try:
            # Build query URL
            query_url = service_url
            if layer_id is not None:
                query_url = f"{service_url}/{layer_id}/query"
            elif not service_url.endswith('/query'):
                query_url = f"{service_url}/query"
            
            # Extract center coordinates
            if center_geojson["type"] != "Point":
                raise ValueError("Center geometry must be a Point")
            
            lon, lat = center_geojson["coordinates"]
            
            # Convert to Web Mercator for ArcGIS
            x, y = lat_lon_to_web_mercator(lat, lon)
            
            # Build query parameters
            params = {
                "where": where_clause,
                "geometry": f"{x},{y}",
                "geometryType": "esriGeometryPoint",
                "spatialRel": "esriSpatialRelIntersects",
                "distance": distance_km * 1000,  # Convert to meters
                "units": "esriSRUnit_Meter",
                "outFields": "*",
                "returnGeometry": "true",
                "f": "json",
                "outSR": "4326"  # Return in WGS84 for GeoJSON compatibility
            }
            
            # Add authentication if provided
            headers = {}
            if auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"
            
            self.logger.info(f"Querying {query_url} with distance {distance_km}km from ({lat}, {lon})")
            
            response = requests.get(query_url, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if "error" in data:
                self.logger.error(f"ArcGIS query error: {data['error']}")
                return []
            
            features = data.get("features", [])
            self.logger.info(f"Found {len(features)} features within {distance_km}km")
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error in spatial query: {e}")
            return []

    def to_geojson(self, arcgis_features: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Convert ArcGIS features to GeoJSON FeatureCollection.
        """
        def feature_to_geojson(feature):
            # Handle different geometry types
            geometry = feature.get("geometry", {})
            
            # Convert ArcGIS geometry to GeoJSON
            if "x" in geometry and "y" in geometry:
                # Point geometry
                geojson_geom = {
                    "type": "Point",
                    "coordinates": [geometry["x"], geometry["y"]]
                }
            elif "paths" in geometry:
                # Polyline geometry
                geojson_geom = {
                    "type": "LineString",
                    "coordinates": geometry["paths"][0] if geometry["paths"] else []
                }
            elif "rings" in geometry:
                # Polygon geometry
                geojson_geom = {
                    "type": "Polygon",
                    "coordinates": geometry["rings"]
                }
            else:
                # Fallback - try to preserve original
                geojson_geom = geometry
            
            return {
                "type": "Feature",
                "geometry": geojson_geom,
                "properties": feature.get("attributes", {})
            }
        
        return {
            "type": "FeatureCollection",
            "features": [feature_to_geojson(f) for f in arcgis_features]
        }

    # === CORE GIS TOOLS ===

    def find_infrastructure_near(self, 
                                place: str, 
                                infrastructure_type: str = "ev_charging",
                                radius_km: float = 2.0,
                                layer_id: Optional[int] = None,
                                additional_filters: Optional[str] = None) -> GISToolResult:
        """
        Find infrastructure near a place.
        This is the core spatial search tool.
        """
        # Geocode the place
        center = self.geocode_place(place)
        if not center:
            return GISToolResult(
                text=f"Could not find location: {place}",
                geojson=None
            )
        
        # Get service configuration
        if infrastructure_type not in self.service_configs:
            return GISToolResult(
                text=f"Unknown infrastructure type: {infrastructure_type}",
                geojson=None
            )
        
        service_config = self.service_configs[infrastructure_type]
        service_url = service_config["url"]
        
        # Build where clause
        where_clause = additional_filters if additional_filters else "1=1"
        
        # Query features
        if service_config.get("mock_mode", False):
            # Generate mock data for demonstration
            features = self._generate_mock_features(
                infrastructure_type=infrastructure_type,
                center=center,
                radius_km=radius_km,
                layer_id=layer_id
            )
        elif service_config.get("frontend_only", False):
            # Abu Dhabi datasets are handled by frontend - signal to use existing system
            return GISToolResult(
                text=f"Abu Dhabi {service_config['name']} query should be handled by the existing frontend system.",
                geojson=None,
                metadata={
                    "requires_frontend": True,
                    "dataset_file": service_config.get("file", ""),
                    "infrastructure_type": infrastructure_type,
                    "dataset_info": service_config
                }
            )
        else:
            # Query real ArcGIS service
            features = self.query_within_distance(
                service_url=service_url,
                center_geojson=center,
                distance_km=radius_km,
                where_clause=where_clause,
                layer_id=layer_id
            )
        
        # Convert to GeoJSON
        geojson = self.to_geojson(features)
        count = len(geojson["features"])
        
        # Generate descriptive text
        infrastructure_name = service_config["name"]
        layer_info = ""
        if layer_id is not None and "layers" in service_config:
            layer_name = service_config["layers"].get(layer_id, f"Layer {layer_id}")
            layer_info = f" ({layer_name})"
            
        text = f"Found {count} {infrastructure_name}{layer_info} within {radius_km} km of {place}."
        
        # Add statistics
        statistics = {
            "total_count": count,
            "search_radius_km": radius_km,
            "center_coordinates": center["coordinates"],
            "infrastructure_type": infrastructure_type
        }
        
        if features:
            # Add basic attribute statistics if available
            sample_attrs = features[0].get("attributes", {})
            statistics["sample_attributes"] = list(sample_attrs.keys())
        
        return GISToolResult(
            text=text,
            center=center,
            geojson=geojson,
            statistics=statistics
        )

    def find_infrastructure_by_attributes(self,
                                        infrastructure_type: str,
                                        where_conditions: str,
                                        layer_id: Optional[int] = None,
                                        max_features: int = 1000) -> GISToolResult:
        """
        Find infrastructure by attribute filters (non-spatial).
        """
        if infrastructure_type not in self.service_configs:
            return GISToolResult(
                text=f"Unknown infrastructure type: {infrastructure_type}",
                geojson=None
            )
        
        service_config = self.service_configs[infrastructure_type]
        service_url = service_config["url"]
        
        try:
            # Build query URL
            query_url = service_url
            if layer_id is not None:
                query_url = f"{service_url}/{layer_id}/query"
            elif not service_url.endswith('/query'):
                query_url = f"{service_url}/query"
            
            # Build query parameters
            params = {
                "where": where_conditions,
                "outFields": "*",
                "returnGeometry": "true",
                "f": "json",
                "outSR": "4326",
                "maxRecordCount": max_features
            }
            
            self.logger.info(f"Querying {query_url} with WHERE: {where_conditions}")
            
            response = requests.get(query_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if "error" in data:
                self.logger.error(f"ArcGIS query error: {data['error']}")
                return GISToolResult(
                    text=f"Query error: {data['error'].get('message', 'Unknown error')}",
                    geojson=None
                )
            
            features = data.get("features", [])
            geojson = self.to_geojson(features)
            count = len(features)
            
            # Generate descriptive text
            infrastructure_name = service_config["name"]
            layer_info = ""
            if layer_id is not None and "layers" in service_config:
                layer_name = service_config["layers"].get(layer_id, f"Layer {layer_id}")
                layer_info = f" ({layer_name})"
            
            text = f"Found {count} {infrastructure_name}{layer_info} matching the criteria."
            
            # Add statistics
            statistics = {
                "total_count": count,
                "where_clause": where_conditions,
                "infrastructure_type": infrastructure_type
            }
            
            return GISToolResult(
                text=text,
                geojson=geojson,
                statistics=statistics
            )
            
        except Exception as e:
            self.logger.error(f"Error in attribute query: {e}")
            return GISToolResult(
                text=f"Query failed: {str(e)}",
                geojson=None
            )

    def buffer_and_intersect(self,
                           source_infrastructure: str,
                           target_infrastructure: str,
                           buffer_distance_km: float,
                           source_filters: Optional[str] = None,
                           target_filters: Optional[str] = None) -> GISToolResult:
        """
        Advanced spatial analysis: buffer source features and find intersecting target features.
        Example: "Find schools within 1km of EV charging stations"
        """
        # This is a more advanced tool that would require spatial processing
        # For now, return a placeholder that demonstrates the concept
        
        text = f"Advanced spatial analysis: Finding {target_infrastructure} within {buffer_distance_km}km of {source_infrastructure}. "
        text += "This operation requires spatial processing capabilities that can be implemented with ArcGIS geoprocessing services."
        
        return GISToolResult(
            text=text,
            geojson=None,
            metadata={
                "operation": "buffer_and_intersect",
                "source": source_infrastructure,
                "target": target_infrastructure,
                "buffer_distance_km": buffer_distance_km,
                "implementation_note": "Requires ArcGIS geoprocessing service or spatial analysis backend"
            }
        )

    def _generate_mock_features(self, 
                              infrastructure_type: str,
                              center: Dict[str, Any],
                              radius_km: float,
                              layer_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Generate mock features for demonstration purposes.
        This creates realistic sample data around the center point.
        """
        import random
        import math
        
        features = []
        center_lon, center_lat = center["coordinates"]
        
        # Generate 3-8 mock features
        num_features = random.randint(3, 8)
        
        for i in range(num_features):
            # Generate random point within radius
            angle = random.uniform(0, 2 * math.pi)
            distance = random.uniform(0.1, radius_km)
            
            # Convert to lat/lon offset
            lat_offset = (distance / 111.0) * math.cos(angle)  # ~111 km per degree
            lon_offset = (distance / 111.0) * math.sin(angle) / math.cos(math.radians(center_lat))
            
            feature_lat = center_lat + lat_offset
            feature_lon = center_lon + lon_offset
            
            # Generate attributes based on infrastructure type
            if infrastructure_type == "ev_charging":
                attributes = {
                    "OBJECTID": i + 1,
                    "StationName": f"Mock EV Station {i + 1}",
                    "ChargerType": random.choice(["Fast", "Level 2"]),
                    "Status": "Active",
                    "InstallYear": random.randint(2019, 2023),
                    "City": "Sacramento" if "sacramento" in str(center).lower() else "Test City"
                }
            elif infrastructure_type == "la_mesa_electrical":
                layer_names = {
                    0: "Electrical Meter",
                    1: "Service Cabinet", 
                    2: "Service Panel",
                    3: "Tree Well with Outlet",
                    4: "Acorn Light (Base & Top)",
                    5: "Acorn Light (Top Only)"
                }
                attributes = {
                    "OBJECTID": i + 1,
                    "AssetType": layer_names.get(layer_id, "Electrical Asset"),
                    "InstallYear": random.randint(2019, 2023),
                    "Status": "Active",
                    "City": "La Mesa",
                    "ZIP": random.choice(["91941", "91942"])
                }
            elif infrastructure_type == "la_mesa_gas":
                attributes = {
                    "OBJECTID": i + 1,
                    "AssetType": "Gas Meter",
                    "InstallYear": random.randint(2020, 2023),
                    "Status": "Active",
                    "City": "La Mesa"
                }
            else:
                attributes = {
                    "OBJECTID": i + 1,
                    "Name": f"Mock Feature {i + 1}",
                    "Type": infrastructure_type
                }
            
            feature = {
                "geometry": {
                    "x": feature_lon,
                    "y": feature_lat
                },
                "attributes": attributes
            }
            
            features.append(feature)
        
        self.logger.info(f"Generated {len(features)} mock features for {infrastructure_type}")
        return features

# Global instance
_gis_tools_instance = None

def get_gis_tools() -> EnhancedGISTools:
    """Get the global GIS tools instance"""
    global _gis_tools_instance
    if _gis_tools_instance is None:
        _gis_tools_instance = EnhancedGISTools()
    return _gis_tools_instance
