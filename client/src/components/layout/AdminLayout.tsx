import React from 'react';
import Sidebar from './Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, actions }) => {
  return (
    // 1. Changed bg-gray-100 to your dark theme bg-[#050414]
    <div className="flex min-h-screen bg-[#050414]">
      
      <Sidebar />
      
      {/* 2. ADDED 'ml-20': This pushes content right so the fixed sidebar doesn't cover it */}
      {/* Added 'transition-all' so it animates smoothly if you ever decide to expand the sidebar width */}
      <div className="flex-1 flex flex-col ml-20 transition-all duration-300 w-full">
        
        {/* Top Header - Updated styles for dark theme */}
        <header className="z-10 bg-[#0D0A2A] border-b border-white/5 sticky top-0">
          <div className="max-w-7xl mx-auto py-6 px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
            {actions && <div>{actions}</div>}
          </div>
        </header>

        {/* Main Content Area - Updated bg to transparent/dark */}
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