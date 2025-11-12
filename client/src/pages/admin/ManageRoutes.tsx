import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import RouteManagement from '../../components/Admin/RouteManagement';
import Loader from '../../components/common/Loader';
import { routeAPI } from '../../services/api';
import { Route } from '../../types';

const ManageRoutes: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await routeAPI.getAll();
      if (response.data.success && response.data.data) {
        setRoutes(response.data.data);
      }
    } catch (err) {
      setError('Failed to load routes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  if (loading && routes.length === 0) {
    return (
      <AdminLayout title="Manage Routes">
        <div className="flex justify-center p-12"><Loader size="lg" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Routes">
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}
      <RouteManagement routes={routes} onUpdate={fetchRoutes} />
    </AdminLayout>
  );
};

export default ManageRoutes;