import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import UserManagement from '../../components/Admin/UserManagement';

const ManageUsers: React.FC = () => {
  return (
    <AdminLayout title="User Management">
      <div className="mb-8">
        <p className="text-gray-400 max-w-3xl leading-relaxed">
          Manage user permissions and roles across the BusBuddy platform. 
          <span className="block mt-2 text-sm text-gray-500">
            Assign <strong className="text-blue-400">Users</strong> for students, 
            <strong className="text-red-400"> Admins</strong> for management access, or 
            <strong className="text-amber-400"> Drivers</strong> for vehicle tracking capabilities.
          </span>
        </p>
      </div>
      <UserManagement />
    </AdminLayout>
  );
};

export default ManageUsers;