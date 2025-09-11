import { useState } from 'react';
import { pythonApiService } from '../services/pythonApiService';
import { RendererService } from '../services/rendererService';
import { spacyConfigService } from '../services/spacyConfigService';

// ESRI JavaScript API Type Definitions
interface ESRIPoint {
  x: number;
  y: number;
  spatialReference: { wkid: number };
}

interface ESRIGraphic {
  geometry: ESRIPoint;
  attributes: Record<string, unknown>;
  symbol: unknown;
  popupTemplate: unknown;
}

interface ESRIView {
  spatialReference: { wkid: number };
  goTo: (target: unknown) => Promise<void>;
}

interface ESRIGraphicsLayer {
  type: string;
  graphics: { length: number; items: ESRIGraphic[] };
  removeAll: () => void;
  add: (graphic: ESRIGraphic) => void;
}

interface ESRIModules {
  Point: new (properties: { x: number; y: number; spatialReference: { wkid: number } }) => ESRIPoint;
  Graphic: new (properties: {
    geometry: ESRIPoint;
    attributes: Record<string, unknown>;
    symbol: unknown;
    popupTemplate: unknown;
  }) => ESRIGraphic;
  projection: {
    load: () => Promise<void>;
    project: (point: ESRIPoint, targetSR: { wkid: number }) => ESRIPoint;
  };
}

// Convert WGS84 coordinates to Web Mercator (EPSG:3857)
function wgs84ToWebMercator(lon: number, lat: number): { x: number; y: number } | null {
  try {
    // Web Mercator projection formulas
    const earthRadius = 6378137; // Earth radius in meters
    const x = lon * Math.PI / 180 * earthRadius;
    const y = Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * earthRadius;
    
    return { x, y };
  } catch (error) {
    console.error('Error in WGS84 to Web Mercator conversion:', error);
    return null;
  }
}

// Convert Web Mercator coordinates to WGS84 (EPSG:4326)
function webMercatorToWgs84(x: number, y: number): { lat: number; lon: number } | null {
  try {
    // Web Mercator to WGS84 conversion formulas
    const earthRadius = 6378137; // Earth radius in meters
    const lon = (x / earthRadius) * 180 / Math.PI;
    const lat = (2 * Math.atan(Math.exp(y / earthRadius)) - Math.PI / 2) * 180 / Math.PI;
    
    return { lat, lon };
  } catch (error) {
    console.error('Error in Web Mercator to WGS84 conversion:', error);
    return null;
  }
}

// Convert Illinois State Plane East (EPSG:3435) coordinates to WGS84
function illinoisStatePlaneToWgs84(x: number, y: number): { lat: number; lon: number } | null {
  try {
    // Illinois State Plane East (EPSG:3435) parameters
    const falseEasting = 984249.37; // feet
    const falseNorthing = 0; // feet
    const centralMeridian = -88.333333; // degrees
    const latOrigin = 36.66666667; // degrees
    const scaleFactor = 1.000013;
    
    // Convert feet to meters
    const feetToMeters = 0.3048006096012192;
    const xMeters = (x - falseEasting) * feetToMeters;
    const yMeters = (y - falseNorthing) * feetToMeters;
    
    // Simplified conversion (for more accuracy, would need full projection equations)
    // This is an approximation for the Illinois area
    const earthRadius = 6378137; // meters
    const lat = latOrigin + (yMeters / (111320)); // approximate degrees per meter
    const lon = centralMeridian + (xMeters / (111320 * Math.cos(lat * Math.PI / 180)));
    
    console.log(`🗺️ Illinois State Plane conversion: ${x},${y} -> ${lat},${lon}`);
    
    // Validate results are in Illinois area
    if (lat >= 36.0 && lat <= 42.5 && lon >= -91.5 && lon <= -87.0) {
      return { lat, lon };
    } else {
      console.warn(`🗺️ Illinois conversion out of expected bounds: ${lat},${lon}`);
      return null;
    }
  } catch (error) {
    console.error('Error in Illinois State Plane conversion:', error);
    return null;
  }
}

// Convert coordinates using ESRI JavaScript API projection engine
async function convertCoordinatesWithEsri(
  x: number, 
  y: number, 
  fromSpatialReference: number, 
  Point: ESRIModules['Point'], 
  projection: ESRIModules['projection']
): Promise<{ lat: number; lon: number } | null> {
  try {
    console.log(`Converting coordinates using ESRI API: ${x}, ${y} from WKID ${fromSpatialReference} to WGS84`);
    
    // Ensure projection engine is loaded
    await projection.load();
    
    // Create source point
    const sourcePoint = new Point({
      x: x,
      y: y,
      spatialReference: { wkid: fromSpatialReference }
    });

    // Project to WGS84 (WKID 4326)
    const targetPoint = projection.project(sourcePoint, { wkid: 4326 });
    
    if (targetPoint && typeof targetPoint.x === 'number' && typeof targetPoint.y === 'number') {
      const result = { lat: targetPoint.y, lon: targetPoint.x };
      console.log(`ESRI conversion successful: ${x}, ${y} -> ${result.lat}, ${result.lon}`);
      
      // Basic bounds checking for California
      if (result.lat < 32 || result.lat > 42 || result.lon < -125 || result.lon > -114) {
        console.warn(`Converted coordinates out of California bounds: ${result.lat}, ${result.lon}`);
      }
      
      return result;
    } else {
      console.error('ESRI projection returned invalid coordinates');
      return null;
    }
  } catch (error) {
    console.error('Error in ESRI coordinate conversion:', error);
    return null;
  }
}

interface FeatureGeometry {
  // Point geometry
  x?: number;
  y?: number;
  // Polygon geometry
  rings?: number[][][];
  // Polyline geometry
  paths?: number[][][];
}

interface FeatureAttributes {
  [key: string]: unknown;
  OBJECTID?: number;
  Station_Na?: string;
  Station_Name?: string;
  Name?: string;
  STATION_NAME?: string;
  Street_Add?: string;
  Street_Address?: string;
  AddrNo?: string;
  SDGE_Meter?: string;
}

interface QueryFeature {
  geometry: FeatureGeometry;
  attributes: FeatureAttributes;
}

interface QueryResponse {
  features: QueryFeature[];
  queryMetadata: {
    where_clause: string;
    location_lat: number | null;
    location_lon: number | null;
    distance_km: number;
    feature_count: number;
    dataset: string;
    dataset_name: string;
    spatial_reference: number;
  };
}

interface ProcessedResult {
  id: string;
  name: string;
  address: string;
  type: string;
  dataset: string;
  attributes: FeatureAttributes;
  latitude: number;
  longitude: number;
  webMercatorX: number;
  webMercatorY: number;
  geometry?: FeatureGeometry;
}

export const useNLQuery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [currentDataset, setCurrentDataset] = useState<string>('ev_charging');
  const rendererService = new RendererService();

  // Helper function to dynamically load ESRI modules
  const loadEsriModules = async (moduleNames: string[]): Promise<unknown[]> => {
    return new Promise((resolve, reject) => {
      (require as unknown as (modules: string[], success: (...modules: unknown[]) => void, error: (error: Error) => void) => void)(
        moduleNames, 
        (...modules: unknown[]) => {
          resolve(modules);
        }, 
        (error: Error) => {
          reject(error);
        }
      );
    });
  };

  // Helper function to add graphics to map
  const addGraphicsToMap = async (
    processedResults: ProcessedResult[],
    view: any,
    graphicsLayer: any,
    Point: any,
    Graphic: any,
    dataset: string
  ) => {
    let addedCount = 0;
    let polylineGraphicsCount = 0;
    let pointGraphicsCount = 0;
    
    // Progressive rendering settings for large datasets
    const BATCH_SIZE = 50; // Add graphics in batches of 50
    const BATCH_DELAY = 50; // 50ms delay between batches for smoother rendering
    const isLargeDataset = processedResults.length > 200;
    
    // Dynamically load required ArcGIS modules
    const [Polyline, SimpleLineSymbol] = await new Promise<[any, any]>((resolve, reject) => {
      // @ts-expect-error - ArcGIS requires dynamic imports
      require([
        'esri/geometry/Polyline',
        'esri/symbols/SimpleLineSymbol'
      ], (PolylineClass: any, SimpleLineSymbolClass: any) => {
        console.log('🔧 Loaded ArcGIS modules for polylines:', { PolylineClass, SimpleLineSymbolClass });
        resolve([PolylineClass, SimpleLineSymbolClass]);
      }, reject);
    });
    
    console.log(`🗺️ Starting to add ${processedResults.length} graphics for dataset: ${dataset}`);
    if (isLargeDataset) {
      console.log(`📊 Large dataset detected! Using progressive rendering with batches of ${BATCH_SIZE} graphics.`);
    }
    
    // Progressive rendering for large datasets
    const processInBatches = async () => {
      for (let i = 0; i < processedResults.length; i += BATCH_SIZE) {
        const batch = processedResults.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(processedResults.length / BATCH_SIZE);
        
        if (isLargeDataset) {
          console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} features)`);
        }
        
        // Process current batch
        for (const result of batch) {
          await processFeature(result);
        }
        
        // Add delay between batches for large datasets to prevent UI freezing
        if (isLargeDataset && i + BATCH_SIZE < processedResults.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }
    };
    
    // Helper function to process individual features
    const processFeature = async (result: ProcessedResult) => {
      // Handle polyline features (water lines, structure lines)
      if (result.geometry && 'paths' in result.geometry && result.geometry.paths) {
        try {
          console.log(`📏 Processing polyline feature for ${dataset}:`, result.geometry.paths.length, 'paths');
          
          // Transform polyline coordinates to Web Mercator
          const transformedPaths = result.geometry.paths.map((path, pathIndex) => {
            console.log(`📏 Processing path ${pathIndex + 1}/${result.geometry.paths.length} with ${path.length} points`);
            
            return path.map((point, pointIndex) => {
              if (Array.isArray(point) && point.length >= 2) {
                const [x, y] = point;
                
                // Simplified coordinate handling - since backend says data is in Web Mercator (3857)
                // and our sample shows coordinates like [-9816341.549616141, 5128058.966030795]
                // these are already in Web Mercator format, so use them directly
                
                let finalX = x;
                let finalY = y;
                
                // Only transform if coordinates look like they need it
                if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
                  // These look like lat/lon, convert to Web Mercator
                  const webMercator = wgs84ToWebMercator(x, y);
                  if (webMercator) {
                    finalX = webMercator.x;
                    finalY = webMercator.y;
                  }
                } else {
                  // Large values - assume already in Web Mercator
                  finalX = x;
                  finalY = y;
                }
                
                // Log first few points for debugging
                if (pathIndex === 0 && pointIndex < 3) {
                  console.log(`📏 Point ${pointIndex}: [${x}, ${y}] → [${finalX}, ${finalY}]`);
                }
                
                return [finalX, finalY];
              }
              return point;
            });
          });
          
          console.log(`📏 Successfully transformed ${transformedPaths.length} paths`);
          
          // Create the polyline geometry with better error handling
          let polylineGeometry;
          try {
            polylineGeometry = new Polyline({
              paths: transformedPaths,
              spatialReference: { wkid: 3857 }
            });
            console.log(`📏 ✅ Created polyline geometry successfully`);
          } catch (geometryError) {
            console.error(`❌ Failed to create polyline geometry:`, geometryError);
            console.error(`❌ Paths data:`, transformedPaths);
            return; // Skip this feature but continue with others
          }
          
          // Get the symbol for this feature
          const symbol = rendererService.getSymbol(result.attributes, dataset);
          console.log(`📏 Got symbol for polyline:`, symbol);
          

          
          // Create the graphic with better error handling
          let graphic;
          try {
            graphic = new Graphic({
              geometry: polylineGeometry,
              symbol: symbol,
              attributes: {
                ...result.attributes,
                dataset: dataset // Add dataset ID for layer visibility control
              }
            });
            console.log(`📏 ✅ Created graphic successfully`);
          } catch (graphicError) {
            console.error(`❌ Failed to create graphic:`, graphicError);
            return; // Skip this feature but continue with others
          }
          
          // Add to map with error handling
          try {
            graphicsLayer.add(graphic);
            addedCount++;
            polylineGraphicsCount++;
            console.log(`📏 ✅ Added polyline graphic ${polylineGraphicsCount} to map`);
          } catch (addError) {
            console.error(`❌ Failed to add graphic to map:`, addError);
          }
          
        } catch (error) {
          console.error(`❌ Error processing polyline feature for ${dataset}:`, error);
        }
      }
      // Handle point features (existing logic)
      else if (result.webMercatorX && result.webMercatorY && !isNaN(result.webMercatorX) && !isNaN(result.webMercatorY)) {
        try {
          console.log(`📍 Processing point feature for ${dataset}:`, {
            id: result.id,
            name: result.name,
            coordinates: { x: result.webMercatorX, y: result.webMercatorY },
            wgs84: { lat: result.latitude, lon: result.longitude }
          });
          
          const point = new Point({
            x: result.webMercatorX,
            y: result.webMercatorY,
            spatialReference: { wkid: 3857 }
          });
          
          console.log(`📍 Created point geometry:`, point);
          
          const symbol = rendererService.getSymbol(result.attributes, dataset);
          const popupTemplate = rendererService.getPopupTemplate(dataset);
          
          console.log(`📍 Got symbol from renderer service:`, symbol);
          
          // Use the symbol from renderer service (keeps your original icons)
          let finalSymbol = symbol;
          
          // Only use simple marker as fallback if renderer service doesn't provide a symbol
          if (!symbol) {
            finalSymbol = {
              type: "simple-marker",
              color: "#FF0000", // Red fallback only when no symbol exists
              size: 8,
              outline: { color: "#000000", width: 1 },
              style: "circle"
            };
            console.log('⚠️ No symbol from renderer service, using red fallback');
          } else {
            console.log(`✅ Using symbol from renderer service:`, symbol);
          }
          
          const graphic = new Graphic({
            geometry: point,
            attributes: {
              ...result.attributes,
              dataset: dataset // Add dataset ID for layer visibility control
            },
            symbol: finalSymbol,
            popupTemplate: popupTemplate
          });
          
          console.log(`📍 Created point graphic:`, graphic);
          
          graphicsLayer.add(graphic);
          addedCount++;
          pointGraphicsCount++;
          
          console.log(`✅ Added point graphic ${pointGraphicsCount} to layer:`, {
            name: result.name,
            coordinates: { x: result.webMercatorX, y: result.webMercatorY },
            wgs84: { lat: result.latitude, lon: result.longitude },
            symbol: finalSymbol,
            layerGraphicsCount: graphicsLayer.graphics?.length || 'unknown'
          });
          
        } catch (graphicError) {
          console.error('❌ Error creating point graphic:', graphicError, result);
        }
      } else {
        console.warn(`❌ Skipping feature with invalid point coordinates:`, {
          id: result.id,
          name: result.name,
          webMercatorX: result.webMercatorX,
          webMercatorY: result.webMercatorY,
          hasGeometry: !!result.geometry
        });
      }
    };
    
    // Execute progressive rendering
    await processInBatches();
    
    console.log(`📊 Added ${addedCount} graphics to map (${processedResults.length} total processed)`);
    console.log(`📊 Graphics Layer State:`, {
      totalGraphics: graphicsLayer.graphics?.length || 'unknown',
      layerType: graphicsLayer.type || 'unknown',
      addedCount: addedCount,
      pointGraphics: pointGraphicsCount,
      polylineGraphics: polylineGraphicsCount
    });
    
    // Try to verify graphics are actually in the layer
    if (graphicsLayer.graphics && graphicsLayer.graphics.length > 0) {
      console.log(`✅ Graphics successfully added to layer. First graphic:`, graphicsLayer.graphics.items?.[0] || graphicsLayer.graphics[0]);
    } else {
      console.warn(`❌ No graphics found in layer after adding ${addedCount} graphics!`);
    }
    
    // Add a test graphic to verify the graphics layer is working
    if (processedResults.length > 0 && addedCount === 0) {
      console.log(`🧪 Adding test graphic to verify graphics layer functionality...`);
      try {
        const testResult = processedResults[0];
        const testPoint = new Point({
          x: testResult.webMercatorX,
          y: testResult.webMercatorY,
          spatialReference: { wkid: 3857 }
        });
        
        const testSymbol = {
          type: "simple-marker",
          color: [255, 0, 0, 0.8], // Bright red
          size: 16,
          outline: {
            color: [255, 255, 255, 1], // White outline
            width: 2
          },
          style: "circle"
        };
        
        const testGraphic = new Graphic({
          geometry: testPoint,
          symbol: testSymbol,
          attributes: { 
            test: true, 
            name: "Test Graphic",
            dataset: dataset // Add dataset ID for layer visibility control
          }
        });
        
        graphicsLayer.add(testGraphic);
        console.log(`🧪 Test graphic added:`, testGraphic);
      } catch (testError) {
        console.error(`❌ Failed to add test graphic:`, testError);
      }
    }
    
    // Debug summary for graphics creation
    if (dataset.includes('water')) {
      console.log(`🗺️ GRAPHICS CREATION SUMMARY for ${dataset}:`);
      console.log(`🗺️ ========================================`);
      console.log(`🗺️ Processed Results: ${processedResults.length}`);
      console.log(`🗺️ Graphics Added to Map: ${addedCount}`);
      console.log(`🗺️ Point Graphics: ${pointGraphicsCount}`);
      console.log(`🗺️ Polyline Graphics: ${polylineGraphicsCount}`);
      console.log(`🗺️ ========================================`);
      console.log(`🗺️ Graphics Success Rate: ${((addedCount / processedResults.length) * 100).toFixed(1)}%`);
      

      
      // Warning if we lost features
      if (addedCount < processedResults.length) {
        console.warn(`⚠️ WARNING: Lost ${processedResults.length - addedCount} features during graphics creation!`);
        console.warn(`⚠️ This means some features were processed but failed to render on the map`);
      }
    } else if (dataset.includes('ev_charging')) {
      console.log(`🔋 EV CHARGING GRAPHICS SUMMARY for ${dataset}:`);
      console.log(`🔋 Processed Results: ${processedResults.length}`);
      console.log(`🔋 Point Graphics Added: ${pointGraphicsCount}`);
      console.log(`🔋 Success Rate: ${((pointGraphicsCount / processedResults.length) * 100).toFixed(1)}%`);
    }
  };

  // Helper function to zoom to results
  const zoomToResults = async (processedResults: ProcessedResult[], view: ESRIView) => {
    if (processedResults.length === 0) return;
    
    try {
      if (processedResults.length === 1) {
        // Single point - zoom to location
        const result = processedResults[0];
        await view.goTo({
          center: [result.longitude, result.latitude],
          zoom: 15
        });
      } else {
        // Multiple points - zoom to extent
        const lons = processedResults.map(r => r.longitude);
        const lats = processedResults.map(r => r.latitude);
        
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        const centerLon = (minLon + maxLon) / 2;
        const centerLat = (minLat + maxLat) / 2;
        
        // Calculate appropriate zoom level based on extent
        const lonDiff = maxLon - minLon;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lonDiff, latDiff);
        
        let zoom = 10;
        if (maxDiff < 0.01) zoom = 16;
        else if (maxDiff < 0.05) zoom = 14;
        else if (maxDiff < 0.1) zoom = 12;
        else if (maxDiff < 0.5) zoom = 10;
        else zoom = 8;
        
        await view.goTo({
          center: [centerLon, centerLat],
          zoom: zoom
        });
      }
    } catch (zoomError) {
      console.warn('Could not zoom to results:', zoomError);
    }
  };

  const executeQuery = async (
    query: string, 
    view: ESRIView, 
    graphicsLayer: ESRIGraphicsLayer, 
    dataset: string = 'ev_charging',
    authToken?: string,
    clearGraphics: boolean = true
  ) => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setCurrentDataset(dataset);
    
    try {
      console.log('Executing NL query:', query, 'for dataset:', dataset);

      // Clear existing graphics only if requested
      if (clearGraphics && graphicsLayer) {
        console.log('🗑️ Clearing existing graphics');
        graphicsLayer.removeAll();
      } else if (clearGraphics) {
        console.log('⚠️ Graphics layer not available for clearing');
      } else {
        console.log('🔄 Keeping existing graphics, adding new layer');
      }

      // Show user that we're processing their query
      console.log('🔍 Processing natural language query...');

      // Call Python API to parse query and get results with better error handling
      let queryResponse: QueryResponse;
      
      try {
        queryResponse = await pythonApiService.parseQuery(query, dataset, authToken);
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Handle specific error types
        if (apiError instanceof Error) {
          if (apiError.message.includes('Cannot connect')) {
            setError('❌ Backend server is not responding. Please make sure the Python server is running on port 8000.');
            return;
          } else if (apiError.message.includes('timed out')) {
            setError('⏱️ Query timed out after 30 seconds. The EV charging dataset may be temporarily slow. Please try a simpler query or try again in a moment.');
            return;
          } else if (apiError.message.includes('HTTP 500')) {
            setError('🔧 Server error occurred while processing your query. This might be due to an invalid WHERE clause or dataset issue. Please try rephrasing your query.');
            return;
          } else if (apiError.message.includes('HTTP 400')) {
            setError('❓ Invalid query format. Please try rephrasing your query. Example: "Show EV charging stations near Sacramento"');
            return;
          }
        }
        
        setError(`❌ Query failed: ${apiError.message}`);
        return;
      }

      console.log('Query response received:', queryResponse);
      console.log('🔍 DEBUG: Features array length:', queryResponse.features?.length);
      console.log('🔍 DEBUG: First few features:', queryResponse.features?.slice(0, 2));
      console.log('🔍 DEBUG: Spatial reference:', queryResponse.queryMetadata?.spatial_reference);

      // Validate response structure
      if (!queryResponse.features || !Array.isArray(queryResponse.features)) {
        setError('❌ Invalid response from server. Please try again.');
        return;
      }

      // Check if we got any results
      if (queryResponse.features.length === 0) {
        const metadata = queryResponse.queryMetadata;
        const whereClause = metadata?.where_clause || 'Unknown';
        
        // Provide helpful feedback for zero results
        if (dataset.startsWith('ev_charging')) {
          if (whereClause.includes('Fuel_Type_')) {
            setError('⚡ No EV charging stations found matching your criteria. Try expanding your search area or using terms like "public charging stations" or "Tesla stations".');
          } else {
            setError('⚡ No EV charging stations found. The query might not have been understood correctly. Try: "Show EV charging stations" or "Find Tesla chargers near [location]".');
          }
        } else {
          setError(`📍 No results found for your query. WHERE clause used: ${whereClause}`);
        }
        return;
      }

      console.log(`Found ${queryResponse.features.length} features`);

      // Load ESRI modules dynamically for coordinate conversion
      const loadedModules = await loadEsriModules([
        'esri/geometry/Point',
        'esri/Graphic',
        'esri/geometry/projection'
      ]);
      
      const [Point, Graphic, projection] = loadedModules as [
        ESRIModules['Point'],
        ESRIModules['Graphic'], 
        ESRIModules['projection']
      ];

      // Process features and convert coordinates
      const processedResults: ProcessedResult[] = [];
      
      // Debug counters for water lines
      let pointFeatures = 0;
      let polylineFeatures = 0;
      let polygonFeatures = 0;
      let skippedFeatures = 0;
      
      // Show progress for large datasets
      if (queryResponse.features.length > 100) {
        console.log(`Processing ${queryResponse.features.length} features...`);
      }
      
      for (const [index, feature] of queryResponse.features.entries()) {
        try {
          console.log('🔍 DEBUG: Processing feature:', { geometry: feature.geometry, attributes: Object.keys(feature.attributes || {}) });
          
          // Validate feature structure and extract coordinates based on geometry type
          let x: number, y: number;
          let preservedGeometry: FeatureGeometry | undefined;
          
          if (!feature.geometry) {
            console.warn('❌ Skipping feature with no geometry:', feature);
            skippedFeatures++;
            continue;
          }
          
          // Handle Point geometry
          if (typeof feature.geometry.x === 'number' && typeof feature.geometry.y === 'number') {
            x = feature.geometry.x;
            y = feature.geometry.y;
            preservedGeometry = { x, y };
            pointFeatures++;
            console.log('📍 Processing Point geometry:', { x, y });
          }
          // Handle Polygon geometry - use centroid of first ring
          else if (feature.geometry.rings && Array.isArray(feature.geometry.rings) && feature.geometry.rings.length > 0) {
            const firstRing = feature.geometry.rings[0];
            if (Array.isArray(firstRing) && firstRing.length > 0) {
              // Calculate centroid of polygon
              let sumX = 0, sumY = 0;
              for (const point of firstRing) {
                if (Array.isArray(point) && point.length >= 2) {
                  sumX += point[0];
                  sumY += point[1];
                }
              }
              x = sumX / firstRing.length;
              y = sumY / firstRing.length;
              preservedGeometry = { rings: feature.geometry.rings };
              polygonFeatures++;
              console.log('🔷 Processing Polygon geometry - using centroid:', { x, y, ringPoints: firstRing.length });
            } else {
              console.warn('❌ Skipping polygon with invalid ring structure:', feature.geometry);
              skippedFeatures++;
              continue;
            }
          }
          // Handle Polyline geometry - preserve full geometry but use midpoint for lat/lon
          else if (feature.geometry.paths && Array.isArray(feature.geometry.paths) && feature.geometry.paths.length > 0) {
            console.log(`📏 Processing polyline with ${feature.geometry.paths.length} paths`);
            
            // Find the first valid path with points
            let validPath = null;
            let pathIndex = -1;
            
            for (let i = 0; i < feature.geometry.paths.length; i++) {
              const path = feature.geometry.paths[i];
              if (Array.isArray(path) && path.length > 0) {
                validPath = path;
                pathIndex = i;
                break;
              }
            }
            
            if (validPath && validPath.length > 0) {
              // Use midpoint of the first valid path for coordinate reference
              const midIndex = Math.floor(validPath.length / 2);
              let midPoint = validPath[midIndex];
              
              // If midpoint is invalid, try first point, then last point
              if (!Array.isArray(midPoint) || midPoint.length < 2) {
                midPoint = validPath[0];
                if (!Array.isArray(midPoint) || midPoint.length < 2) {
                  midPoint = validPath[validPath.length - 1];
                }
              }
              
              if (Array.isArray(midPoint) && midPoint.length >= 2) {
                x = midPoint[0];
                y = midPoint[1];
                preservedGeometry = { paths: feature.geometry.paths }; // Preserve ALL paths
                polylineFeatures++;
                
                console.log(`📏 ✅ Polyline processed: path ${pathIndex + 1}/${feature.geometry.paths.length}, midpoint [${x}, ${y}], total points: ${validPath.length}`);
                
                // Log detailed info for first few polylines
                if (polylineFeatures <= 3) {
                  console.log(`📏 Detailed polyline ${polylineFeatures}:`, {
                    totalPaths: feature.geometry.paths.length,
                    pathLengths: feature.geometry.paths.map(p => Array.isArray(p) ? p.length : 0),
                    midPoint: [x, y],
                    ASSETGROUP: feature.attributes.ASSETGROUP
                  });
                }
              } else {
                console.warn(`❌ Polyline has no valid points in any path:`, feature.geometry.paths);
                skippedFeatures++;
                continue;
              }
            } else {
              console.warn(`❌ Polyline has no valid paths:`, feature.geometry.paths);
              skippedFeatures++;
              continue;
            }
          }
          else {
            console.warn('❌ Skipping feature with unsupported geometry type:', feature.geometry);
            skippedFeatures++;
            continue;
          }
          const sourceSR = queryResponse.queryMetadata.spatial_reference || 3857;
          const outputSR = queryResponse.queryMetadata.output_spatial_reference || 3857;

          console.log(`🔍 Processing feature with coordinates: x=${x}, y=${y}`);
          console.log(`🔍 Spatial Reference - Source: ${sourceSR}, Output: ${outputSR}`);
          console.log(`🔍 Feature attributes:`, feature.attributes);
          
          // Analyze coordinates and spatial reference info
          const looksLikeProjected = Math.abs(x) > 200000 && Math.abs(x) < 10000000 && Math.abs(y) > 200000 && Math.abs(y) < 10000000;
          const looksLikeWebMercator = Math.abs(x) > 1000000 || Math.abs(y) > 1000000; // Web Mercator has large values
          const looksLikeLatLon = Math.abs(x) <= 180 && Math.abs(y) <= 90;
          const isIllinoisStatePlane = sourceSR === 3435 || sourceSR === 102671;
          
          console.log(`🔍 Coordinate analysis: projected=${looksLikeProjected}, webMercator=${looksLikeWebMercator}, latLon=${looksLikeLatLon}, illinoisSP=${isIllinoisStatePlane}`);

          // Convert coordinates with multiple fallback methods
          let latitude: number | null = null;
          let longitude: number | null = null;
          let webMercatorX: number | null = null;
          let webMercatorY: number | null = null;

          // Method 1: Use spatial reference information from backend if available
          if (isIllinoisStatePlane) {
            // Illinois State Plane coordinates (EPSG:3435/102671)
            console.log(`🗺️ Using Illinois State Plane conversion for: ${x},${y}`);
            const result = illinoisStatePlaneToWgs84(x, y);
            if (result) {
              latitude = result.lat;
              longitude = result.lon;
              const webMercator = wgs84ToWebMercator(longitude, latitude);
              if (webMercator) {
                webMercatorX = webMercator.x;
                webMercatorY = webMercator.y;
              }
              console.log(`✅ Illinois State Plane conversion: ${x},${y} -> ${latitude},${longitude} -> WebMercator: ${webMercatorX},${webMercatorY}`);
            } else {
              console.error(`❌ Failed Illinois State Plane conversion for: ${x},${y}`);
            }
          } else if (looksLikeLatLon) {
            // Already in lat/lon (WGS84)
            latitude = y;
            longitude = x;
            const webMercator = wgs84ToWebMercator(longitude, latitude);
            if (webMercator) {
              webMercatorX = webMercator.x;
              webMercatorY = webMercator.y;
            }
            console.log(`✅ Direct lat/lon: ${latitude},${longitude} -> WebMercator: ${webMercatorX},${webMercatorY}`);
          } else if (looksLikeWebMercator) {
            // Already in Web Mercator - use as-is
            webMercatorX = x;
            webMercatorY = y;
            const wgs84 = webMercatorToWgs84(x, y);
            if (wgs84) {
              latitude = wgs84.lat;
              longitude = wgs84.lon;
            }
            console.log(`✅ Direct Web Mercator: ${x},${y} -> WGS84: ${latitude},${longitude}`);
            
            // Verify coordinate conversion for sample backend values
            if (Math.abs(x + 9816341.549616141) < 1000 && Math.abs(y - 5128058.966030795) < 1000) {
              console.log(`🔍 COORDINATE VERIFICATION: Sample backend coordinate conversion`);
              console.log(`🔍 Input Web Mercator: ${x}, ${y}`);
              console.log(`🔍 Converted WGS84: ${latitude}, ${longitude}`);
              console.log(`🔍 Expected location: Illinois/Wisconsin area (lat ≈ 42.4°, lon ≈ -88.1°)`);
              console.log(`🔍 Is this in the US? ${latitude && latitude > 30 && latitude < 50 && longitude && longitude > -130 && longitude < -60 ? 'YES' : 'NO'}`);
            }
          } else if (looksLikeProjected) {
            // Projected coordinates - try to determine the projection
            console.log(`🔄 Attempting to convert projected coordinates: ${x},${y}`);
            
            // Based on coordinate ranges, try to determine the projection
            if (x >= 1000000 && x <= 1100000 && y >= 1800000 && y <= 1900000) {
              // Illinois State Plane East (EPSG:3435) - water infrastructure
              console.log(`🗺️ Detected Illinois State Plane coordinates: ${x},${y}`);
              const result = illinoisStatePlaneToWgs84(x, y);
              if (result) {
                latitude = result.lat;
                longitude = result.lon;
                console.log(`✅ Illinois State Plane conversion: ${x},${y} -> ${latitude},${longitude}`);
              } else {
                console.error(`❌ Failed Illinois State Plane conversion for: ${x},${y}`);
              }
            } else if (x >= 6000000 && x <= 7000000 && y >= 2000000 && y <= 3000000) {
              // California State Plane Zone II
              longitude = (x - 6000000) / 368000 - 121;
              latitude = (y - 2000000) / 368000 + 37;
              
              console.log(`🔄 CA State Plane conversion: ${x},${y} -> ${latitude},${longitude}`);
            } else if (x >= 400000 && x <= 700000 && y >= 3800000 && y <= 4300000) {
              // New Mexico State Plane Central
              const nmCentralX = 500000;
              const nmCentralY = 0;
              const centralMeridian = -106.25;
              const standardParallel = 34.25;
              
              longitude = centralMeridian + (x - nmCentralX) / 100000;
              latitude = standardParallel + (y - nmCentralY) / 111000;
              
              console.log(`🔄 NM State Plane conversion: ${x},${y} -> ${latitude},${longitude}`);
            } else {
              // Generic State Plane approximation for unknown projections
              longitude = x / 100000 - 110;
              latitude = y / 111000 + 30;
              
              console.log(`🔄 Generic State Plane conversion: ${x},${y} -> ${latitude},${longitude}`);
            }
            
            // Validate the converted coordinates
            if (latitude && longitude && 
                latitude >= 25 && latitude <= 50 && 
                longitude >= -125 && longitude <= -100) {
              const webMercator = wgs84ToWebMercator(longitude, latitude);
              if (webMercator) {
                webMercatorX = webMercator.x;
                webMercatorY = webMercator.y;
              }
              console.log(`✅ Projected conversion successful: ${latitude},${longitude} -> WebMercator: ${webMercatorX},${webMercatorY}`);
            } else {
              console.log(`❌ Projected conversion failed: lat=${latitude}, lon=${longitude}`);
              latitude = null;
              longitude = null;
            }
          } else {
            // Fallback - assume Web Mercator if we can't determine
            console.log(`🔄 Fallback: assuming Web Mercator for ${x},${y}`);
            webMercatorX = x;
            webMercatorY = y;
            const wgs84 = webMercatorToWgs84(x, y);
            if (wgs84) {
              latitude = wgs84.lat;
              longitude = wgs84.lon;
            }
            console.log(`✅ Fallback Web Mercator: ${x},${y} -> WGS84: ${latitude},${longitude}`);
          }

          // Skip features that couldn't be converted
          if (!latitude || !longitude || !webMercatorX || !webMercatorY) {
            console.warn(`❌ Skipping feature with invalid coordinates: x=${x}, y=${y}, lat=${latitude}, lon=${longitude}, webMercX=${webMercatorX}, webMercY=${webMercatorY}`);
            continue;
          }
          
          // Additional validation for reasonable coordinate ranges
          if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            console.warn(`❌ Skipping feature with out-of-range lat/lon: lat=${latitude}, lon=${longitude}`);
            continue;
          }
          
          console.log(`✅ Valid feature coordinates: lat=${latitude}, lon=${longitude}, webMerc=${webMercatorX},${webMercatorY}`);

          // Geographic validation based on dataset - RELAXED for water datasets
          if (dataset.includes('ev_charging')) {
            // EV charging stations should be in Sacramento area
            if (latitude < 35 || latitude > 42 || longitude < -125 || longitude > -118) {
              console.warn('❌ EV station coordinates outside Sacramento region, skipping:', latitude, longitude);
              continue;
            }
            console.log(`✅ Valid EV charging station (Sacramento): ${latitude}, ${longitude}`);
          } else if (dataset.includes('la_mesa')) {
            // La Mesa datasets should be in San Diego area
            if (latitude < 32 || latitude > 34 || longitude < -118 || longitude > -116) {
              console.warn('❌ La Mesa coordinates outside San Diego region, skipping:', latitude, longitude);
              continue;
            }
            console.log(`✅ Valid La Mesa feature (San Diego): ${latitude}, ${longitude}`);
          } else if (dataset.includes('water')) {
            // Water datasets - support Illinois and other areas
            // Illinois area: roughly 36-43°N, 87-91°W
            // Be more permissive for water infrastructure which can be in various locations
            if (latitude < -85 || latitude > 85 || longitude < -180 || longitude > 180 || 
                (latitude === 0 && longitude === 0)) {
              console.warn('❌ Water feature coordinates invalid or null island, skipping:', latitude, longitude);
              continue;
            }
            
            // Special validation for Illinois water infrastructure
            if (latitude >= 36.0 && latitude <= 43.0 && longitude >= -91.5 && longitude <= -87.0) {
              console.log(`✅ Valid Illinois water infrastructure coordinates: ${latitude}, ${longitude}`);
            } else {
              console.log(`✅ Valid water infrastructure coordinates (non-Illinois): ${latitude}, ${longitude}`);
            }
          } else {
            // General California validation for other datasets
            if (latitude < 32 || latitude > 42 || longitude < -125 || longitude > -114) {
              console.warn('❌ Coordinates outside California bounds, skipping:', latitude, longitude);
              continue;
            }
            console.log(`✅ Valid California coordinates: ${latitude}, ${longitude}`);
          }

          // Create processed result with geometry information
          const processedResult: ProcessedResult = {
            id: (feature.attributes.OBJECTID || feature.attributes.ObjectId || feature.attributes.ID || index).toString(),
            name: getFeatureDisplayName(feature.attributes, dataset),
            address: getFeatureAddress(feature.attributes, dataset),
            type: getFeatureType(dataset),
            dataset: dataset,
            attributes: feature.attributes,
            latitude: latitude!,
            longitude: longitude!,
            webMercatorX: webMercatorX!,
            webMercatorY: webMercatorY!,
            geometry: preservedGeometry // Include preserved geometry
          };
          
          // Log ASSETGROUP values for water lines

          
          processedResults.push(processedResult);
          
          // Log successful processing
          if (processedResults.length <= 5) {
            console.log(`✅ Processed feature ${processedResults.length}:`, {
              name: processedResult.name,
              geometryType: preservedGeometry ? (preservedGeometry.paths ? 'Polyline' : preservedGeometry.rings ? 'Polygon' : 'Point') : 'Unknown',
              coordinates: { x, y },
              wgs84: { lat: latitude, lon: longitude },
              hasGeometry: !!preservedGeometry
            });
          }
        } catch (featureError) {
          console.error('❌ Error processing feature:', featureError, feature);
        }
      }

      // Validate processed results
      if (processedResults.length === 0) {
        setError('❌ Could not process any of the returned data points. This might be due to coordinate conversion failures. Please try again or contact support.');
        return;
      }

      console.log(`✅ Successfully processed ${processedResults.length} out of ${queryResponse.features.length} features`);
      
      // Debug summary for water lines
      if (dataset.includes('water')) {
        console.log(`📊 COMPREHENSIVE Water Line Processing Summary for ${dataset}:`);
        console.log(`📊 ========================================`);
        console.log(`📊 Input Features: ${queryResponse.features.length}`);
        console.log(`📊 Successfully Processed: ${processedResults.length}`);
        console.log(`📊 Skipped Features: ${skippedFeatures}`);
        console.log(`📊 ========================================`);
        console.log(`📊 Geometry Type Breakdown:`);
        console.log(`📊   - Point Features: ${pointFeatures}`);
        console.log(`📊   - Polyline Features: ${polylineFeatures}`);
        console.log(`📊   - Polygon Features: ${polygonFeatures}`);
        console.log(`📊 ========================================`);
        console.log(`📊 Success Rate: ${((processedResults.length / queryResponse.features.length) * 100).toFixed(1)}%`);
        

      }
      
      // Show first few processed results for debugging
      if (processedResults.length > 0) {
        console.log('Sample processed results:', processedResults.slice(0, 3));
      }
      
      // Update results
      setResults(processedResults);
      console.log('🔄 Updated results state with', processedResults.length, 'items');

      // Add graphics to map with error handling
      try {
        console.log('🗺️ Starting to add graphics to map...');
        await addGraphicsToMap(processedResults, view, graphicsLayer, Point, Graphic, dataset);
        
        // ALWAYS zoom to results extent - never skip based on count
        if (processedResults.length > 0) {
          console.log(`🔍 Zooming to results extent (${processedResults.length} features)...`);
          await zoomToResults(processedResults, view);
          
          // Log zoom completion with progressive display info for large datasets
          if (processedResults.length > 1000) {
            console.log(`✅ Zoomed to area containing ${processedResults.length} features. Graphics will render progressively for better performance.`);
          } else {
            console.log(`✅ Zoomed to area and displayed ${processedResults.length} features.`);
          }
        }
        
        console.log(`✅ Successfully displayed ${processedResults.length} features on the map`);
      } catch (mapError) {
        console.error('❌ Error adding graphics to map:', mapError);
        setError('⚠️ Data loaded successfully but there was an issue displaying it on the map. Please try refreshing the page.');
      }
      
    } catch (error) {
      console.error('Critical error in executeQuery:', error);
      setError(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please try again or contact support.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper methods using spaCy-based semantic analysis (replacing if/else conditions)
  const getFeatureDisplayName = (attributes: FeatureAttributes, dataset: string): string => {
    return spacyConfigService.getFeatureDisplayName(attributes, dataset);
  };

  const getFeatureAddress = (attributes: FeatureAttributes, dataset: string): string => {
    return spacyConfigService.getFeatureAddress(attributes, dataset);
  };

  const getFeatureType = (dataset: string): string => {
    return spacyConfigService.getFeatureType(dataset);
  };

  // Generate semantic test query using spaCy-based analysis instead of hardcoded if/else
  const generateSemanticTestQuery = (
    semantics: { category: string; confidence: number; tags: string[] }, 
    dataset: string
  ): string => {
    const baseQueries: Record<string, string> = {
      'ev_charging': "all Tesla charging stations",
      'electrical_meter': "all residential electrical meters",
      'service_panel': "all commercial service cabinets",
      'tree_well': "all tree wells with outlets",
      'acorn_light': "all acorn lights with outlets",
      'gas_meter': "all gas meters"
    };
    
    return baseQueries[semantics.category] || "all infrastructure features";
  };

  // Add a test function for debugging
  const testQuery = async (
    view: ESRIView, 
    graphicsLayer: ESRIGraphicsLayer, 
    dataset: string = 'ev_charging'
  ) => {
    console.log('=== TESTING QUERY PIPELINE (SHOWS ALL RESULTS) ===');
    console.log('⚠️  This is a TEST FUNCTION that shows ALL results without location filtering');
    console.log('⚠️  For location-based queries, use the AI Query interface in the sidebar');
    console.log('View:', view);
    console.log('Graphics Layer:', graphicsLayer);
    console.log('Dataset:', dataset);
    console.log('View Spatial Reference:', view?.spatialReference);
    
    // Generate test query using spaCy-based semantic analysis instead of hardcoded if/else
    const semantics = spacyConfigService.analyzeDatasetSemantics(dataset);
    const query = generateSemanticTestQuery(semantics, dataset);
    console.log(`🧪 Running test query: "${query}"`);
    
    try {
      await executeQuery(query, view, graphicsLayer, dataset);
    } catch (error) {
      console.error('Test query failed:', error);
    }
  };

  return {
    executeQuery,
    isLoading,
    error,
    results,
    currentDataset,
    testQuery
  };
}; 