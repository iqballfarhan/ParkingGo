import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationBell = ({ unreadCount = 0, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
    >
      <BellIcon className="w-6 h-6" />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
