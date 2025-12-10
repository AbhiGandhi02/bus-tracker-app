import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: {
    name?: string;
    photoURL?: string;
    email?: string;
  } | null;
  handleLogout: () => void;
  BusBuddyLogo?: string | null;
  portalName?: string; // <--- NEW PROP
}

const getUserInitials = (name: string) => 
  name ? name.substring(0, 2).toUpperCase() : 'U';

const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  handleLogout, 
  BusBuddyLogo,
  portalName = "Student Portal" // Default value
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-7xl bg-[#0D0A2A]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl px-6 py-3">
        <div className="flex items-center justify-between w-full">

          {/* Left: Logo + Brand (combined) */}
          <div className="flex items-center gap-3">
            {BusBuddyLogo ? (
              <img src={BusBuddyLogo} alt="BusBuddy Logo" className="w-8 h-8 object-contain" />
            ) : null}
            <h1 className="text-lg font-bold tracking-tight text-white">
              Bus<span className="text-[#B045FF]">Buddy</span>
            </h1>
          </div>

          {/* Center: Student Portal (matching font size/weight) */}
          <div className="text-lg font-bold text-white uppercase tracking-wide">
            {portalName}
          </div>

          {/* Right: Profile + Logout (compact) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-1 pr-4 py-1 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 transition-colors cursor-default">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#B045FF] to-[#4A1F8A] flex items-center justify-center text-xs font-bold text-white border-2 border-[#0D0A2A] shadow-md overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? getUserInitials(user.name) : <UserIcon className="w-4 h-4" />}</span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-200 hidden sm:block">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#4A1F8A]/20 text-[#B045FF] hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all duration-200 group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

        </div>
      </nav>
    </div>
  );
};

export default Navbar;