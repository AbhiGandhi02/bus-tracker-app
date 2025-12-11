import React, { useState } from 'react';
import { BusMaster, BusMasterInput } from '../../types';
import { busMasterAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Bus, User, X } from 'lucide-react'; 
import Loader from '../common/Loader';

interface Props {
  buses: BusMaster[];
  onUpdate: () => void;
}

const BusMasterManagement: React.FC<Props> = ({ buses, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusMaster | null>(null);
  
  const [formData, setFormData] = useState<BusMasterInput>({
    busNumber: '',
    driverName: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenModal = (bus?: BusMaster) => {
    if (bus) {
      setEditingBus(bus);
      setFormData({
        busNumber: bus.busNumber,
        driverName: bus.driverName || '',
      });
    } else {
      setEditingBus(null);
      setFormData({ busNumber: '', driverName: '' });
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingBus) {
        await busMasterAPI.update(editingBus._id, formData);
      } else {
        await busMasterAPI.create(formData);
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save bus');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;
    try {
      await busMasterAPI.delete(id);
      onUpdate();
    } catch (err) {
      alert('Failed to delete bus');
    }
  };

  return (
    <div>
      {/* --- HEADER ACTIONS --- */}
      <div className="mb-6 flex justify-between items-center">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bus className="w-5 h-5 text-[#B045FF]" />
            Active Fleet
         </h2>
         <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#B045FF] hover:bg-[#9d3ce3] text-white rounded-xl font-bold shadow-lg shadow-[#B045FF]/20 transition-all transform hover:-translate-y-0.5"
         >
            <Plus className="w-5 h-5" />
            Add Bus
         </button>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="w-full bg-[#1A1640]/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Bus Number</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Driver</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {buses.map((bus) => (
                <tr key={bus._id} className="hover:bg-white/5 transition-colors group">
                  
                  {/* Bus Number */}
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#B045FF]/10 border border-[#B045FF]/20 flex items-center justify-center text-[#B045FF] font-bold">
                           {bus.busNumber.split(' ').pop()} {/* Just the number/last part */}
                        </div>
                        <span className="font-semibold text-white">{bus.busNumber}</span>
                     </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                      Standard AC
                    </span>
                  </td>
                  
                  {/* Driver */}
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center gap-2 text-gray-300">
                        <User className="w-4 h-4 text-gray-500" />
                        {bus.driverName || <span className="text-gray-600 italic">Not Assigned</span>}
                     </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 ">
                       <button 
                          onClick={() => handleOpenModal(bus)} 
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                          title="Edit"
                       >
                          <Edit2 className="w-4 h-4" />
                       </button>
                       <button 
                          onClick={() => handleDelete(bus._id)} 
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="Delete"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {buses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                     <div className="flex flex-col items-center gap-2">
                        <Bus className="w-8 h-8 text-gray-700" />
                        <p>No buses found in the fleet.</p>
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
          <div className="bg-[#1A1640] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {editingBus ? <Edit2 className="w-5 h-5 text-[#B045FF]" /> : <Plus className="w-5 h-5 text-[#B045FF]" />}
                  {editingBus ? 'Edit Bus Details' : 'Add New Bus'}
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
              
              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 uppercase">Bus Number</label>
                 <div className="relative">
                    <Bus className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                       required
                       value={formData.busNumber}
                       onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                       className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors"
                       placeholder="e.g. BUS-101"
                    />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-400 uppercase">Default Driver (Optional)</label>
                 <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                       value={formData.driverName}
                       onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                       className="w-full bg-[#0D0A2A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#B045FF] transition-colors"
                       placeholder="e.g. John Doe"
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
                  {loading && <Loader size="sm"/>}
                  {editingBus ? 'Update Bus' : 'Add Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusMasterManagement;