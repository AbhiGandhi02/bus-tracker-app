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
        <div className="flex justify-center items-center h-60 md:h-[60vh]">
          <Loader size="lg"/>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Routes">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-red-500" />
           {error}
        </div>
      )}
      
      {/* Introduction / Helper Text */}
      <div className="mb-6">
        <p className="text-gray-400 max-w-3xl leading-relaxed">
          Create and manage bus routes here. 
          <span className="block mt-1 text-sm text-gray-500">
             Use the Google Maps autocomplete to ensure precise GPS tracking for Departure and Arrival points.
          </span>
        </p>
      </div>

      <RouteManagement routes={routes} onUpdate={fetchRoutes} />
    </AdminLayout>
  );
};

export default ManageRoutes;