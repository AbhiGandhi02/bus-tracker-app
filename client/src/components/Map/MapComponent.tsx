import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import type { ViewState } from 'react-map-gl';
import { Bus, BusMapProps } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { busAPI } from '../../services/api';
import { BusFront, Loader2 } from 'lucide-react';
import config from '../../config';

// Socket update interface
interface BusLocationUpdate {
  busId: string;
  busNumber: string;
  location: {
    lat: number;
    lng: number;
    timestamp: Date | string;
  };
}

// Helper to determine bus color based on status
const getBusColor = (status: Bus['status']) => {
  switch (status) {
    case 'Active':
      return '#4f46e5'; // Indigo
    case 'Inactive':
      return '#6b7280'; // Gray
    case 'Maintenance':
      return '#db2777'; // Pink
    default:
      return '#6b7280';
  }
};

const MapComponent: React.FC<BusMapProps> = ({ buses, selectedBus: selectedBusId }) => {
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { socket } = useSocket();

  const [viewState, setViewState] = useState<Partial<ViewState>>(config.MAP_DEFAULTS);

  // Set initial map center when buses prop changes
  useEffect(() => {
    if (buses.length > 0) {
      const firstBusWithLocation = buses.find(
        bus => bus.location && bus.location.lat && bus.location.lng
      );
      if (firstBusWithLocation) {
        setViewState((prev) => ({
          ...prev,
          latitude: firstBusWithLocation.location.lat,
          longitude: firstBusWithLocation.location.lng,
        }));
      }
    }
  }, [buses]);

  // Update selectedBus when selectedBusId changes
  useEffect(() => {
    if (selectedBusId) {
      const bus = buses.find(b => b._id === selectedBusId);
      if (bus) {
        setSelectedBus(bus);
      }
    } else {
      setSelectedBus(null);
    }
  }, [selectedBusId, buses]);

  // Create Marker components
  const markers = useMemo(() => 
    buses
      .filter(bus => bus.location && bus.location.lat && bus.location.lng) // Only render buses with valid locations
      .map(bus => (
        <Marker
          key={bus._id}
          longitude={bus.location.lng}
          latitude={bus.location.lat}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedBus(bus);
          }}
        >
          <div 
            className="p-1.5 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform"
            style={{ 
              backgroundColor: getBusColor(bus.status),
              border: '2px solid white'
            }}
          >
            <BusFront className="w-5 h-5 text-white" />
          </div>
        </Marker>
      )), [buses]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-lg font-medium text-gray-700">Loading Map...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 bg-red-100 text-red-700 p-4 rounded-lg">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!config.MAPBOX_TOKEN) {
    return (
      <div className="h-96 bg-yellow-100 text-yellow-800 p-4 rounded-lg">
        <strong>Warning:</strong> Mapbox token is not configured. Please add REACT_APP_MAPBOX_TOKEN to your .env file.
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={config.MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {markers}

        {selectedBus && selectedBus.location && (
          <Popup
            anchor="top"
            longitude={Number(selectedBus.location.lng)}
            latitude={Number(selectedBus.location.lat)}
            onClose={() => setSelectedBus(null)}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="text-base font-bold text-indigo-700 mb-1">{selectedBus.busNumber}</h3>
              <p className="text-sm mb-1">
                <span className="font-medium">Status:</span>{' '}
                <span 
                  className="font-semibold" 
                  style={{ color: getBusColor(selectedBus.status) }}
                >
                  {selectedBus.status}
                </span>
              </p>
              {selectedBus.driverName && (
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Driver:</span> {selectedBus.driverName}
                </p>
              )}
              {typeof selectedBus.routeId === 'object' && selectedBus.routeId?.routeName && (
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Route:</span> {selectedBus.routeId.routeName}
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapComponent;