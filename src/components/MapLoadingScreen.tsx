import React from 'react';
import { Globe } from 'lucide-react';

const MapLoadingScreen = () => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900">
      <div className="text-center text-white">
        <Globe className="w-16 h-16 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Loading 3D Globe</h2>
        <p className="text-slate-400">Initializing geographic visualization...</p>
      </div>
    </div>
  );
};

export default MapLoadingScreen;
