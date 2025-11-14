import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, LogOut, LayoutDashboard, Bus, Map, Calendar } from 'lucide-react';

const Sidebar: React.FC = () => {
  // --- CHANGE 1: Get the new role functions ---
  const { logout, isMasterAdmin, isPlanner, isOperator } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- CHANGE 2: Conditionally build the nav item list ---
  const navItems = [];

  // "Daily Schedule" link -> Show if isPlanner() OR isOperator()
  if (isPlanner() || isOperator()) {
    navItems.push({ 
      path: '/admin/schedule', 
      label: 'Daily Schedule', 
      icon: <Calendar className="w-5 h-5" /> 
    });
  }

  // "Manage Buses" & "Manage Routes" links -> Show if isPlanner()
  if (isPlanner()) {
    navItems.push({ 
      path: '/admin/buses', 
      label: 'Manage Buses', 
      icon: <Bus className="w-5 h-5" /> 
    });
    navItems.push({ 
      path: '/admin/routes', 
      label: 'Manage Routes', 
      icon: <Map className="w-5 h-5" /> 
    });
  }

  // "Manage Users" link -> Show if isMasterAdmin()
  if (isMasterAdmin()) {
    navItems.push({ 
      path: '/admin/users', 
      label: 'Manage Users', 
      icon: <Users className="w-5 h-5" /> 
    });
  }
  // --- END CHANGE 2 ---

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚌</span>
          <h1 className="text-xl font-bold">Bus Tracker</h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {/* Render the dynamically built list */}
        {navItems.length > 0 && (
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Manage
          </p>
        )}
        {navItems.map((item) => (
          <li key={item.path} className="list-none">
            <NavLink
              to={item.path}
              end={item.path === '/admin/schedule'} // Use schedule as the "root"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}

        {/* --- CHANGE 3: Use isOperator() for the Driver link --- */}
        {isOperator() && (
          <>
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Driver</p>
            <li className="list-none">
              <NavLink
                to="/driver"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-yellow-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Driver Dashboard</span>
              </NavLink>
            </li>
          </>
        )}
        {/* --- END CHANGE 3 --- */}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-red-600 w-full px-4 py-3 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;