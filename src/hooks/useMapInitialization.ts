
import { useEffect, useRef, useState } from 'react';

export function useMapInitialization() {
  console.log('🚀 Starting map initialization hook...');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentBasemap, setCurrentBasemap] = useState('streets-vector');
  const viewRef = useRef<unknown>(null);

  useEffect(() => {
    console.log('🔧 Map initialization useEffect triggered');
    console.log('📍 Map container ref:', !!mapContainerRef.current);
    
    if (!mapContainerRef.current) {
      console.log('⏳ Map container not ready yet, waiting...');
      return;
    }

    console.log('📦 Loading ArcGIS JavaScript API...');
    const script = document.createElement('script');
    script.src = 'https://js.arcgis.com/4.32/';
    document.head.appendChild(script);

    script.onload = () => {
      console.log('✅ ArcGIS JavaScript API loaded successfully');
      console.log('🎨 Loading ArcGIS CSS...');
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://js.arcgis.com/4.32/esri/themes/light/main.css';
      document.head.appendChild(link);
      
      link.onload = () => {
        console.log('✅ ArcGIS CSS loaded successfully');
        initializeMap();
      };
    };

    script.onerror = () => {
      console.error('❌ Failed to load ArcGIS JavaScript API');
      setMapError("Failed to load map resources. Check your internet connection.");
      setIsLoading(false);
    };

    return () => {
      console.log('🧹 Cleaning up map initialization...');
      try {
        document.head.removeChild(script);
      } catch (e) {
        console.log('Script already removed or not found');
      }
    };
  }, []);

  const initializeMap = () => {
    console.log('🗺️ Initializing map...');
    
    // @ts-expect-error - ArcGIS requires dynamic imports
    require(['esri/Map', 'esri/views/MapView'], (Map: unknown, MapView: unknown) => {
      console.log('📦 Map and MapView modules loaded');
      
      const map = new (Map as any)({
        basemap: 'streets-vector' // Use free public basemap
      });
      
      console.log('🌍 Map object created with basemap: streets-vector');
      
      const view = new (MapView as any)({
        container: mapContainerRef.current,
        map: map,
        center: [54.3773, 24.4539], // Abu Dhabi city center
        zoom: 11
      });
      
      console.log('🎬 MapView created, waiting for ready state...');
      
      view.when(() => {
        console.log('🎉 Map view initialized successfully!');
        setIsLoading(false);
        viewRef.current = view;
        (window as any).esriView = view;
        console.log(`🗺️ Initial basemap: ${currentBasemap}`);
        console.log('🌐 View available globally as window.esriView');
      }, (error: Error) => {
        console.error('❌ Failed to initialize map view:', error);
        setMapError(`Failed to initialize map view: ${error.message}`);
        setIsLoading(false);
      });
    });
  };

  // Function to change basemap
  const changeBasemap = (newBasemap: string) => {
    console.log(`🔄 Changing basemap from ${currentBasemap} to ${newBasemap}`);
    setCurrentBasemap(newBasemap);
    
    if (viewRef.current) {
      const view = viewRef.current as any;
      if (view.map) {
        try {
          view.map.basemap = newBasemap;
          console.log(`✅ Basemap changed to: ${newBasemap}`);
        } catch (error) {
          console.error(`❌ Failed to change basemap to ${newBasemap}:`, error);
          // Fallback to streets-vector if the basemap fails
          if (newBasemap !== 'streets-vector') {
            console.log('🔄 Falling back to streets-vector basemap');
            view.map.basemap = 'streets-vector';
            setCurrentBasemap('streets-vector');
          }
        }
      }
    }
  };

  return {
    mapContainerRef,
    isLoading,
    mapError,
    currentBasemap,
    setCurrentBasemap: changeBasemap,
    viewRef
  };
} 
