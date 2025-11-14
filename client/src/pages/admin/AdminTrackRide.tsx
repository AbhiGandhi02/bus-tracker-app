import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ScheduledRide, RideStatusUpdate, RideLocationUpdate } from '../../types';
import { scheduledRideAPI } from '../../services/api';
import MapComponent from '../../components/Map/MapComponent';
import RideDetails from '../../components/User/RideDetails';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { ArrowLeft, Map, Calendar, CheckCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import AdminLayout from '../../components/layout/AdminLayout'; // Use AdminLayout

// --- Helper Functions ---
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

// --- FIX: Helper to format date string consistently using UTC ---
const formatDateForQuery = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear(); // local year
  const month = (d.getMonth() + 1).toString().padStart(2, '0'); // local month
  const day = d.getDate().toString().padStart(2, '0'); // local day
  return `${year}-${month}-${day}`;
};
// --- End Helper Functions ---

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
    Icon = CheckCircle;
    text = "This ride has been cancelled.";
  }

  return (
    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-10">
      <div className="bg-white/90 p-6 rounded-xl shadow-lg">
        <Icon className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <p className="font-semibold text-gray-800">{text}</p>
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

  // --- Data Fetching ---
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
    // We must use UTC for this comparison too
    const rideDate = new Date(ride.date);
    const today = new Date();
    return rideDate.getUTCFullYear() === today.getUTCFullYear() &&
           rideDate.getUTCMonth() === today.getUTCMonth() &&
           rideDate.getUTCDate() === today.getUTCDate();
  }, [ride]);

  // --- Socket Listeners ---
  useEffect(() => {
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

  if (loading) {
    return (
      <AdminLayout title="Loading Ride...">
        <div className="flex items-center justify-center h-[50vh]"><Loader size="lg" /></div>
      </AdminLayout>
    );
  }

  if (error || !ride) {
    return (
      <AdminLayout title="Error">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <p className="text-red-600 mb-4">{error || 'Ride not found'}</p>
          <Button onClick={handleBack}>Back to Schedule</Button>
        </div>
      </AdminLayout>
    );
  }
  
  const isLiveTracking = ride.status === 'In Progress';

  return (
    <AdminLayout title="Track Ride" actions={
      <Button variant="outline" onClick={handleBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Schedule
      </Button>
    }>
      <div className="flex flex-col lg:flex-row gap-6" style={{ height: 'calc(100vh - 150px)' }}>
        
        {/* Map View */}
        <div className="lg:flex-[3] h-[50vh] lg:h-full min-h-[300px] rounded-xl overflow-hidden shadow-lg bg-white relative">
          {!isLiveTracking && (
            <MapOverlay status={ride.status} departureTime={ride.departureTime} />
          )}
          <MapComponent 
            rides={[ride]}
            selectedRide={ride._id} 
          />
        </div>

        {/* Details View */}
        <div className="lg:w-[400px] lg:h-full overflow-y-auto">
          <RideDetails ride={ride} />
        </div>
        
      </div>
    </AdminLayout>
  );
};

export default AdminTrackRide;