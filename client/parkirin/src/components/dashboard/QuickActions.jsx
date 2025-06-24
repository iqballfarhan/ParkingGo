import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common';

const QuickActions = ({ userRole = 'user', className = '' }) => {
  const navigate = useNavigate();
  const userActions = [
    {
      id: 'search-parking',
      label: 'Find Parking',
      description: 'Search for available parking spots nearby',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'primary',
      onClick: () => navigate('/parking/search')
    },
    {
      id: 'view-bookings',
      label: 'My Bookings',
      description: 'View and manage your booking history',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'success',
      onClick: () => navigate('/bookings')
    },
    {
      id: 'wallet',
      label: 'Wallet',
      description: 'Manage your payments and transactions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'secondary',
      onClick: () => navigate('/wallet')
    },
    {
      id: 'chat',
      label: 'Messages',
      description: 'Chat with parking lot owners',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'warning',
      onClick: () => navigate('/chat')
    }
  ];
  const landownerActions = [
    {
      id: 'manage-parking',
      label: 'Manage Parking',
      description: 'Add or edit your parking lots',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'primary',
      onClick: () => navigate('/parking/manage')
    },
    {
      id: 'view-earnings',
      label: 'Earnings',
      description: 'View your income and analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'success',
      onClick: () => navigate('/wallet')
    },
    {
      id: 'bookings-received',
      label: 'Bookings',
      description: 'Manage incoming booking requests',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'secondary',
      onClick: () => navigate('/bookings/received')
    },
    {
      id: 'customer-chat',
      label: 'Customer Chat',
      description: 'Communicate with your customers',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'warning',
      onClick: () => navigate('/chat')
    }
  ];
  const adminActions = [
    {
      id: 'user-management',
      label: 'User Management',
      description: 'Manage users and permissions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'primary',
      onClick: () => navigate('/admin/users')
    },
    {
      id: 'parking-approval',
      label: 'Parking Approval',
      description: 'Review and approve parking lots',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'success',
      onClick: () => navigate('/admin/parking-approval')
    },
    {
      id: 'system-analytics',
      label: 'Analytics',
      description: 'View system-wide analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'secondary',
      onClick: () => navigate('/admin/analytics')
    },
    {
      id: 'support',
      label: 'Support',
      description: 'Handle customer support requests',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'warning',
      onClick: () => navigate('/admin/support')
    }
  ];

  const getActions = () => {
    switch (userRole) {
      case 'landowner':
        return landownerActions;
      case 'admin':
        return adminActions;
      default:
        return userActions;
    }
  };
  const actions = getActions();

  const colorClasses = {
    primary: 'bg-primary-50 border-primary-200 hover:bg-primary-100 hover:border-primary-300 text-primary-600 hover:text-primary-700',
    success: 'bg-success-50 border-success-200 hover:bg-success-100 hover:border-success-300 text-success-600 hover:text-success-700',
    secondary: 'bg-secondary-50 border-secondary-200 hover:bg-secondary-100 hover:border-secondary-300 text-secondary-600 hover:text-secondary-700',
    warning: 'bg-warning-50 border-warning-200 hover:bg-warning-100 hover:border-warning-300 text-warning-600 hover:text-warning-700',
    error: 'bg-error-50 border-error-200 hover:bg-error-100 hover:border-error-300 text-error-600 hover:text-error-700'
  };

  return (
    <div className={`card p-6 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group transform hover:scale-105 ${colorClasses[action.color]}`}
            onClick={action.onClick}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-current">
                  {action.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold mb-1 group-hover:underline">
                  {action.label}
                </h4>
                <p className="text-xs opacity-75 leading-relaxed">{action.description}</p>
              </div>
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

QuickActions.propTypes = {
  userRole: PropTypes.oneOf(['user', 'landowner', 'admin']),
  className: PropTypes.string
};

export default QuickActions;