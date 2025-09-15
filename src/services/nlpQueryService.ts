import { FeatureLayerService } from './featureLayerService';
import { GeodatabaseService } from './geodatabaseService';
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
  statistics?: {
    totalFeatures: number;
    matchingFeatures: number;
    percentage: string;
    queryType: 'analytical' | 'general';
    layerType: string;
  };
}

export class NLPQueryService {
  private featureLayerService: FeatureLayerService;
  private geodatabaseService: GeodatabaseService;
  private abuDhabiRealDataService: AbuDhabiRealDataService | null = null;
  private view: any = null;
  private lastQueryStatistics: any = null;

  private queryPatterns: QueryPattern[] = [
    // Real Abu Dhabi datasets
    {
      pattern: /\b(bus stops?|bus stations?|public transport|transit|ITC)\b/i,
      entities: ['bus_stops', 'transit'],
      layerMapping: {
        'bus_stops': 'bus_stops_real',
        'transit': 'bus_stops_real'
      }
    },
    {
      pattern: /\b(mosques?|masjids?|places? of worship|prayer|islamic|religious)\b/i,
      entities: ['mosques', 'religious'],
      layerMapping: {
        'mosques': 'mosques_real',
        'religious': 'mosques_real'
      }
    },
    {
      pattern: /\b(parks?|green spaces?|recreation|gardens?)\b/i,
      entities: ['parks', 'recreation'],
      layerMapping: {
        'parks': 'parks_real',
        'recreation': 'parks_real'
      }
    },
    {
      pattern: /\b(parking|car parks?|garages?|vehicles?)\b/i,
      entities: ['parking'],
      layerMapping: {
        'parking': 'parking_real'
      }
    },
    {
      pattern: /\b(buildings?|structures?|architecture|construction|schools?)\b/i,
      entities: ['buildings', 'schools'],
      layerMapping: {
        'buildings': 'buildings_real',
        'schools': 'buildings_real'
      }
    },
    {
      pattern: /\b(roads?|streets?|highways?|avenues?|boulevards?)\b/i,
      entities: ['roads'],
      layerMapping: {
        'roads': 'roads_real'
      }
    },
    // GDB datasets for education/healthcare (keep for geodatabase queries)
    {
      pattern: /\b(education|educational|gdb.*education)\b/i,
      entities: ['education'],
      layerMapping: {
        'education': 'gdb_education_facilities'
      }
    },
    {
      pattern: /\b(hospital|hospitals|medical|healthcare|health|gdb.*health)\b/i,
      entities: ['medical', 'healthcare'],
      layerMapping: {
        'medical': 'gdb_healthcare_facilities',
        'healthcare': 'gdb_healthcare_facilities'
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
    console.log('🧠 NLPQueryService initialized');
  }

  setMapView(view: any) {
    this.view = view;
    this.featureLayerService.setMapView(view);
    this.geodatabaseService.setMapView(view);
    console.log('🗺️ Map view set for NLPQueryService and its internal services');
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

    // Default to buildings if no match found (buildings include schools)
    console.log('🎯 No pattern matched, defaulting to buildings_real');
    return 'buildings_real';
  }

  private buildQueryString(query: string): string {
    const queryLower = query.toLowerCase();
    
    // Handle analytical queries for building levels
    if (queryLower.includes('levels') || queryLower.includes('floors') || queryLower.includes('stories')) {
      console.log(`📊 Analytical building query detected: ${query}`);
      return query; // Pass the full query to be processed by parseAnalyticalQuery
    }
    
    // For Abu Dhabi datasets, skip location filtering since they're already geographically filtered
    if (queryLower.includes('abu dhabi') || queryLower.includes('abu') || 
        queryLower.includes('city center') || queryLower.includes('city centre') ||
        queryLower.includes('downtown') || queryLower.includes('center') ||
        (queryLower.includes('near') && !queryLower.includes('specific location'))) {
      console.log(`🏙️ Abu Dhabi/general location query detected, skipping location filter (data already geographically filtered)`);
      return '1=1'; // Return all features since they're already in Abu Dhabi
    }
    
    // Look for other location-based filters
    const locationPatterns = [
      { pattern: /\bin\s+([a-z\s]+?)(?:\s|$)/i, field: 'name' },
      { pattern: /\bnear\s+([a-z\s]+?)(?:\s|$)/i, field: 'name' },
      { pattern: /\baround\s+([a-z\s]+?)(?:\s|$)/i, field: 'name' }
    ];

    for (const locPattern of locationPatterns) {
      const match = query.match(locPattern.pattern);
      if (match) {
        const location = match[1].trim();
        // Skip if location is Abu Dhabi related
        if (location.toLowerCase().includes('abu') || location.toLowerCase().includes('dhabi')) {
          console.log(`🏙️ Abu Dhabi location detected, skipping filter`);
          return '1=1';
        }
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
          id: 'buildings_real',
          title: 'Abu Dhabi Buildings (includes schools)',
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
    console.log(`🔧 Service status: abuDhabiRealDataService=${!!this.abuDhabiRealDataService}`);

    try {
      const { layerId, queryString } = this.analyzeQuery(query);
      let features: any[] = [];

      // Try to query from different services based on layer ID
      if (layerId.startsWith('gdb_')) {
        // Query from geodatabase service - clear graphics first for isolation
        this.featureLayerService.clearGraphics();
        if (this.abuDhabiRealDataService) {
          this.abuDhabiRealDataService.hideAllDatasets();
        }
        features = await this.geodatabaseService.queryLayer(layerId, queryString);
      } else if (layerId.endsWith('_real')) {
        // Query from real Abu Dhabi dataset service
        console.log(`🏙️ Querying real dataset: ${layerId}`);
        
        // Create service instance if not set
        if (!this.abuDhabiRealDataService) {
          console.log('🔧 Creating new AbuDhabiRealDataService instance...');
          console.log('🗺️ NLP Service view status:', !!this.view);
          
          this.abuDhabiRealDataService = new AbuDhabiRealDataService();
          if (this.view) {
            console.log('✅ Setting view on AbuDhabiRealDataService...');
            this.abuDhabiRealDataService.setView(this.view);
            console.log('✅ AbuDhabiRealDataService ready for on-demand loading');
          } else {
            console.error('❌ No map view available in NLP Service - this.view is:', this.view);
          }
        }
        
        // Hide all other datasets and clear any existing graphics
        this.abuDhabiRealDataService.hideAllDatasets();
        this.featureLayerService.clearGraphics();
        
        // For buildings, always clear graphics to remove yellow circles
        if (layerId === 'buildings_real') {
          console.log(`🏗️ Clearing graphics for building query to remove any yellow circle markers`);
          this.featureLayerService.clearGraphics();
          
          // Reset building colors for non-analytical queries
          if (!queryString.includes('levels')) {
            this.abuDhabiRealDataService.resetBuildingColors();
          }
        }
        
        await this.abuDhabiRealDataService.loadSpecificDataset(layerId);
        
        const queryResult = await this.abuDhabiRealDataService.queryLayer(layerId, { where: queryString }, userMessage);
        features = queryResult ? queryResult.features : [];
        
        // Store statistics from the query result
        if (queryResult && queryResult.statistics) {
          console.log(`📊 Retrieved statistics from query:`, queryResult.statistics);
          this.lastQueryStatistics = queryResult.statistics;
        }
      } else {
        // No service available for this layer type
        console.warn(`❌ No service available for layer: ${layerId}`);
        features = [];
      }

      // Fallback mechanism disabled to prevent mixing datasets
      if (features.length === 0) {
        console.log('🔄 No features found for specific query - fallback disabled to maintain dataset isolation');
      }

      // Highlight features on map (skip for buildings - they use renderer-based highlighting)
      if (features.length > 0 && layerId !== 'buildings_real') {
        await this.featureLayerService.highlightFeatures(features);
      } else if (layerId === 'buildings_real') {
        console.log(`🏗️ Skipping graphics highlighting for buildings - using renderer-based highlighting instead`);
      }

      const result: QueryResult = {
        features,
        layerId,
        query: queryString,
        totalCount: features.length,
        statistics: this.lastQueryStatistics
      };
      
      // Log the statistics for debugging
      if (this.lastQueryStatistics) {
        console.log(`📊 Including statistics in result:`, this.lastQueryStatistics);
      } else {
        console.warn(`⚠️ No statistics available for this query`);
      }

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
