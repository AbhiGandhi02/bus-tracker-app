import React from 'react';
import { BusFront, MapPin, Calendar, Navigation, User, Clock } from 'lucide-react';
import { ScheduledRide, RideDetailsProps, BusMaster, Route } from '../../types';

// Styling for the status badges
const statusPillStyles: Record<ScheduledRide['status'], string> = {
  'Scheduled': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'In Progress': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Completed': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Cancelled': 'bg-red-500/20 text-red-300 border-red-500/30',
};

const RideDetails: React.FC<RideDetailsProps> = ({ ride }) => {
  if (!ride) {
    return (
      <div className="bg-[#1A1640] border border-white/10 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center shadow-lg">
        <BusFront className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-gray-200 text-lg font-semibold mb-2">No Ride Selected</h3>
        <p className="text-gray-500 text-sm">Select a bus on the map to view details.</p>
      </div>
    );
  }

  const bus = ride.busId as BusMaster;
  const route = ride.routeId as Route;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="bg-[#1A1640]/80 backdrop-blur-md border border-white/10 rounded-2xl h-full flex flex-col shadow-xl overflow-hidden">
      
      <div className="flex-1 overflow-y-auto custom-scrollbar h-full">
        
        <div className="p-5 border-b border-white/10 relative">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-white">
                {bus.busNumber || 'Bus details'}
              </h2>
              <p className="text-sm text-gray-400">{bus.busType || 'Standard'} Bus</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusPillStyles[ride.status]}`}>
              {ride.status}
            </span>
          </div>
          
          {/* Quick Driver Info */}
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
             <User className="w-4 h-4 text-[#B045FF]" />
             <span className="font-medium text-gray-400">Driver:</span>
             <span>{bus.driverName || 'Not Assigned'}</span>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="p-5 space-y-6">
          
          {/* Schedule Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-3 h-3 text-[#B045FF]" />
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Date</p>
                  <p className="text-sm font-semibold text-gray-200">{formatDate(ride.date)}</p>
               </div>
               <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Departure</p>
                  <p className="text-sm font-semibold text-gray-200">{ride.departureTime}</p>
               </div>
               {route.rideTime && (
                 <div className="col-span-2 bg-[#4A1F8A]/20 p-3 rounded-xl border border-[#4A1F8A]/30 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#B045FF]" />
                    <div>
                      <p className="text-[10px] text-[#B045FF] uppercase font-bold">Est. Duration</p>
                      <p className="text-sm font-bold text-gray-200">{route.rideTime}</p>
                    </div>
                 </div>
               )}
            </div>
          </div>

          {/* Route Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Navigation className="w-3 h-3 text-[#B045FF]" />
              Route Information
            </h3>
            
            <div className="relative pl-2">
              {/* The Vertical Line */}
              <div className="absolute left-[1.35rem] top-3 bottom-8 w-0.5 bg-gray-700" />

              {/* Start Point */}
              <div className="flex gap-4 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 text-green-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Departure</p>
                  <p className="text-sm font-bold text-gray-200 leading-tight">
                    {route.departureLocation}
                  </p>
                </div>
              </div>

              {/* End Point */}
              <div className="flex gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Arrival</p>
                  <p className="text-sm font-bold text-gray-200 leading-tight">
                    {route.arrivalLocation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Status Logic */}
          {ride.currentLocation?.lat && (
             <div className="mt-4 pt-4 border-t border-white/10">
               
               {/* CASE 1: Ride is In Progress */}
               {ride.status === 'In Progress' ? (
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-start gap-3">
                    <div className="relative mt-1">
                      <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-500 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-400">Live Tracking Active</p>
                      <p className="text-xs text-green-600/80 mt-0.5">
                        Last update: {new Date(ride.currentLocation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
               ) : (
               /* CASE 2: Ride is Completed/Cancelled */
                  <div className="bg-gray-500/10 border border-gray-500/20 p-3 rounded-xl flex items-start gap-3">
                    <div className="relative mt-1">
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-400">Live Tracking Ended</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Last recorded location: {new Date(ride.currentLocation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
               )}

             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RideDetails;