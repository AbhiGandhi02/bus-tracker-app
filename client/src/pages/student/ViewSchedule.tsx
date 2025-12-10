import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import RideList from '../../components/User/RideList';
import { scheduledRideAPI } from '../../services/api';
import { ScheduledRide, RideStatusUpdate, RideLocationUpdate } from '../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { ChevronLeft, ChevronRight, } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/layout/Navbar';

const BusBuddyLogo = '/images/BusBuddyLogo.png';

// --- Helper Functions (No changes here) ---
const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
    if (!isNaN(date.getTime())) {
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }
  return getToday();
};
// --- END HELPER FUNCTIONS ---

const ViewSchedule: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
    if (!socket || !isToday) {
      return;
    }
    const handleStatusUpdate = (update: RideStatusUpdate) => {
      setRides(prevRides =>
        prevRides.map(ride =>
          ride._id === update.rideId ? { ...ride, status: update.status } : ride
        )
      );
    };
    const handleLocationUpdate = (update: RideLocationUpdate) => {
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
  }, [socket, isToday]);

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

  return (
    <div className="min-h-screen bg-[#0D0A2A] text-white flex flex-col font-sans selection:bg-[#B045FF] selection:text-white relative overflow-hidden">

      {/* Background Decor (Blobs) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#4A1F8A] blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#B045FF] blur-[120px] opacity-10"></div>
      </div>

      <Navbar
        user={user}
        handleLogout={handleLogout}
        BusBuddyLogo={BusBuddyLogo}
        portalName="Student Portal"
      />

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white">Your Schedule</h2>
              <p className="text-gray-400 text-sm mt-1">Check upcoming rides and track your bus.</p>
            </div>
          </div>

          {/* Date Navigation UI */}
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm p-2 rounded-2xl border border-white/10 shadow-lg">
            <button
              onClick={() => changeDay(-1)}
              className="p-3 rounded-xl hover:bg-[#B045FF]/20 text-white transition-colors active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 text-center flex flex-col items-center justify-center">
              <span className="font-semibold text-lg text-white tracking-wide">
                {formatDateForDisplay(selectedDate)}
              </span>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="mt-1 flex items-center gap-1 text-[10px] text-[#B045FF] font-bold uppercase tracking-wider hover:text-[#c472ff] transition-colors bg-[#B045FF]/10 px-2 py-0.5 rounded-full"
                >
                  Jump to Today
                </button>
              )}
            </div>

            <button
              onClick={() => changeDay(1)}
              className="p-3 rounded-xl hover:bg-[#B045FF]/20 text-white transition-colors active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 mb-6 rounded-xl shadow-sm backdrop-blur-sm flex items-start gap-3">
            <div className="p-1 bg-red-500/20 rounded-full mt-0.5">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="font-semibold text-sm">Unable to sync schedule</p>
              <p className="text-xs opacity-80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* List Container */}
        <div className="h-[calc(100vh-280px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
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

      </main>
    </div>
  );
};

export default ViewSchedule;