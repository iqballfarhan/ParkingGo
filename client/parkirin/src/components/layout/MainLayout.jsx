// src/components/layout/MainLayout.jsx
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

const MainLayout = ({ children, showSidebar = false, showFooter = true }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const shouldShowSidebar = showSidebar && isAuthenticated;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {shouldShowSidebar && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
        
        <main className={`flex-1 ${shouldShowSidebar ? 'lg:ml-0' : ''}`}>
          {shouldShowSidebar && (
            <div className="lg:hidden p-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>
      
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
