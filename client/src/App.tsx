import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import BusMap from './components/Map/MapComponent';
import BusList from './components/User/BusList';
import BusDetails from './components/User/BusDetails';
import Dashboard from './components/Admin/Dashboard';
import { busAPI } from './services/api';
import { Bus } from './types';
import { Loader2, LogOut, Shield } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
        <Loader2 className="w-16 h-16 animate-spin text-white mb-4" />
        <p className="text-white text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
        <Loader2 className="w-16 h-16 animate-spin text-white mb-4" />
        <p className="text-white text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return isAdmin() ? <>{children}</> : <Navigate to="/dashboard" />;
};

const MainDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    try {
      const response = await busAPI.getAll();
      if (response.data.success && response.data.data) {
        setBuses(response.data.data);
      }
    } catch (error) {
      console.error('Error loading buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBus = (busId: string | null) => {
    setSelectedBus(busId);
  };

  const selectedBusData = buses.find(b => b._id === selectedBus) || null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Left side */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                🚌 Bus Tracking System
              </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center">
              <span className="text-sm font-semibold text-gray-600 hidden md:inline">
                👤 {user?.name}
              </span>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  user?.role === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {user?.role === 'admin' ? '👑 Admin' : 'Student'}
              </span>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold rounded-lg shadow-md hover:from-amber-600 hover:to-orange-700 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </Link>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-red-600 transition-all duration-300 hover:-translate-y-0.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] xl:grid-cols-[350px_1fr_400px] gap-5 h-full">
          {/* Left Sidebar - Bus List */}
          <aside className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="h-full max-h-[calc(100vh-140px)] overflow-y-auto">
              <BusList
                buses={buses}
                selectedBus={selectedBus}
                onSelectBus={handleSelectBus}
              />
            </div>
          </aside>

          {/* Center - Map */}
          <main className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 order-first lg:order-none">
            <BusMap buses={buses} selectedBus={selectedBus} />
          </main>

          {/* Right Sidebar - Bus Details (hidden on mobile/tablet) */}
          <aside className="hidden xl:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="h-full max-h-[calc(100vh-140px)] overflow-y-auto">
              <BusDetails bus={selectedBusData} />
            </div>
          </aside>
        </div>

        {/* Mobile/Tablet Bus Details - Show when bus is selected */}
        {selectedBusData && (
          <div className="xl:hidden mt-5 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <BusDetails bus={selectedBusData} />
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;