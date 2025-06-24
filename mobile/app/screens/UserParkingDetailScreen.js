import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker } from "react-native-maps";
import { gql, useQuery } from "@apollo/client";

const GET_PARKING = gql`
  query GetParking($getParkingId: ID!) {
    getParking(id: $getParkingId) {
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
      created_at
      updated_at
    }
  }
`;

const { width, height } = Dimensions.get("window");

export default function UserParkingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { parkingId, userLocation } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  // ✅ ADD: Loading animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current; // ✅ ADD: Spin animation for loading

  const { data, loading, error } = useQuery(GET_PARKING, {
    variables: { getParkingId: parkingId },
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.log("GraphQL Error:", error);
    },
    onCompleted: (data) => {
      console.log("Data received:", data);
      // ✅ ADD: Animate content when data loads
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    },
  });

  // ✅ ADD: Start spin animation on mount
  React.useEffect(() => {
    if (loading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // ✅ ADD: Continuous spin animation
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );

      pulse.start();
      spin.start();

      return () => {
        pulse.stop();
        spin.stop();
      };
    }
  }, [loading, pulseAnim, spinAnim]);

  // ✅ ADD: Interpolate spin value
  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const parking = data?.getParking;

  console.log("Route params:", route.params);
  console.log("Parking ID:", parkingId);
  console.log("Loading:", loading);
  console.log("Error:", error);
  console.log("Data:", data);
  console.log("Parking:", parking);

  // Calculate distance function
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

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#FE7A3A", "#FF9A62"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.loadingHeader}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.loadingHeaderContent}>
            {/* ✅ ADD: Spinning loading icon in header */}
            <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.loadingHeaderTitle}>Loading...</Text>
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          {/* ✅ ENHANCED: Main spinning loader */}
          <View style={styles.mainLoadingContainer}>
            <Animated.View
              style={[
                styles.mainSpinner,
                {
                  transform: [
                    { rotate: spinInterpolate },
                    { scale: pulseAnim },
                  ],
                },
              ]}
            >
              <Ionicons name="car-sport" size={60} color="#FE7A3A" />
            </Animated.View>

            {/* ✅ ADD: Secondary spinning rings */}
            <Animated.View
              style={[
                styles.spinnerRing,
                styles.outerRing,
                { transform: [{ rotate: spinInterpolate }] },
              ]}
            />
            <Animated.View
              style={[
                styles.spinnerRing,
                styles.innerRing,
                {
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["360deg", "0deg"], // Reverse direction
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>

          {/* ✅ ENHANCED: Animated loading skeleton */}
          <View style={styles.loadingContent}>
            <Animated.View
              style={[
                styles.loadingImageSkeleton,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Animated.View
                style={{ transform: [{ rotate: spinInterpolate }] }}
              >
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
              </Animated.View>
            </Animated.View>

            <View style={styles.loadingTextContainer}>
              <Animated.View
                style={[
                  styles.loadingTextSkeleton,
                  styles.loadingTitle,
                  { opacity: pulseAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.loadingTextSkeleton,
                  styles.loadingSubtitle,
                  { opacity: pulseAnim },
                ]}
              />

              <View style={styles.loadingDetails}>
                <Animated.View
                  style={[styles.loadingDetailSkeleton, { opacity: pulseAnim }]}
                />
                <Animated.View
                  style={[styles.loadingDetailSkeleton, { opacity: pulseAnim }]}
                />
              </View>
            </View>
          </View>

          {/* ✅ ADD: Loading dots animation */}
          <View style={styles.loadingDotsContainer}>
            <Animated.View
              style={[styles.loadingDot, { opacity: pulseAnim }]}
            />
            <Animated.View
              style={[
                styles.loadingDot,
                {
                  opacity: spinAnim.interpolate({
                    inputRange: [0, 0.33, 0.66, 1],
                    outputRange: [0.3, 1, 0.3, 0.3],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.loadingDot,
                {
                  opacity: spinAnim.interpolate({
                    inputRange: [0, 0.33, 0.66, 1],
                    outputRange: [0.3, 0.3, 1, 0.3],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ ENHANCED: Better error screen
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#EF4444", "#DC2626"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.errorHeader}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.errorHeaderTitle}>Error Loading</Text>
        </LinearGradient>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>
            We couldn't load the parking details. Please check your connection
            and try again.
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={["#FF9A62", "#FE7A3A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryGradient}
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!parking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>No parking data found</Text>
          <Text>Data: {JSON.stringify(data)}</Text>
          <Text>Parking ID: {parkingId}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Function to check if parking is currently open
  const isParkingOpen = (operationalHours) => {
    if (!operationalHours?.open || !operationalHours?.close) {
      return false; // Default to closed if no hours specified
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    // Parse open time
    const [openHour, openMinute] = operationalHours.open.split(":").map(Number);
    const openTime = openHour * 60 + openMinute;

    // Parse close time
    const [closeHour, closeMinute] = operationalHours.close
      .split(":")
      .map(Number);
    const closeTime = closeHour * 60 + closeMinute;

    // Handle cases where closing time is next day (e.g., 23:59 to 06:00)
    if (closeTime < openTime) {
      // Parking is open if current time is after opening OR before closing (next day)
      return currentTime >= openTime || currentTime <= closeTime;
    } else {
      // Normal case: opening and closing on same day
      return currentTime >= openTime && currentTime <= closeTime;
    }
  };

  const handleBooking = () => {
    if (!parking) return;

    const isOpen = isParkingOpen(parking.operational_hours);
    if (!isOpen) {
      Alert.alert(
        "Parking Closed",
        "This parking is currently closed. Please check the operational hours.",
        [{ text: "OK" }]
      );
      return;
    }

    // Navigate to booking form
    navigation.navigate("BookingFormScreen", {
      parking: parking,
    });
  };

  const renderImageItem = ({ item }) => (
    <View style={styles.imageSlide}>
      <Image source={{ uri: item }} style={styles.carouselImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={styles.imageGradient}
      />
    </View>
  );

  // Extract render logic to reusable function
  const renderParkingDetail = (parkingData) => {
    if (!parkingData) return null;

    const isOpen = isParkingOpen(parkingData.operational_hours);

    const mapLocation = {
      latitude: parkingData.location.coordinates[1],
      longitude: parkingData.location.coordinates[0],
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    // Calculate distance if user location is available
    let distance = 0;
    if (userLocation && parkingData.location?.coordinates) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parkingData.location.coordinates[1],
        parkingData.location.coordinates[0]
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            isOpen ? styles.openBanner : styles.closedBanner,
          ]}
        >
          <Ionicons
            name={isOpen ? "checkmark-circle" : "close-circle"}
            size={16}
            color="white"
          />
          <Text style={styles.statusBannerText}>
            {isOpen ? "CURRENTLY OPEN" : "CURRENTLY CLOSED"}
          </Text>
          <Text style={styles.statusBannerHours}>
            Operating: {parkingData.operational_hours?.open || "00:00"} -{" "}
            {parkingData.operational_hours?.close || "23:59"}
          </Text>
        </View>

        {/* Header with Image Carousel and Info Box */}
        <View style={styles.imageContainer}>
          <FlatList
            data={
              parkingData.images || [
                "https://via.placeholder.com/400x200?text=Parking",
              ]
            }
            renderItem={renderImageItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentImageIndex(index);
            }}
          />

          {/* Image Indicators */}
          <View style={styles.indicatorContainer}>
            {(parkingData.images || [""]).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Info Box Overlay */}
          <View style={styles.infoBox}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>{parkingData.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {(parkingData.rating || 0).toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.infoAddress}>{parkingData.address}</Text>
            </View>

            {userLocation && (
              <View style={styles.infoRow}>
                <Ionicons name="navigate-outline" size={14} color="#6B7280" />
                <Text style={styles.infoDistance}>
                  {formatDistance(distance)} away
                </Text>
              </View>
            )}

            <View style={styles.capacityRow}>
              <View style={styles.capacityItem}>
                <Ionicons name="car-outline" size={14} color="#3B82F6" />
                <Text style={styles.capacityText}>
                  {(parkingData.capacity?.car || 0) -
                    (parkingData.available?.car || 0)}
                  /{parkingData.capacity?.car || 0}
                </Text>
              </View>
              <View style={styles.capacityItem}>
                <Ionicons name="bicycle-outline" size={14} color="#10B981" />
                <Text style={styles.capacityText}>
                  {(parkingData.capacity?.motorcycle || 0) -
                    (parkingData.available?.motorcycle || 0)}
                  /{parkingData.capacity?.motorcycle || 0}
                </Text>
              </View>
              <Text style={styles.pricePreview}>
                From Rp{" "}
                {Math.min(
                  parkingData.rates?.car || 0,
                  parkingData.rates?.motorcycle || 0
                ).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Pricing Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.pricingGrid}>
              <View style={styles.priceCard}>
                <Ionicons name="car" size={24} color="#3B82F6" />
                <Text style={styles.vehicleType}>Car</Text>
                <Text style={styles.priceAmount}>
                  Rp {(parkingData.rates?.car || 0).toLocaleString()}
                </Text>
                <Text style={styles.priceUnit}>per hour</Text>
              </View>
              <View style={styles.priceCard}>
                <Ionicons name="bicycle" size={24} color="#10B981" />
                <Text style={styles.vehicleType}>Motorcycle</Text>
                <Text style={styles.priceAmount}>
                  Rp {(parkingData.rates?.motorcycle || 0).toLocaleString()}
                </Text>
                <Text style={styles.priceUnit}>per hour</Text>
              </View>
            </View>
          </View>

          {/* Operation Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operation Hours</Text>
            <View style={styles.hoursContainer}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.hoursText}>
                {parkingData.operational_hours?.open || "00:00"} -{" "}
                {parkingData.operational_hours?.close || "23:59"}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  isOpen ? styles.openStatusBadge : styles.closedStatusBadge,
                ]}
              >
                <Text style={styles.statusText}>
                  {isOpen ? "OPEN" : "CLOSED"}
                </Text>
              </View>
            </View>
          </View>

          {/* Facilities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facilities</Text>
            <View style={styles.facilitiesGrid}>
              {(parkingData.facilities || []).map((facility, index) => (
                <View key={index} style={styles.facilityItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.facilityText}>{facility}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView style={styles.map} region={mapLocation}>
                <Marker
                  coordinate={{
                    latitude: parkingData.location.coordinates[1],
                    longitude: parkingData.location.coordinates[0],
                  }}
                  title={parkingData.name}
                  description={parkingData.address}
                />
              </MapView>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom Booking Button */}
        <View style={styles.bottomAction}>
          <View style={styles.priceInfo}>
            <Text style={styles.fromText}>Starting from</Text>
            <View style={styles.priceOptions}>
              <View style={styles.priceOption}>
                <Ionicons name="car" size={14} color="#3B82F6" />
                <Text style={styles.priceOptionText}>
                  Rp {(parkingData.rates?.car || 0).toLocaleString()}/hr
                </Text>
              </View>
              <View style={styles.priceOption}>
                <Ionicons name="bicycle" size={14} color="#10B981" />
                <Text style={styles.priceOptionText}>
                  Rp {(parkingData.rates?.motorcycle || 0).toLocaleString()}/hr
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.bookButton, !isOpen && styles.disabledBookButton]}
            onPress={handleBooking}
            disabled={!isOpen}
          >
            <LinearGradient
              colors={isOpen ? ["#FF9A62", "#FE7A3A"] : ["#9CA3AF", "#6B7280"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookGradient}
            >
              <Text style={styles.bookButtonText}>
                {isOpen ? "Book Now" : "Closed"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {renderParkingDetail(parking)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  loadingHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  loadingHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  // ✅ ADD: Main spinner styles
  mainLoadingContainer: {
    position: "relative",
    marginBottom: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  mainSpinner: {
    zIndex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerRing: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 999,
    borderTopColor: "#FE7A3A",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  outerRing: {
    width: 120,
    height: 120,
    borderWidth: 4,
  },
  innerRing: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderTopColor: "#FF9A62",
  },

  loadingContent: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  loadingImageSkeleton: {
    width: width - 80,
    height: 120,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  // ✅ ADD: Loading dots styles
  loadingDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FE7A3A",
    marginHorizontal: 4,
  },

  loadingTextContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  loadingTextSkeleton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingTitle: {
    height: 24,
    width: "70%",
  },
  loadingSubtitle: {
    height: 16,
    width: "50%",
  },
  loadingDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  loadingDetailSkeleton: {
    height: 40,
    width: "45%",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  errorHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  errorHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginTop: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  retryGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  openBanner: {
    backgroundColor: "#10B981",
  },
  closedBanner: {
    backgroundColor: "#EF4444",
  },
  statusBannerText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 6,
    marginRight: 8,
  },
  statusBannerHours: {
    color: "white",
    fontSize: 11,
    opacity: 0.9,
  },
  imageContainer: {
    height: height * 0.35,
    position: "relative",
  },
  imageSlide: {
    width: width,
    height: "100%",
    position: "relative",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  infoBox: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 16,
    backdropFilter: "blur(10px)",
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoAddress: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
    flex: 1,
  },
  infoDistance: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  capacityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  capacityText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  pricePreview: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FE7A3A",
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 16,
  },
  pricingGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  vehicleType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginTop: 8,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  priceUnit: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  hoursContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hoursText: {
    fontSize: 16,
    color: "#1E3A8A",
    fontWeight: "600",
    flex: 1,
    marginLeft: 8,
  },
  statusBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 14,
    color: "#059669",
    marginLeft: 4,
    fontWeight: "500",
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  priceInfo: {
    flex: 1,
  },
  fromText: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  priceOptions: {
    flexDirection: "column",
    gap: 2,
  },
  priceOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
    marginLeft: 4,
  },
  bookButton: {
    marginLeft: 15,
  },
  bookGradient: {
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 25,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  retryButton: {
    backgroundColor: "#FE7A3A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  disabledBookButton: {
    opacity: 0.7,
  },
});
