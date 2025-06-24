import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  ChatBubbleLeftRightIcon, 
  Bars3Icon, 
  XMarkIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid
} from '@heroicons/react/24/solid';
import useAuthStore from '../store/authStore';

const LandownerDashboardLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { 
      name: 'Manage Parking Lots', 
      href: '/parking/manage', 
      icon: BuildingOfficeIcon, 
      iconSolid: BuildingOfficeIconSolid,
      description: 'Kelola properti parkir Anda'
    },
    { 
      name: 'Customer Support', 
      href: '/chat', 
      icon: ChatBubbleLeftRightIcon, 
      iconSolid: ChatBubbleLeftRightIconSolid,
      description: 'Chat dengan pelanggan'
    },
  ];
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed z-50 inset-y-0 left-0 w-72 bg-white shadow-strong flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-gray-200`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center">
            <img src='/assets/logo_ParkGo.png' className='h-10 w-10 mr-3' alt="ParkGo Logo" />
            <div>
              <div className="font-bold text-white text-xl">ParkGo</div>
              <div className="text-orange-100 text-sm">Landowner Portal</div>
            </div>
          </div>
          <button 
            className="p-2 rounded-lg text-white hover:bg-white/10 lg:hidden transition-colors duration-200" 
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Landowner Info Card */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={user?.avatar || '/avatar-default.png'} 
                alt="avatar" 
                className="h-12 w-12 rounded-full border-2 border-orange-200 shadow-sm" 
              />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-success-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">{user?.name || 'Landowner'}</div>
              <div className="text-sm text-gray-500 truncate">{user?.email}</div>
              <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Property Owner
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map(item => {
            const isActive = location.pathname === item.href;
            const IconComponent = isActive ? item.iconSolid : item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 relative ${
                  isActive 
                    ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-orange-600 rounded-r-full"></div>
                )}
                <IconComponent className={`h-5 w-5 mr-3 ${isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <div className="flex-1">
                  <div className={`font-medium ${isActive ? 'text-orange-900' : 'text-gray-900'}`}>
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <button className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200">
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandownerDashboardLayout;
