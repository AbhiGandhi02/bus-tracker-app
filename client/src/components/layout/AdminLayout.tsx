import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { ShieldCheck, Car, Crown } from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, actions }) => {
  const { user } = useAuth();
  
  // 1. Add state to track if sidebar is hovered
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // --- LOGIC: Determine Label, Color, and Icon based on Role ---
  let portalLabel = 'Admin Portal';
  let portalStyle = 'bg-red-500/10 text-red-400 border-red-500/20'; 
  let PortalIcon = ShieldCheck;

  if (user?.role === 'driver') {
    portalLabel = 'Driver Portal';
    portalStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    PortalIcon = Car;
  } else if (user?.role === 'masteradmin') {
    portalLabel = 'Master Admin Portal';
    portalStyle = 'bg-green-500/10 text-green-400 border-green-500/20'; 
    PortalIcon = Crown;
  }
  // -------------------------------------------------------------

  return (
    <div className="flex min-h-screen bg-[#050414]">
      
      {/* 2. Pass the state and the setter to Sidebar */}
      <Sidebar 
        isHovered={isSidebarHovered} 
        setIsHovered={setIsSidebarHovered} 
      />
      
      {/* 3. Update margin-left based on state (ml-20 vs ml-60) */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 w-full ${
          isSidebarHovered ? 'ml-60' : 'ml-20'
        }`}
      >
        
        {/* Top Header */}
        <header className="z-10 bg-[#0D0A2A] border-b border-white/5 sticky top-0">
          <div className="max-w-7xl mx-auto py-6 px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
            
            <div className="flex items-center gap-4">
              
              {/* --- ROLE BADGE --- */}
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide select-none ${portalStyle}`}
              >
                <PortalIcon className="w-3.5 h-3.5" />
                {portalLabel}
              </div>
              {/* ------------------ */}

              {actions && <div>{actions}</div>}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;