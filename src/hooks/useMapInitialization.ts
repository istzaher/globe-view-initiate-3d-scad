import { useEffect, useRef, useState } from 'react';

export function useMapInitialization() {
  console.log('🚀 Starting map initialization hook...');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentBasemap, setCurrentBasemap] = useState('streets-vector');
  const viewRef = useRef<any>(null);

  useEffect(() => {
    console.log('🔧 Map initialization useEffect triggered');
    console.log('📍 Map container ref:', !!mapContainerRef.current);
    
    if (mapContainerRef.current) {
      console.log('📦 Loading ArcGIS JavaScript API...');
      
      // Load ESRI CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://js.arcgis.com/4.29/esri/themes/light/main.css';
      link.onload = () => {
        console.log('✅ ArcGIS CSS loaded successfully');
        initializeMap();
      };
      document.head.appendChild(link);
    }
  }, []);

  const initializeMap = () => {
    console.log('🗺️ Initializing map...');
    
    // Check if ESRI API is loaded
    if (typeof (window as any).require === 'undefined') {
      console.error('❌ ESRI API not loaded. Please check if the script is included in index.html');
      setMapError('ESRI API not loaded. Please refresh the page.');
      setIsLoading(false);
      return;
    }
    
    // Use ESRI JavaScript API for 3D map and view
    (window as any).require(['esri/Map', 'esri/views/SceneView', 'esri/widgets/NavigationToggle', 'esri/config'], (Map: any, SceneView: any, NavigationToggle: any, esriConfig: any) => {
      console.log('📦 Map, SceneView, NavigationToggle, and esriConfig modules loaded');
      
      // Disable ESRI authentication to prevent sign-in popups
      esriConfig.request.useIdentity = false;
      esriConfig.request.interceptors = [];
      
      try {
        // Use simple basemap string for better compatibility
        const map = new Map({
          basemap: 'streets-vector'
        });
        
        console.log('🌍 Map object created');
        
        if (!mapContainerRef.current) {
          console.error('❌ Map container not found');
          setMapError('Map container not found');
          setIsLoading(false);
          return;
        }

        const view = new SceneView({
          container: mapContainerRef.current,
          map: map,
          center: [54.3773, 24.4539], // Abu Dhabi city center
          zoom: 11,
          // 3D environment settings
          environment: {
            atmosphereEnabled: true,
            background: {
              type: "color",
              color: [0, 0, 0, 0]
            },
            starsEnabled: false,
            lighting: {
              type: "sun",
              date: new Date(),
              directShadowsEnabled: true,
              cameraTrackingEnabled: false
            }
          },
          // 3D constraints
          constraints: {
            altitude: {
              min: 0,
              max: 20000000
            },
            tilt: {
              min: 0,
              max: 85
            }
          }
        });
        
        console.log('🗺️ SceneView created');
        
        view.when(() => {
          console.log('🎉 3D SceneView initialized successfully!');
          setIsLoading(false);
          viewRef.current = view;
          (window as any).esriView = view;
          console.log(`🗺️ Initial basemap: ${currentBasemap}`);
          
          // Add 3D navigation controls
          const navigationToggle = new NavigationToggle({
            view: view,
            container: document.createElement("div")
          });
          
          // Add 3D navigation to the view UI
          view.ui.add(navigationToggle, "top-right");
          
          // Enable 3D keyboard shortcuts
          enable3DKeyboardControls(view);
          
          // Enable 3D mouse controls
          enable3DMouseControls(view);
          
          // Add global basemap control function
          (window as any).changeBasemap = (basemapType: string) => {
            console.log(`🌍 Changing basemap to: ${basemapType}`);
            changeBasemap(basemapType);
          };
          
          // Add global function to list available basemaps
          (window as any).listBasemaps = () => {
            console.log('🗺️ Available basemaps:');
            availableBasemaps.forEach(basemap => {
              console.log(`- ${basemap}`);
            });
            console.log('Usage: changeBasemap("satellite")');
          };
          
          console.log('🌐 Global functions available: changeBasemap(basemapType), listBasemaps()');
          
          // Initialize feature layer system
          if ((window as any).initializeFeatureLayers) {
            console.log('🚀 Calling initializeFeatureLayers...');
            (window as any).initializeFeatureLayers(view);
          } else {
            console.warn('⚠️ initializeFeatureLayers not available');
          }
        }, (error: Error) => {
          console.error('❌ Failed to initialize map view:', error);
          setMapError(`Failed to initialize map view: ${error.message}`);
          setIsLoading(false);
        });
        
      } catch (error) {
        console.error('❌ Error creating map or view:', error);
        setMapError(`Error creating map: ${error}`);
        setIsLoading(false);
      }
    }, (error: Error) => {
      console.error('❌ Failed to load ESRI modules:', error);
      setMapError(`Failed to load ESRI modules: ${error.message}`);
      setIsLoading(false);
    });
  };

  // Function to change basemap using simple ESRI basemap strings
  const changeBasemap = (newBasemap: string) => {
    console.log(`🔄 Changing basemap from ${currentBasemap} to ${newBasemap}`);
    setCurrentBasemap(newBasemap);
    
    if (viewRef.current) {
      const view = viewRef.current as any;
      if (view.map) {
        try {
          // Use simple basemap string for better compatibility
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

  // Available basemap types (ESRI built-in basemaps)
  const availableBasemaps = [
    'streets-vector',
    'satellite', 
    'hybrid',
    'terrain',
    'topo-vector',
    'dark-gray-vector',
    'gray-vector'
  ];

  // Enable 3D keyboard controls
  const enable3DKeyboardControls = (view: any) => {
    console.log('⌨️ Enabling 3D keyboard controls...');
    
    // Keyboard shortcuts for 3D navigation
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case 'r':
            event.preventDefault();
            console.log('🔄 Resetting 3D view');
            view.goTo({
              center: [54.3773, 24.4539],
              zoom: 11,
              tilt: 0,
              heading: 0
            }, { duration: 1000 });
            break;
          case 't':
            event.preventDefault();
            console.log('🔄 Toggling 3D tilt');
            const currentTilt = view.camera.tilt;
            const newTilt = currentTilt > 45 ? 0 : 45;
            view.goTo({
              tilt: newTilt
            }, { duration: 1000 });
            break;
        }
      }
    });
    
    console.log('✅ 3D keyboard controls enabled (Ctrl+R: Reset, Ctrl+T: Toggle Tilt)');
  };

  // Enable 3D mouse controls
  const enable3DMouseControls = (view: any) => {
    console.log('🖱️ Enabling 3D mouse controls...');
    
    // Right-click drag for 3D rotation
    let isRightClickDragging = false;
    
    view.container.addEventListener('contextmenu', (event: Event) => {
      event.preventDefault();
    });
    
    view.container.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button === 2) { // Right mouse button
        isRightClickDragging = true;
        console.log('🖱️ Right-click drag started for 3D rotation');
      }
    });
    
    view.container.addEventListener('mouseup', () => {
      isRightClickDragging = false;
    });
    
    // Ctrl + Mouse Wheel for tilt
    view.container.addEventListener('wheel', (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        const currentTilt = view.camera.tilt;
        const delta = event.deltaY > 0 ? -5 : 5;
        const newTilt = Math.max(0, Math.min(85, currentTilt + delta));
        
        view.goTo({
          tilt: newTilt
        }, { duration: 200 });
        
        console.log(`🔄 Tilt adjusted to: ${newTilt.toFixed(1)}°`);
      }
    });
    
    console.log('✅ 3D mouse controls enabled (Right-click drag: Rotate, Ctrl+Wheel: Tilt)');
  };

  // Function to ensure map capabilities are enabled
  const enable3DCapabilities = () => {
    if (viewRef.current) {
      const view = viewRef.current as any;
      console.log('✅ 3D SceneView capabilities ready');
      
      // Enable 3D controls if not already enabled
      enable3DKeyboardControls(view);
      enable3DMouseControls(view);
    }
  };

  return {
    mapContainerRef,
    isLoading,
    mapError,
    currentBasemap,
    setCurrentBasemap: changeBasemap,
    enable3DCapabilities,
    viewRef
  };
}