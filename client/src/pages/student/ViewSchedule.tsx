import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import RideList from '../../components/User/RideList';
import Button from '../../components/common/Button';
import { scheduledRideAPI } from '../../services/api';
import { ScheduledRide } from '../../types';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';

const ViewSchedule: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTodayRides = async () => {
      try {
        setLoading(true);
        // Fetch rides for today. Backend defaults to today if no date param is sent,
        // or you can be explicit: const today = new Date().toISOString().split('T')[0];
        const response = await scheduledRideAPI.getByDate();
        
        if (response.data.success && response.data.data) {
          setRides(response.data.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load today\'s schedule.');
      } finally {
        setLoading(false);
      }
    };

    fetchTodayRides();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRideSelect = (rideId: string | null) => {
    if (rideId) {
      navigate(`/track/${rideId}`);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚌</span>
            <h1 className="text-xl font-bold">College Bus Tracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block opacity-90 text-sm">
              Hi, {user?.name?.split(' ')[0]}
            </span>
            <Button 
              variant="secondary" 
              onClick={handleLogout} 
              className="text-xs py-1.5 px-3 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-200px)]">
          <RideList 
            rides={rides} 
            selectedRide={null} 
            onSelectRide={handleRideSelect} 
          />
        </div>
      </main>
    </div>
  );
};

export default ViewSchedule;