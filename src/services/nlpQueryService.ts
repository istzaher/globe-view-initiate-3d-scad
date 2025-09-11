import { FeatureLayerService } from './featureLayerService';
import { GeodatabaseService } from './geodatabaseService';
import { DemoLayerService } from './demoLayerService';
import { AbuDhabiRealDataService } from './abuDhabiRealDataService';

interface QueryPattern {
  pattern: RegExp;
  entities: string[];
  layerMapping: { [key: string]: string };
}

interface QueryResult {
  features: any[];
  layerId: string;
  query: string;
  totalCount: number;
}

export class NLPQueryService {
  private featureLayerService: FeatureLayerService;
  private geodatabaseService: GeodatabaseService;
  private demoLayerService: DemoLayerService;
  private abuDhabiRealDataService: AbuDhabiRealDataService | null = null;
  private view: any = null;

  private queryPatterns: QueryPattern[] = [
    // Real Abu Dhabi datasets
    {
      pattern: /\b(bus stop|bus station|public transport|transit|ITC)\b/i,
      entities: ['bus_stops', 'transit'],
      layerMapping: {
        'bus_stops': 'bus_stops_real',
        'transit': 'bus_stops_real'
      }
    },
    {
      pattern: /\b(mosque|masjid|place of worship|prayer|islamic|religious)\b/i,
      entities: ['mosques', 'religious'],
      layerMapping: {
        'mosques': 'mosques_real',
        'religious': 'mosques_real'
      }
    },
    {
      pattern: /\b(park|parks|green space|recreation|garden)\b/i,
      entities: ['parks', 'recreation'],
      layerMapping: {
        'parks': 'parks_real',
        'recreation': 'parks_real'
      }
    },
    {
      pattern: /\b(parking|car park|garage|vehicle)\b/i,
      entities: ['parking'],
      layerMapping: {
        'parking': 'parking_real'
      }
    },
    {
      pattern: /\b(building|structure|architecture|construction)\b/i,
      entities: ['buildings'],
      layerMapping: {
        'buildings': 'buildings_real'
      }
    },
    {
      pattern: /\b(road|street|highway|avenue|boulevard)\b/i,
      entities: ['roads'],
      layerMapping: {
        'roads': 'roads_real'
      }
    },
    // Mock datasets
    {
      pattern: /\b(schools?|education|educational)\b/i,
      entities: ['schools', 'education'],
      layerMapping: {
        'schools': 'abu_dhabi_schools',
        'education': 'gdb_education_facilities'
      }
    },
    {
      pattern: /\b(hospital|hospitals|medical|healthcare|health)\b/i,
      entities: ['hospitals', 'medical', 'healthcare'],
      layerMapping: {
        'hospitals': 'abu_dhabi_hospitals',
        'medical': 'gdb_healthcare_facilities',
        'healthcare': 'gdb_healthcare_facilities'
      }
    },
    {
      pattern: /\b(universit|college|higher education)\b/i,
      entities: ['universities'],
      layerMapping: {
        'universities': 'abu_dhabi_universities'
      }
    },
    {
      pattern: /\b(police|law enforcement|security)\b/i,
      entities: ['police'],
      layerMapping: {
        'police': 'abu_dhabi_police_stations'
      }
    },
    {
      pattern: /\b(infrastructure|public works|utilities)\b/i,
      entities: ['infrastructure', 'utilities'],
      layerMapping: {
        'infrastructure': 'gdb_infrastructure',
        'utilities': 'gdb_utilities'
      }
    },
    {
      pattern: /\b(transportation|transport|roads|metro)\b/i,
      entities: ['transportation'],
      layerMapping: {
        'transportation': 'gdb_transportation'
      }
    },
    {
      pattern: /\b(land use|zoning|zones)\b/i,
      entities: ['land_use'],
      layerMapping: {
        'land_use': 'gdb_land_use'
      }
    },
    {
      pattern: /\b(boundaries|administrative|districts)\b/i,
      entities: ['boundaries'],
      layerMapping: {
        'boundaries': 'gdb_boundaries'
      }
    },
    {
      pattern: /\b(environmental|parks|green|nature)\b/i,
      entities: ['environmental'],
      layerMapping: {
        'environmental': 'gdb_environmental'
      }
    }
  ];

  constructor() {
    this.featureLayerService = new FeatureLayerService();
    this.geodatabaseService = new GeodatabaseService();
    this.demoLayerService = new DemoLayerService();
    console.log('🧠 NLPQueryService initialized');
  }

  setMapView(view: any) {
    this.view = view;
    console.log('🗺️ Map view set for NLPQueryService');
  }

  setAbuDhabiRealDataService(service: AbuDhabiRealDataService) {
    this.abuDhabiRealDataService = service;
    console.log('🏙️ AbuDhabiRealDataService set for NLPQueryService');
  }

  private analyzeQuery(query: string): { layerId: string; queryString: string } {
    console.log(`🔍 Analyzing query: "${query}"`);

    // Determine which layer to query
    const layerId = this.determineLayer(query);
    
    // Extract location/filter information
    const queryString = this.buildQueryString(query);

    console.log(`📋 Query analysis result: Layer=${layerId}, Query=${queryString}`);
    return { layerId, queryString };
  }

  private determineLayer(query: string): string {
    const queryLower = query.toLowerCase();
    
    for (const pattern of this.queryPatterns) {
      if (pattern.pattern.test(queryLower)) {
        console.log(`🎯 Pattern matched: ${pattern.pattern}`);
        
        // Return the first available mapping since the pattern already matched
        const firstEntity = pattern.entities[0];
        if (pattern.layerMapping[firstEntity]) {
          console.log(`🎯 Pattern match -> layer "${pattern.layerMapping[firstEntity]}"`);
          return pattern.layerMapping[firstEntity];
        }
      }
    }

    // Default to schools if no match found
    console.log('🎯 No pattern matched, defaulting to abu_dhabi_schools');
    return 'abu_dhabi_schools';
  }

  private buildQueryString(query: string): string {
    const queryLower = query.toLowerCase();
    
    // Look for location-based filters
    const locationPatterns = [
      { pattern: /\bin\s+([a-z\s]+?)(?:\s|$)/i, field: 'District' },
      { pattern: /\bnear\s+([a-z\s]+?)(?:\s|$)/i, field: 'District' },
      { pattern: /\baround\s+([a-z\s]+?)(?:\s|$)/i, field: 'District' }
    ];

    for (const locPattern of locationPatterns) {
      const match = query.match(locPattern.pattern);
      if (match) {
        const location = match[1].trim();
        console.log(`📍 Found location filter: ${location}`);
        return `${locPattern.field} LIKE '%${location}%'`;
      }
    }

    // Look for type-based filters
    const typePatterns = [
      /\bprimary\b/i,
      /\bsecondary\b/i,
      /\bpublic\b/i,
      /\bprivate\b/i,
      /\bgeneral\b/i,
      /\bspecialized\b/i
    ];

    for (const typePattern of typePatterns) {
      if (typePattern.test(query)) {
        const type = query.match(typePattern)?.[0];
        if (type) {
          console.log(`🏷️ Found type filter: ${type}`);
          return `Type LIKE '%${type}%'`;
        }
      }
    }

    // Default query - return all features
    return '1=1';
  }

  async loadDefaultLayers(): Promise<void> {
    console.log('📚 Loading default feature layers...');
    
    try {
      // Load feature layers from configuration
      const FEATURE_LAYERS = [
        {
          id: 'gdb_education_facilities',
          title: 'Education Facilities (GDB)',
          url: '',
          visible: false
        },
        {
          id: 'abu_dhabi_schools',
          title: 'Abu Dhabi Schools',
          url: '',
          visible: false
        }
      ];

      // Load feature layers (skip those with empty URLs)
      for (const layer of FEATURE_LAYERS.filter(l => l.visible)) {
        try {
          const result = await this.featureLayerService.addFeatureLayer(layer);
          if (result === null) {
            console.log(`⏭️ Skipped layer: ${layer.title}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not load layer ${layer.title}:`, error);
        }
      }

      console.log('✅ Default layers loaded');
    } catch (error) {
      console.error('❌ Error loading default layers:', error);
    }
  }

  async processQuery(query: string): Promise<QueryResult> {
    console.log(`🚀 Processing query: "${query}"`);

    try {
      const { layerId, queryString } = this.analyzeQuery(query);
      let features: any[] = [];

      // Try to query from different services based on layer ID
      if (layerId.startsWith('gdb_')) {
        // Query from geodatabase service
        features = await this.geodatabaseService.queryLayer(layerId, queryString);
      } else if (layerId.endsWith('_real') && this.abuDhabiRealDataService) {
        // Query from real Abu Dhabi dataset service
        const queryResult = await this.abuDhabiRealDataService.queryLayer(layerId, { where: queryString });
        features = queryResult ? queryResult.features : [];
      } else {
        // Query from demo layer service
        features = await this.demoLayerService.queryLayer(layerId, queryString);
      }

      // If no features found, try fallback queries
      if (features.length === 0) {
        console.log('🔄 No features found, trying fallback...');
        
        // Try querying all available layers
        const allDemoLayers = this.demoLayerService.getAvailableLayers();
        const allGdbLayers = this.geodatabaseService.getAvailableLayers();
        const allRealLayers = this.abuDhabiRealDataService ? 
          ['bus_stops_real', 'mosques_real', 'parks_real', 'parking_real', 'buildings_real', 'roads_real'] : [];
        
        for (const fallbackLayerId of [...allRealLayers, ...allDemoLayers, ...allGdbLayers]) {
          if (fallbackLayerId.startsWith('gdb_')) {
            features = await this.geodatabaseService.queryLayer(fallbackLayerId, '1=1');
          } else if (fallbackLayerId.endsWith('_real') && this.abuDhabiRealDataService) {
            const queryResult = await this.abuDhabiRealDataService.queryLayer(fallbackLayerId, { where: '1=1' });
            features = queryResult ? queryResult.features : [];
          } else {
            features = await this.demoLayerService.queryLayer(fallbackLayerId, '1=1');
          }
          
          if (features.length > 0) {
            console.log(`✅ Found ${features.length} features in fallback layer: ${fallbackLayerId}`);
            break;
          }
        }
      }

      // Highlight features on map
      if (features.length > 0) {
        await this.featureLayerService.highlightFeatures(features);
      }

      const result: QueryResult = {
        features,
        layerId,
        query: queryString,
        totalCount: features.length
      };

      console.log(`✅ Query completed: ${features.length} features found`);
      return result;

    } catch (error) {
      console.error('❌ Error processing query:', error);
      return {
        features: [],
        layerId: '',
        query: '',
        totalCount: 0
      };
    }
  }

  async executeQuery(query: string): Promise<any> {
    try {
      const result = await this.processQuery(query);
      
      return {
        success: true,
        data: result.features,
        count: result.totalCount,
        layer: result.layerId,
        query: result.query
      };
    } catch (error) {
      console.error('❌ Error executing query:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        count: 0
      };
    }
  }

  clearResults(): void {
    this.featureLayerService.clearGraphics();
    console.log('🧹 Cleared query results');
  }

  getAvailableLayers(): string[] {
    const demoLayers = this.demoLayerService.getAvailableLayers();
    const gdbLayers = this.geodatabaseService.getAvailableLayers();
    return [...demoLayers, ...gdbLayers];
  }
}

export default NLPQueryService;
