import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './common/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // --- MODIFICATION: Update to new, specific roles ---
  requiredRole: 'masteradmin' | 'planner' | 'operator' | 'user' | 'manager';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  // --- MODIFICATION: Get new role functions ---
  const { user, loading, isMasterAdmin, isPlanner, isOperator } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user) {
    // Not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- NEW ROLE LOGIC ---

  // Check for 'masteradmin' (Users page)
  if (requiredRole === 'masteradmin' && !isMasterAdmin()) {
    return <Navigate to="/" replace />;
  }
  
  // Check for 'planner' (Buses, Routes)
  if (requiredRole === 'planner' && !isPlanner()) {
    return <Navigate to="/" replace />;
  }

  // Check for 'operator' (Driver Dashboard)
  if (requiredRole === 'operator' && !isOperator()) {
    return <Navigate to="/" replace />;
  }

  // Check for 'manager' (ANY admin/driver role for Schedule/Track pages)
  if (requiredRole === 'manager' && !(isPlanner() || isOperator())) {
    return <Navigate to="/" replace />;
  }

  // Check for 'user' (student)
  if (requiredRole === 'user') {
    // If any admin/driver tries to access a user-only page
    if (isPlanner() || isOperator()) {
      // Redirect them to the main admin schedule page
      return <Navigate to="/admin/schedule" replace />;
    }
  }
  // --- END NEW ROLE LOGIC ---

  // If all checks pass, render the child component
  return <>{children}</>;
};

export default ProtectedRoute;