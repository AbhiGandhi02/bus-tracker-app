import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ScheduledRide, RideStatusUpdate, RideLocationUpdate } from '../../types';
import { scheduledRideAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import MapComponent from '../../components/Map/MapComponent';
import RideDetails from '../../components/User/RideDetails';
import Loader from '../../components/common/Loader';
import AdminLayout from '../../components/layout/AdminLayout';
import { ArrowLeft, Map, Calendar, CheckCircle, XCircle } from 'lucide-react';

// --- HELPER: Date Formatting ---
const formatDateForQuery = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- COMPONENT: Map Overlay (Dark Theme) ---
const MapOverlay: React.FC<{ status: string, departureTime: string }> = ({ status, departureTime }) => {
  let Icon = Map;
  let text = "Map data is not available.";
  let iconColor = "text-[#B045FF]"; // Default Neon Purple

  if (status === 'Scheduled') {
    Icon = Calendar;
    text = `Scheduled for ${departureTime}`;
  } else if (status === 'Completed') {
    Icon = CheckCircle;
    text = "Ride Completed";
    iconColor = "text-green-400";
  } else if (status === 'Cancelled') {
    Icon = XCircle;
    text = "Ride Cancelled";
    iconColor = "text-red-400";
  }

  return (
    <div className="absolute inset-0 bg-[#0D0A2A]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-10 animate-in fade-in duration-300">
      <div className="bg-[#1A1640] border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-xs w-full">
        <div className={`p-4 rounded-full bg-white/5 mb-4 ${iconColor}`}>
           <Icon className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-1">{status}</h3>
        <p className="text-sm text-gray-400 font-medium">{text}</p>
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

  // --- DATA FETCHING ---
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

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    // Only listen if ride is active
    if (!socket || !ride || ride.status === 'Completed' || ride.status === 'Cancelled') {
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
  }, [socket, ride]);

  const handleBack = () => {
    if (ride) {
      const dateString = formatDateForQuery(ride.date);
      navigate(`/admin/schedule?date=${dateString}`);
    } else {
      navigate('/admin/schedule');
    }
  };

  // --- RENDER STATES ---

  if (loading) {
    return (
      <AdminLayout title="Loading Ride...">
        <div className="flex items-center justify-center h-[60vh]">
           <Loader size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !ride) {
    return (
      <AdminLayout title="Track Ride">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 bg-[#1A1640]/50 rounded-2xl border border-white/5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
             <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Ride</h3>
          <p className="text-red-400 mb-6">{error || 'Ride not found'}</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
          >
            Back to Schedule
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  const isLiveTracking = ride.status === 'In Progress';

  return (
    <AdminLayout 
      title="Live Tracking" 
      actions={
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Schedule
        </button>
      }
    >
      {/* LAYOUT CONTAINER 
         - Mobile: Stacked (Map top, Details bottom)
         - Desktop: Side-by-side (Map Left, Details Right)
         - Height: Fixed on desktop to prevent page scroll, auto on mobile
      */}
      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-140px)]">
        
        {/* --- MAP SECTION --- */}
        <div className="flex-1 h-[50vh] lg:h-full bg-[#1A1640] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative order-2 lg:order-1">
          {!isLiveTracking && (
            <MapOverlay status={ride.status} departureTime={ride.departureTime} />
          )}
          <MapComponent 
            rides={[ride]}
            selectedRide={ride._id} 
          />
        </div>

        {/* --- DETAILS SECTION --- */}
        <div className="lg:w-[400px] h-auto lg:h-full overflow-y-auto custom-scrollbar order-1 lg:order-2">
          {/* We assume RideDetails component handles its own dark styling internally now */}
          <RideDetails ride={ride} />
        </div>
        
      </div>
    </AdminLayout>
  );
};

export default AdminTrackRide;