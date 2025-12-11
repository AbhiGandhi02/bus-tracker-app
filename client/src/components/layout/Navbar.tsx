import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';

const BusBuddy = '/images/BusBuddyLogo.png';

interface NavbarProps {
  user: {
    name?: string;
    photoURL?: string;
    email?: string;
  } | null;
  handleLogout: () => void;
  BusBuddyLogo?: string | null;
  portalName?: string;
}

const getUserInitials = (name: string) =>
  name ? name.substring(0, 2).toUpperCase() : 'U';

const Navbar: React.FC<NavbarProps> = ({
  user,
  handleLogout,
  BusBuddyLogo,
  portalName = "Student Portal"
}) => {
  return (
    <div className="w-full flex justify-center pt-4 px-4">
      <nav className="w-full max-w-xl md:max-w-5xl lg:max-w-7xl bg-[#0D0A2A]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl px-4 py-2.5 md:px-6 md:py-3 transition-all">
        <div className="flex items-center justify-between w-full">

          {/* Left: Brand */}
          <div className="flex items-center gap-2 md:gap-3">
            {BusBuddy ? (
              <img src={BusBuddy} alt="Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
            ) : (
              <span className="text-xl">🚌</span>
            )}
            <div className="flex flex-col">
              <h1 className="text-base md:text-lg font-bold tracking-tight text-white leading-none">
                Bus<span className="text-[#B045FF]">Buddy</span>
              </h1>
              <span className="text-[9px] md:hidden text-gray-400 uppercase tracking-wider font-medium">
                {portalName}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center">
            <span className="text-sm text-gray-300 uppercase tracking-wider font-medium">
              {portalName}
            </span>
          </div>

          {/* Right: Profile + Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-1 pr-1 md:pr-4 py-1 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 transition-colors cursor-default">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#B045FF] to-[#4A1F8A] flex items-center justify-center text-xs font-bold text-white border-2 border-[#0D0A2A] shadow-md overflow-hidden shrink-0">
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
              className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-[#4A1F8A]/20 text-[#B045FF] hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all duration-200 group active:scale-95"
              title="Logout"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

        </div>
      </nav>
    </div>
  );
};

export default Navbar;