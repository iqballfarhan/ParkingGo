import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { GET_USER_BOOKINGS, GET_PARKING_BOOKINGS } from '../../graphql/queries';
import { useAuth, usePagination } from '../../hooks';
import BookingCard from './BookingCard';
import { Button, Pagination, Alert } from '../common';
import { Select } from '../forms';
import { BOOKING_STATUS, VEHICLE_TYPES } from '../../utils/constants';
import { formatBookingStatus } from '../../utils/formatters';

const BookingList = ({
  parkingId = null, // If provided, show bookings for specific parking
  showFilters = true,
  showPagination = true,
  compact = false,
  limit = 10
}) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    vehicleType: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState('desc');

  const {
    currentPage,
    setCurrentPage,
    resetPage
  } = usePagination();

  // Choose query based on whether we're showing user bookings or parking bookings
  const query = parkingId ? GET_PARKING_BOOKINGS : GET_USER_BOOKINGS;
  const variables = {
    ...(parkingId ? { parkingId } : {}),
    filters: {
      ...filters,
      dateFrom: filters.dateFrom || null,
      dateTo: filters.dateTo || null
    },
    page: currentPage,
    limit,
    sortBy,
    sortOrder
  };

  const { data, loading, error, refetch } = useQuery(query, {
    variables,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all'
  });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [filters, sortBy, sortOrder, resetPage]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleBookingUpdate = (status) => {
    // Refetch data when booking status changes
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      vehicleType: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const bookings = data?.getUserBookings?.bookings || data?.getParkingBookings?.bookings || [];
  const totalCount = data?.getUserBookings?.totalCount || data?.getParkingBookings?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.values(BOOKING_STATUS).map(status => ({
      value: status,
      label: formatBookingStatus(status)
    }))
  ];

  const vehicleTypeOptions = [
    { value: '', label: 'All Vehicle Types' },
    ...Object.values(VEHICLE_TYPES).map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    }))
  ];

  const sortOptions = [
    { value: 'startTime', label: 'Start Time' },
    { value: 'createdAt', label: 'Booking Date' },
    { value: 'totalCost', label: 'Total Cost' },
    { value: 'status', label: 'Status' }
  ];

  if (error) {
    return (
      <Alert type="error" className="mb-6">
        <div>
          <h3 className="font-medium">Error loading bookings</h3>
          <p className="mt-1">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FunnelIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="font-medium text-gray-900">Filters</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                options={statusOptions}
                placeholder="Select status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type
              </label>
              <Select
                value={filters.vehicleType}
                onChange={(value) => handleFilterChange('vehicleType', value)}
                options={vehicleTypeOptions}
                placeholder="Select vehicle type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                options={sortOptions}
                className="w-40"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>

            <div className="ml-auto text-sm text-gray-500">
              {loading ? 'Loading...' : `${totalCount} booking${totalCount !== 1 ? 's' : ''} found`}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && bookings.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && bookings.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
            <CalendarIcon />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bookings found
          </h3>
          <p className="text-gray-500">
            {Object.values(filters).some(v => v) 
              ? 'Try adjusting your filters to see more results.'
              : parkingId 
                ? 'This parking lot has no bookings yet.'
                : 'You haven\'t made any bookings yet.'
            }
          </p>
          {Object.values(filters).some(v => v) && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Bookings List */}
      {bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              compact={compact}
              showParkingInfo={!parkingId}
              userRole={user?.role}
              onUpdate={handleBookingUpdate}
            />
          ))}

          {/* Loading overlay for refetching */}
          {loading && bookings.length > 0 && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showPageNumbers={true}
            maxPageNumbers={5}
          />
        </div>
      )}
    </div>
  );
};

export default BookingList;