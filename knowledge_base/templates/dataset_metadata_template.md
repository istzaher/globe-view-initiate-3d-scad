# Dataset Metadata Template

## Basic Information
- **Dataset Name**: [Enter dataset name]
- **Version**: [e.g., 1.0.0]
- **Created Date**: [YYYY-MM-DD]
- **Last Updated**: [YYYY-MM-DD]
- **Category**: [infrastructure|demographics|environment|other]

## Description
[Provide detailed description of the dataset, its purpose, and contents]

## Geographic Coverage
- **Region**: Abu Dhabi
- **Coordinate System**: [e.g., WGS84, UAE UTM Zone 40N]
- **Bounding Box**: 
  - North: [latitude]
  - South: [latitude]
  - East: [longitude]
  - West: [longitude]

## Data Source
- **Provider**: [Organization/Agency name]
- **Contact**: [contact@organization.ae]
- **License**: [License type and restrictions]
- **Update Frequency**: [daily|weekly|monthly|annual|as_needed]
- **Source URL**: [if applicable]

## Technical Details
- **Format**: [shapefile|geojson|gdb|csv|other]
- **File Size**: [size in MB/GB]
- **Record Count**: [number of features/records]
- **Geometry Type**: [point|line|polygon|raster|table]

## Field Definitions
| Field Name | Data Type | Length | Description | Example |
|------------|-----------|--------|-------------|---------|
| OBJECTID | Integer | - | Unique identifier | 1 |
| Name | String | 255 | Feature name | "Emirates Palace" |
| Type | String | 100 | Feature category | "Hotel" |
| District | String | 100 | Administrative district | "Abu Dhabi Island" |

## Data Quality
- **Completeness**: [percentage]%
- **Accuracy**: [High|Medium|Low]
- **Known Issues**: 
  - [List any known data quality issues]
- **Last Validated**: [YYYY-MM-DD]

## Usage Guidelines
### Recommended Uses
- [List appropriate use cases]
- [e.g., Spatial analysis]
- [e.g., Map visualization]

### Limitations
- [List any limitations or restrictions]
- [e.g., Limited to specific geographic area]
- [e.g., Updated annually only]

### Processing Notes
- [Any special requirements for processing this data]
- [Coordinate system transformations needed]
- [Data cleaning steps required]

## Integration Notes
### SCAD GenAI Tool
- **Service Type**: [FeatureLayer|MapImageLayer|Other]
- **Renderer**: [Symbol type and styling]
- **Query Capabilities**: [List supported query types]
- **NLP Keywords**: [Keywords for natural language queries]

### API Endpoints
- **Feature Service URL**: [if applicable]
- **REST Endpoint**: [if applicable]
- **Authentication Required**: [Yes|No]

## Change Log
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | YYYY-MM-DD | Initial dataset creation | [Name] |

## Related Documents
- [Link to technical specifications]
- [Link to user guides]
- [Link to API documentation]

---
**Maintained by**: [Team/Individual name]  
**Contact**: [email@scad.ae]  
**Last Review**: [YYYY-MM-DD]
