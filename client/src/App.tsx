import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/common/Loader';
import AdminTrackRide from './pages/admin/TrackRide';

// Auth Pages
import LoginPage from './pages/auth/Login';

// Admin Pages
import ManageBuses from './pages/admin/ManageBuses';
import ManageRoutes from './pages/admin/ManageRoutes';
import ScheduleRides from './pages/admin/ScheduleRides';

// Student Pages
import ViewSchedule from './pages/student/ViewSchedule';
import TrackRide from './pages/student/TrackRide';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
             <Navigate to="/admin/schedule" replace />
          </ProtectedRoute>
        } />
        <Route path="/admin/buses" element={
          <ProtectedRoute requiredRole="admin">
            <ManageBuses />
          </ProtectedRoute>
        } />
         <Route path="/admin/routes" element={
          <ProtectedRoute requiredRole="admin">
            <ManageRoutes />
          </ProtectedRoute>
        } />
         <Route path="/admin/schedule" element={
          <ProtectedRoute requiredRole="admin">
            <ScheduleRides />
          </ProtectedRoute>
        } />

        <Route
          path="/admin/track/:rideId"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminTrackRide />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route path="/" element={
          <ProtectedRoute requiredRole="user">
             {user?.role === 'admin' ? <Navigate to="/admin" /> : <ViewSchedule />}
          </ProtectedRoute>
        } />
        <Route path="/track/:rideId" element={
          <ProtectedRoute requiredRole="user">
            <TrackRide />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;