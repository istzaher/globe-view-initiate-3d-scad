import React, { useState, useEffect } from 'react';
import MapLoadingScreen from './MapLoadingScreen';
import MapErrorScreen from './MapErrorScreen';
import MapContainer from './MapContainer';
import MapResultsPanel from './MapResultsPanel';
import MapDebugger from './MapDebugger';
import SimpleGraphicsTest from './SimpleGraphicsTest';
import ChatbotInterface from './ChatbotInterface';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useNLQuery } from '@/hooks/useNLQuery';
import NLPQueryService from '@/services/nlpQueryService';
import GeodatabaseService from '@/services/geodatabaseService';
import AbuDhabiRealDataService from '@/services/abuDhabiRealDataService';
import EsriMapTools from './EsriMapTools';

const MapViewer = () => {
  console.log('🔄 MapViewer component rendering...');
  
  const [graphicsLayer, setGraphicsLayer] = useState<any>(null);
  const [highlightGraphic, setHighlightGraphic] = useState<any>(null);
  const [nlpQueryService] = useState(() => new NLPQueryService());
  const [geodatabaseService] = useState(() => new GeodatabaseService());
  const [abuDhabiRealDataService] = useState(() => new AbuDhabiRealDataService());
  const [featureResults, setFeatureResults] = useState<any[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<string[]>([]);
  
  const {
    mapContainerRef,
    isLoading,
    mapError,
    currentBasemap,
    setCurrentBasemap,
    viewRef
  } = useMapInitialization();

  console.log('🗺️ Map initialization state:', { 
    isLoading, 
    mapError, 
    currentBasemap,
    hasMapRef: !!mapContainerRef.current,
    hasViewRef: !!viewRef.current 
  });

  const {
    executeQuery,
    isLoading: isProcessingQuery,
    error: queryError,
    results: nlQueryResults,
    currentDataset,
    testQuery
  } = useNLQuery();

  console.log('🔍 Query state:', { 
    isProcessingQuery, 
    queryError, 
    resultsCount: nlQueryResults.length,
    currentDataset 
  });

  // Handle natural language query
  const handleNLQuery = async (query: string, dataset?: string) => {
    console.log('🔍 Handling NL query:', { query, dataset });
    console.log('🚀 ENHANCED HANDLER: Using new tool-based system - TEST IDENTIFIER 12345 RECEIVED');
    
    try {
      // Try enhanced query service first - implements fastest patterns from ArcGIS + AI document
      const { enhancedQueryService } = await import('../services/enhancedQueryService');
      const enhancedResult = await enhancedQueryService.processQueryWithFallback(query);
      
      // Check if enhanced system says to use existing NLP service for Abu Dhabi datasets
      if (enhancedResult.success && enhancedResult.metadata?.use_existing_nlp_service) {
        console.log('🏙️ Enhanced system routing to existing NLP service for Abu Dhabi datasets');
        // Fall through to the existing NLP service below
      } else if (enhancedResult.success && enhancedResult.geojson?.features?.length > 0) {
        console.log('✅ Enhanced query successful:', enhancedResult);
        setFeatureResults(enhancedResult.geojson.features);
        
        // Center map on results if center point is available
        if (enhancedResult.center && mapView) {
          const [longitude, latitude] = enhancedResult.center.coordinates;
          mapView.goTo({
            center: [longitude, latitude],
            zoom: 12
          }).catch((error: any) => console.warn('Map centering failed:', error));
        }
        
        // Return enhanced result with statistics for chat response
        return {
          features: enhancedResult.geojson.features,
          statistics: enhancedResult.statistics,
          text: enhancedResult.text,
          metadata: enhancedResult.metadata
        };
      }
      
      // If enhanced system didn't work, try original NLP service for Abu Dhabi datasets
      console.log('🔄 Enhanced query returned no results, trying NLP service...');
      const nlpResult = await nlpQueryService.processQuery(query);
      
      if (nlpResult && nlpResult.features && nlpResult.features.length > 0) {
        console.log('✅ NLP query successful:', nlpResult);
        setFeatureResults(nlpResult.features);
        
        // Generate statistical chat response if statistics are available
        if (nlpResult.statistics) {
          console.log('📊 Statistics available, will be used in chat response:', nlpResult.statistics);
        }
        
        return nlpResult; // Return the result with statistics
      }
      
      // Check if this was a real dataset query that should not fall back to backend
      const isRealDatasetQuery = query.toLowerCase().includes('bus stop') || 
                                query.toLowerCase().includes('mosque') || 
                                query.toLowerCase().includes('park') || 
                                query.toLowerCase().includes('parking') || 
                                query.toLowerCase().includes('building') || 
                                query.toLowerCase().includes('road');
      
      if (isRealDatasetQuery) {
        console.log('🏙️ Real dataset query with no visual results - returning nlpResult with statistics');
        return nlpResult; // Return the result with statistics even if no features to display
      }
      
      console.log('🔄 NLP query returned no results, trying backend API...');
      // Fallback to original query system for mock datasets only
      await executeQuery(query, dataset);
    } catch (error) {
      console.error('❌ Error executing query:', error);
      
      // Only try backend fallback for non-real dataset queries
      const isRealDatasetQuery = query.toLowerCase().includes('bus stop') || 
                                query.toLowerCase().includes('mosque') || 
                                query.toLowerCase().includes('park') || 
                                query.toLowerCase().includes('parking') || 
                                query.toLowerCase().includes('building') || 
                                query.toLowerCase().includes('road');
      
      if (!isRealDatasetQuery) {
        await executeQuery(query, dataset);
      } else {
        console.log('🏙️ Real dataset query failed - not calling backend API');
      }
    }
  };

  // Handle feature click
  const handleFeatureClick = (feature: any) => {
    console.log('🎯 Feature clicked:', feature);
  };

  // Handle retry
  const handleRetry = () => {
    console.log('🔄 Retrying map initialization...');
    window.location.reload();
  };

  // Set up feature layer initialization function immediately
  (window as any).initializeFeatureLayers = (view: any) => {
        console.log('🗃️ Setting up feature layer system...');
        nlpQueryService.setMapView(view);
        geodatabaseService.setMapView(view);
        abuDhabiRealDataService.setView(view);
        
        // Connect services together
        nlpQueryService.setAbuDhabiRealDataService(abuDhabiRealDataService);
        
        // Initialize services but don't load datasets automatically
        // Datasets will only be loaded when requested via GenAI
        console.log('✅ Feature layer services initialized - datasets will load on demand');
  };
  
  // Set up test functions for debugging
  (window as any).testQuery = testQuery;
  (window as any).testSchools = () => testQuery('Show me all schools in Abu Dhabi', 'education_0');
  (window as any).testBusStops = () => handleNLQuery('Show all bus stops in Abu Dhabi');
  (window as any).testNLPService = nlpQueryService;
  (window as any).testPolice = () => testQuery('Show me all police stations in Abu Dhabi', 'public_safety_0');
  (window as any).testAgriculture = () => testQuery('Show me all crop fields in Abu Dhabi', 'agriculture_0');
  
  // Feature layer test functions
  (window as any).testNLP = (query: string) => handleNLQuery(query);
  (window as any).testFeatureQuery = () => handleNLQuery('Show all schools in Central Abu Dhabi');
  (window as any).testGeodatabase = () => handleNLQuery('Show education facilities from geodatabase');
  (window as any).testGDBHealthcare = () => handleNLQuery('Find healthcare facilities in GDB data');

  console.log('🎨 Rendering MapViewer with state:', {
    isLoading,
    mapError,
    resultsCount: nlQueryResults.length,
    isProcessingQuery
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900 flex">
      {/* Loading Screen */}
      {isLoading && <MapLoadingScreen />}

      {/* Chat Interface - Left Panel (1/3 width) */}
      <div className="w-1/3 h-full flex flex-col">
          <ChatbotInterface 
            onQuerySubmit={handleNLQuery}
            currentDataset={currentDataset}
            isProcessing={isProcessingQuery}
            visibleLayers={visibleLayers}
          />
      </div>

      {/* Map Container - Right Panel (2/3 width) */}
      <div className="w-2/3 h-full relative">
        {mapError ? (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-xl font-semibold mb-2">Map Unavailable</h2>
              <p className="text-gray-300 mb-4">Map initialization failed</p>
              <button 
                onClick={handleRetry} 
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
              >
                🔄 Retry Map
              </button>
            </div>
          </div>
        ) : (
          <>
            <MapContainer ref={mapContainerRef} />
            
            {/* Esri Map Tools - Bottom Left */}
            {/* {viewRef.current && (
              <EsriMapTools 
                view={viewRef.current}
                currentBasemap={currentBasemap}
                onBasemapChange={(basemap) => {
                  console.log(`🗺️ Basemap changed to: ${basemap}`);
                }}
              />
            )} */}
            
            {/* Results Panel - overlay on map when there are results */}
            <MapResultsPanel
              results={featureResults.length > 0 ? featureResults : nlQueryResults}
              isLoading={isProcessingQuery}
              onFeatureClick={handleFeatureClick}
              isVisible={featureResults.length > 0 || nlQueryResults.length > 0 || isProcessingQuery}
            />
          </>
        )}
      </div>

      {/* Debug Component - invisible but adds debug functions */}
      <MapDebugger view={viewRef.current} graphicsLayer={graphicsLayer} />
      
      {/* Simple Graphics Test - invisible but adds test functions */}
      <SimpleGraphicsTest view={viewRef.current} graphicsLayer={graphicsLayer} />
    </div>
  );
};

export default MapViewer;