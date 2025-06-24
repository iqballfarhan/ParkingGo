// src/components/parking/SearchFilters.jsx
import React, { useState } from 'react';
import { Button, Card, Badge } from '../common';
import { Select } from '../forms';
import { VEHICLE_TYPES, PARKING_FACILITIES } from '../../utils/constants';
import { classNames } from '../../utils/helpers';

const SearchFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const priceRanges = [
    { label: 'Any Price', value: null },
    { label: 'Under Rp 5,000', value: { min: 0, max: 5000 } },
    { label: 'Rp 5,000 - Rp 10,000', value: { min: 5000, max: 10000 } },
    { label: 'Rp 10,000 - Rp 20,000', value: { min: 10000, max: 20000 } },
    { label: 'Over Rp 20,000', value: { min: 20000, max: null } },
  ];

  const distanceOptions = [
    { label: 'Any Distance', value: null },
    { label: 'Within 500m', value: 0.5 },
    { label: 'Within 1km', value: 1 },
    { label: 'Within 2km', value: 2 },
    { label: 'Within 5km', value: 5 },
    { label: 'Within 10km', value: 10 },
  ];

  const sortOptions = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Distance', value: 'distance' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Rating', value: 'rating' },
    { label: 'Availability', value: 'availability' },
  ];

  const vehicleTypeOptions = VEHICLE_TYPES.map(type => ({
    label: type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value: type
  }));

  const facilityOptions = PARKING_FACILITIES.map(facility => ({
    label: facility.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value: facility
  }));

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleFacilityToggle = (facility) => {
    const currentFacilities = filters.facilities || [];
    const newFacilities = currentFacilities.includes(facility)
      ? currentFacilities.filter(f => f !== facility)
      : [...currentFacilities, facility];
    
    handleFilterChange('facilities', newFacilities);
  };

  const hasActiveFilters = () => {
    return Object.keys(filters).some(key => {
      if (key === 'facilities') return filters[key]?.length > 0;
      return filters[key] !== null && filters[key] !== undefined && filters[key] !== '';
    });
  };

  return (
    <Card className={classNames('mb-6', className)}>
      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Select
          label="Sort by"
          value={filters.sortBy || 'relevance'}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          options={sortOptions}
        />
        
        <Select
          label="Vehicle Type"
          value={filters.vehicleType || ''}
          onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
          options={[{ label: 'Any Vehicle', value: '' }, ...vehicleTypeOptions]}
        />
        
        <Select
          label="Price Range"
          value={filters.priceRange ? JSON.stringify(filters.priceRange) : ''}
          onChange={(e) => {
            const value = e.target.value ? JSON.parse(e.target.value) : null;
            handleFilterChange('priceRange', value);
          }}
          options={priceRanges.map(range => ({
            label: range.label,
            value: range.value ? JSON.stringify(range.value) : ''
          }))}
        />
        
        <Select
          label="Distance"
          value={filters.maxDistance || ''}
          onChange={(e) => handleFilterChange('maxDistance', e.target.value ? Number(e.target.value) : null)}
          options={distanceOptions.map(option => ({
            label: option.label,
            value: option.value?.toString() || ''
          }))}
        />
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <span>{isExpanded ? 'Hide' : 'Show'} Advanced Filters</span>
          <svg
            className={classNames(
              'h-4 w-4 transform transition-transform duration-200',
              isExpanded ? 'rotate-180' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="small"
            onClick={onClearFilters}
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="border-t pt-4 space-y-4">
          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.availableNow || false}
                  onChange={(e) => handleFilterChange('availableNow', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Available Now</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.openNow || false}
                  onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Open Now</span>
              </label>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange('minRating', rating)}
                  className={classNames(
                    'flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors duration-200',
                    filters.minRating === rating
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <span>{rating}</span>
                  <svg className="h-3 w-3 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>& up</span>
                </button>
              ))}
            </div>
          </div>

          {/* Facilities Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facilities
            </label>
            <div className="flex flex-wrap gap-2">
              {facilityOptions.map((facility) => (
                <button
                  key={facility.value}
                  onClick={() => handleFacilityToggle(facility.value)}
                  className={classNames(
                    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200',
                    filters.facilities?.includes(facility.value)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {facility.label}
                  {filters.facilities?.includes(facility.value) && (
                    <svg className="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available From
              </label>
              <input
                type="datetime-local"
                value={filters.availableFrom || ''}
                onChange={(e) => handleFilterChange('availableFrom', e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Until
              </label>
              <input
                type="datetime-local"
                value={filters.availableUntil || ''}
                onChange={(e) => handleFilterChange('availableUntil', e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            
            {filters.vehicleType && (
              <Badge variant="primary" size="small">
                {vehicleTypeOptions.find(v => v.value === filters.vehicleType)?.label}
              </Badge>
            )}
            
            {filters.priceRange && (
              <Badge variant="primary" size="small">
                {priceRanges.find(p => JSON.stringify(p.value) === JSON.stringify(filters.priceRange))?.label}
              </Badge>
            )}
            
            {filters.maxDistance && (
              <Badge variant="primary" size="small">
                Within {filters.maxDistance}km
              </Badge>
            )}
            
            {filters.minRating && (
              <Badge variant="primary" size="small">
                {filters.minRating}+ stars
              </Badge>
            )}
            
            {filters.facilities?.map(facility => (
              <Badge key={facility} variant="primary" size="small">
                {facilityOptions.find(f => f.value === facility)?.label}
              </Badge>
            ))}
            
            {filters.availableNow && (
              <Badge variant="success" size="small">
                Available Now
              </Badge>
            )}
            
            {filters.openNow && (
              <Badge variant="success" size="small">
                Open Now
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SearchFilters;