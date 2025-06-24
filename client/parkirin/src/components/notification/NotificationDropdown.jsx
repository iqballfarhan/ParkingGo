import React, { useState } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ 
  isOpen, 
  onClose, 
  notifications = [], 
  onMarkAsRead, 
  onMarkAllAsRead,
  onDelete,
  loading = false 
}) => {
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'read':
        return notification.is_read;
      default:
        return true;
    }
  });

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <BellIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        {['all', 'unread', 'read'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`flex-1 py-2 px-4 text-sm font-medium capitalize ${
              filter === filterType
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filterType}
            {filterType === 'unread' && unreadCount > 0 && (
              <span className="ml-1 text-xs">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <button
            onClick={onMarkAllAsRead}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              {filter === 'unread' 
                ? 'No unread notifications' 
                : filter === 'read'
                ? 'No read notifications'
                : 'No notifications yet'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
