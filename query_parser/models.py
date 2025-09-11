from pydantic import BaseModel, Field
from typing import Optional, List

class QueryResult(BaseModel):
    """
    Represents the parsed result of a natural language query.
    """
    where_clause: str
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None
    distance_km: Optional[float] = None

class ArcGISQuery(BaseModel):
    """
    Represents the query parameters for an ArcGIS Feature Service query.
    """
    where: str = Field(default="1=1", description="A SQL-like WHERE clause to filter features.")
    geometry: Optional[str] = Field(default=None, description="The geometry to apply as a spatial filter.")
    geometryType: str = Field(default="esriGeometryEnvelope", description="The type of geometry specified in the geometry parameter.")
    spatialRel: str = Field(default="esriSpatialRelIntersects", description="The spatial relationship to apply when a geometry filter is present.")
    outFields: str = Field(default="*", description="A comma-separated list of fields to include in the returned result set.")
    returnGeometry: bool = Field(default=True, description="If true, the result set includes geometry for each feature.")
    f: str = Field(default="json", description="The format of the returned response.")
    distance: Optional[float] = Field(default=None, description="Distance in kilometers for spatial queries.")

class GeocodeResult(BaseModel):
    """
    Represents a single geocoding result.
    """
    name: str
    latitude: float
    longitude: float

class QueryParseResult(BaseModel):
    """
    The final result of parsing a natural language query, including the
    generated ArcGIS query parameters and any extracted location data.
    """
    arcgis_query: ArcGISQuery
    extracted_location: Optional[GeocodeResult] = None
    service_url: str 