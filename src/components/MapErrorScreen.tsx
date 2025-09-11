import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface MapErrorScreenProps {
  error: string;
  onRetry: () => void;
}

const MapErrorScreen: React.FC<MapErrorScreenProps> = ({ error, onRetry }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900">
      <div className="text-center text-white max-w-md px-6">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">Map Loading Error</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <Button 
          onClick={onRetry}
          variant="outline"
          className="bg-transparent border-white text-white hover:bg-white hover:text-slate-900"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
};

export default MapErrorScreen;
