import React, { useState } from 'react';
import { ScheduledRide, BusMaster, Route, ScheduledRideInput, RideStatus } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { scheduledRideAPI } from '../../services/api';
// --- NEW: Import useNavigate ---
import { useNavigate } from 'react-router-dom';

interface Props {
  rides: ScheduledRide[];
  buses: BusMaster[];
  routes: Route[];
  selectedDate: string;
  onUpdate: () => void;
  onDateChange: (date: string) => void;
  isToday: boolean;
  
  // --- REMOVED: onRideSelect and selectedRideId props ---
}

// --- FIX: Helper to format date string consistently using UTC ---
const formatDateForQuery = (date: Date | string): string => {
  const d = new Date(date);
  // Use UTC dates to avoid timezone shift
  const year = d.getUTCFullYear();
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// --- END FIX ---

const ScheduleManagement: React.FC<Props> = ({ 
  rides, buses, routes, selectedDate, onUpdate, onDateChange, isToday
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
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // --- NEW: Add useNavigate hook ---
  const navigate = useNavigate();

  const handleOpenModal = (e: React.MouseEvent, ride?: ScheduledRide) => {
    e.stopPropagation(); // Stop click from bubbling to the row
    if (ride) {
      setEditingRide(ride);
      setFormData({
        busId: typeof ride.busId === 'object' ? ride.busId._id : ride.busId,
        routeId: typeof ride.routeId === 'object' ? ride.routeId._id : ride.routeId,
        // Use UTC formatter here too
        date: formatDateForQuery(ride.date),
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRide(null);
  }

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
      handleCloseModal();
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop click from bubbling to the row
    if (!window.confirm('Are you sure you want to delete this scheduled ride?')) return;
    try {
      await scheduledRideAPI.delete(id);
      onUpdate();
    } catch (err) {
      alert('Failed to delete ride');
    }
  };

  const handleQuickStatusChange = async (e: React.MouseEvent, ride: ScheduledRide, newStatus: RideStatus) => {
    e.stopPropagation(); // Stop click from bubbling to the row
    setQuickActionLoading(ride._id);
    try {
      await scheduledRideAPI.update(ride._id, { status: newStatus });
      onUpdate();
    } catch (err) {
      console.error("Failed to update status", err);
      alert('Failed to update status');
    } finally {
      setQuickActionLoading(null);
    }
  };

  // --- NEW: Row click handler ---
  const handleRowClick = (ride: ScheduledRide) => {
    // --- FIX: Use UTC formatter for navigation ---
    const dateString = formatDateForQuery(ride.date);
    // --- END FIX ---
    navigate(`/admin/track/${ride._id}?date=${dateString}`);
  };
  // --- END NEW ---

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
      {/* Top Bar: Date Picker and Add Button */}
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border px-3 py-2"
          />
        </div>
        <Button onClick={(e) => handleOpenModal(e)}>+ Schedule New Ride</Button>
      </div>

      {/* Rides Table */}
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
                // --- MODIFIED: Added onClick and hover state ---
                <tr 
                  key={ride._id}
                  onClick={() => handleRowClick(ride)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                {/* --- END MODIFICATION --- */}

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
                  
                  {/* --- MODIFIED: Added stopPropagation to all buttons --- */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {ride.status === 'Scheduled' && (
                      <Button
                        variant="secondary"
                        className="text-xs py-1 px-2 !bg-green-100 !text-green-700 hover:!bg-green-200"
                        onClick={(e) => handleQuickStatusChange(e, ride, 'In Progress')}
                        isLoading={quickActionLoading === ride._id}
                        disabled={quickActionLoading !== null || !isToday}
                        title={!isToday ? "You can only start rides on the same day" : "Start this ride"}
                      >
                        Start Ride
                      </Button>
                    )}
                    {ride.status === 'In Progress' && (
                       <Button
                        variant="secondary"
                        className="text-xs py-1 px-2 !bg-gray-100 !text-gray-700 hover:!bg-gray-200"
                        onClick={(e) => handleQuickStatusChange(e, ride, 'Completed')}
                        isLoading={quickActionLoading === ride._id}
                        disabled={quickActionLoading !== null || !isToday}
                        title={!isToday ? "You can only complete rides on the same day" : "Mark as Completed"}
                      >
                        Complete
                      </Button>
                    )}
                    <button 
                      onClick={(e) => handleOpenModal(e, ride)} 
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, ride._id)} 
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                  {/* --- END MODIFICATION --- */}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">{editingRide ? 'Edit Schedule' : 'Add New Schedule'}</h3>
            {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="date"
                label="Date"
                required
                value={formData.date as string}
                // --- THIS IS THE FIX ---
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                // --- END OF FIX ---
                disabled={!!editingRide}
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
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border
                                ${!isToday ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as RideStatus })}
                    disabled={!isToday}
                    title={!isToday ? "Status can only be changed on the day of the ride" : "Change ride status"}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div className="mt-5 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
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