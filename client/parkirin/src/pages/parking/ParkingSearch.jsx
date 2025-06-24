import { useState, useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import GoogleMapsService from "../../services/googleMapsService";
import { GET_NEARBY_PARKINGS } from "../../graphql/queries";
import { useNavigate } from 'react-router-dom';

const ParkingSearch = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: -6.2088, // Default to Jakarta's coordinates
    longitude: 106.8456,
    zoom: 13,
  });

  const [searchParams, setSearchParams] = useState({
    radius: 2000, // 2km radius
    vehicleType: "all",
    minPrice: 0,
    maxPrice: 100000,
  });
  const [userLocation, setUserLocation] = useState(null);

  const navigate = useNavigate();

  // GraphQL query
  const { loading, error, data } = useQuery(GET_NEARBY_PARKINGS, {
    variables: {
      longitude: viewport.longitude,
      latitude: viewport.latitude,
      maxDistance: searchParams.radius,
      vehicleType:
        searchParams.vehicleType === "all" ? null : searchParams.vehicleType,
    },
    skip: !userLocation,
  });

  // Initialize Google Maps with better error handling
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current || map.current) return;

      try {
        setMapError(null);
        console.log("Initializing Google Maps...");

        // Create map instance
        map.current = await GoogleMapsService.createMap(mapContainer.current, {
          center: { lat: viewport.latitude, lng: viewport.longitude },
          zoom: viewport.zoom,
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text",
              stylers: [{ visibility: "off" }],
            },
          ],
          gestureHandling: "auto",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        console.log("Map created successfully");
        setMapLoaded(true);
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
        setMapError(error.message);
      }
    };

    // Add delay to ensure component is mounted
    const timeoutId = setTimeout(initMap, 100);

    return () => clearTimeout(timeoutId);
  }, []); // Remove dependencies to prevent re-initialization

  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("User location obtained:", { latitude, longitude });

        setUserLocation({ latitude, longitude });
        setViewport((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        // Update map center if map is loaded
        if (map.current) {
          map.current.setCenter({ lat: latitude, lng: longitude });
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        // Continue with default location
      },
      options
    );
  }, []);

  // Clear existing markers helper
  const clearMarkers = () => {
    markers.current.forEach((marker) => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markers.current = [];
  };

  // Add markers for parking spots and user location
  useEffect(() => {
    const addMarkers = async () => {
      if (
        !map.current ||
        !mapLoaded ||
        !GoogleMapsService.isGoogleMapsLoaded()
      ) {
        return;
      }

      try {
        // Clear existing markers
        clearMarkers();

        // Add user location marker
        if (userLocation) {
          try {
            if (typeof window.google.maps.importLibrary === "function") {
              const { AdvancedMarkerElement } =
                await window.google.maps.importLibrary("marker");
              const userMarker = new AdvancedMarkerElement({
                position: {
                  lat: userLocation.latitude,
                  lng: userLocation.longitude,
                },
                map: map.current,
                title: "Your Location",
              });
              markers.current.push(userMarker);
            } else {
              // Fallback ke Marker biasa
              const userMarker = new window.google.maps.Marker({
                position: {
                  lat: userLocation.latitude,
                  lng: userLocation.longitude,
                },
                map: map.current,
                title: "Your Location",
              });
              markers.current.push(userMarker);
            }
            console.log("User location marker added");
          } catch (error) {
            console.error("Error creating user location marker:", error);
          }
        }

        // Add parking spot markers
        if (data?.getNearbyParkings) {
          try {
            const parkingMarkers = await GoogleMapsService.createParkingMarkers(
              map.current,
              data.getNearbyParkings,
              (parkingData) => {
                console.log("Parking marker clicked:", parkingData);
                // Handle parking selection
              }
            );

            markers.current.push(...parkingMarkers);
            console.log(`Added ${parkingMarkers.length} parking markers`);

            // Fit map to show all markers
            if (parkingMarkers.length > 0) {
              GoogleMapsService.fitBoundsToMarkers(
                map.current,
                markers.current
              );
            }
          } catch (error) {
            console.error("Error creating parking markers:", error);
          }
        }
      } catch (error) {
        console.error("Error in addMarkers:", error);
      }
    };

    addMarkers();
  }, [mapLoaded, data, userLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, []);

  if (mapError) {
    return (
      <div className="h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to Load Map
          </h3>
          <p className="text-gray-600 mb-4">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <div>Error loading parking spots: {error.message}</div>;

  return (
    <div className="h-[calc(100vh-64px)] bg-[#f9fafb]">
      <div className="grid grid-cols-1 md:grid-cols-3 h-full">
        {/* Filters */}
        <div className="p-6 bg-white border-r border-gray-100 rounded-xl shadow-lg m-4 md:m-6 md:mr-0">
          <h2 className="text-xl font-bold text-[#f16634] mb-6">
            Search Filters
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius (km)
              </label>
              <input
                type="range"
                min="0.5"
                max="10000"
                step="2"
                value={searchParams.radius / 1000}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    radius: e.target.value * 1000,
                  }))
                }
                className="w-full accent-[#f16634]"
              />
              <span className="text-sm text-[#f16634] font-bold">
                {searchParams.radius / 1000} km
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type
              </label>
              <select
                value={searchParams.vehicleType}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    vehicleType: e.target.value,
                  }))
                }
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f16634] focus:border-[#f16634] sm:text-sm rounded-md"
              >
                <option value="all">All</option>
                <option value="car">Car</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range (Rp)
              </label>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={searchParams.minPrice}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      minPrice: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="Min"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f16634] focus:border-[#f16634] sm:text-sm"
                />
                <input
                  type="number"
                  value={searchParams.maxPrice}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      maxPrice: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="Max"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f16634] focus:border-[#f16634] sm:text-sm"
                />
              </div>
            </div>
          </div>
          {/* Results List */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-[#f16634] mb-4">
              Available Parking Spots
            </h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#f16634]/40 scrollbar-track-gray-100 rounded-lg">
              {data?.getNearbyParkings?.map((spot) => (
                <div
                  key={spot._id}
                  className="bg-white p-4 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-shadow flex flex-col gap-2 cursor-pointer"
                  onClick={() => navigate(`/parking/${spot._id}`)}
                >
                  <h4 className="font-bold text-[#f16634] text-lg mb-1">
                    {spot.name}
                  </h4>
                  <p className="text-sm text-gray-500 mb-1">{spot.address}</p>
                  <div className="flex flex-wrap gap-2 items-center text-sm">
                    <span className="bg-[#f16634]/10 text-[#f16634] px-2 py-1 rounded-full font-bold">
                      Car: Rp {spot.rates?.car || 0}/hour
                    </span>
                    <span className="bg-[#f16634]/10 text-[#f16634] px-2 py-1 rounded-full font-bold">
                      Motorcycle: Rp {spot.rates?.motorcycle || 0}/hour
                    </span>
                    <span className="text-gray-500">
                      Cars: {spot.available?.car || 0} | Motorcycles:{" "}
                      {spot.available?.motorcycle || 0} available
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center text-sm">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                      {spot.status || "Open"}
                    </span>
                    <span className="flex items-center gap-1 text-yellow-600 font-bold">
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 15.585l6.146 3.233-.927-7.037L20 6.798l-6.884-.645L10 0 6.884 6.153 0 6.798l4.781 4.983-.927 7.037L10 15.585z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {spot.rating || "N/A"} ({spot.review_count || 0} reviews)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>{" "}
        {/* Map */}
        <div className="md:col-span-2 p-4 md:p-6">
          <div className="bg-white rounded-xl shadow-lg h-full">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Parking Locations
              </h2>
            </div>
            <div className="relative h-[calc(100%-80px)]">
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
              <div
                ref={mapContainer}
                className="w-full h-full rounded-lg"
                style={{ minHeight: "400px" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingSearch;
