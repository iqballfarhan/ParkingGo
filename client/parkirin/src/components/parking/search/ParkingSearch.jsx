import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  StarIcon,
  WifiIcon,
  CameraIcon,
  LockClosedIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ParkingSearch = ({ onResults, onFiltersChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [distance, setDistance] = useState(5);
  const [sortBy, setSortBy] = useState('distance');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const amenityOptions = [
    { id: 'cctv', label: 'CCTV', icon: CameraIcon },
    { id: 'security', label: 'Security Guard', icon: LockClosedIcon },
    { id: '24hours', label: '24/7 Access', icon: ClockIcon },
    { id: 'wifi', label: 'WiFi', icon: WifiIcon },
    { id: 'valet', label: 'Valet Service', icon: StarIcon },
    { id: 'ev_charging', label: 'EV Charging', icon: CurrencyDollarIcon },
    { id: 'covered', label: 'Covered Parking', icon: MapPinIcon },
    { id: 'wheelchair', label: 'Wheelchair Access', icon: MapPinIcon }
  ];

  const sortOptions = [
    { value: 'distance', label: 'Distance' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating' },
    { value: 'availability', label: 'Availability' }
  ];

  // Initialize dates to current date and time
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setStartDate(now.toISOString().split('T')[0]);
    setStartTime(now.toTimeString().slice(0, 5));
    setEndDate(tomorrow.toISOString().split('T')[0]);
    setEndTime(now.toTimeString().slice(0, 5));
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    
    const searchParams = {
      query: searchQuery,
      location: location,
      startDateTime: `${startDate}T${startTime}`,
      endDateTime: `${endDate}T${endTime}`,
      priceRange: priceRange,
      amenities: selectedAmenities,
      distance: distance,
      sortBy: sortBy
    };

    // Simulate API call
    setTimeout(() => {
      // Mock search results
      const mockResults = [
        {
          id: '1',
          name: 'Central Plaza Parking',
          address: 'Jl. Sudirman No. 123, Jakarta',
          distance: 0.5,
          pricePerHour: 15000,
          rating: 4.5,
          totalSpots: 150,
          availableSpots: 45,
          amenities: ['cctv', 'security', '24hours', 'covered'],
          coordinates: { lat: -6.208763, lng: 106.845599 },
          images: ['/api/placeholder/300/200']
        },
        {
          id: '2',
          name: 'Mall Taman Anggrek',
          address: 'Jl. Letjen S. Parman, Jakarta',
          distance: 1.2,
          pricePerHour: 12000,
          rating: 4.2,
          totalSpots: 300,
          availableSpots: 120,
          amenities: ['cctv', 'valet', 'ev_charging', 'wifi'],
          coordinates: { lat: -6.178306, lng: 106.790584 },
          images: ['/api/placeholder/300/200']
        },
        {
          id: '3',
          name: 'Office Tower Beta',
          address: 'Jl. HR Rasuna Said, Jakarta',
          distance: 2.1,
          pricePerHour: 20000,
          rating: 4.8,
          totalSpots: 80,
          availableSpots: 12,
          amenities: ['cctv', 'security', 'valet', 'wheelchair'],
          coordinates: { lat: -6.224895, lng: 106.823337 },
          images: ['/api/placeholder/300/200']
        }
      ];
      
      setIsSearching(false);
      onResults && onResults(mockResults);
      onFiltersChange && onFiltersChange(searchParams);
    }, 1500);
  };

  const handleAmenityToggle = (amenityId) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocation('');
    setPriceRange([0, 50000]);
    setSelectedAmenities([]);
    setDistance(5);
    setSortBy('distance');
  };

  const calculateDuration = () => {
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      const diffInHours = Math.max(0, (end - start) / (1000 * 60 * 60));
      return diffInHours.toFixed(1);
    }
    return '0';
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Find Parking</h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <FunnelIcon className="w-4 h-4 mr-1" />
          {showAdvanced ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Basic Search */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Search Query */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, location..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Location */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Near Location
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter address or landmark"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Date and Time Selection */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <div className="relative">
            <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <div className="relative">
            <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Duration Display */}
      {calculateDuration() !== '0' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm text-blue-800">
              Duration: {calculateDuration()} hours
            </span>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-6 space-y-6">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Price Range (per hour)
            </label>
            <div className="px-3">
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Rp 0</span>
                <span>Rp {priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Distance: {distance} km
            </label>
            <div className="px-3">
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>1 km</span>
                <span>20 km</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Amenities
            </label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {amenityOptions.map((amenity) => {
                const IconComponent = amenity.icon;
                const isSelected = selectedAmenities.includes(amenity.id);
                
                return (
                  <button
                    key={amenity.id}
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className={`flex items-center p-2 rounded-lg border text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {amenity.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isSearching}
        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSearching ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Searching...
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
            Search Parking
          </>
        )}
      </button>

      {/* Active Filters Summary */}
      {(selectedAmenities.length > 0 || priceRange[1] < 50000 || distance < 20) && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Active Filters</span>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map((amenityId) => {
              const amenity = amenityOptions.find(a => a.id === amenityId);
              return (
                <span
                  key={amenityId}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {amenity?.label}
                  <button
                    onClick={() => handleAmenityToggle(amenityId)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {priceRange[1] < 50000 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Max: Rp {priceRange[1].toLocaleString()}
              </span>
            )}
            {distance < 20 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Within {distance} km
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingSearch;
