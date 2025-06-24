import React from 'react';
import {
  UsersIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AdminStatsCard = ({ title, value, icon: Icon, change, changeType, color = 'blue' }) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600',
      purple: 'bg-purple-50 text-purple-600'
    };
    return colors[color] || colors.blue;
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${getChangeColor(changeType)}`}>
              {changeType === 'increase' ? '↗' : changeType === 'decrease' ? '↘' : ''} {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboardStats = ({ stats = {} }) => {
  const defaultStats = {
    totalUsers: 0,
    totalParkingLots: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeBookings: 0,
    pendingApprovals: 0,
    ...stats
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AdminStatsCard
        title="Total Users"
        value={defaultStats.totalUsers.toLocaleString()}
        icon={UsersIcon}
        change="+12% from last month"
        changeType="increase"
        color="blue"
      />
      
      <AdminStatsCard
        title="Parking Lots"
        value={defaultStats.totalParkingLots.toLocaleString()}
        icon={BuildingOffice2Icon}
        change="+3 new this month"
        changeType="increase"
        color="green"
      />
      
      <AdminStatsCard
        title="Total Revenue"
        value={`Rp ${defaultStats.totalRevenue.toLocaleString('id-ID')}`}
        icon={CurrencyDollarIcon}
        change="+25% from last month"
        changeType="increase"
        color="green"
      />
      
      <AdminStatsCard
        title="Active Bookings"
        value={defaultStats.activeBookings.toLocaleString()}
        icon={BuildingOffice2Icon}
        color="yellow"
      />
      
      <AdminStatsCard
        title="Total Bookings"
        value={defaultStats.totalBookings.toLocaleString()}
        icon={BuildingOffice2Icon}
        change="+18% from last month"
        changeType="increase"
        color="purple"
      />
      
      <AdminStatsCard
        title="Pending Approvals"
        value={defaultStats.pendingApprovals.toLocaleString()}
        icon={ExclamationTriangleIcon}
        color="red"
      />
    </div>
  );
};

export default AdminDashboardStats;
