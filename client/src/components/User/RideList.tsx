import React from 'react';
import { ScheduledRide, RideListProps, BusMaster, Route, RideStatus } from '../../types';
import { BusFront, Clock, ArrowRight, MapPin, Calendar, Check } from 'lucide-react';

// --- NEW: Define component-specific props ---
// This adds the new props we need from ViewSchedule.tsx
interface UpdatedRideListProps extends RideListProps {
  isToday: boolean;
  selectedDate: Date;
}

const statusPillStyles: Record<RideStatus, string> = {
  'Scheduled': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Completed': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-red-100 text-red-800',
};

// --- Helper component for the link text ---
const RideLinkText: React.FC<{ ride: ScheduledRide; isToday: boolean }> = ({ ride, isToday }) => {
  const isTracking = ride.status === 'In Progress' && isToday;
  
  if (isTracking) {
    return (
      <div className="text-xs font-semibold flex items-center gap-1 text-green-600 animate-pulse">
        <MapPin className="w-4 h-4" />
        Track Live
      </div>
    );
  }
  
  if (ride.status === 'Scheduled') {
    return (
      <div className="text-xs font-semibold flex items-center gap-1 text-indigo-600">
        <Calendar className="w-3 h-3" />
        View Schedule
      </div>
    );
  }
  
  if (ride.status === 'Completed') {
     return (
      <div className="text-xs font-semibold flex items-center gap-1 text-gray-500">
        <Check className="w-3 h-3" />
        View Summary
      </div>
    );
  }
  
  // Default for Cancelled or other states
  return (
    <div className="text-xs font-semibold flex items-center gap-1 text-gray-500">
      View Details
      <ArrowRight className="w-3 h-3" />
    </div>
  );
};
// --- END HELPER ---

const RideList: React.FC<UpdatedRideListProps> = ({ rides, onSelectRide, isToday, selectedDate }) => {
  
  // --- THIS IS THE FIX ---
  // Show a dynamic message if no rides are found
  if (rides.length === 0) {
    const dateString = selectedDate.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric'
    });

    return (
      <div className="bg-white rounded-xl p-6 h-full flex flex-col items-center justify-center text-center">
        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-gray-800 text-lg font-semibold">No Rides Scheduled</h3>
        <p className="text-gray-500 text-sm">
          There are no buses scheduled for {isToday ? 'today' : dateString}.
        </p>
      </div>
    );
  }
  // --- END OF FIX ---

  return (
    <div className="bg-white rounded-xl h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-bold text-gray-800">{isToday ? "Today's" : "Schedule"}</h2>
        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {rides.length} {rides.length === 1 ? 'ride' : 'rides'}
        </span>
      </div>
      
      {/* List of Rides */}
      <div className="overflow-y-auto p-4 space-y-3 flex-1">
        {rides.map((ride) => {
          // Handle cases where data might not be populated (though it should be)
          const bus = ride.busId as BusMaster;
          const route = ride.routeId as Route;

          return (
            <div
              key={ride._id}
              onClick={() => onSelectRide(ride._id)} 
              className="p-4 rounded-xl border-2 transition-all cursor-pointer border-gray-100 hover:border-indigo-200 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {route?.routeNumber || '...'}
                    <span className="font-normal text-gray-500">•</span>
                    {bus?.busNumber || '...'}
                  </h3>
                  <p className="text-sm text-gray-500">{route?.routeName || 'Unknown Route'}</p>
                </div>
                 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusPillStyles[ride.status]}`}>
                  {ride.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {ride.departureTime}
                </div>
                
                {/* Use the helper to show the correct link text */}
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