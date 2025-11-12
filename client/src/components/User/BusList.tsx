import React from 'react';
import { Bus } from '../../types';
import { BusFront, MapPin, Route as RouteIcon, User, ArrowRight } from 'lucide-react';

interface BusListProps {
  buses: Bus[];
  selectedBus: string | null;
  onSelectBus: (busId: string | null) => void;
}

// Helper object for dynamic status badge styling
const statusPillStyles: Record<Bus['status'], string> = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-800',
  Maintenance: 'bg-yellow-100 text-yellow-800',
};

const BusList: React.FC<BusListProps> = ({ buses, selectedBus, onSelectBus }) => {
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to get route name safely
  const getRouteName = (routeId: any): string => {
    if (!routeId) return 'Unassigned';
    if (typeof routeId === 'object' && routeId.routeName) {
      return routeId.routeName;
    }
    return 'Unassigned';
  };

  if (buses.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 h-full shadow-lg border border-gray-200">
        <div className="text-center py-16 px-5 flex flex-col items-center justify-center h-full">
          <BusFront className="w-16 h-16 text-gray-300 mb-5" />
          <h3 className="text-gray-800 text-xl font-semibold mb-2.5">No Buses Available</h3>
          <p className="text-gray-500 text-sm">There are currently no active buses on any route.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Active Buses</h2>
        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
          {buses.length} {buses.length === 1 ? 'bus' : 'buses'}
        </span>
      </div>

      {/* Bus Cards */}
      <div className="flex flex-col gap-[15px] overflow-y-auto flex-1 pr-2 scrollbar-thin">
        {buses.map((bus) => {
          const isSelected = selectedBus === bus._id;
          const statusBorder =
            bus.status === 'Active' ? 'border-l-4 border-green-500' :
            bus.status === 'Inactive' ? 'border-l-4 border-red-500 opacity-90' :
            'border-l-4 border-yellow-500';

          return (
            <div
              key={bus._id}
              className={`p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-600/15 ${statusBorder} ${
                isSelected
                  ? 'border-2 border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-600/20'
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
              onClick={() => onSelectBus(isSelected ? null : bus._id)}
            >
              {/* Card Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-800">
                  <BusFront className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                  <span>{bus.busNumber}</span>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${statusPillStyles[bus.status]}`}>
                  {bus.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="mb-3">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <RouteIcon className="w-4 h-4" /> Route:
                  </span>
                  <span className="text-gray-800 font-semibold text-right">{getRouteName(bus.routeId)}</span>
                </div>

                {bus.driverName && (
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <User className="w-4 h-4" /> Driver:
                    </span>
                    <span className="text-gray-800 font-semibold text-right">{bus.driverName}</span>
                  </div>
                )}
              </div>

              {/* Location Info */}
              {bus.location && bus.location.lat ? (
                <div className="flex gap-2.5 mt-3 p-2.5 bg-white rounded-lg border border-gray-200">
                  <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 font-medium mb-1">
                      {bus.location.lat.toFixed(4)}, {bus.location.lng.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Updated: {formatTime(bus.location.timestamp)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 bg-yellow-100 rounded-lg text-yellow-800 text-xs mt-3">
                  <MapPin className="w-5 h-5" />
                  <span>Location not available</span>
                </div>
              )}

              {/* Card Footer */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <button className="w-full p-1 bg-transparent border-none text-indigo-600 font-semibold text-sm cursor-pointer transition-all duration-300 text-center hover:text-indigo-800 flex items-center justify-center gap-1">
                  {isSelected ? 'View Details' : 'View on Map'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusList;