import React, { useState, useEffect, useRef } from 'react';

// Suppress Esri deprecation warnings for cleaner console output
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('🛑 DEPRECATED') ||
    message.includes('Graphics layer not initialized')
  )) {
    return; // Suppress Esri deprecation warnings and graphics layer warnings
  }
  originalWarn.apply(console, args);
};
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Map, 
  Satellite, 
  Mountain, 
  Navigation, 
  Search, 
  Ruler, 
  MapPin, 
  Home,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  BookOpen,
  Camera,
  Download,
  Share,
  Info,
  Settings,
  Crosshair,
  Move3D,
  GripHorizontal
} from 'lucide-react';

interface EsriMapToolsProps {
  view?: any;
  onBasemapChange?: (basemap: string) => void;
  currentBasemap?: string;
}

const EsriMapTools: React.FC<EsriMapToolsProps> = ({ 
  view, 
  onBasemapChange,
  currentBasemap = 'streets-vector'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [measurementWidget, setMeasurementWidget] = useState<any>(null);
  const [searchWidget, setSearchWidget] = useState<any>(null);
  const [coordinateDisplay, setCoordinateDisplay] = useState({ lat: 0, lon: 0 });
  const [widgets, setWidgets] = useState<any>({
    legend: null,
    layerList: null,
    basemapGallery: null,
    bookmarks: null,
    compass: null,
    coordinateConversion: null,
    directionsWidget: null,
    editor: null,
    featureTable: null,
    fullscreen: null,
    histogramRangeSlider: null,
    home: null,
    locate: null,
    navigationToggle: null,
    orientedImageryViewer: null,
    popup: null,
    scaleBar: null,
    sketch: null,
    swipe: null,
    timeSlider: null,
    track: null,
    weatherWidget: null,
    zoom: null
  });
  const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
  
  // Draggable state - Start at bottom-left
  const [position, setPosition] = useState({ x: 16, y: 16 }); // Initial position (bottom-left with padding)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  // Basemap options
  const basemaps = [
    { id: 'streets-vector', name: 'Streets', icon: <Map className="w-4 h-4" /> },
    { id: 'satellite', name: 'Satellite', icon: <Satellite className="w-4 h-4" /> },
    { id: 'hybrid', name: 'Hybrid', icon: <Layers className="w-4 h-4" /> },
    { id: 'terrain', name: 'Terrain', icon: <Mountain className="w-4 h-4" /> },
    { id: 'topo-vector', name: 'Topographic', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'dark-gray-vector', name: 'Dark Gray', icon: <Settings className="w-4 h-4" /> },
    { id: 'gray-vector', name: 'Light Gray', icon: <Settings className="w-4 h-4" /> }
  ];

  // Initialize widgets when view is available
  useEffect(() => {
    if (!view) return;

    // Initialize all Esri widgets
    (window as any).require([
      'esri/widgets/Measurement',
      'esri/widgets/Search',
      'esri/widgets/Locate',
      'esri/widgets/Legend',
      'esri/widgets/LayerList',
      'esri/widgets/BasemapGallery',
      'esri/widgets/Bookmarks',
      'esri/widgets/Compass',
      'esri/widgets/CoordinateConversion',
      'esri/widgets/Directions',
      'esri/widgets/Editor',
      'esri/widgets/FeatureTable',
      'esri/widgets/Fullscreen',
      'esri/widgets/HistogramRangeSlider',
      'esri/widgets/Home',
      'esri/widgets/NavigationToggle',
      'esri/widgets/ScaleBar',
      'esri/widgets/Sketch',
      'esri/widgets/Swipe',
      'esri/widgets/TimeSlider',
      'esri/widgets/Track',
      'esri/widgets/Zoom',
      'esri/Graphic',
      'esri/layers/GraphicsLayer'
    ], (
      Measurement: any, Search: any, Locate: any, Legend: any, LayerList: any,
      BasemapGallery: any, Bookmarks: any, Compass: any, CoordinateConversion: any,
      Directions: any, Editor: any, FeatureTable: any, Fullscreen: any,
      HistogramRangeSlider: any, Home: any, NavigationToggle: any,
      ScaleBar: any, Sketch: any, Swipe: any, TimeSlider: any,
      Track: any, Zoom: any, Graphic: any, GraphicsLayer: any
    ) => {
      
      // Create graphics layer for sketching
      const sketchLayer = new GraphicsLayer({
        title: "Sketch Layer"
      });
      view.map.add(sketchLayer);

      // Initialize all widgets
      const newWidgets = {
        // Measurement widget
        measurement: new Measurement({
          view: view,
          activeTool: undefined
        }),

        // Search widget
        search: new Search({
          view: view,
          includeDefaultSources: false,
          sources: [{
            locator: {
              url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
            },
            placeholder: "Search Abu Dhabi locations",
            resultSymbol: {
              type: "picture-marker",
              url: "https://developers.arcgis.com/javascript/latest/sample-code/widgets-search-customsource/live/pin.png",
              size: 24,
              width: 24,
              height: 24
            }
          }]
        }),

        // Legend widget
        legend: new Legend({
          view: view,
          style: "card"
        }),

        // Layer List widget
        layerList: new LayerList({
          view: view,
          listItemCreatedFunction: (event: any) => {
            const item = event.item;
            item.panel = {
              content: "legend",
              open: false
            };
          }
        }),

        // Basemap Gallery widget
        basemapGallery: new BasemapGallery({
          view: view,
          source: {
            query: {
              title: '"World Basemaps for Developers" AND owner:esri'
            }
          }
        }),

        // Bookmarks widget
        bookmarks: new Bookmarks({
          view: view,
          bookmarks: [
            {
              name: "Abu Dhabi City Center",
              viewpoint: {
                targetGeometry: {
                  type: "point",
                  longitude: 54.3773,
                  latitude: 24.4539
                },
                scale: 50000
              }
            },
            {
              name: "Sheikh Zayed Grand Mosque",
              viewpoint: {
                targetGeometry: {
                  type: "point",
                  longitude: 54.475323,
                  latitude: 24.412677
                },
                scale: 10000
              }
            }
          ]
        }),

        // Compass widget
        compass: new Compass({
          view: view
        }),

        // Coordinate Conversion widget
        coordinateConversion: new CoordinateConversion({
          view: view
        }),

        // Directions widget
        directions: new Directions({
          view: view
        }),

        // Editor widget
        editor: new Editor({
          view: view,
          layerInfos: [{
            layer: sketchLayer,
            formTemplate: {
              elements: [
                {
                  type: "field",
                  fieldName: "description",
                  label: "Description"
                }
              ]
            }
          }]
        }),

        // Fullscreen widget
        fullscreen: new Fullscreen({
          view: view
        }),

        // Home widget
        home: new Home({
          view: view
        }),

        // Locate widget
        locate: new Locate({
          view: view,
          useHeadingEnabled: false,
          goToOverride: function(view: any, options: any) {
            options.target.scale = 1500;
            return view.goTo(options.target);
          }
        }),

        // Navigation Toggle widget
        navigationToggle: new NavigationToggle({
          view: view
        }),

        // Scale Bar widget
        scaleBar: new ScaleBar({
          view: view,
          unit: "metric"
        }),

        // Sketch widget
        sketch: new Sketch({
          view: view,
          layer: sketchLayer,
          creationMode: "update"
        }),

        // Track widget
        track: new Track({
          view: view,
          graphic: new Graphic({
            symbol: {
              type: "simple-marker",
              size: 12,
              color: "green",
              outline: {
                color: "#efefef",
                width: "1.5px"
              }
            }
          }),
          useHeadingEnabled: false
        }),

        // Zoom widget
        zoom: new Zoom({
          view: view
        })
      };

      setMeasurementWidget(newWidgets.measurement);
      setSearchWidget(newWidgets.search);
      setWidgets(newWidgets);

      // Track mouse coordinates
      view.on('pointer-move', (event: any) => {
        const point = view.toMap({ x: event.x, y: event.y });
        if (point) {
          setCoordinateDisplay({
            lat: parseFloat(point.latitude?.toFixed(6) || '0'),
            lon: parseFloat(point.longitude?.toFixed(6) || '0')
          });
        }
      });
    });

    return () => {
      Object.values(widgets).forEach((widget: any) => {
        widget?.destroy();
      });
    };
  }, [view]);

  // Dragging functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current) {
      setIsDragging(true);
      const rect = dragRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - (window.innerHeight - rect.bottom)
      });
      
      // Prevent text selection while dragging
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && dragRef.current) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Get viewport dimensions to constrain dragging within bounds
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const elementRect = dragRef.current.getBoundingClientRect();
      
      // Constrain to viewport bounds
      const constrainedX = Math.max(0, Math.min(newX, viewport.width - elementRect.width));
      // For bottom positioning, we need to calculate from bottom of viewport
      const bottomPosition = viewport.height - newY - elementRect.height;
      const constrainedY = Math.max(0, Math.min(bottomPosition, viewport.height - elementRect.height));
      
      setPosition({ x: constrainedX, y: constrainedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Change cursor globally while dragging
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, dragStart, position]);

  // Ensure panel stays within viewport when expanded
  useEffect(() => {
    if (isExpanded && dragRef.current) {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const elementRect = dragRef.current.getBoundingClientRect();
      
      // Check if panel would go off screen and adjust
      let newX = position.x;
      let newY = position.y;
      
      // Ensure panel doesn't go off right edge
      if (position.x + elementRect.width > viewport.width) {
        newX = viewport.width - elementRect.width - 16;
      }
      
      // Ensure panel doesn't go off top (when positioned from bottom)
      if (position.y + elementRect.height > viewport.height) {
        newY = viewport.height - elementRect.height - 16;
      }
      
      // Update position if needed
      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: Math.max(16, newX), y: Math.max(16, newY) });
      }
    }
  }, [isExpanded, position.x, position.y]);

  // Map navigation functions
  const zoomIn = () => {
    if (view) view.zoom += 1;
  };

  const zoomOut = () => {
    if (view) view.zoom -= 1;
  };

  const resetRotation = () => {
    if (view) view.rotation = 0;
  };

  const goToAbuDhabi = () => {
    if (view) {
      view.goTo({
        center: [54.3773, 24.4539],
        zoom: 11
      });
    }
  };

  const enableMeasurement = (tool: 'distance' | 'area') => {
    if (measurementWidget) {
      if (tool === 'distance') {
        measurementWidget.activeTool = 'distance';
      } else {
        measurementWidget.activeTool = 'area';
      }
      
      // Add widget to view temporarily
      view?.ui.add(measurementWidget, 'top-right');
      
      // Remove after use
      setTimeout(() => {
        view?.ui.remove(measurementWidget);
      }, 30000); // Auto-remove after 30 seconds
    }
  };

  const enableSearch = () => {
    if (searchWidget && view) {
      view.ui.add(searchWidget, 'top-left');
      
      // Focus search input
      setTimeout(() => {
        const searchInput = document.querySelector('.esri-search__input') as HTMLInputElement;
        searchInput?.focus();
      }, 100);
    }
  };

  const takeScreenshot = () => {
    if (view) {
      view.takeScreenshot().then((screenshot: any) => {
        const link = document.createElement('a');
        link.href = screenshot.dataUrl;
        link.download = `abu-dhabi-map-${new Date().getTime()}.png`;
        link.click();
      });
    }
  };

  const shareLocation = () => {
    if (view) {
      const center = view.center;
      const zoom = view.zoom;
      const url = `${window.location.origin}${window.location.pathname}?lat=${center.latitude.toFixed(6)}&lon=${center.longitude.toFixed(6)}&zoom=${zoom}`;
      
      navigator.clipboard.writeText(url).then(() => {
        alert('Location URL copied to clipboard!');
      });
    }
  };

  const changeBasemap = (basemapId: string) => {
    if (view) {
      view.map.basemap = basemapId;
      onBasemapChange?.(basemapId);
    }
  };

  // Widget toggle functions
  const toggleWidget = (widgetName: string, position: string = 'top-right') => {
    const widget = widgets[widgetName];
    if (!widget || !view) return;

    const isActive = activeWidgets.includes(widgetName);
    
    if (isActive) {
      // Remove widget
      view.ui.remove(widget);
      setActiveWidgets(prev => prev.filter(w => w !== widgetName));
    } else {
      // Add widget
      view.ui.add(widget, position);
      setActiveWidgets(prev => [...prev, widgetName]);
    }
  };

  // Specialized widget functions
  const enableSketch = () => {
    toggleWidget('sketch', 'top-right');
  };

  const enableEditor = () => {
    toggleWidget('editor', 'top-right');
  };

  const enableDirections = () => {
    toggleWidget('directions', 'top-left');
  };

  const showLegend = () => {
    toggleWidget('legend', 'bottom-left');
  };

  const showLayerList = () => {
    toggleWidget('layerList', 'top-right');
  };

  const showBasemapGallery = () => {
    toggleWidget('basemapGallery', 'top-right');
  };

  const showBookmarks = () => {
    toggleWidget('bookmarks', 'top-right');
  };

  const showCoordinateConversion = () => {
    toggleWidget('coordinateConversion', 'bottom-right');
  };

  if (isExpanded) {
    return (
      <div 
        ref={dragRef}
        className="absolute z-50 w-80"
        style={{ 
          left: position.x, 
          bottom: position.y,
          cursor: isDragging ? 'grabbing' : 'auto'
        }}
      >
        <Card className="shadow-lg border border-gray-200 bg-white/95 backdrop-blur-sm max-h-96 overflow-y-auto">
          <CardContent className="p-4">
            {/* Drag Handle Header */}
            <div 
              className="flex items-center justify-between mb-4 p-2 -m-2 rounded cursor-grab hover:bg-gray-50 active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-sm select-none">Map Tools</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="hover:bg-gray-200"
              >
                ✕
              </Button>
            </div>

            {/* Navigation Tools */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Navigation</h4>
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" onClick={zoomIn} title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={zoomOut} title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={resetRotation} title="Reset Rotation">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToAbuDhabi} title="Go to Abu Dhabi">
                  <Home className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Analysis Tools */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Analysis</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => enableMeasurement('distance')}
                  title="Measure Distance"
                >
                  <Ruler className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => enableMeasurement('area')}
                  title="Measure Area"
                >
                  <Move3D className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={enableSearch}
                  title="Search Locations"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Drawing & Editing Tools */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Drawing & Editing</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={activeWidgets.includes('sketch') ? "default" : "outline"}
                  size="sm" 
                  onClick={enableSketch}
                  title="Sketch Tool"
                >
                  <Crosshair className="w-4 h-4" />
                  <span className="ml-2 text-xs">Sketch</span>
                </Button>
                <Button 
                  variant={activeWidgets.includes('editor') ? "default" : "outline"}
                  size="sm" 
                  onClick={enableEditor}
                  title="Feature Editor"
                >
                  <Settings className="w-4 h-4" />
                  <span className="ml-2 text-xs">Editor</span>
                </Button>
              </div>
            </div>

            {/* Navigation Widgets */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Navigation Widgets</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={activeWidgets.includes('directions') ? "default" : "outline"}
                  size="sm" 
                  onClick={enableDirections}
                  title="Directions"
                >
                  <Navigation className="w-4 h-4" />
                  <span className="ml-2 text-xs">Directions</span>
                </Button>
                <Button 
                  variant={activeWidgets.includes('bookmarks') ? "default" : "outline"}
                  size="sm" 
                  onClick={showBookmarks}
                  title="Bookmarks"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="ml-2 text-xs">Bookmarks</span>
                </Button>
              </div>
            </div>

            {/* Layer Management */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Layers</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={activeWidgets.includes('layerList') ? "default" : "outline"}
                  size="sm" 
                  onClick={showLayerList}
                  title="Layer List"
                >
                  <Layers className="w-4 h-4" />
                  <span className="ml-2 text-xs">Layers</span>
                </Button>
                <Button 
                  variant={activeWidgets.includes('legend') ? "default" : "outline"}
                  size="sm" 
                  onClick={showLegend}
                  title="Legend"
                >
                  <Info className="w-4 h-4" />
                  <span className="ml-2 text-xs">Legend</span>
                </Button>
              </div>
            </div>

            {/* Additional Widgets */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Additional Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={activeWidgets.includes('basemapGallery') ? "default" : "outline"}
                  size="sm" 
                  onClick={showBasemapGallery}
                  title="Basemap Gallery"
                >
                  <Map className="w-4 h-4" />
                  <span className="ml-2 text-xs">Gallery</span>
                </Button>
                <Button 
                  variant={activeWidgets.includes('coordinateConversion') ? "default" : "outline"}
                  size="sm" 
                  onClick={showCoordinateConversion}
                  title="Coordinate Conversion"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="ml-2 text-xs">Coords</span>
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Quick Actions</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleWidget('fullscreen', 'top-left')}
                  title="Fullscreen"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleWidget('locate', 'top-left')}
                  title="My Location"
                >
                  <Crosshair className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleWidget('compass', 'top-left')}
                  title="Compass"
                >
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Basemap Selector */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Basemap</h4>
              <div className="grid grid-cols-2 gap-2">
                {basemaps.map((basemap) => (
                  <Button
                    key={basemap.id}
                    variant={currentBasemap === basemap.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeBasemap(basemap.id)}
                    className="justify-start"
                  >
                    {basemap.icon}
                    <span className="ml-2 text-xs">{basemap.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Export Tools */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Export</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={takeScreenshot} title="Take Screenshot">
                  <Camera className="w-4 h-4" />
                  <span className="ml-2 text-xs">Screenshot</span>
                </Button>
                <Button variant="outline" size="sm" onClick={shareLocation} title="Share Location">
                  <Share className="w-4 h-4" />
                  <span className="ml-2 text-xs">Share</span>
                </Button>
              </div>
            </div>

            {/* Coordinates Display */}
            <div className="border-t pt-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Coordinates</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Lat: {coordinateDisplay.lat}</div>
                <div>Lon: {coordinateDisplay.lon}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Collapsed view - just a button at bottom-left
  return (
    <div 
      className="absolute z-50"
      style={{ left: position.x, bottom: 16 }}
    >
      <Button 
        onClick={() => setIsExpanded(true)}
        className="shadow-lg"
        title="Map Tools"
      >
        <Settings className="w-4 h-4 mr-2" />
        Map Tools
      </Button>
    </div>
  );
};

export default EsriMapTools;
