import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, LogOut, LayoutDashboard, Bus, Map, Calendar } from 'lucide-react';

const BusBuddyLogo = '/images/BusBuddyLogo.png';

const Sidebar: React.FC = () => {
  const { logout, isMasterAdmin, isPlanner, isOperator, user } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // --- LOGIC: Determine Portal Name based on Role ---
  let portalName = 'Admin Portal';
  if (user?.role === 'masteradmin') portalName = 'Master Admin';
  if (user?.role === 'driver') portalName = 'Driver Portal';
  // --------------------------------------------------

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build Nav Items
  const navItems = [];

  if (isPlanner() || isOperator()) {
    navItems.push({ path: '/admin/schedule', label: 'Daily Schedule', icon: <Calendar className="w-5 h-5" /> });
  }

  if (isPlanner()) {
    navItems.push({ path: '/admin/buses', label: 'Manage Buses', icon: <Bus className="w-5 h-5" /> });
    navItems.push({ path: '/admin/routes', label: 'Manage Routes', icon: <Map className="w-5 h-5" /> });
  }

  if (isMasterAdmin()) {
    navItems.push({ path: '/admin/users', label: 'Manage Users', icon: <Users className="w-5 h-5" /> });
  }

  return (
    <div 
      className={`fixed left-0 top-0 h-screen bg-[#0D0A2A] border-r border-white/10 text-white z-50 flex flex-col transition-all duration-300 ease-in-out shadow-2xl ${
        isHovered ? 'w-60' : 'w-20'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- HEADER --- */}
      {/* 'pl-6' keeps the icon centered when collapsed (w-20) and left-aligned when expanded */}
      <div className="h-20 flex items-center pl-6 border-b border-white/5 relative overflow-hidden whitespace-nowrap">
        
        {/* Logo Icon (No wrapper box) */}
        <div className="shrink-0 flex items-center justify-center">
            <span className="text-3xl filter drop-shadow-lg" role="img" aria-label="bus">
              <img src={BusBuddyLogo} alt="BusBuddy Logo" className="w-8 h-8 object-contain" />
            </span>
        </div>

        {/* Text (Fades in/out) */}
        <div className={`ml-4 transition-all duration-300 overflow-hidden ${isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">
            Bus<span className="text-[#B045FF]">Buddy</span>
          </h1>
          {/* --- UPDATED: Uses dynamic variable instead of hardcoded text --- */}
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
            {portalName}
          </p>
          {/* --------------------------------------------------------------- */}
        </div>
      </div>

      {/* --- NAVIGATION --- */}
      {/* Added classes to hide scrollbar but keep functionality */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        
        {/* Section Label */}
        <div className={`px-3 mb-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${isHovered ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'}`}>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Management</p>
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin/schedule'}
            className={({ isActive }) =>
              `relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group overflow-hidden whitespace-nowrap ${
                isActive
                  ? 'bg-[#B045FF]/20 text-white shadow-[0_0_15px_rgba(176,69,255,0.3)] border border-[#B045FF]/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
              }`
            }
          >
            {/* Icon */}
            <div className="shrink-0 relative z-10">{item.icon}</div>
            
            {/* Label */}
            <span className={`text-sm font-medium transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              {item.label}
            </span>
            
            {/* Hover Tooltip (Only shows when collapsed) */}
            {!isHovered && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}

        {/* --- DRIVER LINK (Conditional) --- */}
        {isOperator() && (
          <div className="mt-8 pt-6 border-t border-white/5">
              <div className={`px-3 mb-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${isHovered ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'}`}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Driver View</p>
            </div>
            
            <NavLink
              to="/driver"
              className={({ isActive }) =>
                `relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group overflow-hidden whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                    : 'text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-300'
                }`
              }
            >
              <div className="shrink-0 relative z-10"><LayoutDashboard className="w-5 h-5" /></div>
              <span className={`text-sm font-medium transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                Driver Dashboard
              </span>
              
              {!isHovered && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
                  Driver Dashboard
                </div>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* --- FOOTER / LOGOUT --- */}
      <div className="p-3 border-t border-white/5 bg-[#0D0A2A]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 w-full px-3 py-3 rounded-xl text-gray-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 group overflow-hidden whitespace-nowrap"
        >
          <div className="shrink-0 relative z-10"><LogOut className="w-5 h-5" /></div>
          <span className={`text-sm font-medium transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            Sign Out
          </span>
          
          {!isHovered && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;