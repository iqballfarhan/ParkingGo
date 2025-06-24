import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="text-9xl font-bold text-gray-300 mb-4">404</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/dashboard">
            <Button className="w-full" size="lg">
              Go to Dashboard
            </Button>
          </Link>
          
          <Link to="/parking/search">
            <Button variant="outline" className="w-full" size="lg">
              Find Parking
            </Button>
          </Link>
        </div>
        
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact our{' '}
            <a href="mailto:support@parkirin.com" className="text-blue-600 hover:text-blue-800">
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
