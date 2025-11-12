import React from 'react';
import { ScheduledRide, RideListProps, BusMaster, Route } from '../../types';
import { BusFront, Clock, ArrowRight } from 'lucide-react';

const statusPillStyles: Record<ScheduledRide['status'], string> = {
  'Scheduled': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-green-100 text-green-800',
  'Completed': 'bg-gray-100 text-gray-800',
  'Cancelled': 'bg-red-100 text-red-800',
};

const RideList: React.FC<RideListProps> = ({ rides, selectedRide, onSelectRide }) => {
  if (rides.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 h-full shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
        <BusFront className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-gray-800 text-lg font-semibold">No Rides Today</h3>
        <p className="text-gray-500 text-sm">Check back later for schedule updates.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-bold text-gray-800">Today's Schedule</h2>
        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {rides.length}
        </span>
      </div>
      
      <div className="overflow-y-auto p-4 space-y-3 flex-1">
        {rides.map((ride) => {
          const bus = ride.busId as BusMaster;
          const route = ride.routeId as Route;
          const isSelected = selectedRide === ride._id;

          return (
            <div
              key={ride._id}
              onClick={() => onSelectRide(ride._id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                  : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {route.routeNumber}
                    <span className="font-normal text-gray-500">•</span>
                    {bus.busNumber}
                  </h3>
                  <p className="text-sm text-gray-500">{route.routeName}</p>
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
                 <button className={`text-xs font-semibold flex items-center gap-1 ${
                  isSelected ? 'text-indigo-700' : 'text-indigo-600'
                }`}>
                  Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RideList;