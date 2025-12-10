import React, { useState } from 'react';
import { ScheduledRide, BusMaster, Route, ScheduledRideInput, RideStatus } from '../../types';
import { scheduledRideAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Edit2, Trash2, Calendar, Clock, MapPin, 
  PlayCircle, CheckCircle, X, ChevronDown, Bus 
} from 'lucide-react';
import Loader from '../common/Loader';

interface Props {
  rides: ScheduledRide[];
  buses: BusMaster[];
  routes: Route[];
  selectedDate: string;
  onUpdate: () => void;
  onDateChange: (date: string) => void;
  isToday: boolean;
}

const formatDateForQuery = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  
  const navigate = useNavigate();
  const { isPlanner, isOperator } = useAuth();

  // --- HANDLERS ---

  const handleOpenModal = (e: React.MouseEvent, ride?: ScheduledRide) => {
    e.stopPropagation(); 
    if (ride) {
      setEditingRide(ride);
      setFormData({
        busId: typeof ride.busId === 'object' ? ride.busId._id : ride.busId,
        routeId: typeof ride.routeId === 'object' ? ride.routeId._id : ride.routeId,
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
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this scheduled ride?')) return;
    try {
      await scheduledRideAPI.delete(id);
      onUpdate();
    } catch (err) {
      alert('Failed to delete ride');
    }
  };

  const handleQuickStatusChange = async (e: React.MouseEvent, ride: ScheduledRide, newStatus: RideStatus) => {
    e.stopPropagation();
    setQuickActionLoading(ride._id);
    try {
      await scheduledRideAPI.update(ride._id, { status: newStatus });
      onUpdate();

      if (newStatus === 'In Progress') {
        navigate(`/driver`);
      }
    } catch (err) {
      console.error("Failed to update status", err);
      alert('Failed to update status');
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleRowClick = (ride: ScheduledRide) => {
    const dateString = formatDateForQuery(ride.date);
    navigate(`/admin/track/${ride._id}?date=${dateString}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Scheduled': 
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Scheduled</span>;
      case 'In Progress': 
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#B045FF]/10 text-[#B045FF] border border-[#B045FF]/20 animate-pulse">In Progress</span>;
      case 'Completed': 
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">Completed</span>;
      case 'Cancelled': 
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">Cancelled</span>;
      default: 
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>;
    }
  };

  return (
    <div>
      {/* --- HEADER CONTROLS --- */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0D0A2A] border border-white/10 rounded-xl w-full sm:w-auto">
             <Calendar className="w-5 h-5 text-[#B045FF]" />
             <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent border-none text-white focus:ring-0 text-sm font-medium w-full [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
             />
          </div>
        </div>
        
        {isPlanner() && (
          <button 
            onClick={(e) => handleOpenModal(e)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#B045FF] hover:bg-[#9d3ce3] text-white rounded-xl font-bold shadow-lg shadow-[#B045FF]/20 transition-all w-full sm:w-auto transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Schedule Ride</span>
            <span className="sm:hidden">Add</span>
          </button> 
        )}
      </div>

      {/* --- TABLE --- */}
      <div className="w-full bg-[#1A1640]/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Route Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Bus & Driver</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rides.map((ride) => {
                const bus = ride.busId as BusMaster;
                const route = ride.routeId as Route;
                
                return (
                  <tr 
                    key={ride._id}
                    onClick={() => handleRowClick(ride)}
                    className="cursor-pointer hover:bg-white/5 transition-colors group"
                  >
                    {/* Time */}
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-2 text-white font-mono text-lg font-bold">
                          <Clock className="w-4 h-4 text-[#B045FF]" />
                          {ride.departureTime}
                       </div>
                    </td>

                    {/* Route */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="text-white font-semibold flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-xs text-gray-300 border border-white/10">{route?.routeNumber}</span>
                            {route?.routeName}
                         </span>
                         <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <MapPin className="w-3 h-3" />
                            {route?.departureLocation} <span className="text-gray-600">→</span> {route?.arrivalLocation}
                         </div>
                      </div>
                    </td>

                    {/* Bus */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="text-white font-medium flex items-center gap-2">
                            <Bus className="w-4 h-4 text-gray-500" />
                            {bus?.busNumber}
                         </span>
                         <span className="text-xs text-gray-400 pl-6">
                            {bus?.driverName || "No Driver"}
                         </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ride.status)}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Operator Actions (Start/Complete) */}
                        {isOperator() && ride.status === 'Scheduled' && (
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition-colors text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => handleQuickStatusChange(e, ride, 'In Progress')}
                            disabled={quickActionLoading === ride._id || !isToday}
                            title={!isToday ? "Only today's rides" : "Start Trip"}
                          >
                            {quickActionLoading === ride._id ? <Loader size="sm" /> : <PlayCircle className="w-3 h-3" />}
                            Start
                          </button>
                        )}
                        
                        {isOperator() && ride.status === 'In Progress' && (
                           <button
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 border border-gray-500/20 rounded-lg transition-colors text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => handleQuickStatusChange(e, ride, 'Completed')}
                            disabled={quickActionLoading === ride._id || !isToday}
                          >
                            {quickActionLoading === ride._id ? <Loader size="sm" /> : <CheckCircle className="w-3 h-3" />}
                            Complete
                          </button>
                        )}

                        {/* Planner Actions (Edit/Delete) */}
                        {isPlanner() && (
                          <>
                            <button 
                              onClick={(e) => handleOpenModal(e, ride)} 
                              className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => handleDelete(e, ride._id)} 
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rides.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                     <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-8 h-8 text-gray-700" />
                        <p>No rides scheduled for this date.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL --- */}
      {isPlanner() && isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#1A1640] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {editingRide ? <Edit2 className="w-5 h-5 text-[#B045FF]" /> : <Plus className="w-5 h-5 text-[#B045FF]" />}
                  {editingRide ? 'Edit Schedule' : 'New Schedule'}
               </h3>
               <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
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
                    <label className="text-xs font-bold text-gray-400 uppercase">Date</label>
                    <input
                       type="date"
                       required
                       value={formData.date as string}
                       onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                       disabled={!!editingRide}
                       className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors disabled:opacity-50"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Departure</label>
                    <input
                       type="time"
                       required
                       value={formData.departureTime}
                       onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                       className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors"
                    />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Route</label>
                <div className="relative">
                   <select
                      className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors appearance-none cursor-pointer"
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
                   <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Bus</label>
                <div className="relative">
                   <select
                      className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors appearance-none cursor-pointer"
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
                   <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {editingRide && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
                  <div className="relative">
                     <select
                        className={`w-full bg-[#0D0A2A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors appearance-none cursor-pointer ${!isToday ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as RideStatus })}
                        disabled={!isToday}
                     >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                     </select>
                     <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
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
                  {editingRide ? 'Update' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;