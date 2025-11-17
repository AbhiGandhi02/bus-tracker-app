import React, { useState } from 'react';
import { BusMaster, BusMasterInput } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { busMasterAPI } from '../../services/api';

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
      <div className="mb-4 flex justify-end">
        <Button onClick={() => handleOpenModal()}>+ Add New Bus</Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {buses.map((bus) => (
              <tr key={bus._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{bus.busNumber}</td>
                
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}>
                    AC
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{bus.driverName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(bus)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(bus._id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {buses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No buses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">{editingBus ? 'Edit Bus' : 'Add New Bus'}</h3>
            {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Bus Number"
                required
                value={formData.busNumber}
                onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
              />
              
              
              <Input
                label="Driver Name"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              />
              <div className="mt-5 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={loading}>{editingBus ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusMasterManagement;