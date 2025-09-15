/**
 * Visualization Service for Dynamic Chart and Visualization Creation
 * Supports both spatial map data and structured/unstructured document data
 */

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface SpatialAnalysisResult {
  type: 'spatial';
  chartType: 'bar' | 'pie' | 'line' | 'scatter' | 'heatmap';
  data: ChartData;
  title: string;
  description: string;
  spatialContext: {
    layer: string;
    geometryType: string;
    totalFeatures: number;
    bounds?: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    };
  };
}

export interface DocumentAnalysisResult {
  type: 'document';
  chartType: 'bar' | 'pie' | 'line' | 'wordcloud' | 'timeline';
  data: ChartData;
  title: string;
  description: string;
  documentContext: {
    filename: string;
    fileType: string;
    extractedData: any;
  };
}

export interface VisualizationRequest {
  dataSource: 'spatial' | 'document' | 'combined';
  chartType: 'bar' | 'pie' | 'line' | 'scatter' | 'heatmap' | 'wordcloud' | 'timeline';
  spatialLayers?: string[];
  documentIds?: string[];
  analysisType: 'count' | 'distribution' | 'correlation' | 'trend' | 'clustering' | 'summary';
  filters?: {
    category?: string;
    dateRange?: { start: string; end: string };
    spatialBounds?: { minX: number; minY: number; maxX: number; maxY: number };
    customFilters?: Record<string, any>;
  };
  customQuery?: string;
}

export class VisualizationService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'http://localhost:8000') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Generate visualization from spatial map data
   */
  async generateSpatialVisualization(request: VisualizationRequest): Promise<SpatialAnalysisResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/visualize-spatial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating spatial visualization:', error);
      throw error;
    }
  }

  /**
   * Generate visualization from uploaded document data
   */
  async generateDocumentVisualization(request: VisualizationRequest): Promise<DocumentAnalysisResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/visualize-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating document visualization:', error);
      throw error;
    }
  }

  /**
   * Generate combined visualization from both spatial and document data
   */
  async generateCombinedVisualization(request: VisualizationRequest): Promise<SpatialAnalysisResult | DocumentAnalysisResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/visualize-combined`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating combined visualization:', error);
      throw error;
    }
  }

  /**
   * Get available spatial layers for visualization
   */
  async getAvailableSpatialLayers(): Promise<Array<{id: string; name: string; category: string; featureCount: number}>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/spatial-layers`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.layers || [];
    } catch (error) {
      console.error('Error fetching spatial layers:', error);
      return [];
    }
  }

  /**
   * Get available document data for visualization
   */
  async getAvailableDocumentData(): Promise<Array<{id: string; filename: string; fileType: string; hasStructuredData: boolean}>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/uploaded-documents`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.documents?.map((doc: any) => ({
        id: doc.file_id,
        filename: doc.filename,
        fileType: doc.metadata?.mime_type || 'unknown',
        hasStructuredData: doc.metadata?.rows > 0 || doc.metadata?.columns > 0
      })) || [];
    } catch (error) {
      console.error('Error fetching document data:', error);
      return [];
    }
  }

  /**
   * Generate chart configuration for Recharts
   */
  generateRechartsConfig(data: ChartData, chartType: string) {
    const baseConfig = {
      data: data.labels.map((label, index) => ({
        name: label,
        value: data.datasets[0]?.data[index] || 0,
        ...data.datasets.reduce((acc, dataset, datasetIndex) => {
          acc[dataset.label] = dataset.data[index] || 0;
          return acc;
        }, {} as Record<string, any>)
      }))
    };

    switch (chartType) {
      case 'bar':
        return {
          ...baseConfig,
          type: 'bar',
          xAxisKey: 'name',
          yAxisKey: 'value'
        };
      case 'pie':
        return {
          ...baseConfig,
          type: 'pie',
          dataKey: 'value',
          nameKey: 'name'
        };
      case 'line':
        return {
          ...baseConfig,
          type: 'line',
          xAxisKey: 'name',
          yAxisKey: 'value'
        };
      case 'scatter':
        return {
          ...baseConfig,
          type: 'scatter',
          xAxisKey: 'x',
          yAxisKey: 'y'
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Generate color palette for charts
   */
  generateColorPalette(count: number): string[] {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
      '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
    ];
    
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  }
}

export default VisualizationService;
