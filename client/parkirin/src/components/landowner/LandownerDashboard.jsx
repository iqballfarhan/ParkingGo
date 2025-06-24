import React, { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const LandownerDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Mock data - replace with actual GraphQL query
  useEffect(() => {
    const mockStats = {
      totalParkingLots: 5,
      totalSpots: 750,
      occupiedSpots: 482,
      availableSpots: 268,
      todayRevenue: 2350000,
      monthlyRevenue: 45700000,
      totalBookings: 1240,
      activeBookings: 89,
      completedBookings: 1151,
      averageOccupancy: 64.3,
      revenueGrowth: 12.5,
      bookingGrowth: 8.7,
      topPerformingLot: 'Central Plaza Parking',
      recentBookings: [
        {
          id: 'BK001',
          parkingLot: 'Central Plaza Parking',
          spot: 'A-15',
          customer: 'John Doe',
          amount: 120000,
          duration: 8,
          time: '2 hours ago'
        },
        {
          id: 'BK002',
          parkingLot: 'Mall Taman Anggrek',
          spot: 'B-23',
          customer: 'Jane Smith',
          amount: 72000,
          duration: 6,
          time: '4 hours ago'
        },
        {
          id: 'BK003',
          parkingLot: 'Office Tower Beta',
          spot: 'C-08',
          customer: 'Bob Wilson',
          amount: 160000,
          duration: 8,
          time: '6 hours ago'
        }
      ],
      chartData: {
        week: [
          { day: 'Mon', revenue: 2800000, bookings: 45 },
          { day: 'Tue', revenue: 3200000, bookings: 52 },
          { day: 'Wed', revenue: 2900000, bookings: 48 },
          { day: 'Thu', revenue: 3500000, bookings: 58 },
          { day: 'Fri', revenue: 4100000, bookings: 67 },
          { day: 'Sat', revenue: 4800000, bookings: 78 },
          { day: 'Sun', revenue: 3900000, bookings: 63 }
        ]
      }
    };
    
    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, [selectedPeriod]);

  const statCards = [
    {
      title: 'Total Parking Lots',
      value: stats.totalParkingLots,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      change: null
    },
    {
      title: 'Total Spots',
      value: stats.totalSpots,
      subtitle: `${stats.occupiedSpots} occupied, ${stats.availableSpots} available`,
      icon: UsersIcon,
      color: 'bg-green-500',
      change: null
    },
    {
      title: 'Today\'s Revenue',
      value: stats.todayRevenue ? `Rp ${stats.todayRevenue.toLocaleString()}` : '-',
      subtitle: `Monthly: Rp ${stats.monthlyRevenue?.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      change: stats.revenueGrowth,
      changeType: stats.revenueGrowth > 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings,
      subtitle: `${stats.completedBookings} completed`,
      icon: CalendarIcon,
      color: 'bg-purple-500',
      change: stats.bookingGrowth,
      changeType: stats.bookingGrowth > 0 ? 'increase' : 'decrease'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landowner Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your parking lots and monitor performance
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${card.color} rounded-md flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {card.value}
                        </div>
                        {card.change && (
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {card.changeType === 'increase' ? (
                              <TrendingUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                            )}
                            <span className="ml-1">
                              {Math.abs(card.change)}%
                            </span>
                          </div>
                        )}
                      </dd>
                      {card.subtitle && (
                        <dd className="text-sm text-gray-500 mt-1">
                          {card.subtitle}
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Revenue Overview</h3>
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Simple bar chart representation */}
          <div className="space-y-3">
            {stats.chartData?.week.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-12 text-sm text-gray-600">{item.day}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="bg-blue-500 h-6 rounded"
                      style={{ 
                        width: `${(item.revenue / 5000000) * 100}%`,
                        minWidth: '20px'
                      }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      Rp {item.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Bookings</h3>
          <div className="space-y-4">
            {stats.recentBookings?.map((booking, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {booking.parkingLot} - {booking.spot}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.customer} • {booking.duration}h
                  </p>
                  <p className="text-xs text-gray-400">{booking.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Rp {booking.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandownerDashboard; 