import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader, Circle } from '@react-google-maps/api';
import { MagnifyingGlassIcon, MapPinIcon, InformationCircleIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const containerStyle = { width: '100%', height: '400px' };
const libraries = ['places', 'geometry'];

// Default center to Jakarta, Indonesia
const defaultCenter = { lat: -6.2088, lng: 106.8456 };

// Custom parking lot marker icon
const createCustomMarkerIcon = () => {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#DC2626" stroke="white" stroke-width="3"/>
        <circle cx="24" cy="24" r="18" fill="#DC2626"/>
        <rect x="14" y="16" width="20" height="16" rx="2" fill="white"/>
        <text x="24" y="28" text-anchor="middle" fill="#DC2626" font-size="16" font-weight="bold" font-family="Arial">P</text>
        <circle cx="24" cy="40" r="3" fill="#DC2626" opacity="0.6"/>
      </svg>
    `)}`,
    scaledSize: new window.google.maps.Size(48, 48),
    anchor: new window.google.maps.Point(24, 48),
  };
};

// Animated pulse marker for active selection
const createPulseMarkerIcon = () => {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#059669" stroke="white" stroke-width="3"/>
        <circle cx="24" cy="24" r="18" fill="#059669"/>
        <rect x="14" y="16" width="20" height="16" rx="2" fill="white"/>
        <text x="24" y="28" text-anchor="middle" fill="#059669" font-size="16" font-weight="bold" font-family="Arial">P</text>
        <circle cx="24" cy="40" r="3" fill="#059669" opacity="0.6"/>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="scale"
          values="1;1.1;1"
          dur="2s"
          repeatCount="indefinite"/>
      </svg>
    `)}`,
    scaledSize: new window.google.maps.Size(48, 48),
    anchor: new window.google.maps.Point(24, 48),
  };
};

const MapPicker = ({ 
  center = defaultCenter, 
  onSelect, 
  showSearchBox = true, 
  className = "",
  height = "400px" 
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [markerPosition, setMarkerPosition] = useState(center);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [markerIcon, setMarkerIcon] = useState(null);
  const [showPulse, setShowPulse] = useState(false);
  
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  // Initialize marker icons when Google Maps loads
  useEffect(() => {
    if (isLoaded && window.google) {
      setMarkerIcon(createCustomMarkerIcon());
    }
  }, [isLoaded]);
  // Show pulse effect when marker position changes
  useEffect(() => {
    if (isLoaded && window.google) {
      setShowPulse(true);
      setMarkerIcon(createPulseMarkerIcon());
      
      const timer = setTimeout(() => {
        setShowPulse(false);
        setMarkerIcon(createCustomMarkerIcon());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [markerPosition.lat, markerPosition.lng, isLoaded]);

  // Initialize geocoder when map loads
  const onMapLoad = (map) => {
    mapRef.current = map;
    if (window.google && window.google.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
      // Get initial address from coordinates
      reverseGeocode(markerPosition);
    }
  };
  // Reverse geocode to get address from coordinates with enhanced error handling
  const reverseGeocode = async (position) => {
    if (!geocoderRef.current) {
      setSelectedAddress(`Koordinat: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
      return;
    }
    
    try {
      const response = await new Promise((resolve, reject) => {
        geocoderRef.current.geocode(
          { 
            location: position,
            language: 'id', // Indonesian language
            region: 'id'    // Indonesian region
          },
          (results, status) => {
            console.log('Geocoding status:', status);
            
            if (status === 'OK' && results && results.length > 0) {
              resolve(results);
            } else if (status === 'ZERO_RESULTS') {
              resolve(null);
            } else {
              reject(new Error(`Geocoding failed with status: ${status}`));
            }
          }
        );
      });
      
      if (response && response[0]) {
        setSelectedAddress(response[0].formatted_address);
      } else {
        // Fallback: show coordinates when no address found
        setSelectedAddress(`Lokasi: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
      }
    } catch (error) {
      console.warn('Reverse geocoding error:', error.message);
      
      // Enhanced fallback with coordinate display
      const coordsDisplay = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
      
      // Try to provide a meaningful location description based on coordinates
      let locationHint = 'Lokasi Terpilih';
      if (position.lat >= -7 && position.lat <= -5.5 && position.lng >= 106 && position.lng <= 107.5) {
        locationHint = 'Area Jakarta';
      } else if (position.lat >= -8 && position.lat <= -6 && position.lng >= 107 && position.lng <= 109) {
        locationHint = 'Area Jawa Barat';
      } else if (position.lat >= -8.5 && position.lat <= -7 && position.lng >= 110 && position.lng <= 111.5) {
        locationHint = 'Area Jawa Tengah';
      }
      
      setSelectedAddress(`${locationHint} (${coordsDisplay})`);
    }
  };
  // Search for places with enhanced error handling and retry mechanism
  const handleSearch = async (retryCount = 0) => {
    if (!searchQuery.trim() || !geocoderRef.current) return;
    
    setIsSearching(true);
    setSearchError('');
    
    try {
      const response = await new Promise((resolve, reject) => {
        geocoderRef.current.geocode(
          { 
            address: searchQuery,
            componentRestrictions: { country: 'ID' }, // Restrict to Indonesia
            language: 'id',
            region: 'id'
          },
          (results, status) => {
            console.log('Search geocoding status:', status);
            
            if (status === 'OK' && results && results.length > 0) {
              resolve(results);
            } else if (status === 'ZERO_RESULTS') {
              resolve(null);
            } else if (status === 'OVER_QUERY_LIMIT') {
              reject(new Error('RATE_LIMIT'));
            } else if (status === 'REQUEST_DENIED') {
              reject(new Error('API_KEY_ERROR'));
            } else {
              reject(new Error(`Search failed: ${status}`));
            }
          }
        );
      });
      
      if (response && response[0]) {
        const location = response[0].geometry.location;
        const newPosition = {
          lat: location.lat(),
          lng: location.lng()
        };
        
        setMarkerPosition(newPosition);
        setSelectedAddress(response[0].formatted_address);
        
        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.panTo(newPosition);
          mapRef.current.setZoom(16);
        }
        
        // Notify parent component
        onSelect(newPosition);
        setSearchQuery('');
      } else {
        setSearchError('Location not found. Try with a more specific keyword.');
      }
    } catch (error) {
      console.warn('Geocoding search error:', error.message);
      
      if (error.message === 'RATE_LIMIT' && retryCount < 2) {
        // Retry after delay for rate limit
        setTimeout(() => {
          handleSearch(retryCount + 1);
        }, 1000 * (retryCount + 1));
        setSearchError(`Retrying search... (${retryCount + 1}/3)`);
        return;
      } else if (error.message === 'API_KEY_ERROR') {
        setSearchError('API key configuration issue. Contact administrator.');
      } else if (error.message.includes('RATE_LIMIT')) {
        setSearchError('Too many search requests. Please try again later.');
      } else {
        setSearchError('Search failed. Try with a more specific place name or check your internet connection.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newPosition = { lat, lng };
    
    setMarkerPosition(newPosition);
    onSelect(newPosition);
    reverseGeocode(newPosition);
  };

  const handleDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newPosition = { lat, lng };
    
    setMarkerPosition(newPosition);
    onSelect(newPosition);
    reverseGeocode(newPosition);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (loadError) {
    return (      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load map</p>
          <p className="text-sm text-gray-500 mt-1">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>      {showSearchBox && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Lokasi Parking Lot
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search for address, mall, office building, or landmark..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm transition-colors"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4" />
                )}
                {isSearching ? 'Mencari...' : 'Cari'}
              </button>
            </div>
            
            {searchError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  {searchError.replace('Lokasi tidak ditemukan', 'Location not found')
                 .replace('Mencoba ulang pencarian...', 'Retrying search...')
                 .replace('Konfigurasi API key bermasalah', 'API key configuration issue')
                 .replace('Terlalu banyak pencarian', 'Too many search requests')}
                </p>
              </div>
            )}
          </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-blue-700 text-sm">
                <p className="font-medium mb-1">Tips untuk memilih lokasi parking lot:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Cari dengan nama tempat: "Mall Central Park Jakarta"</li>
                  <li>• Klik langsung pada peta untuk memilih lokasi yang tepat</li>
                  <li>• Seret marker hijau untuk menyesuaikan posisi secara presisi</li>
                  <li>• Lingkaran hijau menunjukkan area coverage ±100m</li>
                  <li>• Pastikan lokasi mudah diakses oleh kendaraan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}      <div className="relative rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height }}
          center={markerPosition}
          zoom={16}
          onClick={handleMapClick}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            styles: [
              {
                featureType: 'poi.business',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'poi.attraction',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          }}
        >
          <Marker
            position={markerPosition}
            draggable
            onDragEnd={handleDragEnd}
            title="Seret untuk mengubah posisi"
            icon={markerIcon}
            animation={showPulse ? window.google?.maps?.Animation?.BOUNCE : null}
          />
          
          {/* Add a subtle radius circle to show area coverage */}
          <Circle
            center={markerPosition}
            radius={100} // 100 meter radius
            options={{
              fillColor: '#059669',
              fillOpacity: 0.1,
              strokeColor: '#059669',
              strokeOpacity: 0.3,
              strokeWeight: 1,
            }}
          />
        </GoogleMap>
        
        {/* Map overlay with instructions */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200 max-w-xs">
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-800">💡 Tip:</span> Click on the map or drag the green marker to select the exact location
          </p>
        </div>
      </div>{selectedAddress && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-green-800 font-semibold text-sm">✓ Selected Parking Location</p>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Valid</span>
              </div>
              <p className="text-green-700 text-sm mb-2 leading-relaxed">{selectedAddress}</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/60 rounded p-2">
                  <p className="text-green-600 font-medium">Coordinates:</p>
                  <p className="text-green-700 font-mono">{markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}</p>
                </div>
                <div className="bg-white/60 rounded p-2">
                  <p className="text-green-600 font-medium">Status:</p>
                  <p className="text-green-700">Ready to save</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
