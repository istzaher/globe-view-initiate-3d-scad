/**
 * Enhanced Query Service
 * 
 * Implements the fastest patterns from the ArcGIS + AI document.
 * Uses the new tool-based backend system for improved natural language processing.
 */

import { pythonApiService } from './pythonApiService';

export interface EnhancedQueryResult {
  text: string;
  geojson?: any;
  center?: {
    type: string;
    coordinates: [number, number];
  };
  statistics?: {
    total_count: number;
    search_radius_km?: number;
    center_coordinates?: [number, number];
    infrastructure_type?: string;
    where_clause?: string;
    [key: string]: any;
  };
  metadata?: {
    operation: string;
    [key: string]: any;
  };
  success: boolean;
  processing_time?: number;
  error?: string;
}

export class EnhancedQueryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  /**
   * Process a natural language query using the enhanced tool-based system
   */
  async processEnhancedQuery(query: string): Promise<EnhancedQueryResult> {
    console.log(`🚀 Enhanced Query Service: Processing "${query}"`);
    
    try {
      const startTime = performance.now();
      
      // Call the enhanced backend endpoint
      const response = await fetch(`${this.baseUrl}/api/parse-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const processingTime = performance.now() - startTime;

      console.log(`✅ Enhanced query processed in ${processingTime.toFixed(2)}ms`);
      console.log('📊 Result summary:', {
        hasText: !!result.text,
        hasGeoJSON: !!result.geojson,
        hasCenter: !!result.center,
        hasStatistics: !!result.statistics,
        featureCount: result.geojson?.features?.length || 0
      });

      return {
        ...result,
        processing_time: processingTime
      };

    } catch (error) {
      console.error('❌ Enhanced query service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        text: `Query processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        geojson: null
      };
    }
  }

  /**
   * Process query with fallback to original system for Abu Dhabi datasets
   */
  async processQueryWithFallback(query: string): Promise<EnhancedQueryResult> {
    console.log(`🔄 Processing query with Abu Dhabi dataset fallback: "${query}"`);
    
    // Try enhanced system first
    const enhancedResult = await this.processEnhancedQuery(query);
    
    // Check if this requires frontend handling (Abu Dhabi datasets)
    if (enhancedResult.success && enhancedResult.metadata?.requires_frontend) {
      console.log('🏙️ Query requires frontend Abu Dhabi dataset handling, using existing NLP service');
      
      // Signal that this should be handled by the existing NLP service
      return {
        success: true,
        text: enhancedResult.text,
        geojson: null,
        metadata: {
          ...enhancedResult.metadata,
          use_existing_nlp_service: true,
          original_query: query
        }
      };
    }
    
    if (enhancedResult.success && enhancedResult.geojson?.features?.length > 0) {
      console.log('✅ Enhanced system returned results');
      return enhancedResult;
    }
    
    // Final fallback for any other queries
    console.log('🔄 Using general fallback...');
    return {
      success: true,
      text: "I'll search for that using the existing Abu Dhabi dataset system.",
      geojson: null,
      metadata: {
        operation: 'fallback_to_abu_dhabi_datasets',
        original_query: query,
        use_existing_nlp_service: true
      }
    };
  }

  /**
   * Test the enhanced query system with sample queries
   */
  async testEnhancedSystem(): Promise<void> {
    console.log('🧪 Testing Enhanced Query System...');
    
    const testQueries = [
      "Find EV charging stations near Sacramento",
      "Show electrical meters within 2 km of La Mesa",
      "List all service panels in ZIP code 91942",
      "Find gas meters on University Avenue",
      "Show acorn lights installed after 2020"
    ];

    for (const query of testQueries) {
      console.log(`\n🧪 Testing: "${query}"`);
      const result = await this.processEnhancedQuery(query);
      console.log(`   Result: ${result.success ? '✅' : '❌'} ${result.text}`);
      if (result.statistics) {
        console.log(`   Features: ${result.statistics.total_count || 0}`);
      }
    }
  }

  /**
   * Get query suggestions based on available infrastructure types
   */
  getQuerySuggestions(): string[] {
    return [
      "Find EV charging stations near Sacramento",
      "Show electrical meters within 3 km of La Mesa",
      "List all service panels in La Mesa",
      "Find gas meters on University Avenue", 
      "Show acorn lights with outlets at the top",
      "Find tree wells with outlets near Spring Valley",
      "Show service cabinets installed after 2021",
      "List electrical infrastructure in ZIP code 91942",
      "Find EV stations within 5 miles of Folsom",
      "Show all charging stations in Citrus Heights"
    ];
  }

  /**
   * Parse GeoJSON and add to map view
   */
  async addGeoJSONToMap(geojson: any, mapView: any): Promise<void> {
    if (!geojson || !mapView) {
      console.warn('⚠️ Cannot add to map: missing geojson or mapView');
      return;
    }

    try {
      // Use ArcGIS JS API to add GeoJSON to map
      const [GeoJSONLayer] = await Promise.all([
        // @ts-expect-error - ArcGIS API dynamic loading
        new Promise(resolve => require(['esri/layers/GeoJSONLayer'], resolve))
      ]);

      // Create a blob URL for the GeoJSON
      const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
      const geoJsonUrl = URL.createObjectURL(blob);

      const layer = new GeoJSONLayer({
        url: geoJsonUrl,
        title: 'Query Results',
        popupTemplate: {
          title: 'Infrastructure Feature',
          content: '{*}' // Show all attributes
        }
      });

      await mapView.map.add(layer);
      console.log('✅ Added GeoJSON layer to map');

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(geoJsonUrl), 1000);

    } catch (error) {
      console.error('❌ Error adding GeoJSON to map:', error);
    }
  }

  /**
   * Center map on query results
   */
  async centerMapOnResults(result: EnhancedQueryResult, mapView: any): Promise<void> {
    if (!mapView) {
      console.warn('⚠️ Cannot center map: missing mapView');
      return;
    }

    try {
      if (result.center) {
        // Center on specific point
        const [longitude, latitude] = result.center.coordinates;
        await mapView.goTo({
          center: [longitude, latitude],
          zoom: 12
        });
        console.log(`🎯 Centered map on [${longitude}, ${latitude}]`);
        
      } else if (result.geojson?.features?.length > 0) {
        // Zoom to features extent
        const [Extent, Graphic] = await Promise.all([
          // @ts-expect-error - ArcGIS API dynamic loading
          new Promise(resolve => require(['esri/geometry/Extent'], resolve)),
          // @ts-expect-error - ArcGIS API dynamic loading
          new Promise(resolve => require(['esri/Graphic'], resolve))
        ]);

        const graphics = result.geojson.features.map((feature: any) => new Graphic({
          geometry: feature.geometry,
          attributes: feature.properties
        }));

        if (graphics.length > 0) {
          const extent = graphics.reduce((acc: any, graphic: any) => {
            return acc ? acc.union(graphic.geometry.extent) : graphic.geometry.extent;
          }, null);

          if (extent) {
            await mapView.goTo(extent.expand(1.2));
            console.log('🎯 Zoomed to features extent');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error centering map:', error);
    }
  }
}

// Export singleton instance
export const enhancedQueryService = new EnhancedQueryService();
