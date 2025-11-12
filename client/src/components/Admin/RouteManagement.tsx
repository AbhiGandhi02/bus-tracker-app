import React, { useState } from 'react';
import { routeAPI } from '../../services/api';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

// Define TS interfaces based on your component's needs
interface Stop {
  _id?: string;
  name: string;
  lat: number;
  lng: number;
  arrivalTime: string;
  order: number;
}

interface Route {
  _id: string;
  routeName: string;
  routeNumber: string;
  startTime: string;
  endTime: string;
  stops: Stop[];
  isActive?: boolean;
}

interface RouteManagementProps {
  routes: Route[];
  onUpdate: () => void;
}

const RouteManagement: React.FC<RouteManagementProps> = ({ routes, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    routeName: '',
    routeNumber: '',
    startTime: '',
    endTime: '',
    stops: [] as Stop[]
  });
  const [newStop, setNewStop] = useState({
    name: '',
    lat: '',
    lng: '',
    arrivalTime: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setEditingRoute(null);
    setFormData({
      routeName: '',
      routeNumber: '',
      startTime: '',
      endTime: '',
      stops: []
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      routeName: route.routeName,
      routeNumber: route.routeNumber,
      startTime: route.startTime,
      endTime: route.endTime,
      stops: route.stops
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string, routeName: string) => {
    if (window.confirm(`Are you sure you want to delete route "${routeName}"?`)) {
      try {
        await routeAPI.delete(id);
        onUpdate();
      } catch (error: any) {
        console.error('Failed to delete route:', error.response?.data?.message);
        // You can set an error state here instead of alerting
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.stops.length === 0) {
      setError('Please add at least one stop');
      return;
    }

    setLoading(true);

    try {
      if (editingRoute) {
        await routeAPI.update(editingRoute._id, formData);
      } else {
        await routeAPI.create(formData);
      }
      setShowModal(false);
      onUpdate();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStop({
      ...newStop,
      [e.target.name]: e.target.value
    });
  };

  const addStop = () => {
    if (!newStop.name || !newStop.lat || !newStop.lng || !newStop.arrivalTime) {
      alert('Please fill all stop fields');
      return;
    }

    const stop: Stop = {
      name: newStop.name,
      lat: parseFloat(newStop.lat),
      lng: parseFloat(newStop.lng),
      arrivalTime: newStop.arrivalTime,
      order: formData.stops.length + 1
    };

    setFormData({
      ...formData,
      stops: [...formData.stops, stop]
    });

    setNewStop({ name: '', lat: '', lng: '', arrivalTime: '' });
  };

  const removeStop = (index: number) => {
    const updatedStops = formData.stops.filter((_, i) => i !== index);
    const reorderedStops = updatedStops.map((stop, i) => ({ ...stop, order: i + 1 }));
    setFormData({ ...formData, stops: reorderedStops });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Route Management</h2>
        <button
          className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAdd}
        >
          <Plus className="w-5 h-5" />
          Add New Route
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stops</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {routes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No routes found. Click "Add New Route" to create one.
                </td>
              </tr>
            ) : (
              routes.map(route => (
                <tr key={route._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{route.routeName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{route.routeNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{route.startTime} - {route.endTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{route.stops.length} stops</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                    <button
                      className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition"
                      onClick={() => handleEdit(route)}
                      title="Edit Route"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition"
                      onClick={() => handleDelete(route._id, route.routeName)}
                      title="Delete Route"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h3>
              <button 
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                onClick={() => setShowModal(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="m-5 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                {/* Route Name */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Route Name *</label>
                  <input
                    type="text"
                    name="routeName"
                    value={formData.routeName}
                    onChange={handleChange}
                    placeholder="Electronic City to College"
                    required
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                {/* Route Number */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Route Number *</label>
                  <input
                    type="text"
                    name="routeNumber"
                    value={formData.routeNumber}
                    onChange={handleChange}
                    placeholder="R1"
                    required
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                {/* Start Time */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                {/* End Time */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Stops Section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-md font-bold text-gray-800 mb-3">Route Stops</h4>
                
                {/* Add Stop Form */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    name="name"
                    value={newStop.name}
                    onChange={handleStopChange}
                    placeholder="Stop Name"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition md:col-span-2"
                  />
                  <input
                    type="number"
                    name="lat"
                    value={newStop.lat}
                    onChange={handleStopChange}
                    placeholder="Latitude"
                    step="any"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  />
                  <input
                    type="number"
                    name="lng"
                    value={newStop.lng}
                    onChange={handleStopChange}
                    placeholder="Longitude"
                    step="any"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  />
                  <input
                    type="time"
                    name="arrivalTime"
                    value={newStop.arrivalTime}
                    onChange={handleStopChange}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition md:col-span-5"
                    onClick={addStop}
                  >
                    + Add Stop
                  </button>
                </div>

                {/* Stops List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {formData.stops.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-4">No stops added yet</p>
                  ) : (
                    formData.stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {stop.order}
                        </span>
                        <span className="flex-1 font-semibold text-sm text-gray-700">{stop.name}</span>
                        <span className="flex-1 text-xs text-gray-500 font-mono hidden sm:inline">
                          {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                        </span>
                        <span className="flex-1 text-sm text-gray-700">{stop.arrivalTime}</span>
                        <button
                          type="button"
                          className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
                          onClick={() => removeStop(index)}
                          title="Remove Stop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 justify-end pt-5 mt-5 border-t border-gray-200">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingRoute ? 'Update Route' : 'Add Route'
                  )}
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