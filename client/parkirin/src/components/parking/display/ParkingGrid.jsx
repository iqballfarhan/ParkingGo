// src/components/parking/ParkingGrid.jsx
import React from 'react';
import ParkingCard from './ParkingCard';
import { LoadingSpinner } from '../common';
import { classNames } from '../../utils/helpers';

const ParkingGrid = ({
  parkings = [],
  loading = false,
  error = null,
  userLocation,
  favorites = [],
  onFavorite,
  emptyMessage = 'No parking spaces found',
  className = ''
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading parkings</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!parkings || parkings.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No parking spaces found</h3>
        <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={classNames(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
      className
    )}>      {parkings.map((parking) => (
        <ParkingCard
          key={parking.id}
          parking={parking}
          userLocation={userLocation}
          isFavorite={favorites.includes(parking.id)}
          onFavorite={onFavorite}
        />
      ))}
    </div>
  );
};

export default ParkingGrid;