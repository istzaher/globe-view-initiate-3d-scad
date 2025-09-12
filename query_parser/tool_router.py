"""
Intelligent Tool Router for GIS Operations
Based on the advanced ArcGIS + AI chatbot patterns.

This module implements the tool router that decides which GIS tool to call
based on natural language queries. It uses pattern matching and can be
enhanced with LLM function calling.
"""

import re
import logging
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from query_parser.gis_tools import get_gis_tools, GISToolResult

logger = logging.getLogger(__name__)

@dataclass
class ToolCall:
    """Represents a tool call with its arguments"""
    tool_name: str
    args: Dict[str, Any]
    confidence: float = 1.0

class IntelligentToolRouter:
    """
    Intelligent router that analyzes natural language queries and decides
    which GIS tool to call with what parameters.
    """
    
    def __init__(self):
        """Initialize the tool router"""
        self.gis_tools = get_gis_tools()
        self.logger = logger
        
        # Infrastructure type mappings from user queries to system types
        # Updated for actual Abu Dhabi datasets
        self.infrastructure_mappings = {
            # Transportation
            "bus": "bus_stops_real",
            "bus stop": "bus_stops_real",
            "bus station": "bus_stops_real", 
            "public transport": "bus_stops_real",
            "transportation": "bus_stops_real",
            "transport": "bus_stops_real",
            "transit": "bus_stops_real",
            
            # Religious
            "mosque": "mosques_real",
            "mosques": "mosques_real",
            "islamic": "mosques_real",
            "prayer": "mosques_real",
            "worship": "mosques_real",
            "religious": "mosques_real",
            
            # Recreation
            "park": "parks_real",
            "parks": "parks_real",
            "green space": "parks_real",
            "recreation": "parks_real",
            "recreational": "parks_real",
            "garden": "parks_real",
            
            # Infrastructure/Parking - more specific mapping
            "parking": "parking_real",
            "parking lot": "parking_real",
            "parking area": "parking_real",
            "parking areas": "parking_real",
            "car park": "parking_real",
            
            # Urban/Buildings
            "building": "buildings_real",
            "buildings": "buildings_real",
            "structure": "buildings_real",
            "landmark": "buildings_real",
            "architecture": "buildings_real",
            
            # Transportation/Roads
            "road": "roads_real", 
            "roads": "roads_real",
            "street": "roads_real",
            "streets": "roads_real",
            "highway": "roads_real",
            "avenue": "roads_real"
        }
        
        # Abu Dhabi datasets don't use layer mappings (single datasets)
        # All infrastructure types are handled as single datasets

    def route_query(self, query_text: str) -> GISToolResult:
        """
        Main routing function that analyzes the query and executes the appropriate tool.
        
        Args:
            query_text: User's natural language query
            
        Returns:
            GISToolResult with the response
        """
        self.logger.info(f"🎯 Routing query: '{query_text}'")
        
        # Normalize the query
        normalized_query = query_text.lower().strip()
        
        # Determine the tool call
        tool_call = self._analyze_query(normalized_query)
        
        if not tool_call:
            return GISToolResult(
                text="I couldn't understand your query. Try asking about finding infrastructure near a location, like 'Find EV charging stations near Sacramento' or 'Show electrical meters in La Mesa'.",
                geojson=None
            )
        
        # Execute the tool
        return self._execute_tool(tool_call)

    def _analyze_query(self, query: str) -> Optional[ToolCall]:
        """
        Analyze the query and determine which tool to call with what parameters.
        This implements pattern matching and can be enhanced with LLM function calling.
        """
        
        # Pattern 1: Spatial queries - "Find X near Y" or "X within Z of Y"
        spatial_patterns = [
            r"find (.+?) (?:near|around|close to) (.+?)(?:\s|$)",
            r"(?:show|list) (.+?) (?:near|around|close to) (.+?)(?:\s|$)", 
            r"(.+?) (?:near|around|close to|within.+?of) (.+?)(?:\s|$)",
            r"find (.+?) within (.+?) of (.+?)(?:\s|$)"
        ]
        
        for pattern in spatial_patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                return self._handle_spatial_query(match, query)
        
        # Pattern 2: Attribute-based queries - "Find X where Y" or "Show X with Y"
        attribute_patterns = [
            r"find (.+?) (?:where|with|having) (.+?)(?:\s|$)",
            r"(?:show|list) (.+?) (?:where|with|having) (.+?)(?:\s|$)",
            r"(.+?) (?:installed|built) (?:after|before|in) (\d{4})",
            r"(.+?) in (?:zip|ZIP) (?:code )?([\d]{5})",
            r"(.+?) on (.+?) (?:street|avenue|road|drive|way)"
        ]
        
        for pattern in attribute_patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                return self._handle_attribute_query(match, query)
        
        # Pattern 3: Simple infrastructure queries - "Show X" or "Find X"
        simple_patterns = [
            r"(?:find|show|list|display) (?:all )?(.+?)(?:\s|$)",
            r"(.+?) (?:in|at) (.+?)(?:\s|$)"
        ]
        
        for pattern in simple_patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                return self._handle_simple_query(match, query)
        
        return None

    def _handle_spatial_query(self, match: re.Match, full_query: str) -> ToolCall:
        """Handle spatial queries like 'Find X near Y'"""
        
        # Extract distance if mentioned
        distance_km = self._extract_distance(full_query)
        
        if len(match.groups()) >= 2:
            infrastructure_text = match.group(1).strip()
            location_text = match.group(2).strip()
        elif len(match.groups()) == 3:  # "within X of Y" pattern
            infrastructure_text = match.group(1).strip()
            location_text = match.group(3).strip()
            # Distance already extracted above
        else:
            # Fallback
            infrastructure_text = match.group(1).strip()
            location_text = "unknown location"
        
        # Map infrastructure type
        infrastructure_type = self._map_infrastructure_type(infrastructure_text)
        layer_id = self._get_layer_id(infrastructure_text, infrastructure_type)
        
        # Build additional filters from the query
        additional_filters = self._extract_attribute_filters(full_query)
        
        return ToolCall(
            tool_name="find_infrastructure_near",
            args={
                "place": location_text,
                "infrastructure_type": infrastructure_type,
                "radius_km": distance_km,
                "layer_id": layer_id,
                "additional_filters": additional_filters
            },
            confidence=0.9
        )

    def _handle_attribute_query(self, match: re.Match, full_query: str) -> ToolCall:
        """Handle attribute-based queries like 'Find X where Y'"""
        
        infrastructure_text = match.group(1).strip()
        condition_text = match.group(2).strip() if len(match.groups()) >= 2 else ""
        
        # Map infrastructure type
        infrastructure_type = self._map_infrastructure_type(infrastructure_text)
        layer_id = self._get_layer_id(infrastructure_text, infrastructure_type)
        
        # Build WHERE conditions
        where_conditions = self._build_where_conditions(condition_text, full_query)
        
        return ToolCall(
            tool_name="find_infrastructure_by_attributes",
            args={
                "infrastructure_type": infrastructure_type,
                "where_conditions": where_conditions,
                "layer_id": layer_id
            },
            confidence=0.85
        )

    def _handle_simple_query(self, match: re.Match, full_query: str) -> ToolCall:
        """Handle simple queries like 'Show X'"""
        
        infrastructure_text = match.group(1).strip()
        location_text = match.group(2).strip() if len(match.groups()) >= 2 else None
        
        # Map infrastructure type
        infrastructure_type = self._map_infrastructure_type(infrastructure_text)
        layer_id = self._get_layer_id(infrastructure_text, infrastructure_type)
        
        if location_text:
            # This is actually a location-based query
            return ToolCall(
                tool_name="find_infrastructure_near",
                args={
                    "place": location_text,
                    "infrastructure_type": infrastructure_type,
                    "radius_km": 5.0,  # Default radius
                    "layer_id": layer_id
                },
                confidence=0.8
            )
        else:
            # General attribute query
            additional_filters = self._extract_attribute_filters(full_query)
            where_conditions = additional_filters if additional_filters else "1=1"
            
            return ToolCall(
                tool_name="find_infrastructure_by_attributes",
                args={
                    "infrastructure_type": infrastructure_type,
                    "where_conditions": where_conditions,
                    "layer_id": layer_id,
                    "max_features": 100  # Limit for general queries
                },
                confidence=0.7
            )

    def _extract_distance(self, query: str) -> float:
        """Extract distance from query text"""
        # Look for distance patterns
        distance_patterns = [
            r"within (\d+(?:\.\d+)?)\s*(?:km|kilometers?)",
            r"(\d+(?:\.\d+)?)\s*(?:km|kilometers?)",
            r"within (\d+(?:\.\d+)?)\s*(?:miles?)",
            r"(\d+(?:\.\d+)?)\s*(?:miles?)"
        ]
        
        for pattern in distance_patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                distance = float(match.group(1))
                # Convert miles to km if needed
                if "mile" in match.group(0).lower():
                    distance = distance * 1.60934
                return distance
        
        return 2.0  # Default 2km radius

    def _map_infrastructure_type(self, infrastructure_text: str) -> str:
        """Map user's infrastructure description to system type"""
        infrastructure_lower = infrastructure_text.lower()
        
        # Check for matches, prioritizing longer/more specific matches first
        matches = []
        for key, value in self.infrastructure_mappings.items():
            if key in infrastructure_lower:
                matches.append((key, value, len(key)))
        
        if matches:
            # Return the mapping with the longest (most specific) key match
            matches.sort(key=lambda x: x[2], reverse=True)
            return matches[0][1]
        
        # Default fallback to Abu Dhabi buildings (largest dataset)
        return "buildings_real"

    def _get_layer_id(self, infrastructure_text: str, infrastructure_type: str) -> Optional[int]:
        """Get the specific layer ID for layered services"""
        # Abu Dhabi datasets are single-layer, so no layer ID needed
        return None

    def _extract_attribute_filters(self, query: str) -> Optional[str]:
        """Extract attribute-based filters from the query"""
        conditions = []
        
        # City filters
        city_patterns = [
            r"in (.+?) city",
            r"in (.+?)(?:\s|$)",
        ]
        
        for pattern in city_patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                city = match.group(1).strip()
                # Skip common words that aren't cities
                if city.lower() not in ["the", "a", "an", "and", "or", "with", "by"]:
                    conditions.append(f"City='{city}'")
                break
        
        # ZIP code filters
        zip_match = re.search(r"(?:zip|ZIP) (?:code )?(\d{5})", query)
        if zip_match:
            zip_code = zip_match.group(1)
            conditions.append(f"ZIP='{zip_code}'")
        
        # Date filters  
        date_patterns = [
            r"(?:installed|built) (?:after|since) (\d{4})",
            r"(?:installed|built) (?:before|until) (\d{4})",
            r"(?:installed|built) in (\d{4})"
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                year = match.group(1)
                if "after" in match.group(0) or "since" in match.group(0):
                    conditions.append(f"InstallYear>{year}")
                elif "before" in match.group(0) or "until" in match.group(0):
                    conditions.append(f"InstallYear<{year}")
                else:
                    conditions.append(f"InstallYear={year}")
                break
        
        # Street filters
        street_patterns = [
            r"on (.+?) (?:street|avenue|road|drive|way|blvd|boulevard)",
            r"along (.+?) (?:street|avenue|road|drive|way|blvd|boulevard)"
        ]
        
        for pattern in street_patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                street = match.group(1).strip()
                conditions.append(f"Street LIKE '%{street}%'")
                break
        
        return " AND ".join(conditions) if conditions else None

    def _build_where_conditions(self, condition_text: str, full_query: str) -> str:
        """Build WHERE clause from condition text and full query"""
        
        # Start with extracted attribute filters
        attribute_filters = self._extract_attribute_filters(full_query)
        conditions = [attribute_filters] if attribute_filters else []
        
        # Parse additional conditions from condition_text
        condition_lower = condition_text.lower()
        
        # Type filters
        if "fast" in condition_lower and "charg" in condition_lower:
            conditions.append("ChargerType='Fast'")
        elif "level 2" in condition_lower:
            conditions.append("ChargerType='Level 2'")
        
        # Status filters
        if "active" in condition_lower or "operational" in condition_lower:
            conditions.append("Status='Active'")
        
        return " AND ".join(conditions) if conditions else "1=1"

    def _execute_tool(self, tool_call: ToolCall) -> GISToolResult:
        """Execute the determined tool call"""
        try:
            self.logger.info(f"🔧 Executing tool: {tool_call.tool_name} with args: {tool_call.args}")
            
            if tool_call.tool_name == "find_infrastructure_near":
                return self.gis_tools.find_infrastructure_near(**tool_call.args)
            elif tool_call.tool_name == "find_infrastructure_by_attributes":
                return self.gis_tools.find_infrastructure_by_attributes(**tool_call.args)
            elif tool_call.tool_name == "buffer_and_intersect":
                return self.gis_tools.buffer_and_intersect(**tool_call.args)
            else:
                return GISToolResult(
                    text=f"Unknown tool: {tool_call.tool_name}",
                    geojson=None
                )
                
        except Exception as e:
            self.logger.error(f"Error executing tool {tool_call.tool_name}: {e}")
            return GISToolResult(
                text=f"Error executing query: {str(e)}",
                geojson=None
            )

# Global instance
_router_instance = None

def get_tool_router() -> IntelligentToolRouter:
    """Get the global tool router instance"""
    global _router_instance
    if _router_instance is None:
        _router_instance = IntelligentToolRouter()
    return _router_instance
