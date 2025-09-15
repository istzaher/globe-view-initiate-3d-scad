import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Loader2, MapPin, AlertCircle } from 'lucide-react';

interface NLQueryInterfaceProps {
  onQuery: (query: string) => Promise<any>;
  isLoading?: boolean;
  results?: any;
  error?: string | null;
}

export const NLQueryInterface: React.FC<NLQueryInterfaceProps> = ({
  onQuery,
  isLoading = false,
  results,
  error
}) => {
  const [query, setQuery] = useState('');
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [suggestions] = useState<string[]>([
    'Show me buildings',
    'Show all schools in Abu Dhabi',
    'Find hospitals near Emirates Palace',
    'List universities in Al Ain',
    'Show police stations in Khalifa City',
    'Find all educational facilities from geodatabase',
    'Show healthcare facilities in Abu Dhabi Island',
    'Display infrastructure projects',
    'Show transportation network',
    'Find environmental protected areas'
  ]);

  useEffect(() => {
    // Load recent queries from localStorage
    const saved = localStorage.getItem('nlquery_recent');
    if (saved) {
      try {
        setRecentQueries(JSON.parse(saved));
      } catch (error) {
        console.warn('Could not load recent queries:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    try {
      await onQuery(query);
      
      // Add to recent queries
      const newRecent = [query, ...recentQueries.filter(q => q !== query)].slice(0, 5);
      setRecentQueries(newRecent);
      localStorage.setItem('nlquery_recent', JSON.stringify(newRecent));
      
      setQuery('');
    } catch (error) {
      console.error('Query failed:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Natural Language Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about Abu Dhabi data... (e.g., 'Show all schools in Abu Dhabi')"
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={!query.trim() || isLoading}
                size="default"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {results && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Query Results</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Found {results.count || 0} features
                {results.layer && (
                  <Badge variant="outline" className="ml-2">
                    {results.layer}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Suggested Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto p-2"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
              >
                <span className="text-xs text-muted-foreground truncate">
                  {suggestion}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentQueries.map((recentQuery, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleRecentClick(recentQuery)}
                  disabled={isLoading}
                >
                  <span className="text-xs text-muted-foreground truncate">
                    {recentQuery}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NLQueryInterface;