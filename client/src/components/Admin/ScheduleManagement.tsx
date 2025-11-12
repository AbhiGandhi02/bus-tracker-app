import React, { useState } from 'react';
import { ScheduledRide, BusMaster, Route, ScheduledRideInput } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { scheduledRideAPI } from '../../services/api';

interface Props {
  rides: ScheduledRide[];
  buses: BusMaster[];
  routes: Route[];
  selectedDate: string;
  onUpdate: () => void;
  onDateChange: (date: string) => void;
}

const ScheduleManagement: React.FC<Props> = ({ 
  rides, buses, routes, selectedDate, onUpdate, onDateChange 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<ScheduledRide | null>(null);
  const [formData, setFormData] = useState<ScheduledRideInput>({
    busId: '',
    routeId: '',
    date: selectedDate,
    departureTime: '',
    status: 'Scheduled',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenModal = (ride?: ScheduledRide) => {
    if (ride) {
      setEditingRide(ride);
      setFormData({
        busId: typeof ride.busId === 'object' ? ride.busId._id : ride.busId,
        routeId: typeof ride.routeId === 'object' ? ride.routeId._id : ride.routeId,
        date: new Date(ride.date).toISOString().split('T')[0],
        departureTime: ride.departureTime,
        status: ride.status,
      });
    } else {
      setEditingRide(null);
      setFormData({
        busId: buses[0]?._id || '',
        routeId: routes[0]?._id || '',
        date: selectedDate,
        departureTime: '08:00',
        status: 'Scheduled',
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
      if (editingRide) {
        await scheduledRideAPI.update(editingRide._id, formData);
      } else {
        await scheduledRideAPI.create(formData);
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled ride?')) return;
    try {
      await scheduledRideAPI.delete(id);
      onUpdate();
    } catch (err) {
      alert('Failed to delete ride');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border px-3 py-2"
          />
        </div>
        <Button onClick={() => handleOpenModal()}>+ Schedule New Ride</Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rides.map((ride) => {
              const bus = ride.busId as BusMaster;
              const route = ride.routeId as Route;
              return (
                <tr key={ride._id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{ride.departureTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    <div className="text-sm font-medium text-gray-900">{route?.routeNumber}</div>
                    <div className="text-sm text-gray-500">{route?.routeName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    <div className="text-sm font-medium text-gray-900">{bus?.busNumber}</div>
                    <div className="text-sm text-gray-500">{bus?.driverName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ride.status)}`}>
                      {ride.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(ride)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDelete(ride._id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              );
            })}
            {rides.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No rides scheduled for this date.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">{editingRide ? 'Edit Schedule' : 'Schedule New Ride'}</h3>
            {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="date"
                label="Date"
                required
                value={formData.date as string}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              <Input
                type="time"
                label="Departure Time"
                required
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Route</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  required
                >
                  <option value="">Select a route...</option>
                  {routes.map(route => (
                    <option key={route._id} value={route._id}>
                      {route.routeNumber} - {route.routeName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Bus</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  value={formData.busId}
                  onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                  required
                >
                  <option value="">Select a bus...</option>
                  {buses.map(bus => (
                    <option key={bus._id} value={bus._id}>
                      {bus.busNumber} ({bus.busType})
                    </option>
                  ))}
                </select>
              </div>
              {editingRide && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div className="mt-5 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={loading}>{editingRide ? 'Update' : 'Schedule'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;