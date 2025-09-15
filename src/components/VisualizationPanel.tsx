import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { BarChart3, PieChart, TrendingUp, Activity, Map, FileText, Database } from 'lucide-react';
import ChartVisualization from './ChartVisualization';
import VisualizationService, { VisualizationRequest } from '@/services/visualizationService';

interface SpatialLayer {
  id: string;
  name: string;
  category: string;
  featureCount: number;
  geometryType: string;
}

interface DocumentData {
  id: string;
  filename: string;
  fileType: string;
  hasStructuredData: boolean;
}

const VisualizationPanel: React.FC = () => {
  const [dataSource, setDataSource] = useState<'spatial' | 'document' | 'combined'>('spatial');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line' | 'scatter' | 'area'>('bar');
  const [analysisType, setAnalysisType] = useState<'count' | 'distribution' | 'correlation' | 'trend' | 'clustering' | 'summary'>('count');
  const [selectedSpatialLayers, setSelectedSpatialLayers] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [customQuery, setCustomQuery] = useState('');
  
  const [spatialLayers, setSpatialLayers] = useState<SpatialLayer[]>([]);
  const [documentData, setDocumentData] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [chartTitle, setChartTitle] = useState('');
  const [chartDescription, setChartDescription] = useState('');
  const [spatialContext, setSpatialContext] = useState<any>(null);
  const [documentContext, setDocumentContext] = useState<any>(null);
  
  const { toast } = useToast();
  const visualizationService = new VisualizationService();

  useEffect(() => {
    loadAvailableData();
  }, []);

  const loadAvailableData = async () => {
    try {
      const [spatialLayersData, documentDataResult] = await Promise.all([
        visualizationService.getAvailableSpatialLayers(),
        visualizationService.getAvailableDocumentData()
      ]);
      
      setSpatialLayers(spatialLayersData);
      setDocumentData(documentDataResult);
    } catch (error) {
      console.error('Error loading available data:', error);
      toast({
        title: "Error",
        description: "Failed to load available data sources",
        variant: "destructive",
      });
    }
  };

  const handleSpatialLayerToggle = (layerId: string) => {
    setSelectedSpatialLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const handleDocumentToggle = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const generateVisualization = async () => {
    if (dataSource === 'spatial' && selectedSpatialLayers.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one spatial layer",
        variant: "destructive",
      });
      return;
    }

    if (dataSource === 'document' && selectedDocuments.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one document",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const request: VisualizationRequest = {
        dataSource,
        chartType,
        spatialLayers: selectedSpatialLayers,
        documentIds: selectedDocuments,
        analysisType,
        customQuery: customQuery || undefined
      };

      let result;
      if (dataSource === 'spatial') {
        result = await visualizationService.generateSpatialVisualization(request);
      } else if (dataSource === 'document') {
        result = await visualizationService.generateDocumentVisualization(request);
      } else {
        result = await visualizationService.generateCombinedVisualization(request);
      }

      if (result.success) {
        setChartData(result.data);
        setChartTitle(result.title);
        setChartDescription(result.description);
        setSpatialContext(result.spatialContext);
        setDocumentContext(result.documentContext);
        
        toast({
          title: "Success",
          description: "Visualization generated successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to generate visualization');
      }
    } catch (error) {
      console.error('Error generating visualization:', error);
      toast({
        title: "Error",
        description: "Failed to generate visualization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'pie', label: 'Pie Chart', icon: PieChart },
    { value: 'line', label: 'Line Chart', icon: TrendingUp },
    { value: 'scatter', label: 'Scatter Plot', icon: Activity },
    { value: 'area', label: 'Area Chart', icon: TrendingUp }
  ];

  const analysisTypeOptions = [
    { value: 'count', label: 'Count Analysis' },
    { value: 'distribution', label: 'Distribution Analysis' },
    { value: 'correlation', label: 'Correlation Analysis' },
    { value: 'trend', label: 'Trend Analysis' },
    { value: 'clustering', label: 'Clustering Analysis' },
    { value: 'summary', label: 'Summary Statistics' }
  ];

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dynamic Visualization Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Source Selection */}
          <div>
            <Label className="text-sm font-medium">Data Source</Label>
            <div className="flex gap-4 mt-2">
              <Button
                variant={dataSource === 'spatial' ? 'default' : 'outline'}
                onClick={() => setDataSource('spatial')}
                className="flex items-center gap-2"
              >
                <Map className="h-4 w-4" />
                Spatial Data
              </Button>
              <Button
                variant={dataSource === 'document' ? 'default' : 'outline'}
                onClick={() => setDataSource('document')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Document Data
              </Button>
              <Button
                variant={dataSource === 'combined' ? 'default' : 'outline'}
                onClick={() => setDataSource('combined')}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Combined
              </Button>
            </div>
          </div>

          {/* Chart Type Selection */}
          <div>
            <Label className="text-sm font-medium">Chart Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
              {chartTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={chartType === option.value ? 'default' : 'outline'}
                    onClick={() => setChartType(option.value as any)}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Analysis Type Selection */}
          <div>
            <Label className="text-sm font-medium">Analysis Type</Label>
            <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {analysisTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Selection */}
          {dataSource === 'spatial' && (
            <div>
              <Label className="text-sm font-medium">Select Spatial Layers</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                {spatialLayers.map((layer) => (
                  <div key={layer.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={layer.id}
                      checked={selectedSpatialLayers.includes(layer.id)}
                      onCheckedChange={() => handleSpatialLayerToggle(layer.id)}
                    />
                    <Label htmlFor={layer.id} className="text-sm flex-1">
                      <div className="flex items-center justify-between">
                        <span>{layer.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {layer.featureCount.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">{layer.category}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dataSource === 'document' && (
            <div>
              <Label className="text-sm font-medium">Select Documents</Label>
              <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                {documentData.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={doc.id}
                      checked={selectedDocuments.includes(doc.id)}
                      onCheckedChange={() => handleDocumentToggle(doc.id)}
                    />
                    <Label htmlFor={doc.id} className="text-sm flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{doc.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.fileType.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {doc.hasStructuredData ? 'Structured Data Available' : 'Text Only'}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Query */}
          <div>
            <Label className="text-sm font-medium">Custom Query (Optional)</Label>
            <Input
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Enter a custom analysis query..."
              className="mt-2"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateVisualization}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Generating...' : 'Generate Visualization'}
          </Button>
        </CardContent>
      </Card>

      {/* Chart Display */}
      {chartData && (
        <ChartVisualization
          chartType={chartType}
          data={chartData}
          title={chartTitle}
          description={chartDescription}
          spatialContext={spatialContext}
          documentContext={documentContext}
          height={500}
        />
      )}
    </div>
  );
};

export default VisualizationPanel;
