import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
  Button,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import * as Device from "expo-device";
import { gql, useQuery } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/authContext";
import { StatusBar } from "expo-status-bar";
import ParkingCard from "../components/ParkingCard";

const GET_USER_PROFILE = gql`
  query Me {
    me {
      email
      name
      role
      saldo
    }
  }
`;

const GET_NEARBY_PARKINGS = gql`
  query GetNearbyParkings($longitude: Float!, $latitude: Float!) {
    getNearbyParkings(longitude: $longitude, latitude: $latitude) {
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

export default function HomeScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { setIsSignIn } = useAuth();
  const [userData, setUserData] = useState(null);

  // Get user profile data
  const { loading, error, data, refetch } = useQuery(GET_USER_PROFILE);

  // Replace dummy data with real query
  const {
    data: nearbyData,
    loading: nearbyLoading,
    error: nearbyError,
    refetch: refetchNearby,
  } = useQuery(GET_NEARBY_PARKINGS, {
    variables: {
      longitude: location?.coords?.longitude || 0,
      latitude: location?.coords?.latitude || 0,
    },
    skip: !location, // Skip query sampai location ready
    errorPolicy: "all", // Show partial data even if there's an error
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Always fetch from network
  });

  // Enhanced real location detection with reverse geocoding
  useEffect(() => {
    async function getCurrentLocation() {
      setLocationLoading(true);

      // Check for Android emulator (from test.js)
      if (Platform.OS === "android" && !Device.isDevice) {
        setErrorMsg(
          "Location services not available in Android Emulator. Please use a physical device."
        );
        setLocationLoading(false);
        return;
      }

      try {
        // Request permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
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
        setLocation(currentLocation);

        // Get address from coordinates
        try {
          const addressResponse = await Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });

          if (addressResponse && addressResponse.length > 0) {
            const address = addressResponse[0];
            const cityName =
              address.city || address.subregion || address.region;
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

        setErrorMsg(null);
      } catch (error) {
        console.error("Location error:", error);
        setErrorMsg(
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
            setLocation(lastKnownLocation);
            setLocationAddress("Last known location");
            setErrorMsg("Using last known location");
          }
        } catch (fallbackError) {
          console.error("Fallback location error:", fallbackError);
        }
      } finally {
        setLocationLoading(false);
      }
    }

    getCurrentLocation();
  }, []);

  // Enhanced location status logging
  useEffect(() => {
    if (location) {
      console.log("📍 Location coordinates:", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toLocaleString(),
      });
    }
  }, [location]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const userDataName = await SecureStore.getItemAsync("user_data");
      if (userDataName) {
        const parsedData = JSON.parse(userDataName);
        setUserData(parsedData);
      }
    };
    fetchUserProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh location along with other data
      if (!location) {
        setLocationLoading(true);
        try {
          let currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000,
          });
          setLocation(currentLocation);

          // Get fresh address
          try {
            const addressResponse = await Location.reverseGeocodeAsync({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });

            if (addressResponse && addressResponse.length > 0) {
              const address = addressResponse[0];
              const cityName =
                address.city || address.subregion || address.region;
              const district = address.district || address.street;

              let readableAddress = "";
              if (district && cityName) {
                readableAddress = `${district}, ${cityName}`;
              } else if (cityName) {
                readableAddress = cityName;
              } else {
                readableAddress = `${address.region || "Unknown location"}`;
              }

              setLocationAddress(readableAddress);
            }
          } catch (addressError) {
            console.error("Refresh address error:", addressError);
            setLocationAddress("Location found");
          }

          setErrorMsg(null);
        } catch (error) {
          console.error("Refresh location error:", error);
        } finally {
          setLocationLoading(false);
        }
      }

      await Promise.all([refetch(), refetchNearby()]);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const retryLocation = async () => {
    setLocationLoading(true);
    setErrorMsg(null);
    setLocationAddress(null);

    try {
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });
      setLocation(currentLocation);

      // Get address for retry
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (addressResponse && addressResponse.length > 0) {
          const address = addressResponse[0];
          const cityName = address.city || address.subregion || address.region;
          const district = address.district || address.street;

          let readableAddress = "";
          if (district && cityName) {
            readableAddress = `${district}, ${cityName}`;
          } else if (cityName) {
            readableAddress = cityName;
          } else {
            readableAddress = `${address.region || "Unknown location"}`;
          }

          setLocationAddress(readableAddress);
        }
      } catch (addressError) {
        console.error("Retry address error:", addressError);
        setLocationAddress("Location found");
      }

      console.log("Location retry successful:", currentLocation);
    } catch (error) {
      console.error("Location retry failed:", error);
      setErrorMsg("Failed to get location. Please check your settings.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSearchParking = () => {
    navigation.navigate("SearchParking", {
      initialLocation: location
        ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }
        : null,
    });
  };

  const formatTimeRemaining = (entryTimeString) => {
    const entryTime = new Date(entryTimeString);
    const now = new Date();
    const diffMs = now - entryTime;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const handleMyBooking = () => {
    navigation.navigate("MyBookingsScreen");
  };

  const handleChat = () => {
    // Navigate to chat screen
    navigation.navigate("ChatScreen");
  };

  const handleTopUp = () => {
    // Navigate to topup screen
    navigation.navigate("TopUpScreen");
  };

  const handleBookings = () => {
    // Navigate to bookings screen
    navigation.navigate("BookingDetailScreen");
  };

  const handleViewAllBookings = () => {
    navigation.navigate("MyBookingsScreen");
  };

  const handleParkingDetail = (parkingId) => {
    navigation.navigate("UserParkingDetailScreen", {
      parkingId,
      userLocation: location
        ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }
        : null,
    });
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
    const distance = R * c;
    return distance;
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // Remove dummy data and use real data
  const nearbyParking = nearbyData?.getNearbyParkings || [];
  console.log("Final nearbyParking array:", nearbyParking);

  // Add distance calculation to nearby parking data
  const nearbyParkingWithDistance = nearbyParking.map((parking) => {
    let calculatedDistance = 0;
    if (location && parking.location?.coordinates) {
      calculatedDistance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        parking.location.coordinates[1], // latitude
        parking.location.coordinates[0] // longitude
      );
    }
    return {
      ...parking,
      calculatedDistance,
    };
  });

  // Debug nearby data
  useEffect(() => {
    if (nearbyData) {
      console.log("Nearby parking data received:", nearbyData);
      console.log(
        "Number of parkings found:",
        nearbyData.getNearbyParkings?.length || 0
      );
      nearbyData.getNearbyParkings?.forEach((parking, index) => {
        console.log(`Parking ${index + 1}:`, {
          id: parking._id,
          name: parking.name,
          address: parking.address,
          coordinates: parking.location?.coordinates,
        });
      });
    }
  }, [nearbyData]);

  useEffect(() => {
    if (nearbyError) {
      console.error("Nearby parking error:", nearbyError);
      console.error("GraphQL Error details:", nearbyError.graphQLErrors);
      console.error("Network Error details:", nearbyError.networkError);
    }
  }, [nearbyError]);

  useEffect(() => {
    if (location) {
      console.log("Location changed, will trigger query:", location.coords);
      console.log("Query variables will be:", {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
        maxDistance: 50000,
        limit: 10,
      });
    }
  }, [location]);

  // Debug loading state
  useEffect(() => {
    console.log("Nearby loading state:", nearbyLoading);
  }, [nearbyLoading]);

  // Display balance with hybrid approach
  const displayBalance = () => {
    // Show SecureStore data first (instant)
    if (userData && !data) {
      return `Rp ${userData.saldo.toLocaleString()}`;
    }

    // Update with real-time data when available
    if (data?.me?.saldo !== undefined) {
      return `Rp ${data.me.saldo.toLocaleString()}`;
    }

    // Fallback states
    if (loading) return "Loading...";
    if (error) return "Error";

    return "Rp 0";
  };

  // Update SecureStore when GraphQL data changes
  useEffect(() => {
    const updateUserData = async () => {
      if (data?.me && userData) {
        // Update userData state
        const updatedUserData = {
          ...userData,
          name: data.me.name,
          email: data.me.email,
          saldo: data.me.saldo,
          role: data.me.role,
        };
        setUserData(updatedUserData);

        // Update SecureStore for next app launch
        await SecureStore.setItemAsync(
          "user_data",
          JSON.stringify(updatedUserData)
        );
      }
    };

    updateUserData();
  }, [data]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={["#FF9A62", "#FE7A3A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                Hello, {userData ? userData.name : "User"}!
              </Text>
              <Text style={styles.tagline}>
                Find available parking near you
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("ProfileScreen")}
              style={styles.profileButton}
            >
              <Ionicons
                name="person-circle-outline"
                size={40}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <Text style={styles.balanceAmount}>{displayBalance()}</Text>
            </View>
            <TouchableOpacity
              style={styles.topUpButtonSmall}
              onPress={handleTopUp}
            >
              <Ionicons name="add-circle-outline" size={16} color="#FE7A3A" />
              <Text style={styles.topUpButtonSmallText}>Top Up</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Menu */}
        <View style={styles.quickMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSearchParking}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#E4F3FF" }]}>
              <Ionicons name="search" size={24} color="#1E3A8A" />
            </View>
            <Text style={styles.menuText}>Find Parking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleMyBooking}>
            <View style={[styles.menuIcon, { backgroundColor: "#E0F2FE" }]}>
              <Ionicons name="calendar-outline" size={24} color="#0284C7" />
            </View>
            <Text style={styles.menuText}>My Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTopUp}>
            <View style={[styles.menuIcon, { backgroundColor: "#EBF9EB" }]}>
              <Ionicons name="wallet-outline" size={24} color="#37A237" />
            </View>
            <Text style={styles.menuText}>Top Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleChat}>
            <View style={[styles.menuIcon, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons name="chatbubble-outline" size={24} color="#9747FF" />
            </View>
            <Text style={styles.menuText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Parking Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Parking</Text>
            <TouchableOpacity onPress={handleSearchParking}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Enhanced Location Status */}
          {locationLoading && (
            <View style={styles.locationContainer}>
              <ActivityIndicator size="small" color="#FE7A3A" />
              <Text style={styles.locationText}>Getting your location...</Text>
            </View>
          )}

          {errorMsg && !location && (
            <View style={styles.errorContainer}>
              <Ionicons name="location-outline" size={40} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={retryLocation}
              >
                <Text style={styles.retryButtonText}>Retry Location</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Show location info when available */}
          {location && (
            <View style={styles.locationInfoContainer}>
              <Ionicons name="location" size={16} color="#10B981" />
              <Text style={styles.locationInfoText}>
                {locationAddress || "Location found"}
                {errorMsg && (
                  <Text style={styles.lastKnownText}> (Last known)</Text>
                )}
              </Text>
            </View>
          )}

          {nearbyLoading && location && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FE7A3A" />
              <Text style={styles.loadingText}>Finding nearby parking...</Text>
            </View>
          )}

          {nearbyError && !nearbyLoading && location && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
              <Text style={styles.errorText}>
                Failed to load nearby parking.
              </Text>
              <Text style={styles.debugText}>Error: {nearbyError.message}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  console.log("Retry nearby parking button pressed");
                  refetchNearby();
                }}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {!nearbyLoading &&
            !nearbyError &&
            location &&
            nearbyParkingWithDistance.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="car-outline" size={60} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Parking Found</Text>
                <Text style={styles.emptySubtitle}>
                  No parking spaces available within 50km of your location
                </Text>
                {locationAddress && (
                  <Text style={styles.debugText}>Near: {locationAddress}</Text>
                )}
              </View>
            )}

          {!nearbyLoading &&
            !nearbyError &&
            nearbyParkingWithDistance.length > 0 && (
              <FlatList
                data={nearbyParkingWithDistance}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.nearbyParkingList}
                renderItem={({ item }) => {
                  console.log("Rendering parking card:", item.name);
                  return (
                    <ParkingCard
                      item={item}
                      onPress={() => handleParkingDetail(item._id)}
                      formatDistance={formatDistance}
                    />
                  );
                }}
              />
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tagline: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 4,
    opacity: 0.9,
  },
  profileButton: {
    padding: 5,
  },
  balanceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  topUpButtonSmall: {
    backgroundColor: "#FFF5F0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  topUpButtonSmallText: {
    color: "#FE7A3A",
    fontWeight: "600",
    marginLeft: 4,
  },
  quickMenu: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "white",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItem: {
    alignItems: "center",
    width: "23%",
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  menuText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  sectionContainer: {
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 5,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  seeAllText: {
    color: "#FE7A3A",
    fontWeight: "600",
    fontSize: 14,
  },
  activeBookingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  activeBookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  activeBookingStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 5,
  },
  statusText: {
    color: "#10B981",
    fontWeight: "600",
    fontSize: 12,
  },
  bookingTime: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  parkingNameText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  bookingDetails: {
    flexDirection: "row",
    marginBottom: 15,
  },
  bookingDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  bookingDetailText: {
    marginLeft: 5,
    color: "#6B7280",
    fontSize: 14,
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  viewDetailsText: {
    color: "#FE7A3A",
    fontWeight: "600",
    marginRight: 4,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  viewAllText: {
    color: "#FE7A3A",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 5,
  },
  nearbyParkingList: {
    paddingRight: 20,
    paddingBottom: 15,
  },
  quickActionContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  quickAction: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  findParkingAction: {
    backgroundColor: "#1E3A8A",
    marginRight: 10,
  },
  scanAction: {
    backgroundColor: "#FE7A3A",
    marginLeft: 10,
  },
  quickActionText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 5,
    textAlign: "center",
  },
  nearBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nearBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  locationText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#6B7280",
  },
  debugText: {
    marginTop: 10,
    fontSize: 14,
    color: "#4B5563",
    fontFamily: "monospace",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  retryButton: {
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FE7A3A",
  },
  quickBookingSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  recentBookingsList: {
    paddingRight: 20,
    paddingBottom: 15,
  },
  recentBookingCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    minWidth: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  recentBookingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bookingStatusActive: {
    backgroundColor: "#10B981",
    color: "white",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyBookingsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyBookingsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 15,
  },
  emptyBookingsSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 5,
    textAlign: "center",
  },
  locationInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    marginBottom: 15,
  },
  locationInfoText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  lastKnownText: {
    color: "#F59E0B",
    fontStyle: "italic",
  },
});
