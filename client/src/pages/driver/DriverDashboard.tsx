import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScheduledRide, BusMaster, Route, RideLocation } from '../../types';
import { scheduledRideAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import { PlayCircle, StopCircle, Navigation, Clock, Radio, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import useWakeLock from '../../hooks/useWakeLock';

const BusBuddyLogo = '/images/BusBuddyLogo.webp';

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
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const [trackingRideId, setTrackingRideId] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<RideLocation | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // --- API: Fetch Rides ---
  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = getTodayString();
      const response = await scheduledRideAPI.getByDate(today);

      if (response.data.success && response.data.data) {
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
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Manage wake lock based on tracking state
  useEffect(() => {
    if (trackingRideId) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [trackingRideId, requestWakeLock, releaseWakeLock]);

  const handleStartClick = (rideId: string) => {
    startTracking(rideId);
  };

  // --- TRACKING LOGIC ---
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingRideId(null);
    setLastLocation(null);
  }, []);

  const startTracking = useCallback((rideId: string) => {
    if (watchIdRef.current !== null) {
      stopTracking();
    }

    setTrackingRideId(rideId);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    const onSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const newLocation: RideLocation = {
        lat: latitude,
        lng: longitude,
        timestamp: new Date(position.timestamp)
      };

      setLastLocation(newLocation);

      scheduledRideAPI.updateLocation(rideId, newLocation)
        .catch(err => {
          console.error("Failed to send location update:", err);
        });
    };

    const onError = (err: GeolocationPositionError) => {
      console.error(`Geolocation error (${err.code}): ${err.message}`);
      setError(`Geolocation error: ${err.message}. Please enable location permissions.`);
      stopTracking();
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options);

    // Optimistic update
    scheduledRideAPI.update(rideId, { status: 'In Progress' })
      .then(() => fetchRides());
  }, [stopTracking, fetchRides]);

  useEffect(() => {
    const rideIdFromUrl = searchParams.get('rideId');
    if (rideIdFromUrl && trackingRideId !== rideIdFromUrl) {
      startTracking(rideIdFromUrl);
    }
  }, [searchParams, trackingRideId, startTracking]);


  // --- RENDER HELPERS ---
  const trackingRide = rides.find(r => r._id === trackingRideId);

  if (loading && !rides.length) {
    return (
      <div className="h-screen w-full bg-[#0D0A2A] flex flex-col items-center justify-center gap-4">
        <Loader size="lg" />
        <p className="text-gray-400 animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A2A] text-white">

      <Navbar
        user={user}
        handleLogout={async () => {
          stopTracking();
          await logout();
          navigate('/login');
        }}
        BusBuddyLogo={BusBuddyLogo}
        portalName="Driver Portal"
      />

      <main className="pt-6 lg:pt-8 md:pt-32 px-4 pb-20 max-w-3xl mx-auto">

        {/* BACK BUTTON */}
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-gray-200 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-wide">
            Dashboard Overview
          </h1>
        </div>

        {/* --- ERROR ALERT --- */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-300 animate-in fade-in slide-in-from-top-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {trackingRide ? (
          /* --- ACTIVE TRACKING CARD --- */
          <div className="relative overflow-hidden bg-[#1A1640] rounded-3xl border-2 border-[#B045FF]/50 shadow-[0_0_50px_-12px_rgba(176,69,255,0.3)] p-5 md:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#B045FF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Status Indicator */}
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Status</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">Tracking Active</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold text-green-400 tracking-wider">LIVE</span>
              </div>
            </div>

            {/* Bus & Route Details */}
            <div className="grid gap-6 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <img src={BusBuddyLogo} alt="Bus" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                <div>
                  <p className="text-sm text-gray-400">Bus Number</p>
                  <p className="text-xl md:text-2xl font-bold text-white tracking-tight">{(trackingRide.busId as BusMaster).busNumber}</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Navigation className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-300 font-medium">Route Information</span>
                </div>
                <p className="text-base md:text-lg font-semibold text-white pl-8">{(trackingRide.routeId as Route).routeName}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-black/20 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Latitude</p>
                  <p className="font-mono text-[#B045FF]">{lastLocation?.lat.toFixed(6) || '...'}</p>
                </div>
                <div className="p-3 bg-black/20 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Longitude</p>
                  <p className="font-mono text-[#B045FF]">{lastLocation?.lng.toFixed(6) || '...'}</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={stopTracking}
              className="w-full py-3 md:py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg shadow-lg hover:shadow-red-500/25 transition-all flex items-center justify-center gap-3 relative z-10 group"
            >
              <StopCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Stop Tracking
            </button>
          </div>

        ) : (
          /* --- ELEGANT RIDE SELECTION LIST --- */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#B045FF]" />
                Select a Ride
              </h2>
              <span className="text-xs px-2 py-1 bg-white/10 rounded text-gray-400">
                {rides.length} Available
              </span>
            </div>

            {rides.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center p-10 bg-[#1A1640]/50 rounded-2xl border border-dashed border-gray-700 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-gray-300 font-medium mb-1">No Active Rides</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  There are no scheduled rides marked for today. Check back later or contact admin.
                </p>
              </div>
            )}

            <div className="grid gap-5">
              {rides.map(ride => {
                const route = ride.routeId as Route;
                const bus = ride.busId as BusMaster;

                return (
                  <div
                    key={ride._id}
                    className="group relative overflow-hidden bg-gradient-to-br from-[#1A1640] to-[#0D0A2A] rounded-2xl border border-white/10 hover:border-[#B045FF]/40 shadow-xl transition-all duration-300"
                  >
                    {/* Status Strip on Left */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ride.status === 'In Progress' ? 'bg-green-500' : 'bg-blue-500'}`} />

                    <div className="p-5 md:p-6">
                      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">

                        {/* 1. Time & Bus Info */}
                        <div className="flex-1 w-full md:w-auto">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xl font-bold font-mono text-white">
                              {ride.departureTime}
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${ride.status === 'In Progress' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {ride.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <img src={BusBuddyLogo} alt="Bus" className="w-10 h-10 object-contain" />
                            <div>
                              <h3 className="text-lg font-bold text-gray-200 leading-none mb-1">
                                {bus.busNumber}
                              </h3>
                              <p className="text-xs text-gray-500 uppercase font-semibold">
                                {bus.busType || 'Standard'} Bus
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 2. Visual Route Timeline */}
                        <div className="flex-1 w-full md:w-auto border-l border-white/5 pl-4 md:pl-6 py-2">
                          <div className="relative pl-6 space-y-6">
                            {/* Vertical Dotted Line */}
                            <div className="absolute left-[0.7rem] top-2 bottom-2 w-0.5 border-l-2 border-dashed border-gray-700" />

                            {/* Start */}
                            <div className="relative">
                              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#0D0A2A]" />
                              <p className="text-xs text-gray-500 uppercase">Start</p>
                              <p className="text-sm font-semibold text-white truncate max-w-[200px]">{route.departureLocation}</p>
                            </div>

                            {/* End */}
                            <div className="relative">
                              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#B045FF] border-2 border-[#0D0A2A]" />
                              <p className="text-xs text-gray-500 uppercase">End</p>
                              <p className="text-sm font-semibold text-white truncate max-w-[200px]">{route.arrivalLocation}</p>
                            </div>
                          </div>
                        </div>

                        {/* 3. Action Button */}
                        <div className="w-full md:w-auto">
                          <button
                            onClick={() => handleStartClick(ride._id)}
                            className="w-full md:w-32 h-12 rounded-xl bg-gradient-to-r from-[#B045FF] to-[#7c3aed] hover:from-[#c069ff] hover:to-[#8b5cf6] text-white font-bold shadow-lg shadow-[#B045FF]/20 hover:shadow-[#B045FF]/40 transform group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <span>GO</span>
                            <PlayCircle className="w-4 h-4 fill-white/20" />
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;