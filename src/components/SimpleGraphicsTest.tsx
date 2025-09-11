import React, { useEffect } from 'react';

interface SimpleGraphicsTestProps {
  view: any;
  graphicsLayer: any;
}

const SimpleGraphicsTest: React.FC<SimpleGraphicsTestProps> = ({ view, graphicsLayer }) => {
  
  const addSimpleMarkers = async () => {
    if (!view || !graphicsLayer) {
      console.log('❌ View or graphics layer not ready');
      return;
    }

    try {
      console.log('🧪 Starting simple graphics test...');
      
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
      console.log('🧹 Cleared existing graphics');

      // Test 1: Sacramento area (where EV stations should be)
      const sacramentoPoint = new Point({
        longitude: -121.4690,
        latitude: 38.5816,
        spatialReference: { wkid: 4326 }
      });

      const sacramentoGraphic = new Graphic({
        geometry: sacramentoPoint,
        symbol: {
          type: "simple-marker",
          color: [255, 0, 0, 1], // Red
          size: 20,
          outline: { color: [255, 255, 255, 1], width: 2 }
        },
        attributes: { name: "Sacramento Test Point" }
      });

      // Test 2: La Mesa area (where electrical infrastructure should be)
      const laMesaPoint = new Point({
        longitude: -117.0230,
        latitude: 32.7678,
        spatialReference: { wkid: 4326 }
      });

      const laMesaGraphic = new Graphic({
        geometry: laMesaPoint,
        symbol: {
          type: "simple-marker",
          color: [0, 255, 0, 1], // Green
          size: 20,
          outline: { color: [255, 255, 255, 1], width: 2 }
        },
        attributes: { name: "La Mesa Test Point" }
      });

      // Test 3: Picture marker test
      const iconTestPoint = new Point({
        longitude: -121.5,
        latitude: 38.7,
        spatialReference: { wkid: 4326 }
      });

      const iconGraphic = new Graphic({
        geometry: iconTestPoint,
        symbol: {
          type: "picture-marker",
          url: "/icons/ev-marker-green.png",
          width: 24,
          height: 24
        },
        attributes: { name: "Icon Test Point" }
      });

      // Add all graphics
      graphicsLayer.add(sacramentoGraphic);
      graphicsLayer.add(laMesaGraphic);
      graphicsLayer.add(iconGraphic);

      console.log('✅ Added 3 test graphics to layer');
      console.log('📊 Graphics layer count:', graphicsLayer.graphics.length);
      console.log('📍 Graphics layer visible:', graphicsLayer.visible);
      console.log('🔍 Graphics layer opacity:', graphicsLayer.opacity);

      // Zoom to show all test points
      await view.goTo({
        center: [-119.5, 36.0], // Center between Sacramento and San Diego
        zoom: 6
      });

      console.log('🔍 Zoomed to overview of California');

      // Also expose individual test functions
      (window as any).zoomToSacramento = () => {
        view.goTo({
          center: [-121.4690, 38.5816],
          zoom: 12
        });
      };

      (window as any).zoomToLaMesa = () => {
        view.goTo({
          center: [-117.0230, 32.7678],
          zoom: 12
        });
      };

      (window as any).zoomToIcon = () => {
        view.goTo({
          center: [-121.5, 38.7],
          zoom: 12
        });
      };

      console.log('🧪 Simple graphics test completed!');
      console.log('Available zoom functions: zoomToSacramento(), zoomToLaMesa(), zoomToIcon()');

    } catch (error) {
      console.error('❌ Error in simple graphics test:', error);
    }
  };

  useEffect(() => {
    if (view && graphicsLayer) {
      // Add test function to window
      (window as any).runSimpleGraphicsTest = addSimpleMarkers;
      console.log('🧪 Simple graphics test loaded! Call runSimpleGraphicsTest() to run test.');
    }
  }, [view, graphicsLayer]);

  return null;
};

export default SimpleGraphicsTest; 