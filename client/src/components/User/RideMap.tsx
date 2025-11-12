import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import type { ViewState } from 'react-map-gl';
import { ScheduledRide, RideMapProps } from '../../types';
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

const RideMap: React.FC<RideMapProps> = ({ rides, selectedRide: selectedRideId }) => {
  const [selectedRide, setSelectedRide] = useState<ScheduledRide | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { socket } = useSocket();

  const [viewState, setViewState] = useState<Partial<ViewState>>(config.MAP_DEFAULTS);

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
      console.log('Ride location update:', update);
      // Update will be handled by parent component refreshing rides
    };

    socket.on('ride-location-update', handleLocationUpdate);

    return () => {
      socket.off('ride-location-update', handleLocationUpdate);
    };
  }, [socket]);

  // Update selectedRide when selectedRideId changes
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

  // Create Marker components - only for rides with current location
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

        {selectedRide && selectedRide.currentLocation && (
          <Popup
            anchor="top"
            longitude={Number(selectedRide.currentLocation.lng)}
            latitude={Number(selectedRide.currentLocation.lat)}
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