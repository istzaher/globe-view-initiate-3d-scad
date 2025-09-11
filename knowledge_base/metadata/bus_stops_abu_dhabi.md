# Abu Dhabi Bus Stops Dataset

## Basic Information
- **Dataset Name**: Abu Dhabi Bus Stops
- **Version**: 1.0.0
- **Created Date**: 2025-09-11
- **Last Updated**: 2025-09-11
- **Category**: transportation
- **File**: `bus_stops_query.geojson`

## Description
Comprehensive dataset of public bus stops in Abu Dhabi city center. Includes detailed information about bus routes, shelter availability, amenities, and operational details. Data sourced from OpenStreetMap with ITC (Integrated Transport Centre) official references.

## Geographic Coverage
- **Region**: Abu Dhabi City Center
- **Coordinate System**: WGS84 (EPSG:4326)
- **Bounding Box**: 
  - North: 24.50°N
  - South: 24.48°N
  - East: 54.38°E
  - West: 54.35°E

## Data Source
- **Provider**: OpenStreetMap / Integrated Transport Centre (ITC)
- **License**: Open Database License (ODbL)
- **Update Frequency**: As needed (community-driven)
- **Source URL**: OpenStreetMap query for Abu Dhabi bus stops

## Technical Details
- **Format**: GeoJSON
- **File Size**: ~150KB
- **Record Count**: 75 bus stops
- **Geometry Type**: Point

## Field Definitions
| Field Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| id | String | OpenStreetMap node ID | "node/1670669903" |
| bus | String | Bus service indicator | "yes" |
| highway | String | Highway feature type | "bus_stop" |
| name | String | Bus stop name (Arabic/English) | "B00755 Tourist Club Area" |
| name:en | String | English name | "Tourist Club Area 9 st" |
| public_transport | String | Transport type | "platform" |
| ref | String | Official stop reference | "525B", "808A" |
| network | String | Transport network | "ITC" |
| operator | String | Operating company | "Integrated Transport Centre" |
| shelter | String | Shelter availability | "yes", "no" |
| bench | String | Bench availability | "yes", "no" |
| bin | String | Trash bin availability | "yes", "no" |
| lit | String | Lighting availability | "yes", "no" |

## Data Quality
- **Completeness**: 85%
- **Accuracy**: High (community-verified)
- **Known Issues**: 
  - Some stops missing detailed amenity information
  - Bilingual names not complete for all stops
- **Last Validated**: 2025-09-11

## Usage Guidelines
### Recommended Uses
- Public transport planning and analysis
- Route optimization studies
- Accessibility analysis
- Tourism and navigation applications

### Limitations
- Data completeness varies by location
- Real-time status not included
- Some historical/defunct stops may be included

## Integration Notes
### SCAD GenAI Tool
- **Service Type**: FeatureLayer
- **Renderer**: Bus stop icon (blue/transport theme)
- **Query Capabilities**: Name, route, district-based searches
- **NLP Keywords**: ["bus stop", "public transport", "transit", "ITC"]

### Natural Language Queries
- "Show all bus stops in Abu Dhabi"
- "Find bus stops near Emirates Palace"
- "List bus stops with shelters"
- "Show ITC bus stops on Hamdan Street"

## Change Log
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-09-11 | Initial dataset import from OpenStreetMap | SCAD Team |

---
**Maintained by**: SCAD GenAI Tool Team  
**Contact**: genai@scad.ae  
**Last Review**: 2025-09-11
