import React, { useState } from 'react';
import { Route, RouteInput } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { routeAPI } from '../../services/api';

interface Props {
  routes: Route[];
  onUpdate: () => void;
}

const RouteManagement: React.FC<Props> = ({ routes, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<RouteInput>({
    routeNumber: '',
    routeName: '',
    departureLocation: '',
    arrivalLocation: '',
    rideTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenModal = (route?: Route) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        routeNumber: route.routeNumber,
        routeName: route.routeName,
        departureLocation: route.departureLocation,
        arrivalLocation: route.arrivalLocation,
        rideTime: route.rideTime,
      });
    } else {
      setEditingRoute(null);
      setFormData({
        routeNumber: '',
        routeName: '',
        departureLocation: '',
        arrivalLocation: '',
        rideTime: '',
      });
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => handleOpenModal()}>+ Add New Route</Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From - To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.map((route) => (
              <tr key={route._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{route.routeNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{route.routeName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {route.departureLocation} → {route.arrivalLocation}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{route.rideTime}</td>
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
              <Input
                label="Departure Location"
                required
                value={formData.departureLocation}
                onChange={(e) => setFormData({ ...formData, departureLocation: e.target.value })}
              />
              <Input
                label="Arrival Location"
                required
                value={formData.arrivalLocation}
                onChange={(e) => setFormData({ ...formData, arrivalLocation: e.target.value })}
              />
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