import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import RideList from '../../components/User/RideList';
import Button from '../../components/common/Button';
import { scheduledRideAPI } from '../../services/api';
import { ScheduledRide, RideStatusUpdate, RideLocationUpdate } from '../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

// --- Helper Functions ---
const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  return today;
};

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const parseDateFromQuery = (dateQuery: string | null): Date => {
  if (dateQuery) {
    const date = new Date(dateQuery);
    // Check if date is valid. Note: NaNs are tricky.
    if (!isNaN(date.getTime())) {
      date.setHours(0, 0, 0, 0); // Normalize
      return date;
    }
  }
  return getToday(); // Default to today
};
// --- END HELPER FUNCTIONS ---


const ViewSchedule: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // Get URL params

  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    parseDateFromQuery(searchParams.get('date'))
  );

  const { socket } = useSocket();

  const isToday = isSameDay(selectedDate, getToday());

  // --- Data fetching logic ---
  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const dateString = formatDateForAPI(selectedDate);
      
      // Ensure URL matches state
      setSearchParams({ date: dateString });

      const response = await scheduledRideAPI.getByDate(dateString);
      
      if (response.data.success && response.data.data) {
        setRides(response.data.data);
      } else {
        setRides([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, setSearchParams]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // --- Socket logic ---
  useEffect(() => {
    // Only listen for live updates if the selected date is today
    if (!socket || !isToday) {
      return;
    }
    const handleStatusUpdate = (update: RideStatusUpdate) => {
      console.log('[Socket] Student View received ride-status-update:', update);
      setRides(prevRides => 
        prevRides.map(ride => 
          ride._id === update.rideId ? { ...ride, status: update.status } : ride
        )
      );
    };
    const handleLocationUpdate = (update: RideLocationUpdate) => {
      // Also update status to 'In Progress' if location comes in
      setRides(prevRides => 
        prevRides.map(ride => 
          ride._id === update.rideId 
            ? { ...ride, currentLocation: update.location, status: 'In Progress' }
            : ride
        )
      );
    };

    socket.on('ride-status-update', handleStatusUpdate);
    socket.on('ride-location-update', handleLocationUpdate);

    return () => {
      socket.off('ride-status-update', handleStatusUpdate);
      socket.off('ride-location-update', handleLocationUpdate);
    };
  }, [socket, isToday]); // Only re-subscribe if socket or isToday changes

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRideSelect = (rideId: string | null) => {
    if (rideId) {
      const dateString = formatDateForAPI(selectedDate);
      navigate(`/track/${rideId}?date=${dateString}`);
    }
  };

  // --- Date Navigation Handlers ---
  const changeDay = (days: number) => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const goToToday = () => {
    setSelectedDate(getToday());
  };
  // --- END Handlers ---

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚌</span>
            <h1 className="text-xl font-bold">College Bus Tracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block opacity-90 text-sm">
              Hi, {user?.name?.split(' ')[0]}
            </span>
            <Button 
              variant="secondary" 
              onClick={handleLogout} 
              className="text-xs py-1.5 px-3 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bus Schedule</h2>
          
          {/* Date Navigation UI */}
          <div className="mt-4 flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-200">
            <Button variant="outline" onClick={() => changeDay(-1)} className="!px-3">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 text-center">
              <span className="font-semibold text-lg text-gray-800">
                {formatDateForDisplay(selectedDate)}
              </span>
              {!isToday && (
                <Button variant="secondary" onClick={goToToday} className="ml-3 text-xs !py-1 !px-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  Go to Today
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => changeDay(1)} className="!px-3">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* --- THIS IS THE FIX --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-250px)]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader size="lg" />
            </div>
          ) : (
            <RideList 
              rides={rides} 
              onSelectRide={handleRideSelect}
              isToday={isToday}
              selectedDate={selectedDate} 
            />
          )}
        </div>
        {/* --- END OF FIX --- */}
        
      </main>
    </div>
  );
};

export default ViewSchedule;