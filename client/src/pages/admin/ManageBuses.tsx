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
        <div className="flex justify-center p-12"><Loader size="lg" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Buses">
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}
      <BusMasterManagement buses={buses} onUpdate={fetchBuses} />
    </AdminLayout>
  );
};

export default ManageBuses;