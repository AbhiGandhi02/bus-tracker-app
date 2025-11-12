import React, { useState, useEffect } from 'react';
import BusManagement from './BusManagement';
import RouteManagement from './RouteManagement';
import { busAPI, routeAPI } from '../../services/api';
import { Loader2, BusFront, CheckCircle, Route as RouteIcon, Activity } from 'lucide-react';
import { Bus, Route } from '../../types';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'buses' | 'routes'>('buses');
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBuses: 0,
    activeBuses: 0,
    totalRoutes: 0,
    activeRoutes: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // This will recalculate stats whenever buses or routes data changes
    calculateStats();
  }, [buses, routes]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [busesResponse, routesResponse] = await Promise.all([
        busAPI.getAll(),
        routeAPI.getAll()
      ]);

      if (busesResponse.data.success && busesResponse.data.data) {
        setBuses(busesResponse.data.data);
      }
      
      if (routesResponse.data.success && routesResponse.data.data) {
        setRoutes(routesResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // You could set an error state here to show in the UI
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    setStats({
      totalBuses: buses.length,
      activeBuses: buses.filter(b => b.status === 'Active').length,
      totalRoutes: routes.length,
      activeRoutes: routes.filter(r => r.isActive !== false).length // Assuming default is active
    });
  };

  if (loading) {
    return (
      // Replaced .loading-container and .spinner with Tailwind and Lucide icon
      <div className="flex flex-col items-center justify-center py-20 px-5">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    // Replaced .admin-dashboard
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Replaced .dashboard-header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-base text-gray-600">Manage buses, routes, and system configuration</p>
      </div>

      {/* Replaced .stats-grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* Stat Card 1 */}
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl text-white bg-gradient-to-br from-indigo-500 to-purple-600">
            <BusFront className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-gray-800 mb-0.5">{stats.totalBuses}</div>
            <div className="text-sm font-medium text-gray-500">Total Buses</div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl text-white bg-gradient-to-br from-green-500 to-emerald-600">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-gray-800 mb-0.5">{stats.activeBuses}</div>
            <div className="text-sm font-medium text-gray-500">Active Buses</div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl text-white bg-gradient-to-br from-yellow-500 to-orange-600">
            <RouteIcon className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-gray-800 mb-0.5">{stats.totalRoutes}</div>
            <div className="text-sm font-medium text-gray-500">Total Routes</div>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl text-white bg-gradient-to-br from-green-500 to-emerald-600">
            <Activity className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-gray-800 mb-0.5">{stats.activeRoutes}</div>
            <div className="text-sm font-medium text-gray-500">Active Routes</div>
          </div>
        </div>
      </div>

      {/* Replaced .tabs-container */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Replaced .tabs with responsive classes */}
        <div className="flex md:flex-row flex-col border-b-2 md:border-b-2 md:border-l-0 border-gray-200 bg-gray-50">
          <button
            className={`flex-1 py-4 px-6 font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 text-base 
                        border-l-4 md:border-l-0 md:border-b-4 
                        ${activeTab === 'buses'
                          ? 'text-indigo-600 bg-white border-l-indigo-600 md:border-b-indigo-600 md:border-l-transparent'
                          : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-800'
                        }`}
            onClick={() => setActiveTab('buses')}
          >
            <BusFront className="w-5 h-5" />
            Manage Buses
          </button>
          <button
            className={`flex-1 py-4 px-6 font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 text-base 
                        border-l-4 md:border-l-0 md:border-b-4 
                        ${activeTab === 'routes'
                          ? 'text-indigo-600 bg-white border-l-indigo-600 md:border-b-indigo-600 md:border-l-transparent'
                          : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-800'
                        }`}
            onClick={() => setActiveTab('routes')}
          >
            <RouteIcon className="w-5 h-5" />
            Manage Routes
          </button>
        </div>

        {/* Replaced .tab-content */}
        <div className="p-4 md:p-6">
          {activeTab === 'buses' ? (
            <BusManagement
              buses={buses}
              routes={routes}
              onUpdate={loadData}
            />
          ) : (
            <RouteManagement
              routes={routes}
              onUpdate={loadData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;