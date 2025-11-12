import React, { useState } from 'react';
import { busAPI } from '../../services/api';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { Bus, Route, BusInput } from '../../types';

interface BusManagementProps {
  buses: Bus[];
  routes: Route[];
  onUpdate: () => void;
}

// Helper object for dynamic status badge styling
const statusStyles: Record<Bus['status'], string> = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-800',
  Maintenance: 'bg-yellow-100 text-yellow-800',
};

const BusManagement: React.FC<BusManagementProps> = ({ buses, routes, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState<BusInput>({
    busNumber: '',
    routeId: '',
    driverName: '',
    driverPhone: '',
    capacity: 50,
    status: 'Active'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setEditingBus(null);
    setFormData({
      busNumber: '',
      routeId: '',
      driverName: '',
      driverPhone: '',
      capacity: 50,
      status: 'Active'
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (bus: Bus) => {
    setEditingBus(bus);
    // Handle routeId properly - it could be populated or just an ID
    const routeId = typeof bus.routeId === 'object' && bus.routeId ? bus.routeId._id : (bus.routeId as string) || '';
    
    setFormData({
      busNumber: bus.busNumber,
      routeId: routeId,
      driverName: bus.driverName || '',
      driverPhone: bus.driverPhone || '',
      capacity: bus.capacity || 50,
      status: bus.status
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string, busNumber: string) => {
    if (window.confirm(`Are you sure you want to delete bus ${busNumber}?`)) {
      try {
        await busAPI.delete(id);
        onUpdate();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete bus');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingBus) {
        await busAPI.update(editingBus._id, formData);
      } else {
        await busAPI.create(formData);
      }
      setShowModal(false);
      onUpdate();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Helper to get route name safely
  const getRouteName = (routeId: any): string => {
    if (!routeId) return 'Not assigned';
    if (typeof routeId === 'object' && routeId.routeName) {
      return routeId.routeName;
    }
    return 'Not assigned';
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Bus Management</h2>
        <button
          className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAdd}
        >
          <Plus className="w-5 h-5" />
          Add New Bus
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {buses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No buses found. Click "Add New Bus" to create one.
                </td>
              </tr>
            ) : (
              buses.map(bus => (
                <tr key={bus._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{bus.busNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getRouteName(bus.routeId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{bus.driverName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{bus.capacity || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[bus.status]}`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                    <button
                      className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition"
                      onClick={() => handleEdit(bus)}
                      title="Edit Bus"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition"
                      onClick={() => handleDelete(bus._id, bus.busNumber)}
                      title="Delete Bus"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {editingBus ? 'Edit Bus' : 'Add New Bus'}
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
              <div className="space-y-4">
                {/* Bus Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bus Number *</label>
                  <input
                    type="text"
                    name="busNumber"
                    value={formData.busNumber}
                    onChange={handleChange}
                    placeholder="KA-01-AB-1234"
                    required
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {/* Route */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Route *</label>
                  <select
                    name="routeId"
                    value={formData.routeId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>
                        {route.routeName} ({route.routeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver Info Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Driver Name</label>
                    <input
                      type="text"
                      name="driverName"
                      value={formData.driverName}
                      onChange={handleChange}
                      placeholder="Driver Name"
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Driver Phone</label>
                    <input
                      type="tel"
                      name="driverPhone"
                      value={formData.driverPhone}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Capacity & Status Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Capacity *</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      min="1"
                      required
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
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
                    editingBus ? 'Update Bus' : 'Add Bus'
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

export default BusManagement;