import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import UserManagement from '../../components/Admin/UserManagement';

const ManageUsers: React.FC = () => {
  return (
    <AdminLayout title="User Management">
      <p className="mb-4 text-sm text-gray-600">
        Here you can manage user roles. Users can be assigned as Students, Admins (manage only), or Drivers (manage and track).
      </p>
      <UserManagement />
    </AdminLayout>
  );
};

export default ManageUsers;