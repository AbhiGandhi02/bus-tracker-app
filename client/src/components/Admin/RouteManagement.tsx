import React, { useState, useRef } from 'react';
import { Route, RouteInput } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { routeAPI } from '../../services/api';
import { Autocomplete } from '@react-google-maps/api';

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
      <div className="mb-4 flex justify-end">
        <Button onClick={() => handleOpenModal()}>+ Add New Route</Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {/* Added 'table-fixed' to respect column widths */}
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              {/* --- THIS IS THE UI FIX --- */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Route No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">Locations</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Duration</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Actions</th>
              {/* --- END FIX --- */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.map((route) => (
              <tr key={route._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate">{route.routeNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate">{route.routeName}</td>
                
                {/* --- THIS IS THE UI FIX --- */}
                {/* Removed 'whitespace-nowrap' and 'max-w-xs' */}
                {/* Added 'break-words' to allow wrapping */}
                <td className="px-6 py-4 text-sm text-gray-500 break-words">
                  <div 
                    className="font-medium text-gray-900" 
                    title={route.departureLocation}
                  >
                    <span className="text-gray-400">From: </span>
                    {route.departureLocation}
                  </div>
                  <div 
                    className="font-medium text-gray-900 mt-1" 
                    title={route.arrivalLocation}
                  >
                    <span className="text-gray-400">To: </span>
                    {route.arrivalLocation}
                  </div>
                </td>
                {/* --- END FIX --- */}
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.rideTime}</td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(route)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(route._id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No routes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">{editingRoute ? 'Edit Route' : 'Add New Route'}</h3>
            {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Route Number"
                required
                value={formData.routeNumber}
                onChange={(e) => setFormData({ ...formData, routeNumber: e.target.value })}
              />
              <Input
                label="Route Name"
                required
                value={formData.routeName}
                onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
              />
              
              <Autocomplete
                onLoad={(ref) => (departureAutocompleteRef.current = ref)}
                onPlaceChanged={() => handlePlaceChanged('departure', departureAutocompleteRef)}
              >
                <Input
                  label="Departure Location"
                  required
                  defaultValue={formData.departureLocation}
                  placeholder="Type and select a location..."
                />
              </Autocomplete>

              <Autocomplete
                onLoad={(ref) => (arrivalAutocompleteRef.current = ref)}
                onPlaceChanged={() => handlePlaceChanged('arrival', arrivalAutocompleteRef)}
              >
                <Input
                  label="Arrival Location"
                  required
                  defaultValue={formData.arrivalLocation}
                  placeholder="Type and select a location..."
                />
              </Autocomplete>

              <Input
                label="Ride Duration (e.g., 45 mins)"
                required
                value={formData.rideTime}
                onChange={(e) => setFormData({ ...formData, rideTime: e.target.value })}
              />
              <div className="mt-5 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={loading}>{editingRoute ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;