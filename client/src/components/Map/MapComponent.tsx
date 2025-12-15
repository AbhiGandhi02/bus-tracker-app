import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import type { ViewState } from 'react-map-gl';
import polyline from '@mapbox/polyline';
import type { Feature, Geometry } from 'geojson';
import { ScheduledRide, RideMapProps, RideLocationUpdate, Route } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { BusFront, Loader2, X } from 'lucide-react';
import config from '../../config';
import 'mapbox-gl/dist/mapbox-gl.css';

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

// Decode polyline and create GeoJSON
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

const MapComponent: React.FC<RideMapProps> = ({ rides, selectedRide: selectedRideId }) => {
  const [selectedRide, setSelectedRide] = useState<ScheduledRide | null>(null);
  const [ridesWithLocation, setRidesWithLocation] = useState<ScheduledRide[]>(rides);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const { socket } = useSocket();
  const [viewState, setViewState] = useState<Partial<ViewState>>(config.MAP_DEFAULTS);

  const routeGeoJson = useMemo(() => {
    const currentRide = ridesWithLocation[0];
    if (currentRide) {
      return createGeoJSONFeature(currentRide.routeId as Route);
    }
    return null;
  }, [ridesWithLocation]);

  useEffect(() => {
    setRidesWithLocation(rides);
  }, [rides]);

  useEffect(() => {
    if (rides.length > 0) {
      const firstRideWithLocation = rides.find(
        ride => ride.currentLocation && ride.currentLocation.lat && ride.currentLocation.lng
      );
      if (firstRideWithLocation && firstRideWithLocation.currentLocation) {
        setViewState((prev) => ({
          ...prev,
          latitude: firstRideWithLocation.currentLocation!.lat,
          longitude: firstRideWithLocation.currentLocation!.lng,
        }));
      }
    }
  }, [rides]);

  useEffect(() => {
    if (selectedRideId) {
      const ride = ridesWithLocation.find(r => r._id === selectedRideId);
      if (ride) {
        setSelectedRide(ride);
        if (ride.currentLocation) {
          setViewState((prev) => ({
            ...prev,
            latitude: ride.currentLocation!.lat,
            longitude: ride.currentLocation!.lng,
            zoom: 14,
          }));
        }
      }
    } else {
      setSelectedRide(null);
    }
  }, [selectedRideId, ridesWithLocation]);

  useEffect(() => {
    if (!socket) return;
    const handleLocationUpdate = (update: RideLocationUpdate) => {
      setRidesWithLocation((prevRides) =>
        prevRides.map((ride) =>
          ride._id === update.rideId
            ? { ...ride, currentLocation: update.location }
            : ride
        )
      );
      setSelectedRide((prevSelected) =>
        prevSelected && prevSelected._id === update.rideId
          ? { ...prevSelected, currentLocation: update.location }
          : prevSelected
      );
    };
    socket.on('ride-location-update', handleLocationUpdate);
    return () => {
      socket.off('ride-location-update', handleLocationUpdate);
    };
  }, [socket]);

  const getBusNumber = (ride: ScheduledRide) => {
    return typeof ride.busId === 'object' ? ride.busId.busNumber : 'Unknown';
  };
  const getDriverName = (ride: ScheduledRide) => {
    return typeof ride.busId === 'object' ? ride.busId.driverName : null;
  };
  const getRouteName = (ride: ScheduledRide) => {
    return typeof ride.routeId === 'object' ? ride.routeId.routeName : 'Unknown';
  };

  const markers = useMemo(() => 
    ridesWithLocation
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
            className="p-1.5 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform"
            style={{ 
              backgroundColor: getRideColor(ride.status),
              border: '2px solid white'
            }}
          >
            <BusFront className="w-5 h-5 text-white" />
          </div>
        </Marker>
      )), [ridesWithLocation]
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
        <strong>Warning:</strong> Mapbox token is not configured.
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={config.MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
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
                'line-color': '#B045FF',
                'line-width': 5,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {markers}

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
              closeButton={false}
            >
              <div className="p-2 relative">
                <button
                  onClick={() => setSelectedRide(null)}
                  className="absolute top-1 right-1 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  aria-label="Close popup"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                <h3 className="text-base font-bold text-indigo-700 mb-1">{getBusNumber(selectedRide)}</h3>
                <p className="text-sm mb-1">
                  <span className="font-medium">Status:</span>{' '}
                  <span 
                    className="font-semibold" 
                    style={{ color: getRideColor(selectedRide.status) }}
                  >
                    {selectedRide.status}
                  </span>
                </p>
                {getDriverName(selectedRide) && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Driver:</span> {getDriverName(selectedRide)}
                  </p>
                )}
                {getRouteName(selectedRide) && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Route:</span> {getRouteName(selectedRide)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(selectedRide.currentLocation.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          )}
      </Map>
    </div>
  );
};

export default MapComponent;