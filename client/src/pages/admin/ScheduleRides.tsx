import React, { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import ScheduleManagement from '../../components/Admin/ScheduleManagement';
import Loader from '../../components/common/Loader';
import { busMasterAPI, routeAPI, scheduledRideAPI } from '../../services/api';
import { 
  BusMaster, 
  Route, 
  ScheduledRide, 
  RideStatusUpdate, 
  RideLocationUpdate, 
  RideStatus 
} from '../../types';
import { useSocket } from '../../context/SocketContext';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Button from '../../components/common/Button';

// --- DATE HELPER FIXES ---

const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of *local* day
  return today;
};

// --- FIX: Use local date parts ---
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear(); // local year
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // local month
  const day = date.getDate().toString().padStart(2, '0'); // local day
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

// --- FIX: Use local date parts ---
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// --- FIX: Parse query string as a local date ---
const parseDateFromQuery = (dateQuery: string | null): Date => {
  if (dateQuery) {
    // Creates a date by parsing YYYY-MM-DD as local, not UTC
    // '2025-11-11' becomes Nov 11 2025 00:00:00 (Local)
    const parts = dateQuery.split('-').map(Number);
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  return getToday(); // Default to local today
};
// --- END DATE HELPER FIXES ---

// --- 'shouldAutoStart' function removed ---
// --- 'autoStartScheduledRides' function removed ---


const ScheduleRides: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [buses, setBuses] = useState<BusMaster[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    parseDateFromQuery(searchParams.get('date'))
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();
  
  // --- autoStartRef removed ---
  
  const [isToday, setIsToday] = useState(isSameDay(selectedDate, getToday()));

  useEffect(() => {
    setIsToday(isSameDay(selectedDate, getToday()));
  }, [selectedDate]);

  // --- 'autoStartScheduledRides' logic removed ---

  const fetchData = useCallback(async () => {
    try {
      if (rides.length === 0) {
         setLoading(true);
      }
      // --- autoStartRef reset removed ---
      
      const dateString = formatDateForAPI(selectedDate);
      setSearchParams({ date: dateString });
      
      const [busesRes, routesRes, ridesRes] = await Promise.all([
        busMasterAPI.getAll(),
        routeAPI.getAll(),
        scheduledRideAPI.getByDate(dateString) // Fetch using local date string
      ]);

      if (busesRes.data.success && busesRes.data.data) setBuses(busesRes.data.data);
      if (routesRes.data.success && routesRes.data.data) setRoutes(routesRes.data.data);
      
      if (ridesRes.data.success && ridesRes.data.data) {
        setRides(ridesRes.data.data);
        // --- Call to autoStartScheduledRides removed ---
      } else {
        setRides([]);
      }

    } catch (err) {
      setError('Failed to load schedule data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, setSearchParams]); // 'rides.length' removed from dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket || !isToday) {
      return;
    }
    const handleStatusUpdate = (update: RideStatusUpdate) => {
      console.log('[Socket] Admin received ride-status-update:', update);
      setRides(prevRides => 
        prevRides.map(ride => 
          ride._id === update.rideId ? { ...ride, status: update.status } : ride
        )
      );
    };
    const handleLocationUpdate = (update: RideLocationUpdate) => {
      setRides(prevRides => 
        prevRides.map(ride => 
          ride._id === update.rideId && ride.status === 'Scheduled'
            ? { ...ride, status: 'In Progress' }
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

  const handleDateChange = (dateString: string) => {
    setSelectedDate(parseDateFromQuery(dateString));
  };
  
  // --- FIX: Use local setDate ---
  const changeDay = (days: number) => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + days); // Use local setDate
      return newDate;
    });
  };

  const goToToday = () => {
    setSelectedDate(getToday());
  };
  // --- END FIX ---

  if (loading && buses.length === 0) {
    return (
      <AdminLayout title="Daily Schedule">
        <div className="flex justify-center p-12"><Loader size="lg" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Schedule for ${formatDateForDisplay(selectedDate)}`}>
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}
      
      <div className="mb-6 flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-200">
        <Button variant="outline" onClick={() => changeDay(-1)} className="!px-3">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 text-center">
          <span className="font-semibold text-lg text-gray-800">
            {formatDateForDisplay(selectedDate)}
          </span>
          {/* This logic will now be correct */}
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

      <ScheduleManagement
        rides={rides}
        buses={buses}
        routes={routes}
        selectedDate={formatDateForAPI(selectedDate)}
        onUpdate={fetchData}
        onDateChange={handleDateChange}
        isToday={isToday}
      />
    </AdminLayout>
  );
};

export default ScheduleRides;