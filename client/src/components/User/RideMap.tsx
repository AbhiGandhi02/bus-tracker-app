import React, { useState, useEffect, useMemo } from 'react';
// --- MODIFICATION: Import Source, Layer, and types ---
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import type { ViewState } from 'react-map-gl';
import polyline from '@mapbox/polyline';
import type { Feature, Geometry } from 'geojson';
import { ScheduledRide, RideMapProps, Route } from '../../types';
// --- END MODIFICATION ---
import { useSocket } from '../../context/SocketContext';
import { BusFront, Loader2 } from 'lucide-react';
import config from '../../config';
import 'mapbox-gl/dist/mapbox-gl.css';

// Helper to determine marker color based on status
const getRideColor = (status: ScheduledRide['status']) => {
  switch (status) {
    case 'Scheduled':
      return '#3b82f6'; // Blue
    case 'In Progress':
      return '#10b981'; // Green
    case 'Completed':
      return '#6b7280'; // Gray
    case 'Cancelled':
      return '#ef4444'; // Red
    default:
      return '#6b7280';
  }
};

// --- NEW HELPER: Decode polyline and create GeoJSON ---
const createGeoJSONFeature = (route: Route | undefined): Feature<Geometry> | null => {
  if (!route || !route.polyline) {
    return null;
  }
  try {
    const coordinates = polyline.decode(route.polyline);
    const geoJsonCoords = coordinates.map(coord => [coord[1], coord[0]]);
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: geoJsonCoords,
      },
      properties: {},
    };
  } catch (error) {
    console.error("Failed to decode polyline:", error);
    return null;
  }
};
// --- END NEW HELPER ---

const RideMap: React.FC<RideMapProps> = ({ rides, selectedRide: selectedRideId }) => {
  const [selectedRide, setSelectedRide] = useState<ScheduledRide | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { socket } = useSocket();

  const [viewState, setViewState] = useState<Partial<ViewState>>(config.MAP_DEFAULTS);

  // --- MODIFICATION: Create GeoJSON for the selected route ---
  const routeGeoJson = useMemo(() => {
    // We use the *internal* selectedRide state object here
    if (selectedRide) {
      return createGeoJSONFeature(selectedRide.routeId as Route);
    }
    return null;
  }, [selectedRide]); // Re-calculate when the selectedRide object changes
  // --- END MODIFICATION ---

  // Set initial map center when rides prop changes
  useEffect(() => {
    if (rides.length > 0) {
      const firstRideWithLocation = rides.find(
        ride => ride.currentLocation && ride.currentLocation.lat && ride.currentLocation.lng
      );
      if (firstRideWithLocation) {
        setViewState((prev) => ({
          ...prev,
          latitude: firstRideWithLocation.currentLocation!.lat,
          longitude: firstRideWithLocation.currentLocation!.lng,
        }));
      }
    }
  }, [rides]);

  // Listen for real-time location updates
  useEffect(() => {
    if (!socket) return;
    const handleLocationUpdate = (update: any) => {
      // (This component expects the parent 'rides' prop to be updated)
    };
    socket.on('ride-location-update', handleLocationUpdate);
    return () => {
      socket.off('ride-location-update', handleLocationUpdate);
    };
  }, [socket]);

  // Update selectedRide *object* when selectedRideId *prop* changes
  useEffect(() => {
    if (selectedRideId) {
      const ride = rides.find(r => r._id === selectedRideId);
      if (ride) {
        setSelectedRide(ride);
        if (ride.currentLocation) {
          setViewState((prev) => ({
            ...prev,
            latitude: ride.currentLocation!.lat,
            longitude: ride.currentLocation!.lng,
            zoom: 14
          }));
        }
      }
    } else {
      setSelectedRide(null);
    }
  }, [selectedRideId, rides]);

  // Helper functions
  const getBusNumber = (ride: ScheduledRide) => {
    return typeof ride.busId === 'object' ? ride.busId.busNumber : 'Unknown';
  };
  const getRouteName = (ride: ScheduledRide) => {
    return typeof ride.routeId === 'object' ? ride.routeId.routeName : 'Unknown';
  };

  // Create Marker components
  const markers = useMemo(() => 
    rides
      .filter(ride => ride.currentLocation && ride.currentLocation.lat && ride.currentLocation.lng)
      .map(ride => (
        <Marker
          key={ride._id}
          longitude={ride.currentLocation!.lng}
          latitude={ride.currentLocation!.lat}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedRide(ride);
          }}
        >
          <div 
            className="p-1.5 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform animate-pulse"
            style={{ 
              backgroundColor: getRideColor(ride.status),
              border: '2px solid white'
            }}
          >
            <BusFront className="w-5 h-5 text-white" />
          </div>
        </Marker>
      )), [rides]
  );

  if (isLoading) {
    // ... (no change)
  }
  if (error) {
    // ... (no change)
  }
  if (!config.MAPBOX_TOKEN) {
    // ... (no change)
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={config.MAPBOX_TOKEN}
        style={{ width: '100%', height: '1Git' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* --- ADD THIS: Render the route line --- */}
        {routeGeoJson && (
          <Source id="route-line" type="geojson" data={routeGeoJson}>
            <Layer
              id="route"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': '#0B79D3',
                'line-width': 5,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}
        {/* --- END ADD --- */}
        
        {markers}

        {/* --- FIX: Added specific checks for .lng and .lat --- */}
        {selectedRide && 
         selectedRide.currentLocation &&
         selectedRide.currentLocation.lng &&
         selectedRide.currentLocation.lat && (
          <Popup
            anchor="top"
            longitude={selectedRide.currentLocation.lng}
            latitude={selectedRide.currentLocation.lat}
            onClose={() => setSelectedRide(null)}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="text-base font-bold text-indigo-700 mb-1">
                {getBusNumber(selectedRide)}
              </h3>
              <p className="text-sm mb-1">
                <span className="font-medium">Status:</span>{' '}
                <span 
                  className="font-semibold" 
                  style={{ color: getRideColor(selectedRide.status) }}
                >
                  {selectedRide.status}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Route:</span> {getRouteName(selectedRide)}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Time:</span> {selectedRide.departureTime}
              </p>
              {selectedRide.currentLocation.timestamp && (
                <p className="text-xs text-gray-500 mt-1">
                  Updated: {new Date(selectedRide.currentLocation.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default RideMap;