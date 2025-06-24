import React, { useState, useEffect, useRef } from 'react';
import GoogleMapsService from '../../services/googleMapsService';
import { formatDistance, formatCurrency } from '../../utils/formatters';
import { MAP_DEFAULTS } from '../../utils/constants';

const ParkingMap = ({
  parkingLots = [],
  userLocation = null,
  onParkingClick = null,
  height = '400px',
  showUserLocation = true,
  showNavigationControls = true,
  fitBounds = true,
  zoom = MAP_DEFAULTS.ZOOM,
  center = [MAP_DEFAULTS.CENTER.longitude, MAP_DEFAULTS.CENTER.latitude]
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Google Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Starting map initialization...');
        await GoogleMapsService.loadGoogleMaps();
        
        console.log('Google Maps loaded, checking availability...');
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API not available');
        }

        // Use fallback center if userLocation is not available
        const mapCenter = userLocation && userLocation.latitude && userLocation.longitude
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : { lat: center[1], lng: center[0] };

        console.log('Creating map with center:', mapCenter);

        map.current = new window.google.maps.Map(mapContainer.current, {
          center: mapCenter,
          zoom: zoom,
          // Remove mapId temporarily to test without Advanced Markers
          // mapId: "DEMO_MAP_ID", 
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: showNavigationControls,
          zoomControl: showNavigationControls
        });

        console.log('Map created successfully');
        setMapLoaded(true);
        setError(null);
      } catch (error) {
        console.error('Error initializing Google Map:', error);
        setError(`Failed to load map: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Remove timeout and initialize directly
    initializeMap();
    
    return () => {
      // Cleanup markers
      markers.current.forEach(marker => {
        if (marker.setMap) {
          marker.setMap(null);
        }
      });
      markers.current = [];
      
      // Don't destroy the map instance to avoid re-initialization issues
      // map.current = null;
    };
  }, []); // Keep empty dependency array

  // Add user location marker separately after map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation || !showUserLocation) return;

    console.log('Adding user location marker:', userLocation);
    let userMarker;
    
    const addUserMarker = () => {
      try {
        // Use simple legacy marker for now
        const userIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          scale: 8
        };

        userMarker = new window.google.maps.Marker({
          position: { lat: userLocation.latitude, lng: userLocation.longitude },
          map: map.current,
          title: 'Your Location',
          icon: userIcon
        });

        // Update map center to user location
        map.current.setCenter({ 
          lat: userLocation.latitude, 
          lng: userLocation.longitude 
        });

        const userInfoWindow = new window.google.maps.InfoWindow({
          content: '<div class="text-sm font-medium p-2">Your Location</div>'
        });

        userMarker.addListener('click', () => {
          userInfoWindow.open(map.current, userMarker);
        });

        console.log('User location marker added successfully');
      } catch (error) {
        console.error('Error creating user location marker:', error);
      }
    };

    addUserMarker();

    return () => {
      if (userMarker && userMarker.setMap) {
        userMarker.setMap(null);
      }
    };
  }, [userLocation, mapLoaded, showUserLocation]);

  // Add parking lot markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log('Adding parking markers:', parkingLots.length);

    // Clear existing markers
    markers.current.forEach(({ marker }) => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markers.current = [];

    // Add new markers using legacy markers only
    const addParkingMarkers = () => {
      try {
        for (const parking of parkingLots) {
          if (!parking.location?.coordinates) continue;

          const [lng, lat] = parking.location.coordinates;
          
          // Use simple legacy marker
          const parkingIcon = {
            path: 'M12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5M12,2A7,7 0 0,1 19,9C19,14.25 12,22 12,22C12,22 5,14.25 5,9A7,7 0 0,1 12,2M12,4A5,5 0 0,0 7,9C7,10 7,12 12,18.71C17,12 17,10 17,9A5,5 0 0,0 12,4Z',
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 1.5,
            anchor: new window.google.maps.Point(12, 22)
          };

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: map.current,
            title: parking.name,
            icon: parkingIcon
          });

          // Create info window content
          const infoWindowContent = `
            <div class="p-3 min-w-[250px] max-w-[300px]">
              <h3 class="font-semibold text-gray-900 mb-2">${parking.name}</h3>
              <p class="text-sm text-gray-600 mb-2">${parking.address}</p>
              
              <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <span class="text-gray-500">Car:</span>
                  <span class="font-medium">${parking.available?.car || 0}/${parking.capacity?.car || 0}</span>
                </div>
                <div>
                  <span class="text-gray-500">Motorcycle:</span>
                  <span class="font-medium">${parking.available?.motorcycle || 0}/${parking.capacity?.motorcycle || 0}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <span class="text-gray-500">Car Rate:</span>
                  <span class="font-medium">${formatCurrency(parking.rates?.car || 0)}/hr</span>
                </div>
                <div>
                  <span class="text-gray-500">Motorcycle Rate:</span>
                  <span class="font-medium">${formatCurrency(parking.rates?.motorcycle || 0)}/hr</span>
                </div>
              </div>

              ${parking.distance ? `
                <div class="text-xs text-gray-500 mb-2">
                  Distance: ${formatDistance(parking.distance)}
                </div>
              ` : ''}

              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center">
                  <span class="text-yellow-400 text-sm">★</span>
                  <span class="text-sm text-gray-600 ml-1">${parking.rating || 0}</span>
                </div>
                <button 
                  class="view-details-btn bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                  onclick="window.handleParkingSelect('${parking._id}')"
                >
                  View Details
                </button>
              </div>
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: infoWindowContent
          });

          marker.addListener('click', () => {
            // Close all other info windows
            markers.current.forEach(({ infoWindow: iw }) => {
              if (iw && iw.close) {
                iw.close();
              }
            });
            
            infoWindow.open(map.current, marker);
            
            if (onParkingClick) {
              onParkingClick(parking);
            }
          });

          markers.current.push({ marker, infoWindow });
        }

        console.log('Parking markers added:', markers.current.length);
      } catch (error) {
        console.error('Error creating markers:', error);
      }
    };

    addParkingMarkers();

    // Set up global handler for parking selection
    window.handleParkingSelect = (parkingId) => {
      const parking = parkingLots.find(p => p._id === parkingId);
      if (parking && onParkingClick) {
        onParkingClick(parking);
      }
    };

    // Fit bounds to show all markers
    if (fitBounds && parkingLots.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      parkingLots.forEach(parking => {
        if (parking.location?.coordinates) {
          const [lng, lat] = parking.location.coordinates;
          bounds.extend({ lat, lng });
        }
      });

      if (userLocation && showUserLocation) {
        bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
      }

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
        
        // Limit max zoom when fitting bounds
        const listener = window.google.maps.event.addListener(map.current, 'bounds_changed', () => {
          if (map.current.getZoom() > 15) {
            map.current.setZoom(15);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }

    return () => {
      // Cleanup
      markers.current.forEach(({ marker }) => {
        if (marker.setMap) {
          marker.setMap(null);
        }
      });
      markers.current = [];
      delete window.handleParkingSelect;
    };
  }, [parkingLots, mapLoaded, fitBounds, userLocation, showUserLocation, onParkingClick]);

  // Debugging: Log component state
  useEffect(() => {
    console.log('ParkingMap Debug State:', {
      mapLoaded,
      hasUserLocation: !!userLocation,
      userLocation,
      parkingLotsCount: parkingLots.length,
      hasMapContainer: !!mapContainer.current,
      hasMap: !!map.current,
      loading,
      error
    });
  }, [mapLoaded, userLocation, parkingLots, loading, error]);

  if (loading) {
    return (
      <div 
        style={{ height }}
        className="w-full rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{ height }}
        className="w-full rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100"
      >
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        style={{ height }}
        className="w-full rounded-lg overflow-hidden border border-gray-200"
      />
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <h4 className="font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Your Location</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Parking Available</span>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {parkingLots.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
          <span className="font-medium text-gray-900">
            {parkingLots.length} parking lot{parkingLots.length !== 1 ? 's' : ''} found
          </span>
        </div>
      )}
    </div>
  );
};

export default ParkingMap;