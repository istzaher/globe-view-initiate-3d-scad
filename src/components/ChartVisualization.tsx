import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

interface ChartVisualizationProps {
  chartType: 'bar' | 'pie' | 'line' | 'scatter' | 'area';
  data: ChartData;
  title: string;
  description: string;
  spatialContext?: {
    layers: string[];
    totalFeatures: number;
    analysisType: string;
  };
  documentContext?: {
    documents: string[];
    analysisType: string;
  };
  height?: number;
}

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'];

const ChartVisualization: React.FC<ChartVisualizationProps> = ({
  chartType,
  data,
  title,
  description,
  spatialContext,
  documentContext,
  height = 400
}) => {
  // Transform data for Recharts
  const rechartsData = data.labels.map((label, index) => {
    const dataPoint: any = { name: label };
    data.datasets.forEach((dataset, datasetIndex) => {
      dataPoint[dataset.label] = dataset.data[index] || 0;
    });
    return dataPoint;
  });

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={rechartsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset, index) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                fill={Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[index] : dataset.backgroundColor || COLORS[index % COLORS.length]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        const pieData = data.labels.map((label, index) => ({
          name: label,
          value: data.datasets[0]?.data[index] || 0
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case 'line':
        return (
          <LineChart data={rechartsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset, index) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={Array.isArray(dataset.borderColor) ? dataset.borderColor[index] : dataset.borderColor || COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case 'scatter':
        return (
          <ScatterChart data={rechartsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset, index) => (
              <Scatter
                key={dataset.label}
                dataKey={dataset.label}
                fill={Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[index] : dataset.backgroundColor || COLORS[index % COLORS.length]}
              />
            ))}
          </ScatterChart>
        );

      case 'area':
        return (
          <AreaChart data={rechartsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset, index) => (
              <Area
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stackId="1"
                stroke={Array.isArray(dataset.borderColor) ? dataset.borderColor[index] : dataset.borderColor || COLORS[index % COLORS.length]}
                fill={Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[index] : dataset.backgroundColor || COLORS[index % COLORS.length]}
              />
            ))}
          </AreaChart>
        );

      default:
        return <div>Unsupported chart type: {chartType}</div>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{chartType.toUpperCase()}</Badge>
            {spatialContext && (
              <Badge variant="secondary">Spatial Data</Badge>
            )}
            {documentContext && (
              <Badge variant="secondary">Document Data</Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Context Information */}
        {(spatialContext || documentContext) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis Context</h4>
            {spatialContext && (
              <div className="text-xs text-gray-600">
                <p><strong>Layers:</strong> {spatialContext.layers.join(', ')}</p>
                <p><strong>Total Features:</strong> {spatialContext.totalFeatures.toLocaleString()}</p>
                <p><strong>Analysis Type:</strong> {spatialContext.analysisType}</p>
              </div>
            )}
            {documentContext && (
              <div className="text-xs text-gray-600">
                <p><strong>Documents:</strong> {documentContext.documents.length} document(s)</p>
                <p><strong>Analysis Type:</strong> {documentContext.analysisType}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartVisualization;
