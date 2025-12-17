import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/common/Loader';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import ManageBuses from './pages/admin/ManageBuses';
import ManageRoutes from './pages/admin/ManageRoutes';
import ScheduleRides from './pages/admin/ScheduleRides';
import ManageUsers from './pages/admin/ManageUsers';

// Student Pages
import ViewSchedule from './pages/student/ViewSchedule';

// Driver Page
import DriverDashboard from './pages/driver/DriverDashboard';

// Lazy-loaded components (for code splitting - reduces initial bundle size)
// These components import mapbox-gl which is a large library (~500KB)
const TrackRide = lazy(() => import('./pages/student/TrackRide'));
const AdminTrackRide = lazy(() => import('./pages/admin/AdminTrackRide'));


const App: React.FC = () => {
  const { user, loading, isPlanner, isOperator } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>

        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />

        <Route
          path="/admin"
          element={
            // --- MODIFICATION: Use 'manager' role ---
            <ProtectedRoute requiredRole="manager">
              <Navigate to="/admin/schedule" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/buses"
          element={
            // --- MODIFICATION: Use 'planner' role ---
            <ProtectedRoute requiredRole="planner">
              <ManageBuses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/routes"
          element={
            // --- MODIFICATION: Use 'planner' role ---
            <ProtectedRoute requiredRole="planner">
              <ManageRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            // --- MODIFICATION: Use 'manager' role ---
            <ProtectedRoute requiredRole="manager">
              <ScheduleRides />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/track/:rideId"
          element={
            // --- MODIFICATION: Use 'manager' role ---
            <ProtectedRoute requiredRole="manager">
              <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#0D0A2A]"><Loader size="lg" /></div>}>
                <AdminTrackRide />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            // --- MODIFICATION: Use 'masteradmin' role ---
            <ProtectedRoute requiredRole="masteradmin">
              <ManageUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver"
          element={
            // --- MODIFICATION: Use 'operator' role ---
            <ProtectedRoute requiredRole="operator">
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            // --- MODIFICATION: Use 'user' role ---
            <ProtectedRoute requiredRole="user">
              {/* --- MODIFICATION: Use new functions for redirect --- */}
              {(isPlanner() || isOperator()) ? (
                <Navigate to="/admin/schedule" replace />
              ) : (
                <ViewSchedule />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/track/:rideId"
          element={
            // --- MODIFICATION: Use 'user' role ---
            <ProtectedRoute requiredRole="user">
              <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#0D0A2A]"><Loader size="lg" /></div>}>
                <TrackRide />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </div>
  );
};

export default App;