import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatTime } from '../../utils/formatters';

const RecentActivity = ({ activities = [], loading = false, className = '' }) => {
  const navigate = useNavigate();
  const getActivityIcon = (type) => {
    const icons = {
      booking_created: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      booking_confirmed: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      booking_cancelled: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      booking_completed: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      payment_completed: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      payment_failed: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      chat_message: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      parking_added: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      parking_updated: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      user_registered: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      review_added: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    };
    return icons[type] || (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
  };
  const getActivityColor = (type) => {
    const colors = {
      booking_created: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200' },
      booking_confirmed: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200' },
      booking_cancelled: { bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200' },
      booking_completed: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200' },
      payment_completed: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200' },
      payment_failed: { bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200' },
      chat_message: { bg: 'bg-secondary-50', text: 'text-secondary-600', border: 'border-secondary-200' },
      parking_added: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200' },
      parking_updated: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200' },
      user_registered: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200' },
      review_added: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200' }
    };
    return colors[type] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  };

  const handleActivityClick = (activity) => {
    switch (activity.type) {
      case 'booking_created':
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_completed':
        navigate(`/bookings/${activity.bookingId}`);
        break;
      case 'payment_completed':
      case 'payment_failed':
        navigate('/wallet');
        break;
      case 'chat_message':
        navigate(`/chat/${activity.chatId}`);
        break;
      case 'parking_added':
      case 'parking_updated':
        navigate(`/parking/${activity.parkingId}`);
        break;
      default:
        break;
    }
  };
  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!activities.length) {
    return (
      <div className={`card p-6 ${className}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity
        </h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h4>
          <p className="text-gray-500 max-w-sm mx-auto">Your activity will appear here once you start using the platform</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity
        </h3>
        <button
          onClick={() => navigate('/activity')}
          className="btn-secondary text-sm py-2 px-4"
        >
          View all
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {activities.map((activity, index) => {
          const colors = getActivityColor(activity.type);
          return (
            <div
              key={activity.id || index}
              className="group p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleActivityClick(activity)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-xl border-2 ${colors.bg} ${colors.border} ${colors.text} flex items-center justify-center`}>
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${colors.text} group-hover:underline`}>
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{activity.description}</p>
                      
                      {activity.location && (
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {activity.location}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end text-right ml-4">
                      <span className="text-xs font-medium text-gray-900">
                        {formatTime(activity.timestamp)}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

RecentActivity.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      location: PropTypes.string,
      bookingId: PropTypes.string,
      parkingId: PropTypes.string,
      chatId: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default RecentActivity;