import React from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '../../hooks';
import { StatCard, QuickActions, RecentActivity } from '../../components/dashboard';
import { LoadingSpinner } from '../../components/common';
import { GET_DASHBOARD_STATS, GET_RECENT_ACTIVITY } from '../../graphql/queries';
import { formatCurrency } from '../../utils/formatters';

const Dashboard = () => {
  const { user } = useAuth();
  
  const { 
    data: statsData, 
    loading: statsLoading, 
    error: statsError 
  } = useQuery(GET_DASHBOARD_STATS);
  
  const { 
    data: activityData, 
    loading: activityLoading 
  } = useQuery(GET_RECENT_ACTIVITY, {
    variables: { limit: 10 }
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{statsError.message}</p>
        </div>
      </div>
    );
  }

  const stats = statsData?.getDashboardStats || {};
  const activities = activityData?.getRecentActivity || [];

  // Generate stats based on user role
  const getStatsForRole = () => {
    const baseStats = [
      {
        title: 'Wallet Balance',        value: formatCurrency(
          typeof stats.walletBalance === 'number'
            ? stats.walletBalance
            : (user?.saldo || 0)
        ),
        change: typeof stats.walletChange === 'number' ? stats.walletChange : 0,
        changeType: stats.walletChange > 0 ? 'positive' : (stats.walletChange < 0 ? 'negative' : 'neutral'),
        color: 'success',
        icon: () => (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )
      }
    ];

    switch (user?.role) {
      case 'landowner':
        return [
          ...baseStats,
          {
            title: 'Total Parking Lots',            value: typeof stats.totalParkingLots === 'number' ? stats.totalParkingLots : 0,
            change: typeof stats.parkingLotsChange === 'number' ? stats.parkingLotsChange : 0,
            changeType: 'positive',
            color: 'primary',
            icon: () => (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )
          },
          {
            title: 'Monthly Earnings',            value: formatCurrency(typeof stats.monthlyEarnings === 'number' ? stats.monthlyEarnings : 0),
            change: typeof stats.earningsChange === 'number' ? stats.earningsChange : 0,
            changeType: stats.earningsChange > 0 ? 'positive' : (stats.earningsChange < 0 ? 'negative' : 'neutral'),
            color: 'secondary',
            icon: () => (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            )
          },
          {
            title: 'Active Bookings',            value: typeof stats.activeBookings === 'number' ? stats.activeBookings : 0,
            change: typeof stats.bookingsChange === 'number' ? stats.bookingsChange : 0,
            changeType: 'neutral',
            color: 'warning',
            icon: () => (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )
          }
        ];
      
      case 'admin':
        return [
          ...baseStats,
          {
            title: 'Total Users',            value: typeof stats.totalUsers === 'number' ? stats.totalUsers : 0,
            change: typeof stats.usersChange === 'number' ? stats.usersChange : 0,
            changeType: 'positive',
            color: 'primary',
            icon: () => (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )
          },
          {
            title: 'Platform Revenue',            value: formatCurrency(typeof stats.platformRevenue === 'number' ? stats.platformRevenue : 0),
            change: typeof stats.revenueChange === 'number' ? stats.revenueChange : 0,
            changeType: stats.revenueChange > 0 ? 'positive' : (stats.revenueChange < 0 ? 'negative' : 'neutral'),
            color: 'success',
            icon: () => (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )
          },
          {
            title: 'Pending Approvals',            value: typeof stats.pendingApprovals === 'number' ? stats.pendingApprovals : 0,
            change: null,
            changeType: 'neutral',
            color: 'error',
            icon: () => (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )
          }
        ];
      
      default: // regular user
        return [
          ...baseStats,
          {
            title: 'Active Bookings',           
            value: typeof stats.activeBookings === 'number' ? stats.activeBookings : 0,
            change: null,
            changeType: 'neutral',
            color: 'primary',
            icon: () => (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )
          },
          {
            title: 'Total Bookings',            
            value: typeof stats.totalBookings === 'number' ? stats.totalBookings : 0,
            change: typeof stats.bookingsChange === 'number' ? stats.bookingsChange : 0,
            changeType: 'positive',
            color: 'secondary',
            icon: () => (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )
          },
          {
            title: 'Total Spent',            value: formatCurrency(typeof stats.totalSpent === 'number' ? stats.totalSpent : 0),
            change: typeof stats.spentChange === 'number' ? stats.spentChange : 0,
            changeType: 'neutral',
            color: 'warning',
            icon: () => (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            )
          }
        ];
    }
  };

  const userStats = getStatsForRole();
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-8 shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {user?.name}! 
                  <span className="inline-block ml-2 animate-bounce">👋</span>
                </h1>
                <p className="text-primary-100 text-lg leading-relaxed">
                  {user?.role === 'landowner' 
                    ? 'Manage your parking lots and track your earnings'
                    : user?.role === 'admin'
                    ? 'Monitor the platform and manage users'
                    : 'Find and book parking spots easily'
                  }
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M4 10h16v11H4V10z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4">
            <div className="w-32 h-32 bg-white/5 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8">
            <div className="w-40 h-40 bg-white/5 rounded-full"></div>
          </div>
        </div>
      </div>      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            color={stat.color}
            loading={statsLoading}
            className="hover:scale-105 transition-transform duration-200"
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions userRole={user?.role} />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity 
            activities={activities} 
            loading={activityLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
