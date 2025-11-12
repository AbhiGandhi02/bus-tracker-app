import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScheduledRide } from '../../types';
import { scheduledRideAPI } from '../../services/api';
import MapComponent from '../../components/Map/MapComponent'; // Using your component
import RideDetails from '../../components/User/RideDetails';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { ArrowLeft } from 'lucide-react';

const TrackRide: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const [ride, setRide] = useState<ScheduledRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRideData = async () => {
    if (!rideId) return;
    try {
      // Temporary: fetch all today's rides and find the right one
      // Ideal: Add a specific getById API endpoint later
      const today = new Date().toISOString().split('T')[0];
      const response = await scheduledRideAPI.getByDate(today);
      
      if (response.data.success && response.data.data) {
        const foundRide = response.data.data.find(r => r._id === rideId);
        if (foundRide) {
          setRide(foundRide);
        } else {
          setError('Ride not found');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRideData();
    // Fallback polling every 30s in case sockets miss something
    pollingRef.current = setInterval(fetchRideData, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [rideId]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader size="lg" /></div>;
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error || 'Ride not found'}</p>
        <Button onClick={() => navigate('/')}>Go Back Home</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex items-center z-10">
        <button 
          onClick={() => navigate('/')} 
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Track Ride</h1>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        <div className="flex-1 lg:flex-[2] h-[50vh] lg:h-auto min-h-[300px] rounded-xl overflow-hidden shadow-lg bg-white">
           {/* Passing single ride as array to MapComponent */}
          <MapComponent rides={[ride]} selectedRide={ride._id} />
        </div>
        <div className="lg:w-[400px] h-[40vh] lg:h-auto overflow-y-auto">
          <RideDetails ride={ride} />
        </div>
      </div>
    </div>
  );
};

export default TrackRide;