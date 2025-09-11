import React, { useEffect } from 'react';

interface MapDebuggerProps {
  view: any;
  graphicsLayer: any;
}

const MapDebugger: React.FC<MapDebuggerProps> = ({ view, graphicsLayer }) => {
  useEffect(() => {
    if (!view || !graphicsLayer) return;

    // Add debugging functions to the global window object
    (window as any).debugGraphics = () => {
      console.log('=== GRAPHICS DEBUG INFO ===');
      console.log('View:', view);
      console.log('Graphics Layer:', graphicsLayer);
      console.log('Graphics count:', graphicsLayer?.graphics?.length || 0);
      console.log('View extent:', view.extent);
      console.log('View center:', view.center);
      console.log('View zoom:', view.zoom);
      
      if (graphicsLayer && graphicsLayer.graphics && graphicsLayer.graphics.length > 0) {
        console.log('First 3 graphics:', graphicsLayer.graphics.items.slice(0, 3));
        
        const firstGraphic = graphicsLayer.graphics.items[0];
        console.log('First graphic geometry:', firstGraphic.geometry);
        console.log('First graphic symbol:', firstGraphic.symbol);
        console.log('First graphic attributes:', firstGraphic.attributes);
      }
      
      console.log('Map layers:', view.map.layers.items);
      console.log('Graphics layer visible:', graphicsLayer.visible);
      console.log('Graphics layer opacity:', graphicsLayer.opacity);
    };

    (window as any).testSimpleGraphic = async () => {
      console.log('=== TESTING SIMPLE GRAPHIC ===');
      
      try {
        // Load ESRI modules
        const [Point, Graphic] = await new Promise<any[]>((resolve, reject) => {
          (require as any)(['esri/geometry/Point', 'esri/Graphic'], (...modules: any[]) => {
            resolve(modules);
          }, (error: any) => {
            reject(error);
          });
        });

        // Clear existing graphics
        graphicsLayer.removeAll();
        
        // Add a simple red circle at Sacramento center
        const point = new Point({
          longitude: -121.5,
          latitude: 38.7,
          spatialReference: { wkid: 4326 }
        });

        const symbol = {
          type: "simple-marker",
          color: [255, 0, 0, 1], // Red
          size: 20,
          outline: {
            color: [255, 255, 255, 1], // White
            width: 2
          }
        };

        const graphic = new Graphic({
          geometry: point,
          symbol: symbol,
          attributes: { test: true }
        });

        graphicsLayer.add(graphic);
        
        // Zoom to the graphic
        await view.goTo({
          center: [point.longitude, point.latitude],
          zoom: 12
        });
        
        console.log('✅ Simple graphic added successfully');
        console.log('Graphics layer count:', graphicsLayer.graphics.length);
        
      } catch (error) {
        console.error('❌ Error creating simple graphic:', error);
      }
    };

    (window as any).testIconGraphic = async () => {
      console.log('=== TESTING ICON GRAPHIC ===');
      
      try {
        // Load ESRI modules
        const [Point, Graphic] = await new Promise<any[]>((resolve, reject) => {
          (require as any)(['esri/geometry/Point', 'esri/Graphic'], (...modules: any[]) => {
            resolve(modules);
          }, (error: any) => {
            reject(error);
          });
        });

        // Clear existing graphics
        graphicsLayer.removeAll();
        
        // Add an icon graphic at Sacramento center
        const point = new Point({
          longitude: -121.5,
          latitude: 38.7,
          spatialReference: { wkid: 4326 }
        });

        const symbol = {
          type: "picture-marker",
          url: "/icons/ev-marker-green.png",
          width: 24,
          height: 24
        };

        const graphic = new Graphic({
          geometry: point,
          symbol: symbol,
          attributes: { test: true, type: 'icon-test' }
        });

        graphicsLayer.add(graphic);
        
        // Zoom to the graphic
        await view.goTo({
          center: [point.longitude, point.latitude],
          zoom: 12
        });
        
        console.log('✅ Icon graphic added successfully');
        console.log('Graphics layer count:', graphicsLayer.graphics.length);
        
      } catch (error) {
        console.error('❌ Error creating icon graphic:', error);
      }
    };

    console.log('🐛 Map debugger loaded! Available functions:');
    console.log('  - debugGraphics() - Show debug info');
    console.log('  - testSimpleGraphic() - Test simple red circle');
    console.log('  - testIconGraphic() - Test EV icon');

  }, [view, graphicsLayer]);

  return null; // This component doesn't render anything
};

export default MapDebugger; 