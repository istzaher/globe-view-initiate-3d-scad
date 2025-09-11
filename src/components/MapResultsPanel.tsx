import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  X, 
  Download, 
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

interface QueryResult {
  success: boolean;
  data: any[];
  count: number;
  layer?: string;
  query?: string;
  error?: string;
}

interface MapResultsPanelProps {
  results: QueryResult | null;
  onClearResults: () => void;
  onFeatureClick?: (feature: any) => void;
  isVisible?: boolean;
}

export const MapResultsPanel: React.FC<MapResultsPanelProps> = ({
  results,
  onClearResults,
  onFeatureClick,
  isVisible = true
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    if (results?.data) {
      const filtered = results.data.filter(feature => {
        if (!filterTerm) return true;
        
        const searchTerm = filterTerm.toLowerCase();
        const attributes = feature.attributes || {};
        
        return Object.values(attributes).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        );
      });
      
      setFilteredResults(filtered);
    } else {
      setFilteredResults([]);
    }
  }, [results, filterTerm]);

  if (!isVisible || !results || !results.success || results.count === 0) {
    return null;
  }

  const handleFeatureClick = (feature: any) => {
    if (onFeatureClick) {
      onFeatureClick(feature);
    }
  };

  const handleDownload = () => {
    if (!results.data) return;
    
    try {
      const csvContent = convertToCSV(results.data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `query_results_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading results:', error);
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const attributes = data[0].attributes || {};
    const headers = Object.keys(attributes);
    
    const csvRows = [
      headers.join(','),
      ...data.map(feature => 
        headers.map(header => {
          const value = feature.attributes?.[header] || '';
          return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const formatAttributeValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    
    // Format specific field types
    if (key.toLowerCase().includes('date') && typeof value === 'number') {
      return new Date(value).toLocaleDateString();
    }
    
    if (typeof value === 'number' && value > 1000000) {
      return value.toLocaleString();
    }
    
    return value.toString();
  };

  return (
    <div className="absolute bottom-4 right-4 w-96 max-h-96 z-10">
      <Card className="shadow-lg">
        {/* Commented out header as requested */}
        {/*
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Query Results ({results.count})
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearResults}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {results.layer && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {results.layer}
              </Badge>
              {results.query && (
                <span className="text-xs text-muted-foreground truncate">
                  {results.query}
                </span>
              )}
            </div>
          )}
        </CardHeader>
        */}
        
        {isExpanded && (
          <CardContent className="p-3">
            {/* Action buttons */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                CSV
              </Button>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Results list */}
            <div className="h-64 overflow-y-auto">
              <div className="space-y-2">
                {filteredResults.map((feature, index) => {
                  const attributes = feature.attributes || {};
                  const name = attributes.Name || attributes.name || `Feature ${index + 1}`;
                  const type = attributes.Type || attributes.type || 'Unknown';
                  const district = attributes.District || attributes.district || '';
                  
                  return (
                    <div
                      key={index}
                      className="p-2 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleFeatureClick(feature)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                            {district && (
                              <span className="text-xs text-muted-foreground">
                                {district}
                              </span>
                            )}
                          </div>
                          
                          {/* Additional attributes */}
                          <div className="mt-1 space-y-1">
                            {Object.entries(attributes)
                              .filter(([key]) => 
                                !['OBJECTID', 'Name', 'Type', 'District', 'name', 'type', 'district'].includes(key)
                              )
                              .slice(0, 2)
                              .map(([key, value]) => (
                                <div key={key} className="text-xs text-muted-foreground">
                                  {key}: {formatAttributeValue(key, value)}
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {filteredResults.length === 0 && filterTerm && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No results match "{filterTerm}"
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default MapResultsPanel;