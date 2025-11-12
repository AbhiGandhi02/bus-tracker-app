import React from 'react';
import { Bus, Route, Stop } from'../../types';
import { BusFront, MapPin, Route as RouteIcon, Clock } from 'lucide-react';

interface BusDetailsProps {
  bus: Bus | null;
}

// Helper object for dynamic status badge styling
const statusPillStyles: Record<Bus['status'], string> = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-800',
  Maintenance: 'bg-yellow-100 text-yellow-800',
};

const BusDetails: React.FC<BusDetailsProps> = ({ bus }) => {
  if (!bus) {
    return (
      <div className="bg-white rounded-xl p-6 h-full">
        <div className="text-center py-20 px-5 flex flex-col items-center justify-center h-full">
          <BusFront className="w-20 h-20 text-gray-300 mb-5" />
          <h3 className="text-gray-800 text-xl font-semibold mb-2.5">No Bus Selected</h3>
          <p className="text-gray-500 text-sm">Select a bus from the list to view details</p>
        </div>
      </div>
    );
  }

  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    if (isNaN(hour) || isNaN(parseInt(minutes))) return 'Invalid Time';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Check if routeId is populated and has required fields
  const routeInfo = typeof bus.routeId === 'object' && bus.routeId && 'startTime' in bus.routeId
    ? bus.routeId as Route 
    : null;

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 mb-7 pb-5 border-b-2 border-gray-200">
        <div className="text-4xl md:text-5xl bg-indigo-100 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl text-indigo-600 flex-shrink-0">
          <BusFront className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <div className="flex-1">
          <h2 className="text-gray-800 text-2xl md:text-3xl font-bold mb-2">{bus.busNumber}</h2>
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${statusPillStyles[bus.status]}`}>
            {bus.status}
          </span>
        </div>
      </div>

      {/* Bus Information */}
      <div className="mb-7">
        <h3 className="text-gray-800 text-lg font-bold mb-4 flex items-center gap-2">
          <BusFront className="w-5 h-5 text-indigo-600" />
          Bus Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <span className="block text-gray-500 text-sm font-medium mb-1.5">Driver Name</span>
            <span className="block text-gray-800 text-base font-semibold">{bus.driverName || 'Not assigned'}</span>
          </div>
          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <span className="block text-gray-500 text-sm font-medium mb-1.5">Contact</span>
            <span className="block text-gray-800 text-base font-semibold">{bus.driverPhone || 'N/A'}</span>
          </div>
          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <span className="block text-gray-500 text-sm font-medium mb-1.5">Capacity</span>
            <span className="block text-gray-800 text-base font-semibold">{bus.capacity || 'N/A'} seats</span>
          </div>
          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <span className="block text-gray-500 text-sm font-medium mb-1.5">Status</span>
            <span className="block text-gray-800 text-base font-semibold">{bus.status}</span>
          </div>
        </div>
      </div>

      {/* Current Location */}
      {bus.location && bus.location.lat && (
        <div className="mb-7">
          <h3 className="text-gray-800 text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Current Location
          </h3>
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-green-800 text-xs font-semibold uppercase mb-1">Latitude</span>
              <span className="text-green-900 text-base font-bold">{bus.location.lat.toFixed(6)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-green-800 text-xs font-semibold uppercase mb-1">Longitude</span>
              <span className="text-green-900 text-base font-bold">{bus.location.lng.toFixed(6)}</span>
            </div>
            <div className="flex flex-col md:col-span-2">
              <span className="text-green-800 text-xs font-semibold uppercase mb-1">Last Updated</span>
              <span className="text-green-900 text-base font-bold">
                {new Date(bus.location.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Route Information */}
      {routeInfo && (
        <>
          <div className="mb-7">
            <h3 className="text-gray-800 text-lg font-bold mb-4 flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-indigo-600" />
              Route Information
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <div className="text-gray-800 text-base font-bold">{routeInfo.routeName}</div>
                <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {routeInfo.routeNumber}
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                <div className="flex-1 text-center">
                  <span className="block text-gray-500 text-xs font-medium mb-1.5">Start Time</span>
                  <span className="block text-gray-800 text-lg font-bold">{formatTime(routeInfo.startTime)}</span>
                </div>
                <div className="text-indigo-600 text-xl font-bold md:rotate-0 rotate-90">→</div>
                <div className="flex-1 text-center">
                  <span className="block text-gray-500 text-xs font-medium mb-1.5">End Time</span>
                  <span className="block text-gray-800 text-lg font-bold">{formatTime(routeInfo.endTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Stops */}
          {routeInfo.stops && routeInfo.stops.length > 0 && (
            <div className="mb-7">
              <h3 className="text-gray-800 text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Route Stops
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                {routeInfo.stops
                  .sort((a: Stop, b: Stop) => a.order - b.order)
                  .map((stop: Stop, index: number) => (
                    <div key={index} className="flex gap-4 relative">
                      <div className="flex flex-col items-center relative">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-10">
                          {stop.order}
                        </div>
                        {index < routeInfo.stops!.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-300 my-1 min-h-[24px]"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-5">
                        <div className="text-gray-800 text-base font-semibold mb-0.5">{stop.name}</div>
                        <div className="text-gray-500 text-sm">
                          Arrival: {formatTime(stop.arrivalTime)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BusDetails;