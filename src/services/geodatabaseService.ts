import { loadModules } from 'esri-loader';

interface GeodatabaseLayerConfig {
  id: string;
  title: string;
  geometryType: 'point' | 'polyline' | 'polygon';
  fields: Array<{
    name: string;
    type: string;
    alias: string;
  }>;
  visible: boolean;
}

interface AbuDhabiLocation {
  name: string;
  coordinates: [number, number];
  area: string;
}

export class GeodatabaseService {
  private view: any = null;
  private geodatabaseLayers: Map<string, any> = new Map();

  constructor() {
    console.log('🗃️ GeodatabaseService initialized');
  }

  setMapView(view: any) {
    this.view = view;
    console.log('🗺️ Map view set for GeodatabaseService');
  }

  private loadGeodatabaseConfig(): GeodatabaseLayerConfig[] {
    return [
      {
        id: 'gdb_education_facilities',
        title: 'Educational Institutions',
        geometryType: 'point',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'Institution Name' },
          { name: 'Type', type: 'string', alias: 'Institution Type' },
          { name: 'District', type: 'string', alias: 'District' },
          { name: 'Capacity', type: 'integer', alias: 'Student Capacity' },
          { name: 'Grade_Level', type: 'string', alias: 'Grade Level' }
        ],
        visible: false
      },
      {
        id: 'gdb_healthcare_facilities',
        title: 'Hospitals and Medical Centers',
        geometryType: 'point',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'Facility Name' },
          { name: 'Type', type: 'string', alias: 'Facility Type' },
          { name: 'District', type: 'string', alias: 'District' },
          { name: 'Beds', type: 'integer', alias: 'Number of Beds' },
          { name: 'Emergency', type: 'string', alias: 'Emergency Services' }
        ],
        visible: true
      },
      {
        id: 'gdb_infrastructure',
        title: 'Public Infrastructure',
        geometryType: 'point',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'Infrastructure Name' },
          { name: 'Type', type: 'string', alias: 'Infrastructure Type' },
          { name: 'District', type: 'string', alias: 'District' },
          { name: 'Status', type: 'string', alias: 'Operational Status' },
          { name: 'Year_Built', type: 'integer', alias: 'Year Built' }
        ],
        visible: true
      },
      {
        id: 'gdb_transportation',
        title: 'Transportation Network',
        geometryType: 'polyline',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'Route Name' },
          { name: 'Type', type: 'string', alias: 'Transportation Type' },
          { name: 'Length_KM', type: 'double', alias: 'Length (KM)' },
          { name: 'Status', type: 'string', alias: 'Status' }
        ],
        visible: false
      },
      {
        id: 'gdb_land_use',
        title: 'Land Use Zones',
        geometryType: 'polygon',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Zone_Type', type: 'string', alias: 'Zone Type' },
          { name: 'Area_SQM', type: 'double', alias: 'Area (SQ M)' },
          { name: 'District', type: 'string', alias: 'District' },
          { name: 'Zoning_Code', type: 'string', alias: 'Zoning Code' }
        ],
        visible: false
      },
      {
        id: 'gdb_utilities',
        title: 'Utility Networks',
        geometryType: 'point',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'Utility Name' },
          { name: 'Type', type: 'string', alias: 'Utility Type' },
          { name: 'District', type: 'string', alias: 'District' },
          { name: 'Capacity', type: 'string', alias: 'Capacity' },
          { name: 'Status', type: 'string', alias: 'Status' }
        ],
        visible: false
      },
      {
        id: 'gdb_boundaries',
        title: 'Administrative Boundaries',
        geometryType: 'polygon',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'Boundary Name' },
          { name: 'Type', type: 'string', alias: 'Boundary Type' },
          { name: 'Area_SQM', type: 'double', alias: 'Area (SQ M)' },
          { name: 'Population', type: 'integer', alias: 'Population' }
        ],
        visible: false
      },
      {
        id: 'gdb_environmental',
        title: 'Environmental Features',
        geometryType: 'polygon',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'Feature Name' },
          { name: 'Type', type: 'string', alias: 'Environmental Type' },
          { name: 'Protection_Level', type: 'string', alias: 'Protection Level' },
          { name: 'Area_SQM', type: 'double', alias: 'Area (SQ M)' }
        ],
        visible: false
      }
    ];
  }

  private getAbuDhabiLocations(): AbuDhabiLocation[] {
    return [
      { name: 'Abu Dhabi City Center', coordinates: [54.3773, 24.4539], area: 'Abu Dhabi Island' },
      { name: 'Sheikh Zayed Grand Mosque', coordinates: [54.4756, 24.4128], area: 'Abu Dhabi Island' },
      { name: 'Emirates Palace', coordinates: [54.3920, 24.4622], area: 'Abu Dhabi Island' },
      { name: 'Al Karama District', coordinates: [54.3658, 24.4889], area: 'Abu Dhabi Island' },
      { name: 'Mohammed Bin Zayed City', coordinates: [54.5341, 24.3310], area: 'Mohammed Bin Zayed City' },
      { name: 'Al Khalidiyah', coordinates: [54.4233, 24.4706], area: 'Abu Dhabi Island' },
      { name: 'Al Ain', coordinates: [55.7581, 24.2077], area: 'Al Ain' },
      { name: 'Khalifa City A', coordinates: [54.5506, 24.4216], area: 'Khalifa City' }
    ];
  }

  private getAbuDhabiExtent() {
    return {
      xmin: 54.0,
      ymin: 24.0,
      xmax: 55.0,
      ymax: 24.8,
      spatialReference: { wkid: 4326 }
    };
  }

  private generateMockFeatures(layerConfig: GeodatabaseLayerConfig, count: number = 10): any[] {
    const abuDhabiLocations = this.getAbuDhabiLocations();
    const features = [];

    for (let i = 0; i < count; i++) {
      const baseLocation = abuDhabiLocations[i % abuDhabiLocations.length];
      
      let geometry: any;
      
      if (layerConfig.geometryType === 'point') {
        // Add small random offset to keep points on land (approx 500m)
        const offsetX = (Math.random() - 0.5) * 0.005;
        const offsetY = (Math.random() - 0.5) * 0.005;
        
        geometry = {
          type: 'point',
          longitude: baseLocation.coordinates[0] + offsetX,
          latitude: baseLocation.coordinates[1] + offsetY
        };
      } else if (layerConfig.geometryType === 'polyline') {
        // Create simple line segments
        const startX = baseLocation.coordinates[0] + (Math.random() - 0.5) * 0.01;
        const startY = baseLocation.coordinates[1] + (Math.random() - 0.5) * 0.01;
        const endX = startX + (Math.random() - 0.5) * 0.02;
        const endY = startY + (Math.random() - 0.5) * 0.02;
        
        geometry = {
          type: 'polyline',
          paths: [[[startX, startY], [endX, endY]]]
        };
      } else if (layerConfig.geometryType === 'polygon') {
        // Create small rectangular polygons
        const centerX = baseLocation.coordinates[0] + (Math.random() - 0.5) * 0.01;
        const centerY = baseLocation.coordinates[1] + (Math.random() - 0.5) * 0.01;
        const size = 0.002;
        
        geometry = {
          type: 'polygon',
          rings: [[
            [centerX - size, centerY - size],
            [centerX + size, centerY - size],
            [centerX + size, centerY + size],
            [centerX - size, centerY + size],
            [centerX - size, centerY - size]
          ]]
        };
      }

      const attributes: any = {
        OBJECTID: i + 1,
        District: baseLocation.area
      };

      // Generate layer-specific attributes
      if (layerConfig.id === 'gdb_education_facilities') {
        attributes.Name = `${baseLocation.name} Educational Facility`;
        attributes.Type = ['School', 'University', 'Training Center', 'Research Institute'][Math.floor(Math.random() * 4)];
        attributes.Capacity = Math.floor(Math.random() * 1000) + 200;
        attributes.Grade_Level = ['Primary', 'Secondary', 'Higher Education', 'Vocational'][Math.floor(Math.random() * 4)];
      } else if (layerConfig.id === 'gdb_healthcare_facilities') {
        attributes.Name = `${baseLocation.name} Medical Facility`;
        attributes.Type = ['Hospital', 'Clinic', 'Health Center', 'Specialized Care'][Math.floor(Math.random() * 4)];
        attributes.Beds = Math.floor(Math.random() * 200) + 20;
        attributes.Emergency = ['Yes', 'No'][Math.floor(Math.random() * 2)];
      } else if (layerConfig.id === 'gdb_infrastructure') {
        attributes.Name = `${baseLocation.name} Infrastructure`;
        attributes.Type = ['Bridge', 'Tunnel', 'Power Station', 'Water Treatment'][Math.floor(Math.random() * 4)];
        attributes.Status = ['Operational', 'Under Maintenance', 'Planned', 'Under Construction'][Math.floor(Math.random() * 4)];
        attributes.Year_Built = Math.floor(Math.random() * 30) + 1990;
      }

      features.push({
        geometry,
        attributes
      });
    }

    return features;
  }

  private getLayerRenderer(layerConfig: GeodatabaseLayerConfig): any {
    const colors: { [key: string]: [number, number, number] } = {
      'gdb_education_facilities': [76, 175, 80],      // Green
      'gdb_healthcare_facilities': [244, 67, 54],    // Red
      'gdb_infrastructure': [255, 152, 0],           // Orange
      'gdb_transportation': [156, 39, 176],          // Purple
      'gdb_land_use': [121, 85, 72],                 // Brown
      'gdb_utilities': [255, 235, 59],               // Yellow
      'gdb_boundaries': [96, 125, 139],              // Blue Grey
      'gdb_environmental': [76, 175, 80]             // Green
    };

    const color = colors[layerConfig.id] || [128, 128, 128];

    if (layerConfig.geometryType === 'point') {
      return {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: color,
          size: 8,
          outline: {
            color: [255, 255, 255],
            width: 1
          }
        }
      };
    } else if (layerConfig.geometryType === 'polyline') {
      return {
        type: 'simple',
        symbol: {
          type: 'simple-line',
          color: color,
          width: 2
        }
      };
    } else if (layerConfig.geometryType === 'polygon') {
      return {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [...color, 0.3], // Semi-transparent
          outline: {
            color: color,
            width: 1
          }
        }
      };
    }
  }

  async loadGeodatabaseLayers(): Promise<void> {
    if (!this.view) {
      console.error('❌ Map view not set');
      return;
    }

    try {
      console.log('📄 Loading geodatabase layers...');
      
      const [FeatureLayer] = await loadModules(['esri/layers/FeatureLayer']);
      
      const layerConfigs = this.loadGeodatabaseConfig();

      for (const layerConfig of layerConfigs) {
        try {
          console.log(`📄 Creating layer: ${layerConfig.title}`);
          
          const mockFeatures = this.generateMockFeatures(layerConfig, 6);
          
          const layer = new FeatureLayer({
            title: layerConfig.title,
            geometryType: layerConfig.geometryType,
            spatialReference: { wkid: 4326 },
            fields: layerConfig.fields,
            objectIdField: 'OBJECTID',
            source: mockFeatures,
            visible: layerConfig.visible,
            renderer: this.getLayerRenderer(layerConfig)
          });

          this.view.map.add(layer);
          this.geodatabaseLayers.set(layerConfig.id, layer);
          
          console.log(`✅ Layer added: ${layerConfig.title}`);
        } catch (error) {
          console.error(`❌ Error creating layer ${layerConfig.title}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error loading geodatabase layers:', error);
    }
  }

  async queryLayer(layerId: string, query: string = '1=1'): Promise<any[]> {
    const layer = this.geodatabaseLayers.get(layerId);
    if (!layer) {
      console.error(`❌ Layer ${layerId} not found`);
      return [];
    }

    try {
      const queryResult = await layer.queryFeatures({
        where: query,
        returnGeometry: true,
        outFields: ['*']
      });

      console.log(`🔍 Query completed for ${layerId}: ${queryResult.features.length} features`);
      return queryResult.features;
    } catch (error) {
      console.error(`❌ Error querying layer ${layerId}:`, error);
      return [];
    }
  }

  getAvailableLayers(): string[] {
    return Array.from(this.geodatabaseLayers.keys());
  }

  getLayerByTitle(title: string): any {
    for (const [id, layer] of this.geodatabaseLayers) {
      if (layer.title === title) {
        return layer;
      }
    }
    return null;
  }
}

export default GeodatabaseService;
