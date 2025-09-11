import { loadModules } from 'esri-loader';

interface FeatureLayerConfig {
  id: string;
  title: string;
  url: string;
  visible: boolean;
  renderer?: any;
  popupTemplate?: any;
}

export class FeatureLayerService {
  private view: any = null;
  private layers: Map<string, any> = new Map();
  private graphicsLayer: any = null;

  constructor() {
    console.log('🗺️ FeatureLayerService initialized');
  }

  async setMapView(view: any) {
    this.view = view;
    console.log('🗺️ Map view set for FeatureLayerService');

    // Initialize graphics layer for query results
    await this.initializeGraphicsLayer();
  }

  async addFeatureLayer(config: FeatureLayerConfig): Promise<any> {
    if (!this.view) {
      console.error('❌ Map view not set');
      return null;
    }

    // Skip layers with empty URLs (client-side layers)
    if (!config.url || config.url === '') {
      console.log(`⏭️ Skipping client-side layer: ${config.title}`);
      return null;
    }

    try {
      console.log(`➕ Adding feature layer: ${config.title}`);
      
      const [FeatureLayer] = await loadModules(['esri/layers/FeatureLayer']);
      
      const layerOptions: any = {
        url: config.url,
        title: config.title,
        visible: config.visible
      };

      if (config.renderer) {
        layerOptions.renderer = config.renderer;
      }

      if (config.popupTemplate) {
        layerOptions.popupTemplate = config.popupTemplate;
      }

      const layer = new FeatureLayer(layerOptions);
      
      await layer.load();
      this.view.map.add(layer);
      this.layers.set(config.id, layer);
      
      console.log(`✅ Layer ${config.title} added successfully`);
      return layer;
    } catch (error) {
      console.error(`❌ Error adding layer ${config.title}:`, error);
      return null;
    }
  }

  async loadLayers(configs: FeatureLayerConfig[]): Promise<void> {
    console.log(`📦 Loading ${configs.length} feature layers...`);
    
    for (const config of configs) {
      await this.addFeatureLayer(config);
    }
    
    console.log('✅ All feature layers loaded');
  }

  async queryFeatures(layerId: string, query: any = {}): Promise<any[]> {
    const layer = this.layers.get(layerId);
    if (!layer) {
      console.error(`❌ Layer ${layerId} not found`);
      return [];
    }

    try {
      const [Query] = await loadModules(['esri/rest/support/Query']);
      
      const queryObj = new Query({
        where: query.where || '1=1',
        outFields: query.outFields || ['*'],
        returnGeometry: query.returnGeometry !== false,
        spatialRelationship: query.spatialRelationship || 'intersects'
      });

      if (query.geometry) {
        queryObj.geometry = query.geometry;
        queryObj.distance = query.distance || 1000;
        queryObj.units = query.units || 'meters';
      }

      const result = await layer.queryFeatures(queryObj);
      console.log(`🔍 Query returned ${result.features.length} features`);
      return result.features;
    } catch (error) {
      console.error(`❌ Error querying layer ${layerId}:`, error);
      return [];
    }
  }

  private async initializeGraphicsLayer(): Promise<void> {
    if (!this.view) {
      console.error('❌ Map view not available for graphics layer initialization');
      return;
    }

    if (this.graphicsLayer) {
      console.log('✅ Graphics layer already initialized');
      return;
    }

    try {
      const [GraphicsLayer] = await loadModules(['esri/layers/GraphicsLayer']);
      
      this.graphicsLayer = new GraphicsLayer({
        title: 'Query Results',
        listMode: 'hide'
      });
      
      this.view.map.add(this.graphicsLayer);
      console.log('✅ Graphics layer initialized');
    } catch (error) {
      console.error('❌ Error initializing graphics layer:', error);
    }
  }

  async addGraphicsToMap(features: any[], symbol?: any): Promise<void> {
    if (!this.graphicsLayer) {
      if (!this.view) {
        console.warn('⚠️ Graphics layer and map view not available, skipping graphics display');
        return;
      }
      console.warn('⚠️ Graphics layer not initialized, initializing now...');
      await this.initializeGraphicsLayer();
      if (!this.graphicsLayer) {
        console.error('❌ Failed to initialize graphics layer');
        return;
      }
    }

    try {
      const [Graphic] = await loadModules(['esri/Graphic']);
      
      const graphics = features.map(feature => {
        return new Graphic({
          geometry: feature.geometry,
          attributes: feature.attributes,
          symbol: symbol || {
            type: 'simple-marker',
            color: [255, 0, 0],
            size: 8,
            outline: {
              color: [255, 255, 255],
              width: 1
            }
          }
        });
      });

      this.graphicsLayer.addMany(graphics);
      console.log(`✅ Added ${graphics.length} graphics to map`);
    } catch (error) {
      console.error('❌ Error adding graphics to map:', error);
    }
  }

  clearGraphics(): void {
    if (this.graphicsLayer) {
      this.graphicsLayer.removeAll();
      console.log('🧹 Cleared all graphics from map');
    }
  }

  async highlightFeatures(features: any[]): Promise<void> {
    if (!features || features.length === 0) return;

    try {
      const [Graphic] = await loadModules(['esri/Graphic']);
      
      // Clear existing highlights
      this.clearGraphics();

      // Add highlighted graphics
      const highlightSymbol = {
        type: 'simple-marker',
        color: [255, 255, 0, 0.8],
        size: 12,
        outline: {
          color: [255, 0, 0],
          width: 2
        }
      };

      await this.addGraphicsToMap(features, highlightSymbol);

      // Zoom to features if there are any
      if (features.length > 0 && this.view) {
        const geometries = features.map(f => f.geometry).filter(g => g);
        if (geometries.length > 0) {
          await this.view.goTo(geometries);
        }
      }
    } catch (error) {
      console.error('❌ Error highlighting features:', error);
    }
  }

  getLayer(layerId: string): any {
    return this.layers.get(layerId);
  }

  getAllLayers(): Map<string, any> {
    return this.layers;
  }

  async removeLayer(layerId: string): Promise<void> {
    const layer = this.layers.get(layerId);
    if (layer && this.view) {
      this.view.map.remove(layer);
      this.layers.delete(layerId);
      console.log(`🗑️ Removed layer: ${layerId}`);
    }
  }

  async toggleLayerVisibility(layerId: string): Promise<void> {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.visible = !layer.visible;
      console.log(`👁️ Toggled layer visibility: ${layerId} -> ${layer.visible}`);
    }
  }
}

export default FeatureLayerService;
