class GoogleMapsService {
  constructor() {
    this.isLoaded = false;
    this.placesService = null;
    this.directionsService = null;
    this.geocoder = null;
    this.config = {
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      libraries: ['places', 'geometry'],
      language: 'id',
      region: 'ID',
    };
  }

  // Initialize Google Maps API
  async initialize() {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        this.initializeServices();
        this.isLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      const libraries = this.config.libraries.join(',');
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.apiKey}&libraries=${libraries}&language=${this.config.language}&region=${this.config.region}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.initializeServices();
        this.isLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  initializeServices() {
    // Create a dummy map element for services that require it
    const dummyElement = document.createElement('div');
    const dummyMap = new google.maps.Map(dummyElement, {
      center: { lat: -6.2088, lng: 106.8456 }, // Jakarta
      zoom: 10,
    });

    this.placesService = new google.maps.places.PlacesService(dummyMap);
    this.directionsService = new google.maps.DirectionsService();
    this.geocoder = new google.maps.Geocoder();
  }

  // Search places by text
  async searchPlaces(query, location) {
    await this.initialize();
    
    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      const request = {
        query,
        location: location ? new google.maps.LatLng(location.lat, location.lng) : undefined,
        radius: 50000, // 50km
      };

      this.placesService.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places = results.map(place => ({
            place_id: place.place_id,
            formatted_address: place.formatted_address,
            name: place.name,
            geometry: {
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
            },
            types: place.types,
          }));
          resolve(places);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  // Get place details
  async getPlaceDetails(placeId) {
    await this.initialize();
    
    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      const request = {
        placeId,
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'rating', 'photos'],
      };

      this.placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else if (status === google.maps.places.PlacesServiceStatus.NOT_FOUND) {
          resolve(null);
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  }

  // Calculate distance between two points
  calculateDistance(from, to) {
    const fromLatLng = new google.maps.LatLng(from.lat, from.lng);
    const toLatLng = new google.maps.LatLng(to.lat, to.lng);
    
    return google.maps.geometry.spherical.computeDistanceBetween(fromLatLng, toLatLng);
  }

  // Get directions between two points
  async getDirections(origin, destination, travelMode = google.maps.TravelMode.DRIVING) {
    await this.initialize();
    
    if (!this.directionsService) {
      throw new Error('Directions service not initialized');
    }

    return new Promise((resolve, reject) => {
      const request = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode,
      };

      this.directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          const leg = route.legs[0];
          
          resolve({
            routes: result.routes,
            distance: leg.distance,
            duration: leg.duration,
          });
        } else {
          reject(new Error(`Directions failed: ${status}`));
        }
      });
    });
  }

  // Geocode address
  async geocodeAddress(address) {
    await this.initialize();
    
    if (!this.geocoder) {
      throw new Error('Geocoder not initialized');
    }

    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
          resolve(null);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  // Reverse geocode coordinates
  async reverseGeocode(coordinates) {
    await this.initialize();
    
    if (!this.geocoder) {
      throw new Error('Geocoder not initialized');
    }

    return new Promise((resolve, reject) => {
      const latLng = new google.maps.LatLng(coordinates.lat, coordinates.lng);
      
      this.geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          resolve(results[0].formatted_address);
        } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
          resolve(null);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} menit`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} jam ${remainingMinutes} menit`;
  }

  isInIndonesia(coordinates) {
    const indonesiaBounds = {
      north: 6,
      south: -11,
      west: 95,
      east: 141,
    };

    return (
      coordinates.lat >= indonesiaBounds.south &&
      coordinates.lat <= indonesiaBounds.north &&
      coordinates.lng >= indonesiaBounds.west &&
      coordinates.lng <= indonesiaBounds.east
    );
  }

  // Get nearby places
  async getNearbyPlaces(location, radius = 1000, type) {
    await this.initialize();
    
    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      const request = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
        type,
      };

      this.placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places = results.map(place => ({
            place_id: place.place_id,
            formatted_address: place.vicinity,
            name: place.name,
            geometry: {
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
            },
            types: place.types,
          }));
          resolve(places);
        } else {
          reject(new Error(`Nearby places search failed: ${status}`));
        }
      });
    });
  }
}

export default new GoogleMapsService(); 