import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import type { ViewState } from 'react-map-gl';
import polyline from '@mapbox/polyline';
import type { Feature, Geometry } from 'geojson';
import { BusFront } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

import { ScheduledRide, RideMapProps, Route } from '../../types';
import { useSocket } from '../../context/SocketContext';
import config from '../../config';

// Theme Colors
const THEME_PURPLE = '#B045FF';
const THEME_DARK = '#0D0A2A';

const getRideColor = (status: ScheduledRide['status']) => {
  switch (status) {
    case 'Scheduled': return '#3b82f6'; 
    case 'In Progress': return '#10b981';
    case 'Completed': return '#6b7280';
    case 'Cancelled': return '#ef4444';
    default: return '#6b7280';
  }
};

const createGeoJSONFeature = (route: Route | undefined): Feature<Geometry> | null => {
  if (!route || !route.polyline) return null;
  try {
    const coordinates = polyline.decode(route.polyline);
    const geoJsonCoords = coordinates.map(coord => [coord[1], coord[0]]);
    return {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: geoJsonCoords },
      properties: {},
    };
  } catch (error) {
    console.error("Failed to decode polyline:", error);
    return null;
  }
};

const RideMap: React.FC<RideMapProps> = ({ rides, selectedRide: selectedRideId }) => {
  const [selectedRide, setSelectedRide] = useState<ScheduledRide | null>(null);
  const { socket } = useSocket();

  const [viewState, setViewState] = useState<Partial<ViewState>>({
    latitude: 12.9716, 
    longitude: 77.5946,
    zoom: 11
  });

  const routeGeoJson = useMemo(() => {
    if (selectedRide) return createGeoJSONFeature(selectedRide.routeId as Route);
    return null;
  }, [selectedRide]);

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
          zoom: 12
        }));
      }
    }
  }, [rides]);

  useEffect(() => {
    if (selectedRideId) {
      const ride = rides.find(r => r._id === selectedRideId);
      if (ride) {
        setSelectedRide(ride);
        if (ride.currentLocation && ride.currentLocation.lat && ride.currentLocation.lng) {
          setViewState((prev) => ({
            ...prev,
            latitude: ride.currentLocation!.lat,
            longitude: ride.currentLocation!.lng,
            zoom: 14,
            transitionDuration: 1000 
          }));
        }
      }
    } else {
      setSelectedRide(null);
    }
  }, [selectedRideId, rides]);

  // Helpers
  const getBusNumber = (ride: ScheduledRide) => typeof ride.busId === 'object' ? (ride.busId as any).busNumber : 'Unknown';
  const getRouteName = (ride: ScheduledRide) => typeof ride.routeId === 'object' ? (ride.routeId as any).routeName : 'Unknown';

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
            className="p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform animate-pulse"
            style={{ 
              backgroundColor: getRideColor(ride.status),
              border: `2px solid ${THEME_DARK}`
            }}
          >
            <BusFront className="w-5 h-5 text-white" />
          </div>
        </Marker>
      )), [rides]
  );

  if (!config.MAPBOX_TOKEN) {
    return <div className="w-full h-full flex items-center justify-center bg-[#1A1640] text-gray-500">Mapbox token missing</div>;
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-white/10 relative bg-[#1A1640]">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={config.MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        mapStyle="mapbox://styles/mapbox/dark-v11" 
      >
        {routeGeoJson && (
          <Source id="route-line" type="geojson" data={routeGeoJson}>
            <Layer
              id="route"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': THEME_PURPLE,
                'line-width': 5,
                'line-opacity': 0.8,
                'line-blur': 1
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
            offset={15}
            className="rounded-xl overflow-hidden"
            maxWidth="250px"
          >
            <div className="p-1 min-w-[180px] bg-[#0D0A2A] text-white">
              <h3 className="text-base font-bold text-[#B045FF] mb-1">
                {getBusNumber(selectedRide)}
              </h3>
              
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium text-gray-400">Status:</span>{' '}
                  <span className="font-bold text-xs px-2 py-0.5 rounded-full text-black" style={{ backgroundColor: getRideColor(selectedRide.status) }}>
                    {selectedRide.status}
                  </span>
                </p>
                <p className="text-xs text-gray-300">
                  <span className="font-medium text-gray-500">Route:</span> {getRouteName(selectedRide)}
                </p>
                <p className="text-xs text-gray-300">
                  <span className="font-medium text-gray-500">Time:</span> {selectedRide.departureTime}
                </p>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default RideMap;