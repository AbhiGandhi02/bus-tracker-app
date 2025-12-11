import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ScheduledRide, RideStatusUpdate, RideLocationUpdate } from '../../types';
import { scheduledRideAPI } from '../../services/api';
import MapComponent from '../../components/Map/MapComponent';
import RideDetails from '../../components/User/RideDetails';
import Loader from '../../components/common/Loader';
import { ArrowLeft, Map, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/layout/Navbar'; 
import { useAuth } from '../../context/AuthContext'; 

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

const TrackRide: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth(); 

  const [ride, setRide] = useState<ScheduledRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();

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
      navigate(`/?date=${dateString}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0D0A2A] flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (error || !ride) {
    return (
      <div className="min-h-screen bg-[#0D0A2A] flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4 font-medium">{error || 'Ride not found'}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-[#4A1F8A] hover:bg-[#B045FF] text-white rounded-full transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }
  
  const isLiveTracking = ride.status === 'In Progress';

  return (
    <div className="min-h-screen bg-[#0D0A2A] text-white flex flex-col">
      
      {/* 1. Navbar */}
      <Navbar 
        user={user} 
        handleLogout={logout} 
        BusBuddyLogo={null} 
        portalName="Student Portal"
      />

      {/* 2. Main Content */}
      <div className="pt-6 lg:pt-8 px-4 pb-6 max-w-7xl mx-auto flex flex-col flex-1 w-full">
        
        {/* Page Title & Back Button */}
        <div className="flex items-center gap-4 mb-4 lg:mb-6">
          <button 
            onClick={handleBack} 
            className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-gray-200 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-wide">
            Ride Details
          </h1>
        </div>

        {/* Map and Details Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-4 lg:gap-6 pb-4">
          
          {/* Map Section */}
          <div className="w-full h-80 lg:h-auto lg:flex-[2] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative shrink-0 lg:shrink">
            {!isLiveTracking && (
              <MapOverlay status={ride.status} departureTime={ride.departureTime} />
            )}
            <MapComponent 
              rides={[ride]}
              selectedRide={ride._id} 
            />
          </div>

          {/* Details Section */}
          <div className="flex-1 lg:w-[400px] lg:flex-none h-80 lg:h-auto overflow-y-auto custom-scrollbar min-h-0">
            <RideDetails ride={ride} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrackRide;