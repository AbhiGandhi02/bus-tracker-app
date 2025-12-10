import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { userAPI } from '../../services/api';
import Loader from '../common/Loader';
import { useAuth } from '../../context/AuthContext';
import { Shield, User as UserIcon, Car, ChevronDown, Crown } from 'lucide-react'; // Added Crown for SuperAdmin

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getAll();
      if (response.data.success && response.data.data) {
        setUsers(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      // 1. Pass newRole to API. 
      // If your API expects a specific type, cast it here: (newRole as 'admin' | 'user' | 'driver')
      // Otherwise, generic string usually works for the API call itself.
      await userAPI.updateRole(userId, newRole as any); 

      // 2. Update Local State
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId 
            // 3. THIS IS THE FIX: Cast 'newRole' to the type of user.role
            // This tells TypeScript: "Trust me, this string is a valid role"
            ? { ...user, role: newRole as typeof user.role } 
            : user
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
      alert(`Error: ${err.response?.data?.message || 'Failed to update role'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin': // --- NEW CASE ---
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#B045FF]/20 text-[#B045FF] border border-[#B045FF]/30 shadow-[0_0_10px_rgba(176,69,255,0.2)]">
            <Crown className="w-3 h-3" /> Super Admin
          </span>
        );
      case 'admin': 
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      case 'driver': 
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Car className="w-3 h-3" /> Driver
          </span>
        );
      case 'user':
      default: 
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <UserIcon className="w-3 h-3" /> User
          </span>
        );
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader size="lg" /></div>;
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        {error}
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1A1640]/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Current Role</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUser?.id;
              
              return (
                <tr 
                  key={user.id} 
                  className={`transition-colors hover:bg-white/5 ${isCurrentUser ? 'bg-[#B045FF]/5' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.photoURL ? (
                             <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src={user.photoURL} alt="" />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#B045FF] to-[#4A1F8A] flex items-center justify-center text-white font-bold ring-2 ring-white/10">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                       
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                            {user.name} 
                            {isCurrentUser && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">(You)</span>}
                        </div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="relative inline-block text-left w-36"> {/* Increased width slightly for 'Super Admin' text */}
                        <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={isCurrentUser || updatingId !== null}
                            className={`
                                appearance-none block w-full bg-[#0D0A2A] border border-white/10 text-gray-300 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#B045FF] focus:border-[#B045FF] transition-all cursor-pointer
                                ${isCurrentUser || updatingId ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/30'}
                            `}
                        >
                            <option value="user">User</option>
                            <option value="driver">Driver</option>
                            <option value="admin">Admin</option>
                            
                            {/* --- ADDED THIS OPTION --- */}
                            {/* This ensures your role displays correctly in the dropdown, even if disabled */}
                            <option value="superadmin">Super Admin</option>
                        </select>
                        
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                           <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500">
              No users found.
          </div>
      )}
    </div>
  );
};

export default UserManagement;