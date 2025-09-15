import React from 'react';
import VisualizationPanel from '@/components/VisualizationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Map, FileText, Database } from 'lucide-react';

const Visualization: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Dynamic Chart & Visualization Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Create interactive charts and visualizations from both spatial map data and uploaded documents. 
            Analyze patterns, trends, and relationships across your data sources.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Map className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Spatial Data Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Analyze Abu Dhabi's spatial datasets including bus stops, mosques, parks, 
                buildings, and road networks with interactive visualizations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Document Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Extract insights from uploaded documents including PDFs, Word docs, 
                Excel files, and CSV data through AI-powered analysis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Database className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Combined Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Cross-reference spatial and document data to discover hidden patterns 
                and relationships across different data sources.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visualization Panel */}
        <VisualizationPanel />

        {/* Chart Types Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Supported Chart Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium">Bar Charts</h3>
                <p className="text-xs text-gray-600">Compare categories and counts</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="h-8 w-8 bg-green-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <h3 className="font-medium">Pie Charts</h3>
                <p className="text-xs text-gray-600">Show proportions and percentages</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="h-8 w-8 bg-orange-600 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">L</span>
                </div>
                <h3 className="font-medium">Line Charts</h3>
                <p className="text-xs text-gray-600">Track trends over time</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="h-8 w-8 bg-purple-600 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                <h3 className="font-medium">Scatter Plots</h3>
                <p className="text-xs text-gray-600">Explore correlations</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="h-8 w-8 bg-red-600 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <h3 className="font-medium">Area Charts</h3>
                <p className="text-xs text-gray-600">Show cumulative data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Visualization;
