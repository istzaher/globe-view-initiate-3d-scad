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
import DemoLayerService from '@/services/demoLayerService';
import EsriMapTools from './EsriMapTools';

const MapViewer = () => {
  console.log('🔄 MapViewer component rendering...');
  
  const [graphicsLayer, setGraphicsLayer] = useState<any>(null);
  const [highlightGraphic, setHighlightGraphic] = useState<any>(null);
  const [nlpQueryService] = useState(() => new NLPQueryService());
  const [geodatabaseService] = useState(() => new GeodatabaseService());
  const [demoLayerService] = useState(() => new DemoLayerService());
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
    try {
      // Try NLP query service first for feature layers
      const nlpResult = await nlpQueryService.processQuery(query);
      
      if (nlpResult.success && nlpResult.features) {
        console.log('✅ NLP query successful:', nlpResult);
        setFeatureResults(nlpResult.features);
        return;
      }
      
      // Fallback to original query system
      await executeQuery(query, dataset);
    } catch (error) {
      console.error('❌ Error executing query:', error);
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

  // Initialize feature layer system when map is ready
  useEffect(() => {
    if (viewRef.current) {
      // Set up feature layer initialization
      (window as any).initializeFeatureLayers = (view: any) => {
        console.log('🗃️ Setting up feature layer system...');
        nlpQueryService.setMapView(view);
        geodatabaseService.setMapView(view);
        demoLayerService.setMapView(view);
        
        // Load all layer systems
        Promise.all([
          nlpQueryService.loadDefaultLayers(),
          geodatabaseService.loadGeodatabaseConfig().then(() => 
            geodatabaseService.loadGeodatabaseLayers()
          ),
          demoLayerService.createDemoLayers()
        ]).then(() => {
          console.log('✅ Feature layer system, geodatabase, and demo layers ready');
        }).catch(error => {
          console.error('❌ Error initializing layers:', error);
        });
      };
      
      // Test functions for debugging
      (window as any).testQuery = testQuery;
      (window as any).testSchools = () => testQuery('Show me all schools in Abu Dhabi', 'education_0');
      (window as any).testPolice = () => testQuery('Show me all police stations in Abu Dhabi', 'public_safety_0');
      (window as any).testAgriculture = () => testQuery('Show me all crop fields in Abu Dhabi', 'agriculture_0');
      
      // Feature layer test functions
      (window as any).testNLP = (query: string) => handleNLQuery(query);
      (window as any).testFeatureQuery = () => handleNLQuery('Show all schools in Central Abu Dhabi');
      (window as any).testGeodatabase = () => handleNLQuery('Show education facilities from geodatabase');
      (window as any).testGDBHealthcare = () => handleNLQuery('Find healthcare facilities in GDB data');
    }
  }, [viewRef.current, testQuery, nlpQueryService]);

  console.log('🎨 Rendering MapViewer with state:', {
    isLoading,
    mapError,
    resultsCount: nlQueryResults.length,
    isProcessingQuery
  });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 flex">
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
            {viewRef.current && (
              <EsriMapTools 
                view={viewRef.current}
                currentBasemap={currentBasemap}
                onBasemapChange={(basemap) => {
                  console.log(`🗺️ Basemap changed to: ${basemap}`);
                }}
              />
            )}
            
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