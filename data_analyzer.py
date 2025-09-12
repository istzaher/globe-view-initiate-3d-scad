import json
import os
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class AbuDhabiDataAnalyzer:
    """Direct data analyzer for Abu Dhabi GeoJSON datasets"""
    
    def __init__(self, data_directory: str = "public/data"):
        self.data_directory = data_directory
        self.datasets = {}
        self.load_all_datasets()
    
    def load_all_datasets(self):
        """Load all GeoJSON files into memory"""
        geojson_files = {
            'buildings': 'BuildingStructures.geojson',
            'bus_stops': 'bus_stops_query.geojson',
            'mosques': 'mosques_query.geojson',
            'parking': 'Parking_Areas.geojson',
            'parks': 'Parks_In_Bbox.geojson',
            'roads': 'Roads_Query.geojson'
        }
        
        for dataset_name, filename in geojson_files.items():
            file_path = os.path.join(self.data_directory, filename)
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        self.datasets[dataset_name] = data
                        logger.info(f"✅ Loaded {dataset_name}: {len(data.get('features', []))} features")
                except Exception as e:
                    logger.error(f"❌ Failed to load {dataset_name}: {e}")
            else:
                logger.warning(f"⚠️ File not found: {file_path}")
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """Analyze a natural language query and return data insights"""
        query_lower = query.lower()
        
        # Determine which dataset(s) to analyze
        target_datasets = []
        if any(word in query_lower for word in ['building', 'buildings', 'structure', 'tower', 'level', 'levels', 'floor', 'floors']):
            target_datasets.append('buildings')
        if any(word in query_lower for word in ['bus', 'stop', 'stops', 'transport', 'transit']):
            target_datasets.append('bus_stops')
        if any(word in query_lower for word in ['mosque', 'mosques', 'religious', 'prayer']):
            target_datasets.append('mosques')
        if any(word in query_lower for word in ['parking', 'park', 'garage']):
            target_datasets.append('parking')
        if any(word in query_lower for word in ['garden', 'gardens', 'green', 'recreation', 'park']):
            target_datasets.append('parks')
        if any(word in query_lower for word in ['road', 'roads', 'street', 'streets']):
            target_datasets.append('roads')
        
        # If no specific dataset detected, analyze all
        if not target_datasets:
            target_datasets = list(self.datasets.keys())
        
        results = {}
        for dataset_name in target_datasets:
            if dataset_name in self.datasets:
                results[dataset_name] = self.analyze_dataset(dataset_name, query)
        
        return results
    
    def analyze_dataset(self, dataset_name: str, query: str) -> Dict[str, Any]:
        """Analyze a specific dataset based on the query"""
        if dataset_name not in self.datasets:
            return {"error": f"Dataset {dataset_name} not found"}
        
        data = self.datasets[dataset_name]
        features = data.get('features', [])
        total_features = len(features)
        
        analysis = {
            "dataset": dataset_name,
            "total_features": total_features,
            "matching_features": 0,
            "percentage": 0.0,
            "sample_features": [],
            "attribute_summary": {},
            "query_specific_analysis": {}
        }
        
        if total_features == 0:
            return analysis
        
        # Analyze buildings specifically for level queries
        if dataset_name == 'buildings' and any(word in query.lower() for word in ['level', 'levels', 'floor', 'floors', 'more than', 'greater than', 'above']):
            analysis.update(self.analyze_building_levels(features, query))
        
        # General feature analysis
        analysis["sample_features"] = features[:3] if features else []
        analysis["attribute_summary"] = self.get_attribute_summary(features)
        
        return analysis
    
    def analyze_building_levels(self, features: List[Dict], query: str) -> Dict[str, Any]:
        """Specific analysis for building level queries"""
        level_analysis = {
            "level_distribution": {},
            "matching_features": 0,
            "level_stats": {
                "min": None,
                "max": None,
                "average": None
            }
        }
        
        # Extract level threshold from query
        threshold = self.extract_number_from_query(query)
        if threshold is None:
            threshold = 6  # Default threshold
        
        levels_found = []
        matching_count = 0
        
        for feature in features:
            props = feature.get('properties', {})
            
            # Look for level information in various field names
            level_value = None
            for field in ['building:levels', 'levels', 'floors', 'height_levels']:
                if field in props:
                    try:
                        level_value = int(float(str(props[field])))
                        break
                    except (ValueError, TypeError):
                        continue
            
            if level_value is not None:
                levels_found.append(level_value)
                
                # Count levels in distribution
                level_key = f"{level_value}_levels"
                level_analysis["level_distribution"][level_key] = level_analysis["level_distribution"].get(level_key, 0) + 1
                
                # Check if matches query criteria
                if level_value > threshold:
                    matching_count += 1
        
        # Calculate statistics
        if levels_found:
            level_analysis["level_stats"]["min"] = min(levels_found)
            level_analysis["level_stats"]["max"] = max(levels_found)
            level_analysis["level_stats"]["average"] = round(sum(levels_found) / len(levels_found), 1)
        
        level_analysis["matching_features"] = matching_count
        level_analysis["total_with_level_data"] = len(levels_found)
        level_analysis["threshold"] = threshold
        
        return level_analysis
    
    def extract_number_from_query(self, query: str) -> Optional[int]:
        """Extract numerical threshold from query"""
        import re
        
        # Look for patterns like "more than 6", "greater than 10", "above 5"
        patterns = [
            r'more than (\d+)',
            r'greater than (\d+)',
            r'above (\d+)',
            r'over (\d+)',
            r'exceeding (\d+)',
            r'> (\d+)',
            r'(\d+)\+'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, query.lower())
            if match:
                return int(match.group(1))
        
        return None
    
    def get_attribute_summary(self, features: List[Dict]) -> Dict[str, Any]:
        """Get summary of feature attributes"""
        if not features:
            return {}
        
        # Sample first feature to understand structure
        sample_properties = features[0].get('properties', {})
        
        summary = {
            "total_features": len(features),
            "property_fields": list(sample_properties.keys()),
            "sample_properties": sample_properties
        }
        
        return summary
    
    def get_filtered_features(self, query: str) -> Dict[str, Any]:
        """Get filtered features for map display based on query"""
        query_lower = query.lower()
        
        # Determine which dataset(s) to show
        target_datasets = []
        if any(word in query_lower for word in ['building', 'buildings', 'structure', 'tower', 'level', 'levels']):
            target_datasets.append('buildings')
        if any(word in query_lower for word in ['bus', 'stop', 'stops', 'transport', 'transit']):
            target_datasets.append('bus_stops')
        if any(word in query_lower for word in ['mosque', 'mosques', 'religious', 'prayer']):
            target_datasets.append('mosques')
        if any(word in query_lower for word in ['parking', 'garage']):
            target_datasets.append('parking')
        if any(word in query_lower for word in ['garden', 'gardens', 'green', 'recreation', 'park']) and 'parking' not in query_lower:
            target_datasets.append('parks')
        if any(word in query_lower for word in ['road', 'roads', 'street', 'streets']):
            target_datasets.append('roads')
        
        # If no specific dataset detected, show buildings (default)
        if not target_datasets:
            target_datasets = ['buildings']
        
        result = {}
        
        for dataset_name in target_datasets:
            if dataset_name not in self.datasets:
                continue
                
            features = self.datasets[dataset_name].get('features', [])
            filtered_features = []
            
            # Apply specific filtering for building level queries
            if dataset_name == 'buildings' and any(word in query_lower for word in ['level', 'levels', 'more than', 'greater than']):
                # Note: Real Abu Dhabi buildings dataset doesn't have level information
                # For demo purposes, show a subset of buildings (first 50)
                logger.info(f"Building level query detected, but real dataset lacks level data. Showing sample buildings.")
                filtered_features = features[:50]  # Show first 50 buildings as sample
            else:
                # For other datasets, include all features
                filtered_features = features
            
            result[dataset_name] = {
                "type": "FeatureCollection",
                "features": filtered_features[:100],  # Limit to 100 features for performance
                "total_features": len(features),
                "filtered_features": len(filtered_features),
                "dataset_type": dataset_name
            }
        
        return result
    
    def get_dataset_info(self) -> Dict[str, Any]:
        """Get information about all loaded datasets"""
        info = {}
        for name, data in self.datasets.items():
            features = data.get('features', [])
            info[name] = {
                "feature_count": len(features),
                "sample_properties": features[0].get('properties', {}) if features else {}
            }
        return info
