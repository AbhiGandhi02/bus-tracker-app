import React, { useEffect, useState, useMemo } from 'react';
// --- MODIFICATION: Import useSearchParams ---
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
// --- END MODIFICATION ---
import { ScheduledRide, RideStatusUpdate, RideLocationUpdate } from '../../types';
import { scheduledRideAPI } from '../../services/api';
import MapComponent from '../../components/Map/MapComponent';
import RideDetails from '../../components/User/RideDetails';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { ArrowLeft, Map, Calendar, CheckCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

// --- Helper Functions (no change) ---
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
  const year = d.getFullYear(); // local year
  const month = (d.getMonth() + 1).toString().padStart(2, '0'); // local month
  const day = d.getDate().toString().padStart(2, '0'); // local day
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
    Icon = CheckCircle;
    text = "This ride has been cancelled.";
  }
  // 'In Progress' is correctly handled by not showing this overlay

  return (
    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-10">
      <div className="bg-white/90 p-6 rounded-xl shadow-lg">
        <Icon className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <p className="font-semibold text-gray-800">{text}</p>
      </div>
    </div>
  );
};

const TrackRide: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  // --- MODIFICATION: Get search params from URL ---
  const [searchParams] = useSearchParams();
  // --- END MODIFICATION ---
  const [ride, setRide] = useState<ScheduledRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  // --- MODIFICATION: Data Fetching ---
  useEffect(() => {
    if (!rideId) {
      setError('No Ride ID provided.');
      setLoading(false);
      return;
    }

    // --- NEW: Read date from URL ---
    const dateFromQuery = searchParams.get('date');
    if (!dateFromQuery) {
      setError('No date provided in URL.');
      setLoading(false);
      return;
    }
    // --- END NEW ---

    const fetchRideData = async () => {
      try {
        // --- THIS IS THE FIX ---
        // Fetch rides for the specific date from the URL, not just "today"
        const response = await scheduledRideAPI.getByDate(dateFromQuery);
        // --- END FIX ---

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
  }, [rideId, searchParams]); // --- Re-run if rideId or searchParams change ---

  const isToday = useMemo(() => {
    if (!ride) return false;
    return isSameDay(new Date(ride.date), getToday());
  }, [ride]);

  // --- Socket Listeners (Modified) ---
  useEffect(() => {
    // Only listen for updates if the socket exists, we have a ride, 
    // it's for today, and it's not completed/cancelled.
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
  }, [socket, ride, isToday]); // <-- isToday is correctly used here

  // --- Back Button Handler (Correct from your context) ---
  const handleBack = () => {
    if (ride) {
      // Navigate back to the schedule page for the ride's date
      const dateString = formatDateForQuery(ride.date);
      navigate(`/?date=${dateString}`);
    } else {
      // Fallback to home
      navigate('/');
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader size="lg" /></div>;
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error || 'Ride not found'}</p>
        <Button onClick={() => navigate('/')}>Go Back Home</Button>
      </div>
    );
  }
  
  // Logic is now correct. Map shows if status is 'In Progress'
  const isLiveTracking = ride.status === 'In Progress';

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex items-center z-10">
        <button 
          onClick={handleBack} 
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Ride Details</h1>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        
        <div className="flex-1 lg:flex-[2] h-[50vh] lg:h-auto min-h-[300px] rounded-xl overflow-hidden shadow-lg bg-white relative">
          {/* This logic is now correct. Overlay shows if not live tracking. */}
          {!isLiveTracking && (
            <MapOverlay status={ride.status} departureTime={ride.departureTime} />
          )}
          <MapComponent 
            rides={[ride]}
            selectedRide={ride._id} 
          />
        </div>

        <div className="lg:w-[400px] h-[40vh] lg:h-auto overflow-y-auto">
          <RideDetails ride={ride} />
        </div>
      </div>
    </div>
  );
};

export default TrackRide;