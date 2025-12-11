import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ScheduledRide, RideStatusUpdate, RideLocationUpdate } from '../../types';
import { scheduledRideAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import MapComponent from '../../components/Map/MapComponent';
import RideDetails from '../../components/User/RideDetails';
import Loader from '../../components/common/Loader';
import AdminLayout from '../../components/layout/AdminLayout';
import { ArrowLeft, Map, Calendar, CheckCircle, XCircle } from 'lucide-react';

// --- HELPER FUNCTIONS (Same as Student View) ---
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formatDateForQuery = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear(); 
  const month = (d.getMonth() + 1).toString().padStart(2, '0'); 
  const day = d.getDate().toString().padStart(2, '0'); 
  return `${year}-${month}-${day}`;
};

// --- MAP OVERLAY COMPONENT ---
const MapOverlay: React.FC<{ status: string, departureTime: string }> = ({ status, departureTime }) => {
  let Icon = Map;
  let text = "Map data is not available for this ride.";

  if (status === 'Scheduled') {
    Icon = Calendar;
    text = `This ride is scheduled to start at ${departureTime}.`;
  } else if (status === 'Completed') {
    Icon = CheckCircle;
    text = "This ride has been completed.";
  } else if (status === 'Cancelled') {
    Icon = XCircle;
    text = "This ride has been cancelled.";
  }

  return (
    <div className="absolute inset-0 bg-[#0D0A2A]/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-10">
      <div className="bg-[#1A1640] border border-white/10 p-6 rounded-xl shadow-2xl">
        <Icon className="w-12 h-12 text-[#B045FF] mx-auto mb-4" />
        <p className="font-semibold text-gray-200">{text}</p>
      </div>
    </div>
  );
};

const AdminTrackRide: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [ride, setRide] = useState<ScheduledRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (!rideId) {
      setError('No Ride ID provided.');
      setLoading(false);
      return;
    }

    const dateFromQuery = searchParams.get('date');
    if (!dateFromQuery) {
      setError('No date provided in URL.');
      setLoading(false);
      return;
    }

    const fetchRideData = async () => {
      try {
        const response = await scheduledRideAPI.getByDate(dateFromQuery);
        if (response.data.success && response.data.data) {
          const foundRide = response.data.data.find(r => r._id === rideId);
          if (foundRide) {
            setRide(foundRide);
          } else {
            setError(`Ride not found for ${dateFromQuery}.`);
          }
        } else {
          setError(`No rides found for ${dateFromQuery}.`);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load ride details');
      } finally {
        setLoading(false);
      }
    };

    fetchRideData();
  }, [rideId, searchParams]);

  // --- 2. SOCKET & DATE LOGIC ---
  const isToday = useMemo(() => {
    if (!ride) return false;
    return isSameDay(new Date(ride.date), getToday());
  }, [ride]);

  useEffect(() => {
    if (!socket || !ride || !isToday || ride.status === 'Completed' || ride.status === 'Cancelled') {
      return;
    }

    const handleStatusUpdate = (update: RideStatusUpdate) => {
      if (update.rideId === ride._id) {
        setRide(prevRide => prevRide ? { ...prevRide, status: update.status } : null);
      }
    };

    const handleLocationUpdate = (update: RideLocationUpdate) => {
      if (update.rideId === ride._id) {
        setRide(prevRide => prevRide ? { 
          ...prevRide, 
          currentLocation: update.location,
          status: 'In Progress'
        } : null);
      }
    };

    socket.on('ride-status-update', handleStatusUpdate);
    socket.on('ride-location-update', handleLocationUpdate);

    return () => {
      socket.off('ride-status-update', handleStatusUpdate);
      socket.off('ride-location-update', handleLocationUpdate);
    };
  }, [socket, ride, isToday]);

  const handleBack = () => {
    if (ride) {
      const dateString = formatDateForQuery(ride.date);
      navigate(`/admin/schedule?date=${dateString}`);
    } else {
      navigate('/admin/schedule');
    }
  };

  // --- 3. RENDER STATES ---

  if (loading) {
    return (
      <AdminLayout title="Tracking Ride">
        <div className="h-full w-full flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </AdminLayout>
    );
  }
  
  if (error || !ride) {
    return (
      <AdminLayout title="Error">
        <div className="h-full flex flex-col items-center justify-center p-4">
          <p className="text-red-400 mb-4 font-medium">{error || 'Ride not found'}</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-[#4A1F8A] hover:bg-[#B045FF] text-white rounded-full transition-colors"
          >
            Back to Schedule
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  const isLiveTracking = ride.status === 'In Progress';

  return (
    <AdminLayout title="Live Tracking">
      <div className="flex flex-col h-auto md:h-[calc(100vh-100px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        
        {/* Page Title & Back Button */}
        <div className="flex items-center gap-4 mb-5">
          <button 
            onClick={handleBack} 
            className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-gray-200 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Track Ride
          </h1>
        </div>

        {/* Map and Details Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-6">
          
          {/* Map Section */}
          <div className="flex-1 lg:flex-[2] h-80 md:h-[50vh] lg:h-auto min-h-[200px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
            {!isLiveTracking && (
              <MapOverlay status={ride.status} departureTime={ride.departureTime} />
            )}
            <MapComponent 
              rides={[ride]}
              selectedRide={ride._id} 
            />
          </div>

          {/* Details Section (Reusing Student Component) */}
          <div className="lg:w-[400px] h-80 md:h-[40vh] lg:h-auto overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <RideDetails ride={ride} />
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminTrackRide;