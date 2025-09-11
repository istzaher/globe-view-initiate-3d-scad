import { loadModules } from 'esri-loader';

interface AbuDhabiDataConfig {
  id: string;
  title: string;
  description: string;
  file: string;
  geometry_type: string;
  category: string;
  color: string;
  icon: string;
  visible?: boolean;
}

export class AbuDhabiRealDataService {
  private view: any = null;
  private loadedLayers: Map<string, any> = new Map();

  constructor() {
    console.log('🏙️ AbuDhabiRealDataService initialized');
  }

  setView(view: any) {
    this.view = view;
    console.log('🗺️ Map view set for AbuDhabiRealDataService');
  }

  async loadRealDatasets() {
    if (!this.view) {
      console.warn('⚠️ Map view not set, cannot load real datasets');
      return;
    }

    console.log('📊 Loading real Abu Dhabi datasets...');

    const datasets: AbuDhabiDataConfig[] = [
      {
        id: 'bus_stops_real',
        title: 'Abu Dhabi Bus Stops',
        description: 'ITC public transportation stops',
        file: '/data/bus_stops_query.geojson',
        geometry_type: 'point',
        category: 'transportation',
        color: '#2563eb',
        icon: 'bus',
        visible: true
      },
      {
        id: 'mosques_real',
        title: 'Abu Dhabi Mosques',
        description: 'Islamic places of worship',
        file: '/data/mosques_query.geojson',
        geometry_type: 'polygon',
        category: 'religious',
        color: '#16a34a',
        icon: 'place-of-worship',
        visible: true
      },
      {
        id: 'parks_real',
        title: 'Abu Dhabi Parks',
        description: 'Public parks and green spaces',
        file: '/data/Parks_In_Bbox.geojson',
        geometry_type: 'polygon',
        category: 'recreation',
        color: '#059669',
        icon: 'trees',
        visible: true
      },
      {
        id: 'parking_real',
        title: 'Abu Dhabi Parking',
        description: 'Parking areas and facilities',
        file: '/data/Parking_Areas.geojson',
        geometry_type: 'polygon',
        category: 'transportation',
        color: '#dc2626',
        icon: 'car',
        visible: false
      },
      {
        id: 'buildings_real',
        title: 'Abu Dhabi Buildings',
        description: 'Building structures and architecture',
        file: '/data/BuildingStructures.geojson',
        geometry_type: 'polygon',
        category: 'infrastructure',
        color: '#6b7280',
        icon: 'building',
        visible: false
      },
      {
        id: 'roads_real',
        title: 'Abu Dhabi Roads',
        description: 'Street and road network',
        file: '/data/Roads_Query.geojson',
        geometry_type: 'polyline',
        category: 'transportation',
        color: '#374151',
        icon: 'route',
        visible: false
      }
    ];

    for (const dataset of datasets) {
      try {
        await this.loadDataset(dataset);
      } catch (error) {
        console.error(`❌ Failed to load dataset ${dataset.id}:`, error);
      }
    }

    console.log('✅ Real Abu Dhabi datasets loaded');
  }

  private async loadDataset(config: AbuDhabiDataConfig) {
    try {
      console.log(`📄 Loading ${config.title} from ${config.file}...`);

      // Fetch the GeoJSON data
      const response = await fetch(config.file);
      console.log(`📡 Fetch response for ${config.file}:`, response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${config.file}: ${response.statusText}`);
      }
      
      const geojsonData = await response.json();
      console.log(`📊 Loaded ${geojsonData.features?.length || 0} features for ${config.title}`);

      // Load ArcGIS modules
      const [FeatureLayer, Graphic] = await loadModules([
        'esri/layers/FeatureLayer',
        'esri/Graphic'
      ]);

      // Create graphics from GeoJSON features
      const graphics = geojsonData.features.map((feature: any) => {
        return new Graphic({
          geometry: this.convertGeoJSONGeometry(feature.geometry),
          attributes: {
            OBJECTID: feature.id || Math.random().toString(36).substr(2, 9),
            Name: feature.properties.name || feature.properties['name:en'] || 'Unnamed',
            Type: feature.properties.amenity || feature.properties.highway || feature.properties.leisure || config.category,
            Category: config.category,
            Description: config.description,
            ...feature.properties
          }
        });
      });

      // Create the feature layer
      const featureLayer = new FeatureLayer({
        title: config.title,
        id: config.id,
        source: graphics,
        fields: this.createFields(),
        objectIdField: 'OBJECTID',
        geometryType: this.getEsriGeometryType(config.geometry_type),
        spatialReference: { wkid: 4326 },
        renderer: this.createRenderer(config),
        popupTemplate: this.createPopupTemplate(config),
        visible: config.visible || false
      });

      // Add to map
      this.view.map.add(featureLayer);
      this.loadedLayers.set(config.id, featureLayer);

      console.log(`✅ Added layer: ${config.title}`);

    } catch (error) {
      console.error(`❌ Error loading dataset ${config.id}:`, error);
    }
  }

  private convertGeoJSONGeometry(geojsonGeom: any) {
    // Convert GeoJSON geometry to ArcGIS geometry format
    switch (geojsonGeom.type) {
      case 'Point':
        return {
          type: 'point',
          longitude: geojsonGeom.coordinates[0],
          latitude: geojsonGeom.coordinates[1],
          spatialReference: { wkid: 4326 }
        };
      case 'Polygon':
        return {
          type: 'polygon',
          rings: geojsonGeom.coordinates,
          spatialReference: { wkid: 4326 }
        };
      case 'LineString':
        return {
          type: 'polyline',
          paths: [geojsonGeom.coordinates],
          spatialReference: { wkid: 4326 }
        };
      case 'MultiPolygon':
        return {
          type: 'polygon',
          rings: geojsonGeom.coordinates.flat(),
          spatialReference: { wkid: 4326 }
        };
      default:
        console.warn(`Unsupported geometry type: ${geojsonGeom.type}`);
        return null;
    }
  }

  private getEsriGeometryType(geoJsonType: string): string {
    switch (geoJsonType.toLowerCase()) {
      case 'point':
        return 'point';
      case 'polygon':
        return 'polygon';
      case 'polyline':
      case 'linestring':
        return 'polyline';
      default:
        return 'point';
    }
  }

  private createFields() {
    return [
      {
        name: 'OBJECTID',
        type: 'oid',
        alias: 'Object ID'
      },
      {
        name: 'Name',
        type: 'string',
        length: 255,
        alias: 'Name'
      },
      {
        name: 'Type',
        type: 'string',
        length: 100,
        alias: 'Type'
      },
      {
        name: 'Category',
        type: 'string',
        length: 100,
        alias: 'Category'
      },
      {
        name: 'Description',
        type: 'string',
        length: 255,
        alias: 'Description'
      }
    ];
  }

  private createRenderer(config: AbuDhabiDataConfig) {
    const color = this.hexToRgb(config.color);
    
    if (config.geometry_type === 'point') {
      return {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: color,
          size: 8,
          outline: {
            color: [255, 255, 255, 0.8],
            width: 1
          }
        }
      };
    } else if (config.geometry_type === 'polygon') {
      return {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [...color, 0.3],
          outline: {
            color: color,
            width: 2
          }
        }
      };
    } else if (config.geometry_type === 'polyline') {
      return {
        type: 'simple',
        symbol: {
          type: 'simple-line',
          color: color,
          width: 2,
          style: 'solid'
        }
      };
    }
  }

  private createPopupTemplate(config: AbuDhabiDataConfig) {
    return {
      title: '{Name}',
      content: [
        {
          type: 'fields',
          fieldInfos: [
            {
              fieldName: 'Type',
              label: 'Type'
            },
            {
              fieldName: 'Category',
              label: 'Category'
            },
            {
              fieldName: 'Description',
              label: 'Description'
            }
          ]
        }
      ]
    };
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  getLoadedLayers() {
    return Array.from(this.loadedLayers.values());
  }

  getLayerById(id: string) {
    return this.loadedLayers.get(id);
  }

  async queryLayer(layerId: string, query: any = {}) {
    console.log(`🔍 Abu Dhabi Real Data Service - queryLayer called with: ${layerId}`);
    console.log(`📊 Available layers:`, Array.from(this.loadedLayers.keys()));
    
    const layer = this.getLayerById(layerId);
    if (!layer) {
      console.warn(`❌ Layer ${layerId} not found in loaded layers`);
      return null;
    }
    
    console.log(`✅ Found layer ${layerId}, executing query...`);

    try {
      const queryResult = await layer.queryFeatures({
        where: query.where || '1=1',
        outFields: ['*'],
        returnGeometry: true
      });

      console.log(`🔍 Query result for ${layerId}: ${queryResult.features.length} features`);
      return queryResult;
    } catch (error) {
      console.error(`Error querying layer ${layerId}:`, error);
      return null;
    }
  }
}

export default AbuDhabiRealDataService;
