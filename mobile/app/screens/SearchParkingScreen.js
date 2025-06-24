import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as Device from "expo-device";
import { gql, useQuery } from "@apollo/client";
import { LinearGradient } from "expo-linear-gradient";
import MapViewDirections from "react-native-maps-directions";
import Slider from "@react-native-community/slider";

const GET_NEARBY_PARKINGS = gql`
  query GetNearbyParkings(
    $longitude: Float!
    $latitude: Float!
    $maxDistance: Float
  ) {
    getNearbyParkings(
      longitude: $longitude
      latitude: $latitude
      maxDistance: $maxDistance
    ) {
      _id
      name
      address
      location {
        type
        coordinates
      }
      owner_id
      owner {
        email
        name
        role
        saldo
      }
      capacity {
        car
        motorcycle
      }
      available {
        car
        motorcycle
      }
      rates {
        car
        motorcycle
      }
      operational_hours {
        open
        close
      }
      facilities
      images
      status
      rating
      review_count
    }
  }
`;

const { width, height } = Dimensions.get("window");

export default function SearchParkingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { initialLocation } = route.params || {};

  const [location, setLocation] = useState(initialLocation);
  const [locationAddress, setLocationAddress] = useState(null);
  const [locationLoading, setLocationLoading] = useState(!initialLocation);
  const [locationError, setLocationError] = useState(null);
  const [selectedParking, setSelectedParking] = useState(null);
  const [showListView, setShowListView] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10); // Default 10km

  // Get nearby parkings with dynamic max distance
  const {
    data: nearbyData,
    loading: nearbyLoading,
    error: nearbyError,
    refetch: refetchNearby,
  } = useQuery(GET_NEARBY_PARKINGS, {
    variables: {
      longitude: location?.longitude || 0,
      latitude: location?.latitude || 0,
      maxDistance: maxDistance * 1000, // Convert km to meters for backend
    },
    skip: !location,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  // Enhanced location detection with reverse geocoding (from HomeScreen.js)
  useEffect(() => {
    if (!location) {
      getCurrentLocation();
    } else if (location && !locationAddress) {
      // If we have location but no address, get the address
      getAddressFromCoordinates(location.latitude, location.longitude);
    }
  }, []);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    // Check for Android emulator
    if (Platform.OS === "android" && !Device.isDevice) {
      setLocationError(
        "Location services not available in Android Emulator. Please use a physical device."
      );
      setLocationLoading(false);
      return;
    }

    try {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Permission to access location was denied");
        setLocationLoading(false);
        return;
      }

      console.log("Getting current location...");

      // Get current position with enhanced options
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
        maximumAge: 10000,
      });

      console.log("Current location received:", currentLocation);

      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(locationData);

      // Get address from coordinates
      await getAddressFromCoordinates(
        locationData.latitude,
        locationData.longitude
      );

      setLocationError(null);
    } catch (error) {
      console.error("Location error:", error);
      setLocationError(
        "Failed to get your location. Please enable location services."
      );

      // Try fallback to last known location
      try {
        console.log("Trying last known location...");
        let lastKnownLocation = await Location.getLastKnownPositionAsync({
          maxAge: 60000, // 1 minute
          requiredAccuracy: 100,
        });

        if (lastKnownLocation) {
          console.log("Using last known location:", lastKnownLocation);
          const fallbackLocation = {
            latitude: lastKnownLocation.coords.latitude,
            longitude: lastKnownLocation.coords.longitude,
          };
          setLocation(fallbackLocation);
          setLocationAddress("Last known location");
          setLocationError("Using last known location");
        }
      } catch (fallbackError) {
        console.error("Fallback location error:", fallbackError);
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse && addressResponse.length > 0) {
        const address = addressResponse[0];
        const cityName = address.city || address.subregion || address.region;
        const district = address.district || address.street;

        // Create readable address
        let readableAddress = "";
        if (district && cityName) {
          readableAddress = `${district}, ${cityName}`;
        } else if (cityName) {
          readableAddress = cityName;
        } else {
          readableAddress = `${address.region || "Unknown location"}`;
        }

        setLocationAddress(readableAddress);
        console.log("Address found:", readableAddress);
      } else {
        setLocationAddress("Location found");
      }
    } catch (addressError) {
      console.error("Reverse geocoding error:", addressError);
      setLocationAddress("Location found");
    }
  };

  const retryLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    setLocationAddress(null);

    try {
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });

      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(locationData);

      // Get address for retry
      await getAddressFromCoordinates(
        locationData.latitude,
        locationData.longitude
      );

      console.log("Location retry successful:", currentLocation);
    } catch (error) {
      console.error("Location retry failed:", error);
      setLocationError("Failed to get location. Please check your settings.");
    } finally {
      setLocationLoading(false);
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // Function to check if parking is currently open
  const isParkingOpen = (operationalHours) => {
    if (!operationalHours?.open || !operationalHours?.close) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHour, openMinute] = operationalHours.open.split(":").map(Number);
    const openTime = openHour * 60 + openMinute;

    const [closeHour, closeMinute] = operationalHours.close
      .split(":")
      .map(Number);
    const closeTime = closeHour * 60 + closeMinute;

    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    } else {
      return currentTime >= openTime && currentTime <= closeTime;
    }
  };

  // Process parking data with distance and open/close status + apply distance filter
  const nearbyParkings = (nearbyData?.getNearbyParkings || [])
    .map((parking) => {
      let calculatedDistance = 0;
      if (location && parking.location?.coordinates) {
        calculatedDistance = calculateDistance(
          location.latitude,
          location.longitude,
          parking.location.coordinates[1],
          parking.location.coordinates[0]
        );
      }

      const isOpen = isParkingOpen(parking.operational_hours);

      return {
        ...parking,
        distanceFromUser: calculatedDistance,
        isOpen,
      };
    })
    .filter((parking) => parking.distanceFromUser <= maxDistance)
    .sort((a, b) => a.distanceFromUser - b.distanceFromUser);

  // Auto-select first parking when data loads
  useEffect(() => {
    if (nearbyParkings.length > 0 && !selectedParking) {
      setSelectedParking(nearbyParkings[0]);
    }
  }, [nearbyParkings]);

  // Format distance for filter display
  const formatFilterDistance = (distanceKm) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    if (distanceKm >= 1000) {
      return `${Math.round(distanceKm)}km`;
    }
    return `${distanceKm.toFixed(1)}km`;
  };

  // Filter Modal Component
  const FilterModal = () => (
    <View style={styles.filterModal}>
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filter by Distance</Text>
          <TouchableOpacity
            onPress={() => setShowFilterModal(false)}
            style={styles.filterCloseButton}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContent}>
          {/* Current Location Display */}
          {location && (
            <View style={styles.currentLocationContainer}>
              <Ionicons name="location" size={16} color="#10B981" />
              <Text style={styles.currentLocationText}>
                📍 {locationAddress || "Current location"}
              </Text>
            </View>
          )}

          <Text style={styles.filterLabel}>
            Maximum Distance: {formatFilterDistance(maxDistance)}
          </Text>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>10m</Text>
            <View style={styles.sliderWrapper}>
              <Slider
                style={styles.slider}
                minimumValue={0.01}
                maximumValue={1000}
                value={maxDistance}
                onValueChange={setMaxDistance}
                minimumTrackTintColor="#FE7A3A"
                maximumTrackTintColor="#E5E7EB"
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
                step={0.1}
              />
            </View>
            <Text style={styles.sliderLabel}>1000km</Text>
          </View>

          {/* Preset Buttons */}
          <View style={styles.presetButtons}>
            {[0.5, 1, 5, 10].map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.presetButton,
                  Math.abs(maxDistance - distance) < 0.1 &&
                    styles.activePresetButton,
                ]}
                onPress={() => setMaxDistance(distance)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    Math.abs(maxDistance - distance) < 0.1 &&
                      styles.activePresetButtonText,
                  ]}
                >
                  {distance < 1 ? `${distance * 1000}m` : `${distance}km`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.presetButtons}>
            {[20, 50, 100, 1000].map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.presetButton,
                  Math.abs(maxDistance - distance) < 0.1 &&
                    styles.activePresetButton,
                ]}
                onPress={() => setMaxDistance(distance)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    Math.abs(maxDistance - distance) < 0.1 &&
                      styles.activePresetButtonText,
                  ]}
                >
                  {distance}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterActions}>
          <TouchableOpacity
            style={styles.filterResetButton}
            onPress={() => setMaxDistance(1000)}
          >
            <Text style={styles.filterResetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterApplyButton}
            onPress={() => handleFilterApply(maxDistance)}
          >
            <Text style={styles.filterApplyText}>Apply Filter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render parking box for horizontal scroll
  const renderParkingBox = ({ item }) => {
    const isSelected = selectedParking?._id === item._id;

    return (
      <TouchableOpacity
        style={[styles.parkingBox, isSelected && styles.selectedParkingBox]}
        onPress={() => handleSelectParking(item)}
      >
        <View style={styles.boxHeader}>
          <Text style={styles.boxParkingName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              item.isOpen ? styles.openBadge : styles.closedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {item.isOpen ? "OPEN" : "CLOSED"}
            </Text>
          </View>
        </View>

        <Text style={styles.boxOwnerName} numberOfLines={1}>
          Owner: {item.owner?.name || "Unknown"}
        </Text>

        <View style={styles.boxDetails}>
          <View style={styles.boxDetailItem}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.boxDetailText}>
              {formatDistance(item.distanceFromUser)}
            </Text>
          </View>

          <View style={styles.boxSlotsContainer}>
            <View style={styles.boxSlotItem}>
              <Ionicons name="car" size={14} color="#3B82F6" />
              <Text style={styles.boxSlotText}>
                {item.available?.car || 0}/{item.capacity?.car || 0}
              </Text>
            </View>
            <View style={styles.boxSlotItem}>
              <Ionicons name="bicycle" size={14} color="#10B981" />
              <Text style={styles.boxSlotText}>
                {item.available?.motorcycle || 0}/
                {item.capacity?.motorcycle || 0}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => handleParkingDetail(item)}
        >
          <Text style={styles.detailButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color="#FE7A3A" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render list item for list view
  const renderListItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleParkingDetail(item)}
    >
      <View style={styles.listImageContainer}>
        <Image
          source={{
            uri:
              item.images?.[0] ||
              "https://via.placeholder.com/100x80?text=Parking",
          }}
          style={styles.listItemImage}
        />
        <View
          style={[
            styles.listStatusBadge,
            item.isOpen ? styles.openBadge : styles.closedBadge,
          ]}
        >
          <Text style={styles.statusText}>
            {item.isOpen ? "OPEN" : "CLOSED"}
          </Text>
        </View>
      </View>

      <View style={styles.listInfo}>
        <Text style={styles.listParkingName}>{item.name}</Text>
        <Text style={styles.listOwnerName}>
          Owner: {item.owner?.name || "Unknown"}
        </Text>

        <View style={styles.listDetails}>
          <View style={styles.listDetailItem}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.listDetailText}>
              {formatDistance(item.distanceFromUser)}
            </Text>
          </View>
        </View>

        <View style={styles.listSlotsContainer}>
          <View style={styles.listSlotItem}>
            <Ionicons name="car" size={14} color="#3B82F6" />
            <Text style={styles.listSlotText}>
              Cars: {item.available?.car || 0}/{item.capacity?.car || 0}
            </Text>
          </View>
          <View style={styles.listSlotItem}>
            <Ionicons name="bicycle" size={14} color="#10B981" />
            <Text style={styles.listSlotText}>
              Bikes: {item.available?.motorcycle || 0}/
              {item.capacity?.motorcycle || 0}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.listDetailButton}
        onPress={() => handleSelectParking(item)}
      >
        <Ionicons name="navigate" size={16} color="#FE7A3A" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const handleSelectParking = (parking) => {
    setSelectedParking(parking);
    setShowDirections(true);
  };

  const handleParkingDetail = (parking) => {
    navigation.navigate("UserParkingDetailScreen", {
      parkingId: parking._id,
      userLocation: location,
    });
  };

  const toggleListView = () => {
    setShowListView(!showListView);
  };

  const handleFilterApply = (distance) => {
    setMaxDistance(distance);
    setShowFilterModal(false);

    // Reset selected parking if it's outside new filter range
    if (selectedParking && selectedParking.distanceFromUser > distance) {
      setSelectedParking(null);
      setShowDirections(false);
    }

    // Refetch with new maxDistance parameter
    if (refetchNearby && location) {
      refetchNearby({
        longitude: location.longitude,
        latitude: location.latitude,
        maxDistance: distance * 1000,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with location info */}
      <LinearGradient
        colors={["#FE7A3A", "#FF9A62"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Find Parking</Text>
            
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options" size={20} color="#FFFFFF" />
              <Text style={styles.filterButtonText}>
                {formatFilterDistance(maxDistance)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.listToggleButton}
              onPress={toggleListView}
            >
              <Ionicons
                name={showListView ? "map" : "list"}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Location Loading/Error States */}
      {locationLoading && (
        <View style={styles.locationStatusContainer}>
          <ActivityIndicator size="small" color="#FE7A3A" />
          <Text style={styles.locationStatusText}>
            Getting your location...
          </Text>
        </View>
      )}

      {locationError && !location && (
        <View style={styles.locationErrorContainer}>
          <Ionicons name="location-outline" size={20} color="#EF4444" />
          <Text style={styles.locationErrorText}>{locationError}</Text>
          <TouchableOpacity
            style={styles.retryLocationButton}
            onPress={retryLocation}
          >
            <Text style={styles.retryLocationText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {showListView ? (
        // List View
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {nearbyLoading
                ? "Searching..."
                : `${nearbyParkings.length} Parking Spots Found`}
            </Text>
            {location && locationAddress && (
              <Text style={styles.listSubtitle}>Near {locationAddress}</Text>
            )}
          </View>

          {!location ? (
            <View style={styles.noLocationContainer}>
              <Ionicons name="location-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noLocationText}>Location Required</Text>
              <Text style={styles.noLocationSubtext}>
                Please enable location services to find nearby parking
              </Text>
              <TouchableOpacity
                style={styles.enableLocationButton}
                onPress={retryLocation}
              >
                <Text style={styles.enableLocationText}>Enable Location</Text>
              </TouchableOpacity>
            </View>
          ) : nearbyLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FE7A3A" />
              <Text style={styles.loadingText}>Finding nearby parking...</Text>
            </View>
          ) : nearbyError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
              <Text style={styles.errorText}>Failed to load parking spots</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={refetchNearby}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={nearbyParkings}
              keyExtractor={(item) => item._id}
              renderItem={renderListItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        // Map View
        <View style={styles.mapContainer}>
          {!location ? (
            <View style={styles.noLocationMapContainer}>
              <Ionicons name="location-outline" size={60} color="#D1D5DB" />
              <Text style={styles.noLocationMapText}>Location Required</Text>
              <Text style={styles.noLocationMapSubtext}>
                Please enable location services to view the map
              </Text>
              <TouchableOpacity
                style={styles.enableLocationButton}
                onPress={retryLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.enableLocationText}>Enable Location</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={{
                latitude: selectedParking
                  ? selectedParking.location.coordinates[1]
                  : location.latitude,
                longitude: selectedParking
                  ? selectedParking.location.coordinates[0]
                  : location.longitude,
                latitudeDelta:
                  maxDistance > 100 ? 5.0 : showDirections ? 0.025 : 0.015,
                longitudeDelta:
                  maxDistance > 100 ? 5.0 : showDirections ? 0.025 : 0.015,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {/* User location marker */}
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="Your location"
                description={locationAddress || "Current location"}
              >
                <View style={styles.userMarker}>
                  <View style={styles.userDot} />
                  <View style={styles.userRing} />
                </View>
              </Marker>

              {/* Parking markers */}
              {nearbyParkings.map((parking) => (
                <Marker
                  key={parking._id}
                  coordinate={{
                    latitude: parking.location.coordinates[1],
                    longitude: parking.location.coordinates[0],
                  }}
                  title={parking.name}
                  description={`${
                    parking.isOpen ? "Open" : "Closed"
                  } • ${formatDistance(parking.distanceFromUser)} • Owner: ${
                    parking.owner?.name || "Unknown"
                  }`}
                >
                  <View
                    style={[
                      styles.parkingMarker,
                      selectedParking?._id === parking._id &&
                        styles.selectedMarker,
                    ]}
                  >
                    <View
                      style={[
                        styles.markerBackground,
                        {
                          backgroundColor: parking.isOpen
                            ? "#10B981"
                            : "#EF4444",
                        },
                      ]}
                    >
                      <Ionicons name="car" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </Marker>
              ))}

              {/* Directions */}
              {showDirections && selectedParking && (
                <MapViewDirections
                  origin={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  destination={{
                    latitude: selectedParking.location.coordinates[1],
                    longitude: selectedParking.location.coordinates[0],
                  }}
                  apikey="AIzaSyBFw0Qbyq9zTFTd-tUY6disiuIcSK_M-24"
                  strokeWidth={4}
                  strokeColor="#FE7A3A"
                  optimizeWaypoints={true}
                />
              )}
            </MapView>
          )}

          {/* Bottom Parking Boxes */}
          <View style={styles.bottomContainer}>
            {!location ? (
              <View style={styles.noLocationBottomContainer}>
                <Text style={styles.noLocationBottomText}>
                  Enable location to find parking spots
                </Text>
              </View>
            ) : nearbyLoading ? (
              <View style={styles.boxLoadingContainer}>
                <ActivityIndicator size="large" color="#FE7A3A" />
                <Text style={styles.loadingText}>Finding parking spots...</Text>
              </View>
            ) : nearbyParkings.length > 0 ? (
              <>
                <FlatList
                  data={nearbyParkings}
                  keyExtractor={(item) => item._id}
                  renderItem={renderParkingBox}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.boxesContainer}
                  snapToInterval={width * 0.85 + 15}
                  decelerationRate="fast"
                  snapToAlignment="start"
                />
                <View style={styles.rangeIndicator}>
                  <Text style={styles.rangeText}>
                    Showing parking within {formatFilterDistance(maxDistance)}
                  </Text>
                  <Text style={styles.rangeSubtext}>
                    {nearbyParkings.length} spot
                    {nearbyParkings.length !== 1 ? "s" : ""} found near{" "}
                    {locationAddress || "your location"}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyBoxContainer}>
                <Text style={styles.emptyBoxText}>
                  No parking spots found within{" "}
                  {formatFilterDistance(maxDistance)}
                </Text>
                <Text style={styles.emptyBoxSubtext}>
                  Try increasing the distance range
                </Text>
              </View>
            )}
          </View>

          {/* Distance Info Popup */}
          {showDirections && selectedParking && (
            <View style={styles.distancePopup}>
              <View style={styles.distanceInfo}>
                <Text style={styles.distanceText}>
                  {formatDistance(selectedParking.distanceFromUser)}
                </Text>
                <Text style={styles.distanceLabel}>away</Text>
              </View>
              <TouchableOpacity
                style={styles.closeDirections}
                onPress={() => setShowDirections(false)}
              >
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Filter Modal */}
      {showFilterModal && <FilterModal />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginRight: 10,
  },
  filterButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  listToggleButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
  },
  userMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1E3A8A",
    borderWidth: 2,
    borderColor: "white",
  },
  userRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30, 58, 138, 0.15)",
    position: "absolute",
  },
  parkingMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  selectedMarker: {
    transform: [{ scale: 1.3 }],
    zIndex: 999,
  },

  // List container styles
  listContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listHeader: {
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  listSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  listContent: {
    padding: 15,
  },

  // List item styles
  listItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    overflow: "hidden",
  },
  listImageContainer: {
    width: 100,
    height: 120,
    position: "relative",
  },
  listItemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  listStatusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  listInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  listParkingName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  listOwnerName: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  listDetails: {
    marginBottom: 8,
  },
  listDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  listDetailText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  listSlotsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listSlotItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  listSlotText: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 4,
  },
  listDetailButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    backgroundColor: "#FFF5F0",
  },

  // Bottom container for parking boxes
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingTop: 15,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  boxesContainer: {
    paddingHorizontal: 15,
  },
  boxLoadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyBoxContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyBoxText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyBoxSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 5,
  },

  // Parking box styles
  parkingBox: {
    width: width * 0.85,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedParkingBox: {
    borderColor: "#FE7A3A",
    borderWidth: 3,
    shadowColor: "#FE7A3A",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    transform: [{ scale: 1.02 }],
  },
  boxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  boxParkingName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    flex: 1,
    marginRight: 10,
  },
  boxOwnerName: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  boxDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  boxDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  boxDetailText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
    fontWeight: "600",
  },
  boxSlotsContainer: {
    flexDirection: "row",
  },
  boxSlotItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
  },
  boxSlotText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
    fontWeight: "600",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5F0",
    paddingVertical: 10,
    borderRadius: 12,
  },
  detailButtonText: {
    color: "#FE7A3A",
    fontWeight: "600",
    marginRight: 5,
  },

  // Status badges
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openBadge: {
    backgroundColor: "#10B981",
  },
  closedBadge: {
    backgroundColor: "#EF4444",
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },

  // Filter Modal styles
  filterModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  filterContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    margin: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  filterCloseButton: {
    padding: 5,
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
  },
  filterContent: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 20,
    textAlign: "center",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  slider: {
    width: "100%",
    height: 50,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    minWidth: 35,
    textAlign: "center",
  },
  sliderThumb: {
    backgroundColor: "#FE7A3A",
    width: 28,
    height: 28,
    borderRadius: 14,
    shadowColor: "#FE7A3A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
  },
  presetButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 5,
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "transparent",
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  activePresetButton: {
    backgroundColor: "#FFF5F0",
    borderColor: "#FE7A3A",
  },
  presetButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  activePresetButtonText: {
    color: "#FE7A3A",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  filterResetButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
  },
  filterResetText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterApplyButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#FE7A3A",
    borderRadius: 12,
    alignItems: "center",
  },
  filterApplyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  // Distance popup styles
  distancePopup: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  distanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginLeft: 8,
  },
  distanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  closeDirections: {
    padding: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },

  // Error container styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#FE7A3A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },

  // Range indicator styles
  rangeIndicator: {
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 10,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  rangeSubtext: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  locationStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#FFF5F0",
    borderBottomWidth: 1,
    borderBottomColor: "#FED7AA",
  },
  locationStatusText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#EA580C",
    fontWeight: "500",
  },
  locationErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FEF2F2",
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  locationErrorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: "#DC2626",
  },
  retryLocationButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryLocationText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  currentLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    marginBottom: 15,
  },
  currentLocationText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noLocationText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
  },
  noLocationSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
  },
  enableLocationButton: {
    backgroundColor: "#FE7A3A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enableLocationText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  noLocationMapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 40,
  },
  noLocationMapText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
  },
  noLocationMapSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
  },
  noLocationBottomContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noLocationBottomText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
