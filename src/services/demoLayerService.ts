import { loadModules } from 'esri-loader';

interface DemoLayerConfig {
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

export class DemoLayerService {
  private view: any = null;
  private demoLayers: Map<string, any> = new Map();

  constructor() {
    console.log('🎭 DemoLayerService initialized');
  }

  setMapView(view: any) {
    this.view = view;
    console.log('🗺️ Map view set for DemoLayerService');
  }

  private getDemoLayerConfig(): DemoLayerConfig[] {
    return [
      {
        id: 'abu_dhabi_schools',
        title: 'Abu Dhabi Schools',
        geometryType: 'point',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'School Name' },
          { name: 'Type', type: 'string', alias: 'School Type' },
          { name: 'District', type: 'string', alias: 'District' },
          { name: 'Students', type: 'integer', alias: 'Number of Students' },
          { name: 'Established', type: 'integer', alias: 'Year Established' }
        ],
        visible: true
      },
      {
        id: 'abu_dhabi_hospitals',
        title: 'Abu Dhabi Hospitals',
        geometryType: 'point',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'Hospital Name' },
          { name: 'Type', type: 'string', alias: 'Hospital Type' },
          { name: 'District', type: 'string', alias: 'District' },
          { name: 'Beds', type: 'integer', alias: 'Number of Beds' },
          { name: 'Specialization', type: 'string', alias: 'Specialization' }
        ],
        visible: true
      },
      {
        id: 'abu_dhabi_universities',
        title: 'Abu Dhabi Universities',
        geometryType: 'point',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'University Name' },
          { name: 'Type', type: 'string', alias: 'Institution Type' },
          { name: 'District', type: 'string', alias: 'District' },
          { name: 'Students', type: 'integer', alias: 'Number of Students' },
          { name: 'Founded', type: 'integer', alias: 'Year Founded' }
        ],
        visible: false
      },
      {
        id: 'abu_dhabi_police_stations',
        title: 'Abu Dhabi Police Stations',
        geometryType: 'point',
        fields: [
          { name: 'OBJECTID', type: 'oid', alias: 'Object ID' },
          { name: 'Name', type: 'string', alias: 'Station Name' },
          { name: 'Type', type: 'string', alias: 'Station Type' },
          { name: 'District', type: 'string', alias: 'District' },
          { name: 'Officers', type: 'integer', alias: 'Number of Officers' },
          { name: 'Established', type: 'integer', alias: 'Year Established' }
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

  private generateMockFeatures(layerConfig: DemoLayerConfig, count: number = 10): any[] {
    const abuDhabiLocations = this.getAbuDhabiLocations();
    const features = [];

    for (let i = 0; i < count; i++) {
      const baseLocation = abuDhabiLocations[i % abuDhabiLocations.length];
      
      // Add small random offset to keep points on land (approx 500m)
      const offsetX = (Math.random() - 0.5) * 0.005;
      const offsetY = (Math.random() - 0.5) * 0.005;
      
      const coordinates = [
        baseLocation.coordinates[0] + offsetX,
        baseLocation.coordinates[1] + offsetY
      ];

      const attributes: any = {
        OBJECTID: i + 1,
        District: baseLocation.area
      };

      // Generate layer-specific attributes
      if (layerConfig.id === 'abu_dhabi_schools') {
        attributes.Name = `${baseLocation.name} School ${i + 1}`;
        attributes.Type = ['Primary', 'Secondary', 'International', 'Private'][Math.floor(Math.random() * 4)];
        attributes.Students = Math.floor(Math.random() * 800) + 200;
        attributes.Established = Math.floor(Math.random() * 30) + 1990;
      } else if (layerConfig.id === 'abu_dhabi_hospitals') {
        attributes.Name = `${baseLocation.name} Hospital`;
        attributes.Type = ['General', 'Specialized', 'Private', 'Emergency'][Math.floor(Math.random() * 4)];
        attributes.Beds = Math.floor(Math.random() * 300) + 50;
        attributes.Specialization = ['General Medicine', 'Cardiology', 'Pediatrics', 'Surgery'][Math.floor(Math.random() * 4)];
      } else if (layerConfig.id === 'abu_dhabi_universities') {
        attributes.Name = `${baseLocation.name} University`;
        attributes.Type = ['Public', 'Private', 'Technical', 'Medical'][Math.floor(Math.random() * 4)];
        attributes.Students = Math.floor(Math.random() * 5000) + 1000;
        attributes.Founded = Math.floor(Math.random() * 40) + 1980;
      } else if (layerConfig.id === 'abu_dhabi_police_stations') {
        attributes.Name = `${baseLocation.name} Police Station`;
        attributes.Type = ['Main Station', 'Patrol Station', 'Traffic Police', 'Emergency'][Math.floor(Math.random() * 4)];
        attributes.Officers = Math.floor(Math.random() * 50) + 10;
        attributes.Established = Math.floor(Math.random() * 40) + 1980;
      }

      features.push({
        geometry: {
          type: 'point',
          longitude: coordinates[0],
          latitude: coordinates[1]
        },
        attributes
      });
    }

    return features;
  }

  private getLayerRenderer(layerConfig: DemoLayerConfig): any {
    const colors: { [key: string]: [number, number, number] } = {
      'abu_dhabi_schools': [76, 175, 80],      // Green
      'abu_dhabi_hospitals': [244, 67, 54],    // Red  
      'abu_dhabi_universities': [63, 81, 181], // Indigo
      'abu_dhabi_police_stations': [33, 150, 243] // Blue
    };

    const color = colors[layerConfig.id] || [128, 128, 128];

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
  }

  async createDemoLayers(): Promise<void> {
    if (!this.view) {
      console.error('❌ Map view not set');
      return;
    }

    try {
      console.log('🎭 Creating demo layers...');
      
      const [FeatureLayer] = await loadModules(['esri/layers/FeatureLayer']);
      
      const layerConfigs = this.getDemoLayerConfig();

      for (const layerConfig of layerConfigs) {
        try {
          console.log(`📄 Creating layer: ${layerConfig.title}`);
          
          const mockFeatures = this.generateMockFeatures(layerConfig, 8);
          
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
          this.demoLayers.set(layerConfig.id, layer);
          
          console.log(`✅ Layer added: ${layerConfig.title}`);
        } catch (error) {
          console.error(`❌ Error creating layer ${layerConfig.title}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error creating demo layers:', error);
    }
  }

  async queryLayer(layerId: string, query: string = '1=1'): Promise<any[]> {
    const layer = this.demoLayers.get(layerId);
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
    return Array.from(this.demoLayers.keys());
  }

  getLayerByTitle(title: string): any {
    for (const [id, layer] of this.demoLayers) {
      if (layer.title === title) {
        return layer;
      }
    }
    return null;
  }
}

export default DemoLayerService;
