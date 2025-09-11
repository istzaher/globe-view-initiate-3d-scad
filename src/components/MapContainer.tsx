import React, { forwardRef } from 'react';
import MapInfoBar from './MapInfoBar';

const MapContainer = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div className="w-full h-full relative">
      <div
        ref={ref}
        data-testid="map-container"
        className="w-full h-full absolute top-0 left-0"
        style={{ 
          background: '#1a1a1a',
          width: '100%',
          height: '100%',
          minHeight: '400px'
        }}
      />
      
      {/* Header Controls on Map */}
      <div className="absolute top-4 left-4 right-4 z-40 flex gap-4">
        {/* Search */}
      </div>

      <MapInfoBar />
    </div>
  );
});

MapContainer.displayName = 'MapContainer';

export default MapContainer;
