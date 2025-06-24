import React from 'react';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'error':
        return 'border-l-red-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div      className={`bg-white border-l-4 ${getBorderColor(notification.type)} p-4 shadow-sm hover:shadow-md transition-shadow ${
        !notification.is_read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="mt-0.5">
          {getIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              
              {/* Additional data if available */}
              {notification.data && (
                <div className="mt-2 text-xs text-gray-500">
                  {typeof notification.data === 'object' 
                    ? JSON.stringify(notification.data)
                    : notification.data
                  }
                </div>
              )}
            </div>            {/* Unread indicator */}
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></div>
            )}
          </div>

          {/* Footer with timestamp and actions */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              {formatTimestamp(notification.created_at)}
            </span>

            <div className="flex items-center space-x-2">              {!notification.is_read && onMarkAsRead && (
                <button
                  onClick={() => onMarkAsRead(notification._id)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark as read
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={() => onDelete(notification._id)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
