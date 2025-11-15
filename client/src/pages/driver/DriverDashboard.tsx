import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScheduledRide, BusMaster, Route, RideLocation } from '../../types';
import { scheduledRideAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { MapPin, PlayCircle, StopCircle, LogOut } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Helper to format date
const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DriverDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [trackingRideId, setTrackingRideId] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<RideLocation | null>(null);
  
  // Ref to store the watchPosition ID
  const watchIdRef = useRef<number | null>(null);

  // Fetch only 'In Progress' or 'Scheduled' rides for today
  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = getTodayString();
      const response = await scheduledRideAPI.getByDate(today);

      if (response.data.success && response.data.data) {
        // Filter for rides that the driver can actually track
        const trackableRides = response.data.data.filter(
          ride => ride.status === 'In Progress' || ride.status === 'Scheduled'
        );
        setRides(trackableRides);
      } else {
        setRides([]);
      }
    } catch (err) {
      setError('Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array is correct here

  useEffect(() => {
    fetchRides();
  }, [fetchRides]); // Use the callback function

  // Wrap stopTracking in useCallback
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingRideId(null);
    setLastLocation(null);
  }, []); // State setters and refs don't need to be dependencies

  // Wrap startTracking in useCallback
  const startTracking = useCallback((rideId: string) => {
    if (watchIdRef.current !== null) {
      stopTracking();
    }

    setTrackingRideId(rideId);
    
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const onSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const newLocation: RideLocation = {
        lat: latitude,
        lng: longitude,
        timestamp: new Date(position.timestamp)
      };
      
      setLastLocation(newLocation);
      
      // Send to backend
      scheduledRideAPI.updateLocation(rideId, newLocation)
        .catch(err => {
          // Non-fatal error, log it
          console.error("Failed to send location update:", err);
          setError("Failed to send location update. Check connection.");
        });
    };

    const onError = (err: GeolocationPositionError) => {
      console.error(`Geolocation error (${err.code}): ${err.message}`);
      setError(`Geolocation error: ${err.message}. Please enable location permissions.`);
      stopTracking(); // Stop if there's an error
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options);
    
    // Also mark the ride as 'In Progress' via API immediately
    scheduledRideAPI.update(rideId, { status: 'In Progress' })
      .then(() => fetchRides()); // Refresh list
  }, [stopTracking, fetchRides]); // Add dependencies

  // Auto-start tracking useEffect
  useEffect(() => {
    const rideIdFromUrl = searchParams.get('rideId');
    if (rideIdFromUrl) {
      // Check if we are already tracking this ride
      if (trackingRideId !== rideIdFromUrl) {
         startTracking(rideIdFromUrl);
      }
    }
  // Add 'startTracking' to dependency array
  }, [searchParams, trackingRideId, startTracking]); 

  const handleLogout = async () => {
    stopTracking(); // Stop tracking on logout
    await logout();
    navigate('/login');
  };

  // --- Render Logic ---

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader size="lg" /></div>;
  }
  
  const trackingRide = rides.find(r => r._id === trackingRideId);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">Driver Dashboard</h1>
          <p className="text-sm text-gray-400">Welcome, {user?.name?.split(' ')[0]}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </header>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg my-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="mt-6">
        {/* Current Tracking Card */}
        {trackingRide ? (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-yellow-400">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Currently Tracking</h2>
              <span className="flex items-center gap-2 text-green-400 animate-pulse">
                <MapPin className="w-5 h-5" />
                LIVE
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xl font-bold">🚌 {(trackingRide.busId as BusMaster).busNumber}</p>
              <p className="text-gray-300">{(trackingRide.routeId as Route).routeName}</p>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              <p>Lat: {lastLocation?.lat.toFixed(6) || '...'}</p>
              <p>Lng: {lastLocation?.lng.toFixed(6) || '...'}</p>
            </div>
            <Button 
              variant="danger" 
              onClick={stopTracking} 
              fullWidth 
              className="mt-6 !bg-red-600 hover:!bg-red-700"
            >
              <StopCircle className="w-5 h-5 mr-2" />
              Stop Tracking
            </Button>
          </div>
        ) : (
          // List of available rides
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-300">Select a ride to start tracking:</h2>
            {rides.length === 0 && !loading && (
              <div className="bg-gray-800 p-6 rounded-xl text-center text-gray-400">
                <p>No trackable rides (Scheduled or In Progress) for today.</p>
              </div>
            )}
            
            {rides.map(ride => (
              <div key={ride._id} className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold">🚌 {(ride.busId as BusMaster).busNumber}</p>
                  <p className="text-sm text-gray-400">{(ride.routeId as Route).routeName}</p>
                  <p className="text-sm text-gray-500">{ride.departureTime} - {ride.status}</p>
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => startTracking(ride._id)}
                  className="!bg-green-600 hover:!bg-green-700"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Start
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;