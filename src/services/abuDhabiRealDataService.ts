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
    console.log('🗺️ Map view available:', !!this.view);

    const datasets: AbuDhabiDataConfig[] = [
      {
        id: 'bus_stops_real',
        title: 'Abu Dhabi Bus Stops',
        description: 'ITC public transportation stops',
        file: '/data/bus_stops_query.geojson',
        geometry_type: 'point',
        category: 'transportation',
        color: '#1e40af',
        icon: 'bus',
        visible: false
      },
      {
        id: 'mosques_real',
        title: 'Abu Dhabi Mosques',
        description: 'Islamic places of worship',
        file: '/data/mosques_query.geojson',
        geometry_type: 'polygon',
        category: 'religious',
        color: '#7c3aed',
        icon: 'place-of-worship',
        visible: false
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
        visible: false
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
        visible: false // Disabled due to large file size and geometry validation errors
      }
    ];

    for (const dataset of datasets) {
      try {
        console.log(`🔄 Loading dataset: ${dataset.id}`);
        
        // Roads dataset now enabled for on-demand loading
        console.log(`🛣️ Processing dataset: ${dataset.id}`);
        
        await this.loadDataset(dataset);
        console.log(`✅ Completed loading: ${dataset.id}`);
      } catch (error) {
        console.error(`❌ Failed to load dataset ${dataset.id}:`, error);
      }
    }

    console.log('✅ Real Abu Dhabi datasets loaded');
    console.log('📊 Total loaded layers:', this.loadedLayers.size);
    console.log('📋 Layer IDs:', Array.from(this.loadedLayers.keys()));
  }

  private getDatasetConfigs(): AbuDhabiDataConfig[] {
    return [
      {
        id: 'bus_stops_real',
        title: 'Abu Dhabi Bus Stops',
        description: 'ITC public transportation stops',
        file: '/data/bus_stops_query.geojson',
        geometry_type: 'point',
        category: 'transportation',
        color: '#1e40af',
        icon: 'bus',
        visible: false
      },
      {
        id: 'mosques_real',
        title: 'Abu Dhabi Mosques',
        description: 'Islamic places of worship',
        file: '/data/mosques_query.geojson',
        geometry_type: 'polygon',
        category: 'religious',
        color: '#7c3aed',
        icon: 'place-of-worship',
        visible: false
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
        visible: false
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
  }

  async loadSpecificDataset(datasetId: string): Promise<void> {
    if (!this.view) {
      console.error('❌ No map view available for AbuDhabiRealDataService');
      return;
    }

    // Check if dataset is already loaded
    if (this.loadedLayers.has(datasetId)) {
      console.log(`✅ Dataset ${datasetId} already loaded, making it visible`);
      const layer = this.loadedLayers.get(datasetId);
      if (layer) {
        layer.visible = true;
      }
      return;
    }

    console.log(`🏙️ Loading specific dataset: ${datasetId}`);
    
    const datasets = this.getDatasetConfigs();
    const dataset = datasets.find(d => d.id === datasetId);
    
    if (!dataset) {
      console.error(`❌ Dataset not found: ${datasetId}`);
      return;
    }

    try {
      console.log(`🛣️ Loading dataset: ${dataset.id} (including roads if requested)`);
      await this.loadDataset(dataset);
      
      // Make the loaded dataset visible
      const layer = this.loadedLayers.get(datasetId);
      if (layer) {
        layer.visible = true;
      }
      
      console.log(`✅ Successfully loaded and made visible: ${dataset.id}`);
    } catch (error) {
      console.error(`❌ Failed to load dataset ${dataset.id}:`, error);
      console.log(`⚠️ If this is roads dataset, it might have geometry validation issues but will still attempt to display`);
    }
  }

  hideAllDatasets(): void {
    console.log('🙈 Hiding all datasets');
    this.loadedLayers.forEach((layer, id) => {
      layer.visible = false;
      console.log(`👁️ Hidden dataset: ${id}`);
    });
  }

  showOnlyDataset(datasetId: string): void {
    console.log(`👁️ Showing only dataset: ${datasetId}`);
    this.loadedLayers.forEach((layer, id) => {
      layer.visible = (id === datasetId);
      console.log(`👁️ ${id}: ${layer.visible ? 'visible' : 'hidden'}`);
    });
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
      console.log(`🗺️ Adding layer ${config.id} to map...`);
      this.view.map.add(featureLayer);
      this.loadedLayers.set(config.id, featureLayer);

      console.log(`✅ Added layer: ${config.title}`);
      console.log(`📊 Layer ${config.id} now in loadedLayers:`, this.loadedLayers.has(config.id));

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
    console.log(`🎨 Creating renderer for ${config.id}: color=${config.color} -> RGB(${color.join(',')}) geometry=${config.geometry_type}`);
    
    if (config.geometry_type === 'point') {
      // Enhanced point symbols for better visibility
      return {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          style: config.id === 'bus_stops_real' ? 'square' : 'circle',
          color: color,
          size: config.id === 'bus_stops_real' ? 10 : 8,
          outline: {
            color: [255, 255, 255, 0.9],
            width: 2
          }
        }
      };
    } else if (config.geometry_type === 'polygon') {
      // Enhanced polygon symbols with better visibility
      return {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [...color, 0.6], // Increased opacity for better visibility
          outline: {
            color: color,
            width: config.id === 'mosques_real' ? 3 : 2 // Thicker outline for mosques
          }
        }
      };
    } else if (config.geometry_type === 'polyline') {
      return {
        type: 'simple',
        symbol: {
          type: 'simple-line',
          color: color,
          width: 3,
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
      // Enhanced where clause for analytical queries
      let whereClause = query.where || '1=1';
      let isAnalyticalQuery = false;
      
      // Handle analytical queries for building levels
      if (layerId === 'buildings_real' && whereClause.includes('levels')) {
        whereClause = this.parseAnalyticalQuery(whereClause);
        isAnalyticalQuery = true;
        console.log(`🏗️ Enhanced building levels query: ${whereClause}`);
      }
      
      const queryResult = await layer.queryFeatures({
        where: whereClause,
        outFields: ['*'],
        returnGeometry: true
      });

      console.log(`🔍 Query result for ${layerId}: ${queryResult.features.length} features`);
      
      // For ALL real dataset queries, gather statistics for chat response
      if (layerId.endsWith('_real')) {
        console.log(`📊 GATHERING STATISTICS FOR ${layerId}...`);
        
        // Get total count of all features in this dataset
        const totalQuery = await layer.queryFeatures({
          where: '1=1',
          returnGeometry: false,
          returnCountOnly: true
        });
        
        console.log(`🔍 Total query result for ${layerId}:`, totalQuery);
        let totalFeatures = totalQuery.count || 0;
        
        // Fallback: if returnCountOnly doesn't work, use the features array length
        if (totalFeatures === 0) {
          console.warn(`⚠️ returnCountOnly returned 0, trying alternate method...`);
          const allFeaturesQuery = await layer.queryFeatures({
            where: '1=1',
            returnGeometry: false,
            outFields: ['OBJECTID']
          });
          totalFeatures = allFeaturesQuery.features.length;
          console.log(`🔢 Fallback count method: found ${totalFeatures} total features`);
        }
        const matchingFeatures = queryResult.features.length;
        
        // If totalFeatures is still 0, use matchingFeatures as total (assuming query returned all features)
        if (totalFeatures === 0 && matchingFeatures > 0) {
          totalFeatures = matchingFeatures;
          console.log(`🔧 Using matchingFeatures (${matchingFeatures}) as totalFeatures since count query failed`);
        }
        
        const percentage = totalFeatures > 0 ? ((matchingFeatures / totalFeatures) * 100).toFixed(1) : '100';
        
        console.log(`📊 Statistical Analysis for ${layerId}: ${matchingFeatures} features out of ${totalFeatures} total (${percentage}%)`);
        
        // Determine query type
        const queryType = (layerId === 'buildings_real' && isAnalyticalQuery) ? 'analytical' : 'general';
        
        // Add statistics to the query result for use in chat responses
        queryResult.statistics = {
          totalFeatures: totalFeatures,
          matchingFeatures: matchingFeatures,
          percentage: percentage,
          queryType: queryType,
          layerType: layerId.replace('_real', '')
        };
        
        console.log(`📊 ADDED STATISTICS TO QUERY RESULT FOR ${layerId}:`, queryResult.statistics);
        
        // Debug building level data for analytical queries
        if (layerId === 'buildings_real' && isAnalyticalQuery) {
          if (queryResult.features.length > 0) {
            console.log(`🏗️ Sample building level data:`, 
              queryResult.features.slice(0, 3).map(f => ({
                name: f.attributes.name,
                levels: f.attributes['building:levels'] || f.attributes['building_levels'],
                id: f.attributes.OBJECTID
              }))
            );
          } else {
            console.warn(`⚠️ No buildings found matching the level criteria`);
          }
        }
      }
      
      // Apply conditional highlighting for analytical queries
      if (isAnalyticalQuery && layerId === 'buildings_real') {
        await this.highlightAnalyticalResults(layerId, queryResult);
      }
      
      return queryResult;
    } catch (error) {
      console.error(`Error querying layer ${layerId}:`, error);
      return null;
    }
  }

  private parseAnalyticalQuery(whereClause: string): string {
    // Parse building level queries like "more than 16 levels"
    const levelPatterns = [
      { pattern: /more than (\d+) levels?/i, operator: '>' },
      { pattern: /greater than (\d+) levels?/i, operator: '>' },
      { pattern: /over (\d+) levels?/i, operator: '>' },
      { pattern: /above (\d+) levels?/i, operator: '>' },
      { pattern: /(\d+)\+ levels?/i, operator: '>=' },
      { pattern: /at least (\d+) levels?/i, operator: '>=' },
      { pattern: /minimum (\d+) levels?/i, operator: '>=' },
      { pattern: /less than (\d+) levels?/i, operator: '<' },
      { pattern: /under (\d+) levels?/i, operator: '<' },
      { pattern: /below (\d+) levels?/i, operator: '<' },
      { pattern: /exactly (\d+) levels?/i, operator: '=' },
      { pattern: /(\d+) levels? exactly/i, operator: '=' }
    ];

    for (const { pattern, operator } of levelPatterns) {
      const match = whereClause.match(pattern);
      if (match) {
        const levelValue = match[1];
        console.log(`📊 Analytical query detected: ${operator} ${levelValue} levels`);
        
        // Convert to ArcGIS field query - use CAST for numeric comparison
        // The field name is "building:levels" and values are strings like "6"
        const fieldExpression = `CAST("building:levels" AS INTEGER)`;
        
        if (operator === '>=' && levelValue) {
          return `${fieldExpression} >= ${levelValue}`;
        } else if (operator === '>' && levelValue) {
          return `${fieldExpression} > ${levelValue}`;
        } else if (operator === '<' && levelValue) {
          return `${fieldExpression} < ${levelValue}`;
        } else if (operator === '=' && levelValue) {
          return `${fieldExpression} = ${levelValue}`;
        }
      }
    }

    return whereClause;
  }

  private async highlightAnalyticalResults(layerId: string, queryResult: any): Promise<void> {
    console.log(`🎨 Applying analytical highlighting for ${queryResult.features.length} matching buildings`);
    
    // Debug: Log available field names to understand the schema
    if (queryResult.features.length > 0) {
      const sampleAttributes = queryResult.features[0].attributes;
      console.log(`🔍 Available fields in building data:`, Object.keys(sampleAttributes));
      console.log(`🏗️ Sample building levels field:`, sampleAttributes['building:levels'] || sampleAttributes['building_levels'] || 'NOT FOUND');
    }
    
    const layer = this.getLayerById(layerId);
    if (!layer) return;

    // Create a new renderer that highlights matching features in red
    const highlightRenderer = {
      type: 'unique-value',
      field: 'OBJECTID', // Use a unique field
      defaultSymbol: {
        type: 'simple-fill',
        color: [156, 163, 175, 0.4], // Gray for non-matching buildings
        outline: {
          color: [156, 163, 175, 0.8],
          width: 1
        }
      },
      uniqueValueInfos: queryResult.features.map((feature: any) => ({
        value: feature.attributes.OBJECTID,
        symbol: {
          type: 'simple-fill',
          color: [239, 68, 68, 0.7], // Red for matching buildings
          outline: {
            color: [220, 38, 38, 0.9],
            width: 2
          }
        }
      }))
    };

    // Apply the new renderer
    layer.renderer = highlightRenderer;
    console.log(`🔴 Applied red highlighting to ${queryResult.features.length} buildings matching analytical criteria`);
  }

  resetBuildingColors(): void {
    const layer = this.getLayerById('buildings_real');
    if (!layer) return;

    // Reset to original renderer
    const originalRenderer = this.createRenderer({
      id: 'buildings_real',
      title: 'Abu Dhabi Buildings',
      description: 'Building structures, landmarks, and architectural features',
      file: '/data/BuildingStructures.geojson',
      geometry_type: 'polygon',
      category: 'urban',
      color: '#f59e0b',
      icon: 'building',
      visible: true
    });

    layer.renderer = originalRenderer;
    console.log(`🎨 Reset buildings to original orange color`);
  }
}

export default AbuDhabiRealDataService;
