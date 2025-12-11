import React from 'react';
import { ScheduledRide, RideListProps, BusMaster, Route, RideStatus } from '../../types';
import { Clock, ArrowRight, MapPin, Calendar, Check } from 'lucide-react';

interface UpdatedRideListProps extends RideListProps {
  isToday: boolean;
  selectedDate: Date;
}

// Updated Status Pills for Dark Mode (Neon/Glassy look)
const statusPillStyles: Record<RideStatus, string> = {
  'Scheduled': 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  'In Progress': 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 animate-pulse',
  'Completed': 'bg-green-500/10 text-green-300 border border-green-500/20',
  'Cancelled': 'bg-red-500/10 text-red-300 border border-red-500/20',
};

// --- Helper component for the link text ---
const RideLinkText: React.FC<{ ride: ScheduledRide; isToday: boolean }> = ({ ride, isToday }) => {
  const isTracking = ride.status === 'In Progress' && isToday;
  
  if (isTracking) {
    return (
      <div className="text-xs font-bold flex items-center gap-1 text-[#B045FF] drop-shadow-[0_0_8px_rgba(176,69,255,0.6)]">
        <MapPin className="w-4 h-4" />
        TRACK LIVE
      </div>
    );
  }
  
  if (ride.status === 'Scheduled') {
    return (
      <div className="text-xs font-medium flex items-center gap-1 text-gray-400 group-hover:text-white transition-colors">
        <Calendar className="w-3 h-3" />
        View Schedule
      </div>
    );
  }
  
  if (ride.status === 'Completed') {
     return (
      <div className="text-xs font-medium flex items-center gap-1 text-gray-500">
        <Check className="w-3 h-3" />
        Run Completed
      </div>
    );
  }
  
  return (
    <div className="text-xs font-medium flex items-center gap-1 text-gray-500">
      View Details
      <ArrowRight className="w-3 h-3" />
    </div>
  );
};
// --- END HELPER ---

const RideList: React.FC<UpdatedRideListProps> = ({ rides, onSelectRide, isToday, selectedDate }) => {
  
  // Empty State - Dark Theme
  if (rides.length === 0) {
    const dateString = selectedDate.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric'
    });

    return (
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 h-64 flex flex-col items-center justify-center text-center shadow-lg">
        <div className="bg-white/5 p-4 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-white text-lg font-semibold mb-1">No Rides Scheduled</h3>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          We couldn't find any buses scheduled for {isToday ? <span className="text-[#B045FF] font-medium">today</span> : dateString}.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">
            {isToday ? "Today's Trips" : "Upcoming Trips"}
        </h2>
        <span className="bg-[#4A1F8A]/30 border border-[#4A1F8A]/50 text-purple-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {rides.length} {rides.length === 1 ? 'ride' : 'rides'}
        </span>
      </div>
      
      {/* List of Rides */}
      <div className="overflow-y-auto space-y-4 pb-20 pr-1 custom-scrollbar">
        {rides.map((ride) => {
          const bus = ride.busId as BusMaster;
          const route = ride.routeId as Route;

          return (
            <div
              key={ride._id}
              onClick={() => onSelectRide(ride._id)} 
              className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-[#B045FF]/50 hover:shadow-[0_0_20px_rgba(176,69,255,0.15)]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                    {route?.routeNumber || '...'}
                    <span className="text-gray-600 text-sm">•</span>
                    <span className="text-gray-300 font-medium text-base">{bus?.busNumber || '...'}</span>
                  </h3>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {route?.routeName || 'Unknown Route'}
                  </p>
                </div>
                 <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${statusPillStyles[ride.status]}`}>
                  {ride.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-gray-300 font-medium">
                  <div className="p-1.5 bg-[#4A1F8A]/30 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-[#B045FF]" />
                  </div>
                  {ride.departureTime}
                </div>
                
                <RideLinkText ride={ride} isToday={isToday} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RideList;