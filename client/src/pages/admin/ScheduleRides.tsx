import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import ScheduleManagement from '../../components/Admin/ScheduleManagement';
import Loader from '../../components/common/Loader';
import { busMasterAPI, routeAPI, scheduledRideAPI } from '../../services/api';
import { BusMaster, Route, ScheduledRide } from '../../types';

const ScheduleRides: React.FC = () => {
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [buses, setBuses] = useState<BusMaster[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all required data in parallel
      const [busesRes, routesRes, ridesRes] = await Promise.all([
        busMasterAPI.getAll(),
        routeAPI.getAll(),
        scheduledRideAPI.getByDate(selectedDate)
      ]);

      if (busesRes.data.success && busesRes.data.data) setBuses(busesRes.data.data);
      if (routesRes.data.success && routesRes.data.data) setRoutes(routesRes.data.data);
      if (ridesRes.data.success && ridesRes.data.data) setRides(ridesRes.data.data);

    } catch (err) {
      setError('Failed to load schedule data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Only re-fetch rides when date changes (optimization)
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  if (loading && buses.length === 0) {
    return (
      <AdminLayout title="Daily Schedule">
        <div className="flex justify-center p-12"><Loader size="lg" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Daily Schedule">
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}
      <ScheduleManagement
        rides={rides}
        buses={buses}
        routes={routes}
        selectedDate={selectedDate}
        onUpdate={fetchData}
        onDateChange={handleDateChange}
      />
    </AdminLayout>
  );
};

export default ScheduleRides;