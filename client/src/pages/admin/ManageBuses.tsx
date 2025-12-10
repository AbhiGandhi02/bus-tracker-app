import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import BusMasterManagement from '../../components/Admin/BusMasterManagement';
import Loader from '../../components/common/Loader';
import { busMasterAPI } from '../../services/api';
import { BusMaster } from '../../types';

const ManageBuses: React.FC = () => {
  const [buses, setBuses] = useState<BusMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await busMasterAPI.getAll();
      if (response.data.success && response.data.data) {
        setBuses(response.data.data);
      }
    } catch (err) {
      setError('Failed to load buses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  if (loading && buses.length === 0) {
    return (
      <AdminLayout title="Manage Buses">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Buses">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-red-500" />
           {error}
        </div>
      )}

      {/* Intro Text */}
      <div className="mb-6">
        <p className="text-gray-400 max-w-3xl leading-relaxed">
          Manage your vehicle fleet here.
          <span className="block mt-1 text-sm text-gray-500">
             Add bus numbers and assign default drivers to streamline your daily scheduling process.
          </span>
        </p>
      </div>

      <BusMasterManagement buses={buses} onUpdate={fetchBuses} />
    </AdminLayout>
  );
};

export default ManageBuses;