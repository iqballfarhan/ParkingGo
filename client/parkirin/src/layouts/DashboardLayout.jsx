import React from 'react';
import useAuthStore from '../store/authStore';
import UserDashboardLayout from './UserDashboardLayout';
import LandownerDashboardLayout from './LandownerDashboardLayout';

const DashboardLayout = ({ children }) => {
  const { user } = useAuthStore();

  // Render based on user role
  if (user?.role === 'landowner') {
    return <LandownerDashboardLayout>{children}</LandownerDashboardLayout>;
  }

  return <UserDashboardLayout>{children}</UserDashboardLayout>;
};

export default DashboardLayout;
