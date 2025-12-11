import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import ScheduleManagement from '../../components/Admin/ScheduleManagement';
import Loader from '../../components/common/Loader';
import { busMasterAPI, routeAPI, scheduledRideAPI } from '../../services/api';
import { 
  BusMaster, Route, ScheduledRide, RideStatusUpdate, RideLocationUpdate 
} from '../../types';
import { useSocket } from '../../context/SocketContext';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'; // Icons

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
    const parts = dateQuery.split('-').map(Number);
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  return getToday(); 
};

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
  
  const [isToday, setIsToday] = useState(isSameDay(selectedDate, getToday()));

  useEffect(() => {
    setIsToday(isSameDay(selectedDate, getToday()));
  }, [selectedDate]);

  const fetchData = useCallback(async () => {
    try {
      if (rides.length === 0) {
         setLoading(true);
      }
      
      const dateString = formatDateForAPI(selectedDate);
      setSearchParams({ date: dateString });
      
      const [busesRes, routesRes, ridesRes] = await Promise.all([
        busMasterAPI.getAll(),
        routeAPI.getAll(),
        scheduledRideAPI.getByDate(dateString) 
      ]);

      if (busesRes.data.success && busesRes.data.data) setBuses(busesRes.data.data);
      if (routesRes.data.success && routesRes.data.data) setRoutes(routesRes.data.data);
      
      if (ridesRes.data.success && ridesRes.data.data) {
        setRides(ridesRes.data.data);
      } else {
        setRides([]);
      }

    } catch (err) {
      setError('Failed to load schedule data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, setSearchParams, rides.length]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  if (loading && buses.length === 0) {
    return (
      <AdminLayout title="Daily Schedule">
        <div className="flex justify-center items-center h-60 md:h-[60vh]">
           <Loader size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Daily Schedule">
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-red-500" />
           {error}
        </div>
      )}
      
      {/* Date Navigation Bar */}
      <div className="mb-8 flex items-center justify-between bg-[#1A1640]/50 p-2 rounded-2xl shadow-lg border border-white/5 backdrop-blur-md max-w-2xl mx-auto">
        <button 
           onClick={() => changeDay(-1)} 
           className="p-3 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-white">
            {formatDateForDisplay(selectedDate)}
          </span>
          {!isToday && (
            <button 
               onClick={goToToday} 
               className="text-xs text-[#B045FF] hover:text-[#d389ff] font-medium mt-1 flex items-center gap-1 transition-colors"
            >
              <Calendar className="w-3 h-3" />
              Go to Today
            </button>
          )}
        </div>
        
        <button 
           onClick={() => changeDay(1)} 
           className="p-3 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
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