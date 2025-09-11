import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Eye, EyeOff, Layers } from 'lucide-react';

interface LayerInfo {
  id: string;
  title: string;
  visible: boolean;
  category: 'demo' | 'geodatabase';
  featureCount?: number;
}

interface LayerVisibilityControlProps {
  view: any;
  onLayerVisibilityChange?: (layerId: string, visible: boolean) => void;
  onVisibleLayersChange?: (visibleLayers: string[]) => void;
}

export const LayerVisibilityControl: React.FC<LayerVisibilityControlProps> = ({
  view,
  onLayerVisibilityChange,
  onVisibleLayersChange
}) => {
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!view) return;

    const updateLayerInfo = async () => {
      try {
        setIsLoading(true);
        
        // Get all layers from the map
        const mapLayers = view.map.layers.items;
        const layerInfos: LayerInfo[] = [];

        for (const layer of mapLayers) {
          if (layer.title && layer.title !== 'Query Results' && layer.title !== 'Spatial Analysis Results') {
            // Determine category based on title
            const category = layer.title.includes('(GDB)') ? 'geodatabase' : 'demo';
            
            // Try to get feature count
            let featureCount = 0;
            try {
              if (layer.queryFeatures) {
                const result = await layer.queryFeatures({
                  where: '1=1',
                  returnCountOnly: true
                });
                featureCount = result.count || 0;
              }
            } catch (error) {
              console.warn(`Could not get feature count for ${layer.title}:`, error);
            }

            layerInfos.push({
              id: layer.id,
              title: layer.title,
              visible: layer.visible,
              category,
              featureCount
            });
          }
        }

        setLayers(layerInfos);
      } catch (error) {
        console.error('Error updating layer info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    updateLayerInfo();

    // Watch for layer changes
    const handle = view.map.layers.on('change', updateLayerInfo);

    return () => {
      handle.remove();
    };
  }, [view]);

  useEffect(() => {
    // Notify parent of visible layers changes
    if (onVisibleLayersChange) {
      const visibleLayers = layers.filter(layer => layer.visible).map(layer => layer.id);
      onVisibleLayersChange(visibleLayers);
    }
  }, [layers, onVisibleLayersChange]);

  const toggleLayerVisibility = async (layerId: string) => {
    if (!view) return;

    try {
      const layer = view.map.layers.find((l: any) => l.id === layerId);
      if (layer) {
        layer.visible = !layer.visible;
        
        // Update local state
        setLayers(prevLayers =>
          prevLayers.map(l =>
            l.id === layerId ? { ...l, visible: layer.visible } : l
          )
        );

        // Notify parent
        if (onLayerVisibilityChange) {
          onLayerVisibilityChange(layerId, layer.visible);
        }

        console.log(`👁️ Toggled layer visibility: ${layer.title} -> ${layer.visible}`);
      }
    } catch (error) {
      console.error('Error toggling layer visibility:', error);
    }
  };

  const groupLayersByCategory = () => {
    const demoLayers = layers.filter(layer => layer.category === 'demo');
    const gdbLayers = layers.filter(layer => layer.category === 'geodatabase');
    
    return { demoLayers, gdbLayers };
  };

  const { demoLayers, gdbLayers } = groupLayersByCategory();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Layer Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading layers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Layer Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Demo Layers */}
        {demoLayers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Demo Layers</h4>
            <div className="space-y-2">
              {demoLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {layer.visible ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {layer.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Demo
                        </Badge>
                        {layer.featureCount !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {layer.featureCount} features
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="h-8 w-8 p-0"
                  >
                    {layer.visible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geodatabase Layers */}
        {gdbLayers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Geodatabase Layers</h4>
            <div className="space-y-2">
              {gdbLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {layer.visible ? (
                        <Eye className="h-4 w-4 text-blue-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {layer.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          GDB
                        </Badge>
                        {layer.featureCount !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {layer.featureCount} features
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="h-8 w-8 p-0"
                  >
                    {layer.visible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {layers.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No layers available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LayerVisibilityControl;