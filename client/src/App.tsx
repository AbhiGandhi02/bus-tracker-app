import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// --- MODIFICATION: Import new role functions ---
import { useAuth } from './context/AuthContext';
// --- END MODIFICATION ---
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/common/Loader';
import AdminTrackRide from './pages/admin/AdminTrackRide';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import ManageBuses from './pages/admin/ManageBuses';
import ManageRoutes from './pages/admin/ManageRoutes';
import ScheduleRides from './pages/admin/ScheduleRides';
import ManageUsers from './pages/admin/ManageUsers';

// Student Pages
import ViewSchedule from './pages/student/ViewSchedule';
import TrackRide from './pages/student/TrackRide';

// Driver Page
import DriverDashboard from './pages/driver/DriverDashboard';


const App: React.FC = () => {
  // --- MODIFICATION: Get new functions ---
  const { user, loading, isPlanner, isOperator } = useAuth();
  // --- END MODIFICATION ---

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
              <AdminTrackRide />
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
              <TrackRide />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </div>
  );
};

export default App;