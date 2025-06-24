/**
 * Google Maps Service
 * Comprehensive Google Maps integration for client-server architecture
 * Handles API loading, geocoding, places search, and mapping functions
 */

class GoogleMapsService {
  constructor() {
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Load Google Maps JavaScript API with better error handling
   * @returns {Promise<void>}
   */
  async loadGoogleMaps() {
    if (this.isLoaded) {
      return Promise.resolve();
    }    if (this.isLoading) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.Map) {
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
        return;
      }

      // Get API key from environment or server
      this.getApiKey().then(apiKey => {
        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }

        // Create script element with proper error handling
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&v=weekly`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          // Wait for Google Maps to be fully available
          this.waitForGoogleMaps().then(() => {
            this.isLoaded = true;
            this.isLoading = false;
            resolve();
          }).catch(reject);
        };
        
        script.onerror = (error) => {
          this.isLoading = false;
          reject(new Error('Failed to load Google Maps API script'));
        };
        
        document.head.appendChild(script);
      }).catch(reject);
    });

    return this.loadPromise;
  }

  /**
   * Get API key from server or environment
   */
  async getApiKey() {
    // First try environment variable
    if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    }

    // Then try server endpoint
    try {
      const response = await fetch('/api/google-maps-key');
      if (response.ok) {
        const data = await response.json();
        return data.apiKey;
      }
    } catch (error) {
      console.warn('Failed to get API key from server:', error);
    }

    return null;
  }

  /**
   * Wait for Google Maps to be fully loaded
   */
  async waitForGoogleMaps(maxAttempts = 50) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkGoogleMaps = () => {
        attempts++;
        
        if (window.google && 
            window.google.maps && 
            window.google.maps.Map && 
            window.google.maps.Marker &&
            window.google.maps.places &&
            window.google.maps.places.PlacesService) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Google Maps API failed to load completely'));
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      
      checkGoogleMaps();
    });
  }

  isGoogleMapsLoaded() {
    return this.isLoaded && 
           window.google && 
           window.google.maps && 
           window.google.maps.Map;
  }

  /**
   * Geocode an address to coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise<Object>} Geocoding result
   */
  async geocode(address) {
    if (!address?.trim()) {
      throw new Error('Address is required');
    }

    const cacheKey = `geocode_${address}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      await this.loadGoogleMaps();
      
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            const result = {
              location: {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
              },
              formatted_address: results[0].formatted_address,
              place_id: results[0].place_id
            };
            
            this.setCache(cacheKey, result);
            resolve(result);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Reverse geocoding result
   */
  async reverseGeocode(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Valid latitude and longitude are required');
    }

    const cacheKey = `reverse_${lat}_${lng}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      await this.loadGoogleMaps();
      
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat, lng };
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
            const result = {
              formatted_address: results[0].formatted_address,
              address_components: results[0].address_components,
              place_id: results[0].place_id
            };
            
            this.setCache(cacheKey, result);
            resolve(result);
          } else {
            reject(new Error(`Reverse geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Search for nearby places
   * @param {Object} location - { lat, lng }
   * @param {number} radius - Search radius in meters
   * @param {string} type - Place type (e.g., 'parking')
   * @returns {Promise<Array>} Places results
   */
  async searchNearbyPlaces(location, radius = 5000, type = 'parking') {
    if (!location?.lat || !location?.lng) {
      throw new Error('Valid location coordinates are required');
    }

    const cacheKey = `places_${location.lat}_${location.lng}_${radius}_${type}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      await this.loadGoogleMaps();
      
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      
      const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        type: type
      };
      
      return new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const places = results.map(place => ({
              place_id: place.place_id,
              name: place.name,
              rating: place.rating,
              vicinity: place.vicinity,
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              types: place.types,
              photos: place.photos?.map(photo => ({
                url: photo.getUrl({ maxWidth: 400, maxHeight: 300 })
              })) || []
            }));
            
            this.setCache(cacheKey, places);
            resolve(places);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Places search error:', error);
      throw new Error('Failed to search nearby places');
    }
  }

  /**
   * Calculate distance between two points
   * @param {Object} origin - { lat, lng }
   * @param {Object} destination - { lat, lng }
   * @returns {Promise<Object>} Distance calculation result
   */
  async calculateDistance(origin, destination) {
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      throw new Error('Valid origin and destination coordinates are required');
    }

    try {
      await this.loadGoogleMaps();
      
      const service = new window.google.maps.DistanceMatrixService();
      
      return new Promise((resolve, reject) => {
        service.getDistanceMatrix({
          origins: [origin],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status === window.google.maps.DistanceMatrixStatus.OK) {
            const element = response.rows[0].elements[0];
            if (element.status === 'OK') {
              resolve({
                distance: element.distance,
                duration: element.duration,
                status: element.status
              });
            } else {
              reject(new Error(`Distance calculation failed: ${element.status}`));
            }
          } else {
            reject(new Error(`Distance Matrix request failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Distance calculation error:', error);
      throw new Error('Failed to calculate distance');
    }
  }

  /**
   * Get directions between two points
   * @param {Object} origin - { lat, lng } or address string
   * @param {Object} destination - { lat, lng } or address string
   * @param {string} travelMode - DRIVING, WALKING, BICYCLING, TRANSIT
   * @returns {Promise<Object>} Directions result
   */
  async getDirections(origin, destination, travelMode = 'DRIVING') {
    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    try {
      await this.loadGoogleMaps();
      
      const directionsService = new window.google.maps.DirectionsService();
      
      return new Promise((resolve, reject) => {
        directionsService.route({
          origin: origin,
          destination: destination,
          travelMode: window.google.maps.TravelMode[travelMode],
          unitSystem: window.google.maps.UnitSystem.METRIC
        }, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            resolve({
              routes: result.routes,
              status: status
            });
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Directions error:', error);
      throw new Error('Failed to get directions');
    }
  }

  /**
   * Create a map instance with better validation
   * @param {HTMLElement} container - Map container element
   * @param {Object} options - Map options
   * @returns {Promise<google.maps.Map>} Map instance
   */
  async createMap(container, options = {}) {
    if (!container) {
      throw new Error('Map container element is required');
    }

    try {
      // Ensure Google Maps is loaded
      await this.loadGoogleMaps();
      
      // Double check availability
      if (!this.isGoogleMapsLoaded()) {
        throw new Error('Google Maps API not properly loaded');
      }
      
      const defaultOptions = {
        center: { lat: -6.2088, lng: 106.8456 }, // Jakarta default
        zoom: 12,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        gestureHandling: 'auto',
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      const mapOptions = { ...defaultOptions, ...options };
      
      // Add small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const map = new window.google.maps.Map(container, mapOptions);
      
      // Wait for map to be fully initialized
      return new Promise((resolve, reject) => {
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          window.google.maps.event.removeListener(listener);
          resolve(map);
        });
        
        // Timeout fallback
        setTimeout(() => {
          window.google.maps.event.removeListener(listener);
          resolve(map);
        }, 5000);
      });
      
    } catch (error) {
      console.error('Map creation error:', error);
      throw new Error('Failed to create map');
    }
  }

  /**
   * Create a marker
   * @param {Object} options - Marker options
   * @returns {google.maps.marker.AdvancedMarkerElement|google.maps.Marker} Marker instance
   */
  async createMarker(options = {}) {
    if (!window.google?.maps) {
      throw new Error('Google Maps not loaded');
    }

    try {
      // Try to use AdvancedMarkerElement if available
      if (typeof window.google.maps.importLibrary === 'function') {
        const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");
        
        const markerOptions = {
          position: options.position,
          map: options.map,
          title: options.title
        };

        if (options.content) {
          markerOptions.content = options.content;
        }

        return new AdvancedMarkerElement(markerOptions);
      } else {
        // Fallback to legacy Marker
        console.warn('Using legacy Marker API');
        return new window.google.maps.Marker({
          position: options.position,
          map: options.map,
          title: options.title,
          icon: options.icon || undefined
        });
      }
    } catch (error) {
      console.error('Failed to create marker, falling back to legacy Marker:', error);
      // Final fallback to legacy Marker
      return new window.google.maps.Marker({
        position: options.position,
        map: options.map,
        title: options.title,
        icon: options.icon || undefined
      });
    }
  }

  /**
   * Create parking markers on map with server data integration
   * @param {Object} map - Google Maps instance
   * @param {Array} parkingSpots - Array of parking data from server
   * @param {Function} onMarkerClick - Callback for marker clicks
   * @returns {Array} Created markers
   */
  async createParkingMarkers(map, parkingSpots, onMarkerClick = null) {
    if (!map || !window.google?.maps) {
      throw new Error('Google Maps not loaded or map instance not provided');
    }

    if (!Array.isArray(parkingSpots)) {
      throw new Error('Parking spots must be an array');
    }    const markers = [];

    for (const spot of parkingSpots) {
      try {
        // Validate parking spot data
        if (!spot.location?.coordinates || !Array.isArray(spot.location.coordinates)) {
          console.warn(`Skipping parking spot ${spot._id}: invalid location data`);
          continue;
        }

        const [lng, lat] = spot.location.coordinates;
        
        if (!this.isValidCoordinates(lat, lng)) {
          console.warn(`Skipping parking spot ${spot._id}: invalid coordinates`);
          continue;
        }

        // Determine marker color based on availability
        let markerColor = '#dc2626'; // red - no availability
        if ((spot.available?.car > 0) || (spot.available?.motorcycle > 0)) {
          markerColor = '#16a34a'; // green - available
        } else if ((spot.available?.car === 0 && spot.capacity?.car > 0) || 
                   (spot.available?.motorcycle === 0 && spot.capacity?.motorcycle > 0)) {
          markerColor = '#ea580c'; // orange - full
        }        let marker;

        try {
          // Try to use AdvancedMarkerElement if available
          if (typeof window.google.maps.importLibrary === 'function') {
            const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");
            
            // Create custom SVG content for AdvancedMarkerElement
            const markerElement = document.createElement('div');
            markerElement.innerHTML = `
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3C11.58 3 8 6.58 8 11c0 6.5 8 18 8 18s8-11.5 8-18c0-4.42-3.58-8-8-8z" fill="${markerColor}" stroke="white" stroke-width="2"/>
                <circle cx="16" cy="11" r="4" fill="white"/>
                <text x="16" y="15" text-anchor="middle" fill="${markerColor}" font-size="12" font-weight="bold">P</text>
              </svg>
            `;
            markerElement.style.cursor = 'pointer';

            marker = new AdvancedMarkerElement({
              position: { lat, lng },
              map: map,
              title: spot.name,
              content: markerElement,
              zIndex: spot.available?.car > 0 || spot.available?.motorcycle > 0 ? 1000 : 100
            });
          } else {
            // Fallback to legacy Marker with custom icon
            const icon = {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 3C11.58 3 8 6.58 8 11c0 6.5 8 18 8 18s8-11.5 8-18c0-4.42-3.58-8-8-8z" fill="${markerColor}" stroke="white" stroke-width="2"/>
                  <circle cx="16" cy="11" r="4" fill="white"/>
                  <text x="16" y="15" text-anchor="middle" fill="${markerColor}" font-size="12" font-weight="bold">P</text>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 32)
            };

            marker = new window.google.maps.Marker({
              position: { lat, lng },
              map: map,
              title: spot.name,
              icon: icon,
              zIndex: spot.available?.car > 0 || spot.available?.motorcycle > 0 ? 1000 : 100
            });
          }
        } catch (markerError) {
          console.error('Error creating marker, using basic marker:', markerError);
          // Basic fallback marker
          marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: { lat, lng },
            map: map,
            title: spot.name,
            zIndex: spot.available?.car > 0 || spot.available?.motorcycle > 0 ? 1000 : 100
          });
        }

        // Create info window content
        const infoContent = this.createParkingInfoWindow(spot);
        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });

        // Add click event
        marker.addListener('click', () => {
          // Close all other info windows
          markers.forEach(m => m.infoWindow?.close());
          
          infoWindow.open(map, marker);
          
          if (onMarkerClick) {
            onMarkerClick(spot, marker);
          }
        });

        // Store reference to info window
        marker.infoWindow = infoWindow;
        marker.parkingData = spot;
        
        markers.push(marker);
      } catch (error) {
        console.error(`Error creating marker for parking spot ${spot._id}:`, error);
      }
    }

    return markers;
  }

  /**
   * Create HTML content for parking info window
   * @param {Object} parking - Parking data
   * @returns {string} HTML content
   */
  createParkingInfoWindow(parking) {
    const carAvailable = parking.available?.car || 0;
    const motorcycleAvailable = parking.available?.motorcycle || 0;
    const carRate = parking.rates?.car || 0;
    const motorcycleRate = parking.rates?.motorcycle || 0;
    
    // Format rates as currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    };

    return `
      <div class="parking-info-window" style="min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
          <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">${parking.name}</h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">${parking.address}</p>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">            <span style="font-size: 14px; color: #374151;">🚗 Car:</span>
            <span style="font-size: 14px; font-weight: 500; color: ${carAvailable > 0 ? '#16a34a' : '#dc2626'};">
              ${carAvailable} available
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px; color: #374151;">🏍️ Motorcycle:</span>
            <span style="font-size: 14px; font-weight: 500; color: ${motorcycleAvailable > 0 ? '#16a34a' : '#dc2626'};">
              ${motorcycleAvailable} available
            </span>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 14px; color: #374151;">💰 Tarif Mobil:</span>
            <span style="font-size: 14px; font-weight: 500;">${formatCurrency(carRate)}/jam</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 14px; color: #374151;">💰 Tarif Motor:</span>
            <span style="font-size: 14px; font-weight: 500;">${formatCurrency(motorcycleRate)}/jam</span>
          </div>
        </div>
        
        ${parking.operational_hours ? `
          <div style="margin-bottom: 12px;">
            <span style="font-size: 14px; color: #374151;">🕒 Jam Operasional:</span>
            <span style="font-size: 14px; font-weight: 500;">${parking.operational_hours.open} - ${parking.operational_hours.close}</span>
          </div>
        ` : ''}
        
        ${parking.facilities && parking.facilities.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; color: #374151; margin-bottom: 4px;">🏢 Fasilitas:</div>
            <div style="font-size: 12px; color: #6b7280;">
              ${parking.facilities.join(', ')}
            </div>
          </div>
        ` : ''}
        
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <button 
            onclick="window.selectParking && window.selectParking('${parking._id}')"
            style="width: 100%; padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;"
            onmouseover="this.style.background='#1d4ed8'"
            onmouseout="this.style.background='#2563eb'"
          >
            Pilih Lokasi Parkir
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Cache management
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Error handling helper
   */
  handleApiError(error, context = 'Google Maps operation') {
    console.error(`${context} error:`, error);
    
    if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('Google Maps API quota exceeded. Please try again later.');
    } else if (error.message?.includes('REQUEST_DENIED')) {
      throw new Error('Google Maps API request denied. Please check API key.');
    } else if (error.message?.includes('INVALID_REQUEST')) {
      throw new Error('Invalid request to Google Maps API.');
    } else {
      throw new Error(`${context} failed. Please try again.`);
    }
  }

  /**
   * Utility method to validate coordinates
   */
  isValidCoordinates(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' && 
      lat >= -90 && lat <= 90 && 
      lng >= -180 && lng <= 180
    );
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(lat, lng, precision = 6) {
    if (!this.isValidCoordinates(lat, lng)) {
      return 'Invalid coordinates';
    }
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
  }
  /**
   * Fit map bounds to show all markers
   * @param {google.maps.Map} map - Google Maps instance
   * @param {Array} markers - Array of markers
   */
  fitBoundsToMarkers(map, markers) {
    if (!map || !markers || markers.length === 0) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    
    markers.forEach(marker => {
      if (marker.getPosition) {
        // Legacy Marker
        bounds.extend(marker.getPosition());
      } else if (marker.position) {
        // AdvancedMarkerElement
        bounds.extend(marker.position);
      }
    });

    // Fit the map to show all markers
    map.fitBounds(bounds);
    
    // Optional: Add some padding
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    map.fitBounds(bounds, padding);
  }

  /**
   * Open directions to a destination in the user's preferred map app
   * @param {Object} destination - { lat, lng } or address string
   * @param {Object} origin - { lat, lng } or address string (optional, defaults to user location)
   * @param {string} travelMode - 'driving', 'walking', 'transit', 'bicycling' (optional, defaults to 'driving')
   */
  openDirections(destination, origin = null, travelMode = 'driving') {
    if (!destination) {
      throw new Error('Destination is required');
    }

    try {
      // Format destination for URL
      let destStr = '';
      if (typeof destination === 'string') {
        destStr = encodeURIComponent(destination);
      } else if (destination.lat && destination.lng) {
        destStr = `${destination.lat},${destination.lng}`;
      } else {
        throw new Error('Invalid destination format');
      }

      // Format origin for URL if provided
      let originStr = '';
      if (origin) {
        if (typeof origin === 'string') {
          originStr = encodeURIComponent(origin);
        } else if (origin.lat && origin.lng) {
          originStr = `${origin.lat},${origin.lng}`;
        }
      }

      // Detect platform and open appropriate map app
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      // iOS devices
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        let url = `maps://`;
        if (originStr) {
          url += `?saddr=${originStr}&daddr=${destStr}`;
        } else {
          url += `?daddr=${destStr}`;
        }
        
        // Add travel mode for Apple Maps
        if (travelMode === 'walking') {
          url += `&dirflg=w`;
        } else if (travelMode === 'transit') {
          url += `&dirflg=r`;
        } else {
          url += `&dirflg=d`; // driving
        }
        
        // Try to open Apple Maps, fallback to Google Maps web
        const appleMapsLink = document.createElement('a');
        appleMapsLink.href = url;
        appleMapsLink.click();
        
        // Fallback after a delay if Apple Maps doesn't open
        setTimeout(() => {
          this.openGoogleMapsWeb(destStr, originStr, travelMode);
        }, 1000);
        
        return;
      }
      
      // Android devices
      if (/android/i.test(userAgent)) {
        let url = `geo:0,0?q=${destStr}`;
        if (originStr) {
          url = `https://www.google.com/maps/dir/${originStr}/${destStr}`;
        } else {
          url = `https://www.google.com/maps/dir/?api=1&destination=${destStr}`;
        }
        
        // Add travel mode
        if (travelMode === 'walking') {
          url += `&travelmode=walking`;
        } else if (travelMode === 'transit') {
          url += `&travelmode=transit`;
        } else if (travelMode === 'bicycling') {
          url += `&travelmode=bicycling`;
        } else {
          url += `&travelmode=driving`;
        }
        
        window.open(url, '_blank');
        return;
      }
      
      // Desktop and other devices - open Google Maps web
      this.openGoogleMapsWeb(destStr, originStr, travelMode);
      
    } catch (error) {
      console.error('Error opening directions:', error);
      // Fallback to Google Maps web
      this.openGoogleMapsWeb(destination, origin, travelMode);
    }
  }

  /**
   * Open Google Maps web interface for directions
   * @param {string} destination - Destination string
   * @param {string} origin - Origin string (optional)
   * @param {string} travelMode - Travel mode
   * @private
   */
  openGoogleMapsWeb(destination, origin = null, travelMode = 'driving') {
    let url = 'https://www.google.com/maps/dir/';
    
    if (origin) {
      url += `${origin}/${destination}`;
    } else {
      url += `?api=1&destination=${destination}`;
    }
    
    // Add travel mode
    if (travelMode === 'walking') {
      url += url.includes('?') ? '&travelmode=walking' : '?travelmode=walking';
    } else if (travelMode === 'transit') {
      url += url.includes('?') ? '&travelmode=transit' : '?travelmode=transit';
    } else if (travelMode === 'bicycling') {
      url += url.includes('?') ? '&travelmode=bicycling' : '?travelmode=bicycling';
    } else {
      url += url.includes('?') ? '&travelmode=driving' : '?travelmode=driving';
    }
    
    window.open(url, '_blank');
  }
}

// Export singleton instance
const googleMapsService = new GoogleMapsService();
export default googleMapsService;
