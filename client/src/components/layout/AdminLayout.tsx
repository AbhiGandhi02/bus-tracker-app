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
      
      {/* Sidebar: Desktop (hidden md:block) + Mobile drawer from Sidebar component */}
      <div className="hidden md:block">
        <Sidebar 
          isHovered={isSidebarHovered} 
          setIsHovered={setIsSidebarHovered} 
        />
      </div>
      
      {/* Mobile Sidebar: Hamburger button is fixed at top-left inside here */}
      <div className="md:hidden">
        <Sidebar 
          isHovered={isSidebarHovered} 
          setIsHovered={setIsSidebarHovered} 
        />
      </div>
      
      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 w-full ml-0 ${
          isSidebarHovered ? 'md:ml-60' : 'md:ml-20'
        }`}
      >
        
        {/* Header - Responsive */}
        {/* CHANGE 1: removed pt-16, added pl-14 on mobile to make room for fixed hamburger */}
        <header className="z-10 bg-[#0D0A2A] border-b border-white/5 sticky top-0 pl-14 md:pl-0 transition-all">
          <div className="max-w-7xl mx-auto py-4 px-4 md:px-8 h-16 md:h-20 flex items-center">
            
            <div className="flex items-center justify-between w-full">
              {/* CHANGE 2: Title left-aligned (not centered) so it sits next to the hamburger */}
              <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight truncate mr-2">
                {title}
              </h1>
              
              {/* Portal Badge - Right side */}
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div 
                  className={`flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full border text-[10px] md:text-xs font-semibold tracking-wide select-none ${portalStyle}`}
                >
                  <PortalIcon className="w-3.5 h-3.5" />
                  {/* Hide text on very small screens if needed, or keep for mobile */}
                  <span className="hidden sm:inline">{portalLabel}</span>
                </div>
                {actions && <div>{actions}</div>}
              </div>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;