import React from 'react';
import { ScheduledRide, RideDetailsProps, BusMaster, Route } from '../../types';
import { BusFront, MapPin, Calendar, Navigation } from 'lucide-react';

const statusPillStyles: Record<ScheduledRide['status'], string> = {
  'Scheduled': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-green-100 text-green-800',
  'Completed': 'bg-gray-100 text-gray-800',
  'Cancelled': 'bg-red-100 text-red-800',
};

const RideDetails: React.FC<RideDetailsProps> = ({ ride }) => {
  if (!ride) {
    return (
      <div className="bg-white rounded-xl p-6 h-full flex flex-col items-center justify-center text-center">
        <BusFront className="w-20 h-20 text-gray-300 mb-5" />
        <h3 className="text-gray-800 text-xl font-semibold mb-2.5">No Ride Selected</h3>
        <p className="text-gray-500 text-sm">Select a ride from the list to view details</p>
      </div>
    );
  }

  // Helper functions with safe casting
  const bus = ride.busId as BusMaster;
  const route = ride.routeId as Route;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600">
          <BusFront className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{bus.busNumber || 'Unknown Bus'}</h2>
          <p className="text-sm text-gray-500 mb-2">{bus.busType || 'Standard'} Bus</p>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusPillStyles[ride.status]}`}>
            {ride.status}
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {/* Driver Info */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BusFront className="w-5 h-5 text-indigo-600" />
            Bus Details
          </h3>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Driver</p>
                <p className="font-medium">{bus.driverName || 'Not Assigned'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Type</p>
                <p className="font-medium">{bus.busType}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Info */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Schedule
          </h3>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4">
             <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
              <p className="font-medium">{formatDate(ride.date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Departure</p>
              <p className="font-medium">{ride.departureTime}</p>
            </div>
             {route.rideTime && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase font-semibold">Est. Duration</p>
                <p className="font-medium">{route.rideTime}</p>
              </div>
            )}
          </div>
        </div>

        {/* Route Info */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-600" />
            Route: {route.routeName}
          </h3>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4 relative">
            {/* Connecting line */}
             <div className="absolute left-[2.25rem] top-10 bottom-10 w-0.5 bg-gray-300" />
             
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Start</p>
                <p className="font-bold text-gray-900">{route.departureLocation}</p>
              </div>
            </div>
             <div className="flex items-start gap-4 relative z-10">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">End</p>
                <p className="font-bold text-gray-900">{route.arrivalLocation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Location */}
        {ride.currentLocation?.lat && (
           <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600 animate-pulse" />
              Live Status
            </h3>
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <p className="text-green-800 font-medium mb-1">Currently Tracking</p>
               <p className="text-xs text-green-600">
                Last update: {new Date(ride.currentLocation.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideDetails;