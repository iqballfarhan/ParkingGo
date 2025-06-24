import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { MapIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { SEARCH_PARKING_LOTS } from '../../graphql/queries';
import { useDebounce, useGeolocation } from '../../hooks';
import ParkingCard from './ParkingCard';
import ParkingGrid from './ParkingGrid';
import ParkingMap from './ParkingMap';
import SearchFilters from './SearchFilters';
import { Pagination } from '../common';

const ParkingList = ({ 
  initialSearchQuery = '',
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  defaultView = 'grid',
  onParkingSelect = null
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    maxDistance: '',
    vehicleType: '',
    facilities: [],
    minRating: 0,
    availability: true
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState(defaultView);
  const [sortBy, setSortBy] = useState('distance');
  const [sortOrder, setSortOrder] = useState('asc');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { location: userLocation, loading: locationLoading } = useGeolocation();

  // Prepare search variables
  const searchVariables = {
    query: debouncedSearchQuery,
    filters: {
      ...filters,
      userLocation: userLocation ? {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      } : null
    },
    page: currentPage,
    limit: 12,
    sortBy,
    sortOrder
  };

  const { data, loading, error, refetch } = useQuery(SEARCH_PARKING_LOTS, {
    variables: searchVariables,
    skip: !debouncedSearchQuery && !filters.location,
    fetchPolicy: 'cache-and-network'
  });

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, filters]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleParkingClick = (parking) => {
    if (onParkingSelect) {
      onParkingSelect(parking);
    }
  };
  const parkingLots = data?.searchParkings || [];
  const totalCount = parkingLots.length;
  const totalPages = Math.ceil(totalCount / 12);

  const sortOptions = [
    { value: 'distance', label: 'Distance' },
    { value: 'price', label: 'Price' },
    { value: 'rating', label: 'Rating' },
    { value: 'name', label: 'Name' },
    { value: 'availability', label: 'Availability' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Search Bar */}
      {showSearch && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search parking lots by name, address, or area..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* View Toggle and Sort */}
          <div className="flex items-center gap-4">
            {showViewToggle && (
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 flex items-center gap-2 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 flex items-center gap-2 ${
                    viewMode === 'map' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  Map
                </button>
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {loading ? (
              'Searching...'
            ) : (
              `${totalCount} parking lot${totalCount !== 1 ? 's' : ''} found`
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4">
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              userLocation={userLocation}
              locationLoading={locationLoading}
            />
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading parking lots
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error.message}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => refetch()}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && parkingLots.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No parking lots found</h3>
          <p className="text-gray-500">Try adjusting your search or filters to find parking lots in your area.</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && parkingLots.length > 0 && (
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            <ParkingGrid
              parkingLots={parkingLots}
              onParkingClick={handleParkingClick}
              userLocation={userLocation}
            />
          ) : (
            <ParkingMap
              parkingLots={parkingLots}
              onParkingClick={handleParkingClick}
              userLocation={userLocation}
              height="600px"
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
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
      )}
    </div>
  );
};

export default ParkingList;