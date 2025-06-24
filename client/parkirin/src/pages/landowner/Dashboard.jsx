import React from 'react';
import { 
  CreditCardIcon, 
  ClockIcon, 
  UserIcon,
  ChartBarIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { StatCard, QuickActions } from '../../components/common';
import { useLandownerDashboard } from '../../hooks/useLandownerDashboard';

const Dashboard = () => {
  const {
    isLoading,
    userInfo,
    bookings,
    parkings,
    formatCurrency,
    handleNavigate
  } = useLandownerDashboard();

  if (isLoading) return (
    <div className="flex justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const stats = [
    {
      title: 'Wallet Balance',
      value: formatCurrency(userInfo?.saldo),
      icon: CreditCardIcon,
      color: 'success'
    },
    {
      title: 'Active Bookings',
      value: bookings.length,
      icon: ClockIcon,
      color: 'primary'
    },
    {
      title: 'My Parking Lots',
      value: parkings.length,
      icon: BuildingOffice2Icon,
      color: 'secondary'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(0), // Replace with actual revenue calculation
      icon: ChartBarIcon,
      color: 'warning'
    }
  ];

  return (
    <div className="w-full p-4 sm:p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white mb-6">        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userInfo?.name}!</h1>
            <p className="text-orange-100 mt-1">Manage your parking lots</p>
          </div>
          <div className="flex items-center space-x-4">
            {userInfo?.avatar ? (
              <img src={userInfo.avatar} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white" />
            ) : (
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* My Parking Lots List */}
      {parkings.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">My Parking Lots</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parkings.map((lot) => (
                  <tr key={lot._id} className="border-b">
                    <td className="px-4 py-2">{lot.name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        lot.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {lot.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
                        onClick={() => handleNavigate(`/landowner/parking/${lot._id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions userRole="landowner" />
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 3).map((booking) => (
                <div key={booking._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">Booking #{booking._id.slice(-6)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.startTime).toLocaleDateString()} - {booking.duration}h
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 