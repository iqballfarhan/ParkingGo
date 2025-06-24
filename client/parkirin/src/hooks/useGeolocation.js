// src/hooks/useGeolocation.js
import { useState, useEffect } from 'react';

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported'));
      setLoading(false);
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setLocation({
        latitude,
        longitude,
        accuracy,
        timestamp: position.timestamp
      });
      setError(null);
      setLoading(false);
    };

    const handleError = (error) => {
      console.error('Geolocation error:', error);
      setError(error);
      setLoading(false);
      
      // Set default location if geolocation fails
      setLocation({
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: null,
        timestamp: Date.now()
      });
    };

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Increase timeout
      maximumAge: 60000,
      ...options
    };

    // Only get initial position, don't watch
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );
  }, []);

  // Function to refresh location
  const refresh = () => {
    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp
        });
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Force fresh location
        ...options
      }
    );
  };

  return {
    location,
    error,
    loading,
    refresh,
    isAvailable: !!navigator.geolocation
  };
};

export default useGeolocation;
