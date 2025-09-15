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
    
    // Expose displayLLMResults globally for ChatbotInterface
    (window as any).displayLLMResults = this.displayLLMResults.bind(this);
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
        console.log(`📊 Analytical query detected: "${whereClause}"`);
        const parsedWhereClause = this.parseAnalyticalQuery(whereClause);
        console.log(`🏗️ Parsed to SQL: "${parsedWhereClause}"`);
        whereClause = parsedWhereClause;
        isAnalyticalQuery = true;
      }
      
      // Debug: Check available fields first and fix field names
      if (isAnalyticalQuery) {
        console.log(`🔍 DEBUGGING FIELDS: Checking available fields in layer...`);
        const sampleQuery = await layer.queryFeatures({
          where: '1=1',
          outFields: ['*'],
          returnGeometry: false,
          num: 1
        });
        
        if (sampleQuery.features.length > 0) {
          const sampleFeature = sampleQuery.features[0];
          console.log(`🔍 SAMPLE FEATURE ATTRIBUTES:`, Object.keys(sampleFeature.attributes));
          console.log(`🔍 SAMPLE FEATURE VALUES:`, sampleFeature.attributes);
          console.log(`🔍 LOOKING FOR LEVEL FIELDS:`, Object.keys(sampleFeature.attributes).filter(key => 
            key.toLowerCase().includes('level') || key.toLowerCase().includes('floor') || key.toLowerCase().includes('building')
          ));
          
          // Look for the building:levels field specifically
          const buildingLevelsField = Object.keys(sampleFeature.attributes).find(key => 
            key.includes('building') && key.includes('level')
          );
          console.log(`🏗️ BUILDING LEVELS FIELD FOUND:`, buildingLevelsField);
          if (buildingLevelsField) {
            console.log(`🏗️ BUILDING LEVELS VALUE:`, sampleFeature.attributes[buildingLevelsField]);
            console.log(`🏗️ EXACT FIELD NAME TO USE IN SQL:`, buildingLevelsField);
            // Replace the placeholder with the actual field name
            console.log(`🔄 BEFORE REPLACEMENT: "${whereClause}"`);
            whereClause = whereClause.replace(/BUILDING_LEVELS_FIELD_PLACEHOLDER/g, buildingLevelsField);
            console.log(`🔄 AFTER REPLACEMENT: "${whereClause}"`);
          } else {
            console.log(`🏗️ NO BUILDING LEVELS FIELD FOUND - CHECKING ALL FIELD NAMES:`);
            Object.keys(sampleFeature.attributes).forEach(key => {
              console.log(`  - ${key}: ${sampleFeature.attributes[key]}`);
            });
            // Fallback: try common alternative field names
            const alternativeFields = ['building_levels', 'buildinglevels', 'levels', 'LEVELS'];
            for (const altField of alternativeFields) {
              if (Object.keys(sampleFeature.attributes).includes(altField)) {
                console.log(`🔄 USING ALTERNATIVE FIELD: ${altField}`);
                whereClause = whereClause.replace(/BUILDING_LEVELS_FIELD_PLACEHOLDER/g, altField);
                break;
              }
            }
          }
        }
      }

      // For buildings, optimize query to handle large dataset
      const queryOptions: any = {
        where: whereClause,
        outFields: ['*'],
        returnGeometry: true
      };
      
      // For buildings showing "all", ensure no limits and proper handling
      if (layerId === 'buildings_real' && whereClause === '1=1') {
        console.log(`🏗️ Querying ALL buildings - optimizing for large dataset`);
        queryOptions.maxRecordCount = 0; // Remove any limits
        queryOptions.start = 0; // Start from beginning
      }
      
      const queryResult = await layer.queryFeatures(queryOptions);

      console.log(`🔍 Query result for ${layerId}: ${queryResult.features.length} features`);
      
      // Special logging for buildings to debug the "show all" issue
      if (layerId === 'buildings_real') {
        console.log(`🏗️ BUILDINGS DEBUG:`);
        console.log(`   📊 Query: "${whereClause}"`);
        console.log(`   🔢 Features returned: ${queryResult.features.length}`);
        console.log(`   📐 Query options used:`, queryOptions);
        
        // Check if this is showing "all" buildings
        if (whereClause === '1=1') {
          console.log(`   🎯 This is a "SHOW ALL BUILDINGS" query`);
          console.log(`   ⚠️ Expected: 1398 buildings, Got: ${queryResult.features.length}`);
          
          if (queryResult.features.length < 1398) {
            console.warn(`   ❌ MISSING BUILDINGS: Only showing ${queryResult.features.length} out of 1398 expected buildings!`);
            console.warn(`   🔧 This indicates a query limit or performance issue`);
          } else {
            console.log(`   ✅ All buildings are being returned correctly`);
          }
        }
      }
      
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
        // Perform detailed attribute analysis
        const attributeAnalysis = this.analyzeFeatureAttributes(layerId, queryResult.features || [], totalFeatures);
        
        queryResult.statistics = {
          totalFeatures: totalFeatures,
          matchingFeatures: matchingFeatures,
          percentage: percentage,
          queryType: queryType,
          layerType: layerId.replace('_real', ''),
          attributeAnalysis: attributeAnalysis,
          hasLevelData: true, // This dataset DOES contain building level information in "building:levels" field
        };
        
        console.log(`📊 ADDED ENHANCED STATISTICS TO QUERY RESULT FOR ${layerId}:`, queryResult.statistics);
        
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
    console.log(`🔍 PARSING ANALYTICAL QUERY: "${whereClause}"`);
    
    // Check if this is a level-related query - building:levels field DOES exist in GeoJSON
    const isLevelQuery = whereClause.toLowerCase().includes('level') || 
                        whereClause.toLowerCase().includes('floor') || 
                        whereClause.toLowerCase().includes('story');
    
    if (isLevelQuery) {
      console.log(`🏗️ LEVEL QUERY DETECTED - building:levels field available in dataset`);
    }
    
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
      { pattern: /(\d+) levels? exactly/i, operator: '=' },
      // Add patterns for "having" constructions
      { pattern: /having more than (\d+) levels?/i, operator: '>' },
      { pattern: /having (\d+)\+ levels?/i, operator: '>=' },
      { pattern: /with more than (\d+) levels?/i, operator: '>' },
      { pattern: /with (\d+)\+ levels?/i, operator: '>=' }
    ];

    for (const { pattern, operator } of levelPatterns) {
      console.log(`🔍 Testing pattern: ${pattern} against "${whereClause}"`);
      const match = whereClause.match(pattern);
      if (match) {
        const levelValue = match[1];
        console.log(`✅ PATTERN MATCHED: ${operator} ${levelValue} levels`);
        
        // Convert to ArcGIS field query for "building:levels" field
        // Include null check and proper casting for numeric comparison
        console.log(`🏗️ Building SQL query for building:levels ${operator} ${levelValue}`);
        
        // We need to use the dynamic field name detection from queryLayer
        // This will be replaced by the actual field name found in the layer
        const fieldName = 'BUILDING_LEVELS_FIELD_PLACEHOLDER';
        
        if (operator === '>=' && levelValue) {
          return `${fieldName} IS NOT NULL AND CAST(${fieldName} AS INTEGER) >= ${levelValue}`;
        } else if (operator === '>' && levelValue) {
          return `${fieldName} IS NOT NULL AND CAST(${fieldName} AS INTEGER) > ${levelValue}`;
        } else if (operator === '<' && levelValue) {
          return `${fieldName} IS NOT NULL AND CAST(${fieldName} AS INTEGER) < ${levelValue}`;
        } else if (operator === '=' && levelValue) {
          return `${fieldName} = '${levelValue}'`;
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

  /**
   * Analyze feature attributes to provide detailed breakdowns for LLM
   */
  private analyzeFeatureAttributes(layerId: string, features: any[], totalFeatures: number): any {
    try {
      console.log(`🔍 ANALYZING ATTRIBUTES for ${layerId} with ${features.length} features`);
      
      if (layerId === 'buildings_real') {
        return this.analyzeBuildingAttributes(features, totalFeatures);
      } else if (layerId === 'mosques_real') {
        return this.analyzeMosqueAttributes(features, totalFeatures);
      } else if (layerId === 'bus_stops_real') {
        return this.analyzeBusStopAttributes(features, totalFeatures);
      } else if (layerId === 'parks_real') {
        return this.analyzeParkAttributes(features, totalFeatures);
      } else if (layerId === 'parking_real') {
        return this.analyzeParkingAttributes(features, totalFeatures);
      } else {
        return this.analyzeGenericAttributes(features, totalFeatures);
      }
    } catch (error) {
      console.error(`❌ Error analyzing attributes for ${layerId}:`, error);
      return { summary: 'Attribute analysis not available' };
    }
  }

  private analyzeBuildingAttributes(features: any[], totalFeatures: number): any {
    const buildingTypes = new Map<string, number>();
    const amenityTypes = new Map<string, number>();
    const levelCounts = new Map<string, number>();
    const namedBuildings: string[] = [];

    features.forEach(feature => {
      const attrs = feature.attributes || feature.properties || {};
      
      // Building types
      if (attrs.building && attrs.building !== 'yes') {
        buildingTypes.set(attrs.building, (buildingTypes.get(attrs.building) || 0) + 1);
      }
      
      // Amenity types
      if (attrs.amenity) {
        amenityTypes.set(attrs.amenity, (amenityTypes.get(attrs.amenity) || 0) + 1);
      }
      
      // Building levels
      const levels = attrs['building:levels'] || attrs.building_levels;
      if (levels) {
        const levelRange = this.getLevelRange(parseInt(levels));
        levelCounts.set(levelRange, (levelCounts.get(levelRange) || 0) + 1);
      }
      
      // Named buildings
      if (attrs.name && namedBuildings.length < 10) {
        namedBuildings.push(attrs.name);
      }
    });

    return {
      summary: `Analysis of ${features.length} buildings out of ${totalFeatures} total`,
      buildingTypes: Object.fromEntries(buildingTypes),
      amenityTypes: Object.fromEntries(amenityTypes),
      levelDistribution: Object.fromEntries(levelCounts),
      namedBuildings: namedBuildings.slice(0, 5),
      totalAnalyzed: features.length
    };
  }

  private analyzeMosqueAttributes(features: any[], totalFeatures: number): any {
    const namedMosques: string[] = [];
    const denominations = new Map<string, number>();

    features.forEach(feature => {
      const attrs = feature.attributes || feature.properties || {};
      
      if (attrs.name && namedMosques.length < 10) {
        namedMosques.push(attrs.name);
      }
      
      if (attrs.denomination) {
        denominations.set(attrs.denomination, (denominations.get(attrs.denomination) || 0) + 1);
      }
    });

    return {
      summary: `Analysis of ${features.length} mosques out of ${totalFeatures} total`,
      namedMosques: namedMosques.slice(0, 5),
      denominations: Object.fromEntries(denominations),
      totalAnalyzed: features.length
    };
  }

  private analyzeBusStopAttributes(features: any[], totalFeatures: number): any {
    const operators = new Map<string, number>();
    const namedStops: string[] = [];

    features.forEach(feature => {
      const attrs = feature.attributes || feature.properties || {};
      
      if (attrs.name && namedStops.length < 10) {
        namedStops.push(attrs.name);
      }
      
      if (attrs.operator) {
        operators.set(attrs.operator, (operators.get(attrs.operator) || 0) + 1);
      }
    });

    return {
      summary: `Analysis of ${features.length} bus stops out of ${totalFeatures} total`,
      namedStops: namedStops.slice(0, 5),
      operators: Object.fromEntries(operators),
      totalAnalyzed: features.length
    };
  }

  private analyzeParkAttributes(features: any[], totalFeatures: number): any {
    const parkTypes = new Map<string, number>();
    const namedParks: string[] = [];

    features.forEach(feature => {
      const attrs = feature.attributes || feature.properties || {};
      
      if (attrs.name && namedParks.length < 10) {
        namedParks.push(attrs.name);
      }
      
      if (attrs.leisure) {
        parkTypes.set(attrs.leisure, (parkTypes.get(attrs.leisure) || 0) + 1);
      }
    });

    return {
      summary: `Analysis of ${features.length} parks out of ${totalFeatures} total`,
      namedParks: namedParks.slice(0, 5),
      parkTypes: Object.fromEntries(parkTypes),
      totalAnalyzed: features.length
    };
  }

  private analyzeParkingAttributes(features: any[], totalFeatures: number): any {
    const parkingTypes = new Map<string, number>();
    const namedParking: string[] = [];

    features.forEach(feature => {
      const attrs = feature.attributes || feature.properties || {};
      
      if (attrs.name && namedParking.length < 10) {
        namedParking.push(attrs.name);
      }
      
      if (attrs.amenity) {
        parkingTypes.set(attrs.amenity, (parkingTypes.get(attrs.amenity) || 0) + 1);
      }
    });

    return {
      summary: `Analysis of ${features.length} parking areas out of ${totalFeatures} total`,
      namedParking: namedParking.slice(0, 5),
      parkingTypes: Object.fromEntries(parkingTypes),
      totalAnalyzed: features.length
    };
  }

  private analyzeGenericAttributes(features: any[], totalFeatures: number): any {
    return {
      summary: `Analysis of ${features.length} features out of ${totalFeatures} total`,
      totalAnalyzed: features.length
    };
  }

  private getLevelRange(levels: number): string {
    if (levels <= 2) return '1-2 levels';
    if (levels <= 5) return '3-5 levels';
    if (levels <= 10) return '6-10 levels';
    if (levels <= 20) return '11-20 levels';
    if (levels <= 30) return '21-30 levels';
    return '30+ levels';
  }

  /**
   * Display LLM analysis results on the map
   */
  async displayLLMResults(mapFeatures: any) {
    if (!this.view) {
      console.warn('⚠️ Map view not available for displaying LLM results');
      return;
    }

    try {
      console.log('🎯 Displaying LLM-filtered results on map');
      console.log('📊 LLM Map Data received:', mapFeatures);
      
      // Clear ALL existing layers to show only LLM results
      this.hideAllDatasets();
      this.clearLLMLayers();
      
      // Load each dataset from LLM results
      for (const [datasetName, featureCollection] of Object.entries(mapFeatures)) {
        console.log(`🔍 Processing dataset: ${datasetName}`, featureCollection);
        
        if (featureCollection && typeof featureCollection === 'object') {
          const dataset = featureCollection as any;
          
          if (dataset.features && dataset.features.length > 0) {
            console.log(`📊 Dataset ${datasetName} has ${dataset.features.length} features`);
            console.log(`🎯 First feature geometry type:`, dataset.features[0]?.geometry?.type);
            
            // Special handling for buildings to ensure all are displayed
            if (datasetName.includes('buildings')) {
              console.log(`🏗️ BUILDINGS SPECIAL HANDLING:`);
              console.log(`   🔢 LLM returned: ${dataset.features.length} buildings`);
              console.log(`   📊 Total features claimed: ${dataset.total_features || 'unknown'}`);
              console.log(`   📊 Filtered features: ${dataset.filtered_features || 'unknown'}`);
              
              // If we have fewer than expected and this seems like a "show all" query, use direct layer
              if (dataset.features.length < 1398 && dataset.features.length < (dataset.total_features || 1398)) {
                console.warn(`   ⚠️ LLM returned incomplete building set: ${dataset.features.length} < expected 1398`);
                console.log(`   🔧 Attempting to show all buildings directly from loaded layer...`);
                
                // Try to show all buildings from the loaded layer instead
                const buildingsLayer = this.getLayerById('buildings_real');
                if (buildingsLayer) {
                  console.log(`   ✅ Found buildings layer, making it visible to show ALL buildings`);
                  buildingsLayer.visible = true;
                  // Don't process the LLM limited dataset, use the full layer instead
                  continue;
                } else {
                  console.warn(`   ❌ Buildings layer not loaded, will display LLM limited results`);
                }
              }
            }
            
            await this.displayLLMDataset(datasetName, dataset);
          } else {
            console.warn(`⚠️ Dataset ${datasetName} has no features`);
          }
        }
      }
      
      console.log('✅ LLM results displayed on map successfully');
      
      // Zoom to the displayed results
      await this.zoomToLLMResults(mapFeatures);
      
    } catch (error) {
      console.error('❌ Error displaying LLM results on map:', error);
    }
  }

  /**
   * Zoom to LLM results extent
   */
  private async zoomToLLMResults(mapFeatures: any) {
    if (!this.view) {
      console.warn('⚠️ Map view not available for zooming to LLM results');
      return;
    }

    try {
      console.log('🔍 Zooming to LLM results extent...');
      
      // Collect all features from all datasets
      const allFeatures: any[] = [];
      for (const [datasetName, featureCollection] of Object.entries(mapFeatures)) {
        if (featureCollection && typeof featureCollection === 'object') {
          const dataset = featureCollection as any;
          if (dataset.features && dataset.features.length > 0) {
            allFeatures.push(...dataset.features);
          }
        }
      }

      if (allFeatures.length === 0) {
        console.warn('⚠️ No features to zoom to');
        return;
      }

      console.log(`🎯 Zooming to ${allFeatures.length} features from LLM results`);

      // Calculate extent from all features
      let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
      
      for (const feature of allFeatures) {
        if (feature.geometry && feature.geometry.coordinates) {
          const coords = this.extractCoordinates(feature.geometry);
          for (const [lon, lat] of coords) {
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          }
        }
      }

      if (minLon === Infinity) {
        console.warn('⚠️ Could not extract coordinates for zooming');
        return;
      }

      // Calculate center and appropriate zoom level
      const centerLon = (minLon + maxLon) / 2;
      const centerLat = (minLat + maxLat) / 2;
      
      const lonDiff = maxLon - minLon;
      const latDiff = maxLat - minLat;
      const maxDiff = Math.max(lonDiff, latDiff);
      
      let zoom = 10;
      if (maxDiff < 0.01) zoom = 16;
      else if (maxDiff < 0.05) zoom = 14;
      else if (maxDiff < 0.1) zoom = 12;
      else if (maxDiff < 0.5) zoom = 10;
      else zoom = 8;

      // Add some padding to the extent
      const padding = Math.max(lonDiff, latDiff) * 0.1;
      const paddedMinLon = minLon - padding;
      const paddedMaxLon = maxLon + padding;
      const paddedMinLat = minLat - padding;
      const paddedMaxLat = maxLat + padding;

      // Use ArcGIS extent for more accurate zooming
      const [Extent] = await loadModules(['esri/geometry/Extent']);
      
      const extent = new Extent({
        xmin: paddedMinLon,
        ymin: paddedMinLat,
        xmax: paddedMaxLon,
        ymax: paddedMaxLat,
        spatialReference: { wkid: 4326 }
      });

      // Zoom to extent with animation
      await this.view.goTo(extent, {
        duration: 1000,
        easing: "ease-in-out"
      });

      console.log(`✅ Zoomed to LLM results extent: center [${centerLon.toFixed(6)}, ${centerLat.toFixed(6)}], zoom ${zoom}`);

    } catch (error) {
      console.error('❌ Error zooming to LLM results:', error);
    }
  }

  /**
   * Extract coordinates from various geometry types
   */
  private extractCoordinates(geometry: any): [number, number][] {
    const coords: [number, number][] = [];
    
    switch (geometry.type.toLowerCase()) {
      case 'point':
        coords.push([geometry.coordinates[0], geometry.coordinates[1]]);
        break;
      case 'polygon':
        // Extract all rings (exterior and holes)
        for (const ring of geometry.coordinates) {
          for (const coord of ring) {
            coords.push([coord[0], coord[1]]);
          }
        }
        break;
      case 'multipolygon':
        // Extract all polygons
        for (const polygon of geometry.coordinates) {
          for (const ring of polygon) {
            for (const coord of ring) {
              coords.push([coord[0], coord[1]]);
            }
          }
        }
        break;
      case 'linestring':
        for (const coord of geometry.coordinates) {
          coords.push([coord[0], coord[1]]);
        }
        break;
      case 'multilinestring':
        for (const line of geometry.coordinates) {
          for (const coord of line) {
            coords.push([coord[0], coord[1]]);
          }
        }
        break;
    }
    
    return coords;
  }

  /**
   * Display a specific LLM dataset on the map
   */
  private async displayLLMDataset(datasetName: string, featureCollection: any) {
    try {
      const [FeatureLayer] = await loadModules(['esri/layers/FeatureLayer']);
      
      // Find the appropriate dataset config or create a default one
      let datasetConfig = this.getDatasetConfigs().find(d => 
        d.id.includes(datasetName.replace('_real', '')) || 
        d.title.toLowerCase().includes(datasetName.toLowerCase())
      );
      
      // Create default config if not found
      if (!datasetConfig) {
        // Determine geometry type based on actual features
        let geometryType = 'point'; // default
        if (featureCollection.features && featureCollection.features.length > 0) {
          const firstFeature = featureCollection.features[0];
          if (firstFeature.geometry?.type) {
            const geoType = firstFeature.geometry.type.toLowerCase();
            if (geoType === 'polygon' || geoType === 'multipolygon') {
              geometryType = 'polygon';
            } else if (geoType === 'linestring' || geoType === 'multilinestring') {
              geometryType = 'polyline';
            } else {
              geometryType = 'point';
            }
          }
        }
        
        datasetConfig = {
          id: `${datasetName}_llm`,
          title: `${datasetName.replace('_', ' ').toUpperCase()}`,
          description: `Results from LLM analysis for ${datasetName}`,
          file: '',
          geometry_type: geometryType,
          category: 'LLM Results',
          color: datasetName.includes('buildings') ? '#FF6B35' : 
                 datasetName.includes('bus') ? '#004E98' :
                 datasetName.includes('mosque') ? '#009639' :
                 datasetName.includes('park') ? '#90EE90' :
                 datasetName.includes('parking') ? '#7209B7' :
                 datasetName.includes('road') ? '#808080' : '#FF6B35',
          icon: '📍',
          visible: true
        };
        
        console.log(`🔧 Created default config for ${datasetName}:`, datasetConfig);
      }

      // Prepare features with proper ArcGIS geometry format
      const features = featureCollection.features.map((feature: any, index: number) => {
        // Convert GeoJSON geometry to ArcGIS geometry format
        let geometry = null;
        if (feature.geometry && feature.geometry.coordinates) {
          const geojsonGeometry = feature.geometry;
          
          // Convert based on geometry type
          switch (geojsonGeometry.type.toLowerCase()) {
            case 'point':
              geometry = {
                type: 'point',
                longitude: geojsonGeometry.coordinates[0],
                latitude: geojsonGeometry.coordinates[1],
                spatialReference: { wkid: 4326 }
              };
              break;
            case 'polygon':
              geometry = {
                type: 'polygon',
                rings: geojsonGeometry.coordinates,
                spatialReference: { wkid: 4326 }
              };
              break;
            case 'multipolygon':
              // Flatten multipolygon to polygon for ArcGIS
              const allRings = geojsonGeometry.coordinates.flat();
              geometry = {
                type: 'polygon',
                rings: allRings,
                spatialReference: { wkid: 4326 }
              };
              break;
            case 'linestring':
              geometry = {
                type: 'polyline',
                paths: [geojsonGeometry.coordinates],
                spatialReference: { wkid: 4326 }
              };
              break;
            case 'multilinestring':
              geometry = {
                type: 'polyline',
                paths: geojsonGeometry.coordinates,
                spatialReference: { wkid: 4326 }
              };
              break;
            default:
              console.warn(`⚠️ Unsupported geometry type: ${geojsonGeometry.type}`);
          }
        }
        
        return {
          geometry: geometry,
          attributes: {
            OBJECTID: index + 1,
            Name: feature.properties?.Name || feature.properties?.name || `Feature ${index + 1}`,
            Type: feature.properties?.Type || feature.properties?.amenity || 'Unknown',
            Category: feature.properties?.Category || datasetName,
            Description: feature.properties?.Description || feature.properties?.description || '',
            ...feature.properties
          }
        };
      }).filter(feature => feature.geometry !== null); // Remove features with invalid geometry

      console.log(`📊 Processing ${datasetName}: ${features.length} valid features out of ${featureCollection.features.length} total`);
      if (features.length > 0) {
        console.log(`🔍 Sample feature geometry:`, features[0].geometry);
        console.log(`🎯 Geometry type: ${datasetConfig.geometry_type}`);
      }

      // Create feature layer from GeoJSON with optimizations for large datasets
      const layer = new FeatureLayer({
        title: `${datasetConfig.title} (LLM Results - ${featureCollection.features.length} features)`,
        source: features,
        geometryType: datasetConfig.geometry_type as any,
        spatialReference: { wkid: 4326 }, // WGS84
        renderer: this.createRenderer(datasetConfig),
        popupTemplate: this.createPopupTemplate(datasetConfig),
        objectIdField: 'OBJECTID',
        // Optimize for large datasets like buildings (1398 features)
        maxRecordCount: 0, // Remove any limits to show ALL features
        fields: [
          { name: 'OBJECTID', type: 'oid' },
          { name: 'Name', type: 'string' },
          { name: 'Type', type: 'string' },
          { name: 'Category', type: 'string' },
          { name: 'Description', type: 'string' }
        ]
      });

      // Add to map
      this.view.map.add(layer);
      this.loadedLayers.set(`llm_${datasetName}`, layer);
      
      console.log(`✅ Added LLM ${datasetName} layer with ${featureCollection.features.length} features`);
      
      // Special logging for buildings LLM results
      if (datasetName.includes('buildings')) {
        console.log(`🏗️ LLM BUILDINGS DISPLAY DEBUG:`);
        console.log(`   📊 Dataset: ${datasetName}`);
        console.log(`   🔢 LLM Features: ${featureCollection.features.length}`);
        console.log(`   🎯 Expected for "all buildings": 1398`);
        
        if (featureCollection.features.length < 1398) {
          console.warn(`   ⚠️ LLM returned fewer buildings than expected!`);
          console.warn(`   🔧 This suggests the LLM is filtering/limiting the results`);
          console.log(`   💡 The LLM should return ALL ${featureCollection.total_features || 'available'} buildings for "show all" queries`);
        }
        
        // Log the actual layer added to map
        console.log(`   🗺️ Layer added to map:`, layer.title);
        console.log(`   👁️ Layer visible:`, layer.visible);
        console.log(`   🎨 Renderer:`, layer.renderer ? 'configured' : 'missing');
      }
      
    } catch (error) {
      console.error(`❌ Error displaying LLM ${datasetName}:`, error);
    }
  }

  /**
   * Clear LLM-specific layers
   */
  private clearLLMLayers() {
    for (const [name, layer] of this.loadedLayers) {
      if (name.startsWith('llm_')) {
        this.view.map.remove(layer);
        this.loadedLayers.delete(name);
      }
    }
  }
}

export default AbuDhabiRealDataService;
