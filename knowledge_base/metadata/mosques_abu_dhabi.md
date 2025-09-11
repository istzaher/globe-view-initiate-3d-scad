# Abu Dhabi Mosques Dataset

## Basic Information
- **Dataset Name**: Abu Dhabi Mosques and Islamic Places of Worship
- **Version**: 1.0.0
- **Created Date**: 2025-09-11
- **Last Updated**: 2025-09-11
- **Category**: religious_facilities
- **File**: `mosques_query.geojson`

## Description
Comprehensive dataset of mosques and Islamic places of worship in Abu Dhabi city center. Includes building footprints, names in Arabic and English, architectural details, and religious facility information. Data represents both active and historical religious sites.

## Geographic Coverage
- **Region**: Abu Dhabi City Center
- **Coordinate System**: WGS84 (EPSG:4326)
- **Bounding Box**: 
  - North: 24.50°N
  - South: 24.48°N
  - East: 54.38°E
  - West: 54.35°E

## Data Source
- **Provider**: OpenStreetMap / Kaart Ground Survey 2017
- **License**: Open Database License (ODbL)
- **Update Frequency**: As needed (community-driven)
- **Source URL**: OpenStreetMap query for Abu Dhabi mosques

## Technical Details
- **Format**: GeoJSON
- **File Size**: ~75KB
- **Record Count**: 35 mosques
- **Geometry Type**: Polygon (building footprints)

## Field Definitions
| Field Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| id | String | OpenStreetMap way ID | "way/62281265" |
| amenity | String | Facility type | "place_of_worship" |
| building | String | Building type | "mosque", "yes" |
| religion | String | Religious affiliation | "muslim" |
| denomination | String | Islamic denomination | "sunni" |
| name | String | Mosque name (original) | "مسجد الشيخ هزاع بن سلطان" |
| name:ar | String | Arabic name | "مسجد هامل بن خادم" |
| name:en | String | English name | "Sheikh Khalifa Mosque" |
| addr:city:ar | String | City name in Arabic | "أبو ظبي" |
| building:levels | String | Number of floors | "2" |
| service_times | String | Service information | "Closed due to COVID-19" |
| wheelchair | String | Accessibility | "no" |
| source | String | Data source | "Kaart Ground Survey 2017" |

## Data Quality
- **Completeness**: 90%
- **Accuracy**: High (ground-surveyed)
- **Known Issues**: 
  - Some mosques missing bilingual names
  - Historical data may include temporary closures
  - Building level information incomplete
- **Last Validated**: 2025-09-11

## Usage Guidelines
### Recommended Uses
- Religious facility planning and analysis
- Cultural heritage mapping
- Urban planning and zoning studies
- Tourism and cultural applications
- Accessibility analysis

### Limitations
- Building footprints may not reflect current construction
- Service times and operational status may be outdated
- Some unnamed smaller mosques may be missing

## Integration Notes
### SCAD GenAI Tool
- **Service Type**: FeatureLayer
- **Renderer**: Mosque/crescent icon (green/religious theme)
- **Query Capabilities**: Name (Arabic/English), district-based searches
- **NLP Keywords**: ["mosque", "masjid", "place of worship", "islamic", "prayer"]

### Natural Language Queries
- "Show all mosques in Abu Dhabi"
- "Find Sheikh Khalifa Mosque"
- "List places of worship near Corniche"
- "Show mosques with Arabic names"
- "Find Islamic centers in the city center"

## Cultural Considerations
- **Language Support**: Full Arabic and English naming
- **Religious Sensitivity**: Respectful representation of Islamic facilities
- **Cultural Context**: Important landmarks for Muslim community
- **Historical Significance**: Some mosques are heritage sites

## Change Log
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-09-11 | Initial dataset import from OpenStreetMap | SCAD Team |

---
**Maintained by**: SCAD GenAI Tool Team  
**Contact**: genai@scad.ae  
**Last Review**: 2025-09-11
