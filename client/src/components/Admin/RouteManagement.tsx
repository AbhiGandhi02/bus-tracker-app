import React, { useState, useRef } from 'react';
import { Route, RouteInput } from '../../types';
import { routeAPI } from '../../services/api';
import { Autocomplete } from '@react-google-maps/api';
import { Plus, Edit2, Trash2, MapPin, Clock, Navigation, X } from 'lucide-react';
import Loader from '../common/Loader'; 

interface Props {
  routes: Route[];
  onUpdate: () => void;
}

const initialFormData: RouteInput = {
  routeNumber: '',
  routeName: '',
  departureLocation: '',
  departureCoords: { lat: 0, lng: 0 },
  arrivalLocation: '',
  arrivalCoords: { lat: 0, lng: 0 },
  rideTime: '',
};

const RouteManagement: React.FC<Props> = ({ routes, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<RouteInput>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const departureAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const arrivalAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleOpenModal = (route?: Route) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        routeNumber: route.routeNumber,
        routeName: route.routeName,
        departureLocation: route.departureLocation,
        // @ts-ignore
        departureCoords: route.departureCoords, 
        arrivalLocation: route.arrivalLocation,
        // @ts-ignore
        arrivalCoords: route.arrivalCoords,
        rideTime: route.rideTime,
      });
    } else {
      setEditingRoute(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.departureCoords || formData.departureCoords.lat === 0) {
      setError('Please select a valid departure location from the suggestions.');
      return;
    }
    if (!formData.arrivalCoords || formData.arrivalCoords.lat === 0) {
      setError('Please select a valid arrival location from the suggestions.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (editingRoute) {
        await routeAPI.update(editingRoute._id, formData);
      } else {
        await routeAPI.create(formData);
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await routeAPI.delete(id);
      onUpdate();
    } catch (err) {
      alert('Failed to delete route');
    }
  };

  const handlePlaceChanged = (
    type: 'departure' | 'arrival', 
    ref: React.MutableRefObject<google.maps.places.Autocomplete | null>
  ) => {
    if (ref.current) {
      const place = ref.current.getPlace();
      if (place && place.geometry && place.geometry.location) {
        
        const locationName = place.formatted_address || place.name || '';
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        if (type === 'departure') {
          setFormData({ 
            ...formData, 
            departureLocation: locationName, 
            departureCoords: coords 
          });
        } else {
          setFormData({ 
            ...formData, 
            arrivalLocation: locationName, 
            arrivalCoords: coords 
          });
        }
        setError('');
      }
    }
  };

  return (
    <div>
      {/* --- HEADER ACTIONS --- */}
      <div className="mb-6 flex justify-between items-center">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#B045FF]" />
            Active Routes
         </h2>
         <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#B045FF] hover:bg-[#9d3ce3] text-white rounded-xl font-bold shadow-lg shadow-[#B045FF]/20 transition-all transform hover:-translate-y-0.5"
         >
            <Plus className="w-5 h-5" />
            Add Route
         </button>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="w-full bg-[#1A1640]/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 table-fixed">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[15%]">Route No</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[20%]">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[40%]">Locations</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-[10%]">Duration</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {routes.map((route) => (
                <tr key={route._id} className="hover:bg-white/5 transition-colors group">
                  
                  {/* Route Number */}
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#B045FF]/10 border border-[#B045FF]/20 flex items-center justify-center text-[#B045FF] font-bold text-xs">
                           {route.routeNumber}
                        </div>
                     </div>
                  </td>

                  {/* Name */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {route.routeName}
                  </td>
                  
                  {/* Locations (From -> To) */}
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <div className="flex flex-col gap-2 relative pl-4 border-l-2 border-dashed border-gray-700">
                       {/* Departure */}
                       <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-[#1A1640]" />
                          <p className="text-xs text-gray-500 uppercase font-semibold">From</p>
                          <p className="font-medium text-white line-clamp-1" title={route.departureLocation}>
                             {route.departureLocation}
                          </p>
                       </div>
                       
                       {/* Arrival */}
                       <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#B045FF] border-2 border-[#1A1640]" />
                          <p className="text-xs text-gray-500 uppercase font-semibold">To</p>
                          <p className="font-medium text-white line-clamp-1" title={route.arrivalLocation}>
                             {route.arrivalLocation}
                          </p>
                       </div>
                    </div>
                  </td>
                  
                  {/* Duration */}
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center gap-1.5 text-gray-400 bg-black/20 px-2 py-1 rounded-md w-fit">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-mono">{route.rideTime} mins</span>
                     </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 ">
                       <button 
                          onClick={() => handleOpenModal(route)} 
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                          title="Edit"
                       >
                          <Edit2 className="w-4 h-4" />
                       </button>
                       <button 
                          onClick={() => handleDelete(route._id)} 
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="Delete"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                     <div className="flex flex-col items-center gap-2">
                        <MapPin className="w-8 h-8 text-gray-700" />
                        <p>No routes found. Create one to get started.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DARK THEMED MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#1A1640] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {editingRoute ? <Edit2 className="w-5 h-5 text-[#B045FF]" /> : <Plus className="w-5 h-5 text-[#B045FF]" />}
                  {editingRoute ? 'Edit Route' : 'Add New Route'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
               </button>
            </div>

            {error && (
               <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
               </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Route No</label>
                    <input
                       required
                       value={formData.routeNumber}
                       onChange={(e) => setFormData({ ...formData, routeNumber: e.target.value })}
                       className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors"
                       placeholder="e.g. 101"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Route Name</label>
                    <input
                       required
                       value={formData.routeName}
                       onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                       className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors"
                       placeholder="e.g. Downtown Express"
                    />
                 </div>
              </div>
              
              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 uppercase">Departure</label>
                 <Autocomplete
                   onLoad={(ref) => (departureAutocompleteRef.current = ref)}
                   onPlaceChanged={() => handlePlaceChanged('departure', departureAutocompleteRef)}
                 >
                   <input
                     required
                     defaultValue={formData.departureLocation}
                     className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors"
                     placeholder="Search departure location..."
                   />
                 </Autocomplete>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 uppercase">Arrival</label>
                 <Autocomplete
                   onLoad={(ref) => (arrivalAutocompleteRef.current = ref)}
                   onPlaceChanged={() => handlePlaceChanged('arrival', arrivalAutocompleteRef)}
                 >
                   <input
                     required
                     defaultValue={formData.arrivalLocation}
                     className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors"
                     placeholder="Search arrival location..."
                   />
                 </Autocomplete>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 uppercase">Duration</label>
                 <div className="relative">
                    <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                       required
                       value={formData.rideTime}
                       onChange={(e) => setFormData({ ...formData, rideTime: e.target.value })}
                       className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors"
                       placeholder="e.g. 45 mins"
                    />
                 </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2 bg-[#B045FF] hover:bg-[#9d3ce3] text-white rounded-xl font-bold shadow-lg shadow-[#B045FF]/20 flex items-center gap-2"
                >
                  {loading && <Loader size="sm" />}
                  {editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;