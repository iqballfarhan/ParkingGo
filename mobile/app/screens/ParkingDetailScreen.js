import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery } from "@apollo/client";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const { width } = Dimensions.get("window");

const GET_PARKING_DETAIL = gql`
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

const GET_PARKING_STATS = gql`
  query GetParkingStats($parkingId: ID!) {
    getParkingStats(parkingId: $parkingId) {
      parkingId
      parkingName
      totalRevenue
      totalBookings
      averageRating
      currentOccupancyRate
      dailyStats {
        date
        revenue
        bookings
        occupancyRate
      }
      monthlyStats {
        month
        revenue
        bookings
        averageOccupancy
      }
      vehicleDistribution {
        car
        motorcycle
        carPercentage
        motorcyclePercentage
      }
      peakHours
      bestDay
      worstDay
    }
  }
`;

export default function ParkingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { parkingId, parkingName } = route.params;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_PARKING_DETAIL, {
    variables: { getParkingId: parkingId },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useQuery(GET_PARKING_STATS, {
    variables: { parkingId: parkingId },
    skip: !showStatsModal,
    fetchPolicy: "cache-and-network",
  });

  const formatCurrency = (amount) => {
    return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const formatTime = (time) => {
    if (!time) return "-";
    return time.substring(0, 5); // Format HH:MM
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FE7A3A" />
          <Text style={styles.loadingText}>Loading parking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Details</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const parking = data?.getParking;
  if (!parking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
          <Text style={styles.errorTitle}>Parking Not Found</Text>
          <Text style={styles.errorMessage}>
            The parking space you're looking for doesn't exist.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const images =
    parking.images && parking.images.length > 0
      ? parking.images
      : ["https://via.placeholder.com/400x200"];

  // Extract coordinates from parking location
  const coordinates = parking.location?.coordinates;
  const mapRegion = coordinates
    ? {
        latitude: coordinates[1], // coordinates are [longitude, latitude]
        longitude: coordinates[0],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : null;

  const openInMaps = () => {
    if (coordinates) {
      const lat = coordinates[1];
      const lng = coordinates[0];

      // Create multiple URL options for different map apps
      const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
      const appleMapsUrl = `http://maps.apple.com/?q=${lat},${lng}`;
      const googleMapsAppUrl = `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}&zoom=14`;

      Alert.alert("Open in Maps", "Choose your preferred maps application:", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Google Maps",
          onPress: async () => {
            try {
              // Try to open Google Maps app first
              const canOpenGoogleMaps = await Linking.canOpenURL(
                googleMapsAppUrl
              );
              if (canOpenGoogleMaps) {
                await Linking.openURL(googleMapsAppUrl);
              } else {
                // Fallback to web version
                await Linking.openURL(googleMapsUrl);
              }
            } catch (error) {
              console.error("Error opening Google Maps:", error);
              Alert.alert("Error", "Could not open Google Maps");
            }
          },
        },
        {
          text: "Apple Maps",
          onPress: async () => {
            try {
              await Linking.openURL(appleMapsUrl);
            } catch (error) {
              console.error("Error opening Apple Maps:", error);
              Alert.alert("Error", "Could not open Apple Maps");
            }
          },
        },
      ]);
    } else {
      Alert.alert("Error", "Location coordinates not available");
    }
  };

  const renderStatsModal = () => {
    const stats = statsData?.getParkingStats;

    return (
      <Modal
        visible={showStatsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <SafeAreaView style={styles.statsModalContainer}>
          {/* Stats Modal Header */}
          <View style={styles.statsModalHeader}>
            <Text style={styles.statsModalTitle}>Parking Statistics</Text>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowStatsModal(false)}
            >
              <Ionicons name="close" size={24} color="#1E3A8A" />
            </TouchableOpacity>
          </View>

          {statsLoading ? (
            <View style={styles.statsLoadingContainer}>
              <ActivityIndicator size="large" color="#FE7A3A" />
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : statsError ? (
            <View style={styles.statsErrorContainer}>
              <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
              <Text style={styles.errorTitle}>Error Loading Stats</Text>
              <Text style={styles.errorMessage}>{statsError.message}</Text>
            </View>
          ) : stats ? (
            <ScrollView
              style={styles.statsContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Overview Stats */}
              <View style={styles.statsOverviewSection}>
                <Text style={styles.statsSectionTitle}>Overview</Text>
                <View style={styles.statsOverviewCards}>
                  <View
                    style={[styles.statsCard, { backgroundColor: "#FFF5F0" }]}
                  >
                    <View
                      style={[
                        styles.statsIconBg,
                        { backgroundColor: "#FDDED3" },
                      ]}
                    >
                      <Ionicons name="cash-outline" size={24} color="#FE7A3A" />
                    </View>
                    <Text style={styles.statsValue}>
                      {formatCurrency(stats.totalRevenue)}
                    </Text>
                    <Text style={styles.statsLabel}>Total Revenue</Text>
                  </View>

                  <View
                    style={[styles.statsCard, { backgroundColor: "#EDF5FF" }]}
                  >
                    <View
                      style={[
                        styles.statsIconBg,
                        { backgroundColor: "#D7E8FF" },
                      ]}
                    >
                      <Ionicons name="car-outline" size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.statsValue}>{stats.totalBookings}</Text>
                    <Text style={styles.statsLabel}>Total Bookings</Text>
                  </View>

                  <View
                    style={[styles.statsCard, { backgroundColor: "#F0FFF4" }]}
                  >
                    <View
                      style={[
                        styles.statsIconBg,
                        { backgroundColor: "#DBFDE6" },
                      ]}
                    >
                      <Ionicons
                        name="speedometer-outline"
                        size={24}
                        color="#059669"
                      />
                    </View>
                    <Text style={styles.statsValue}>
                      {stats.currentOccupancyRate}%
                    </Text>
                    <Text style={styles.statsLabel}>Occupancy Rate</Text>
                  </View>
                </View>
              </View>

              {/* Vehicle Distribution */}
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>
                  Vehicle Distribution
                </Text>
                <View style={styles.vehicleDistributionCard}>
                  <View style={styles.vehicleDistributionRow}>
                    <View style={styles.vehicleDistributionItem}>
                      <Ionicons name="car-outline" size={20} color="#3B82F6" />
                      <Text style={styles.vehicleLabel}>Cars</Text>
                      <Text style={styles.vehicleCount}>
                        {stats.vehicleDistribution.car}
                      </Text>
                      <Text style={styles.vehiclePercentage}>
                        {stats.vehicleDistribution.carPercentage.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.vehicleDistributionItem}>
                      <Ionicons
                        name="bicycle-outline"
                        size={20}
                        color="#059669"
                      />
                      <Text style={styles.vehicleLabel}>Motorcycles</Text>
                      <Text style={styles.vehicleCount}>
                        {stats.vehicleDistribution.motorcycle}
                      </Text>
                      <Text style={styles.vehiclePercentage}>
                        {stats.vehicleDistribution.motorcyclePercentage.toFixed(
                          1
                        )}
                        %
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Peak Hours */}
              {stats.peakHours && stats.peakHours.length > 0 && (
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>Peak Hours</Text>
                  <View style={styles.peakHoursCard}>
                    <View style={styles.peakHoursList}>
                      {stats.peakHours.map((hour, index) => (
                        <View key={index} style={styles.peakHourItem}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#FE7A3A"
                          />
                          <Text style={styles.peakHourText}>
                            {hour.toString().padStart(2, "0")}:00
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Daily Stats */}
              {stats.dailyStats && stats.dailyStats.length > 0 && (
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>
                    Daily Stats (Last 7 Days)
                  </Text>
                  <View style={styles.dailyStatsCard}>
                    {stats.dailyStats.map((day, index) => (
                      <View key={index} style={styles.dailyStatItem}>
                        <Text style={styles.dailyStatDate}>
                          {formatDate(day.date)}
                        </Text>
                        <Text style={styles.dailyStatRevenue}>
                          {formatCurrency(day.revenue)}
                        </Text>
                        <Text style={styles.dailyStatBookings}>
                          {day.bookings} bookings
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Monthly Stats */}
              {stats.monthlyStats && stats.monthlyStats.length > 0 && (
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>Monthly Stats</Text>
                  <View style={styles.monthlyStatsCard}>
                    {stats.monthlyStats.map((month, index) => (
                      <View key={index} style={styles.monthlyStatItem}>
                        <Text style={styles.monthlyStatMonth}>
                          {formatMonth(month.month)}
                        </Text>
                        <Text style={styles.monthlyStatRevenue}>
                          {formatCurrency(month.revenue)}
                        </Text>
                        <Text style={styles.monthlyStatBookings}>
                          {month.bookings} bookings
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Best/Worst Days */}
              {(stats.bestDay || stats.worstDay) && (
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>Performance</Text>
                  <View style={styles.performanceCards}>
                    {stats.bestDay && (
                      <View
                        style={[
                          styles.performanceCard,
                          { backgroundColor: "#F0FDF4" },
                        ]}
                      >
                        <Ionicons
                          name="trending-up-outline"
                          size={20}
                          color="#059669"
                        />
                        <Text style={styles.performanceLabel}>Best Day</Text>
                        <Text style={styles.performanceValue}>
                          {formatDate(stats.bestDay)}
                        </Text>
                      </View>
                    )}
                    {stats.worstDay && (
                      <View
                        style={[
                          styles.performanceCard,
                          { backgroundColor: "#FEF2F2" },
                        ]}
                      >
                        <Ionicons
                          name="trending-down-outline"
                          size={20}
                          color="#EF4444"
                        />
                        <Text style={styles.performanceLabel}>Lowest Day</Text>
                        <Text style={styles.performanceValue}>
                          {formatDate(stats.worstDay)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.statsErrorContainer}>
              <Text style={styles.errorTitle}>No Statistics Available</Text>
              <Text style={styles.errorMessage}>
                Statistics data is not available for this parking.
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {parking.name}
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate("EditParkingScreen", { parkingId: parking._id })
          }
        >
          <Ionicons name="create-outline" size={24} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setSelectedImageIndex(index);
            }}
          >
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.parkingImage}
                defaultSource={require("../assets/logo.png")}
              />
            ))}
          </ScrollView>

          {/* Image Indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    selectedImageIndex === index && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              parking.status === "active"
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {parking.status === "active" ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Parking Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleSection}>
            <Text style={styles.parkingName}>{parking.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.rating}>{parking.rating || "0.0"}</Text>
              <Text style={styles.reviewCount}>
                ({parking.review_count || 0} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.locationSection}>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <Text style={styles.address}>{parking.address}</Text>
          </View>

          {/* Map Section */}
          {mapRegion && (
            <View style={styles.mapSection}>
              <View style={styles.mapHeader}>
                <Text style={styles.sectionTitle}>Location</Text>
              </View>

              <View style={styles.mapContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  region={mapRegion}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                >
                  <Marker
                    coordinate={{
                      latitude: mapRegion.latitude,
                      longitude: mapRegion.longitude,
                    }}
                    title={parking.name}
                    description={parking.address}
                  >
                    <View style={styles.customMarker}>
                      <Ionicons name="car" size={20} color="#FFF" />
                    </View>
                  </Marker>
                </MapView>

                <TouchableOpacity
                  style={styles.mapOverlayButton}
                  onPress={openInMaps}
                >
                  <Ionicons name="expand-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.coordinatesInfo}>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Latitude</Text>
                  <Text style={styles.coordinateValue}>
                    {mapRegion.latitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Longitude</Text>
                  <Text style={styles.coordinateValue}>
                    {mapRegion.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Owner Info */}
          {parking.owner && (
            <View style={styles.ownerSection}>
              <Text style={styles.sectionTitle}>Owner Information</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{parking.owner.name}</Text>
                  <Text style={styles.ownerEmail}>{parking.owner.email}</Text>
                  <View style={styles.ownerRole}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.ownerRoleText}>
                      {parking.owner.role}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Capacity & Availability */}
          <View style={styles.capacitySection}>
            <Text style={styles.sectionTitle}>Capacity & Availability</Text>
            <View style={styles.capacityCards}>
              <View style={styles.capacityCard}>
                <Ionicons name="car-outline" size={24} color="#3B82F6" />
                <Text style={styles.capacityLabel}>Cars</Text>
                <Text style={styles.capacityValue}>
                  {parking.available?.car || 0}/{parking.capacity?.car || 0}
                </Text>
                <Text style={styles.capacitySubtext}>Available</Text>
              </View>
              <View style={styles.capacityCard}>
                <Ionicons name="bicycle-outline" size={24} color="#059669" />
                <Text style={styles.capacityLabel}>Motorcycles</Text>
                <Text style={styles.capacityValue}>
                  {parking.available?.motorcycle || 0}/
                  {parking.capacity?.motorcycle || 0}
                </Text>
                <Text style={styles.capacitySubtext}>Available</Text>
              </View>
            </View>
          </View>

          {/* Rates */}
          <View style={styles.ratesSection}>
            <Text style={styles.sectionTitle}>Rates</Text>
            <View style={styles.rateCards}>
              <View style={styles.rateCard}>
                <Ionicons name="car-outline" size={20} color="#3B82F6" />
                <Text style={styles.rateLabel}>Car</Text>
                <Text style={styles.rateValue}>
                  {formatCurrency(parking.rates?.car || 0)}/hour
                </Text>
              </View>
              <View style={styles.rateCard}>
                <Ionicons name="bicycle-outline" size={20} color="#059669" />
                <Text style={styles.rateLabel}>Motorcycle</Text>
                <Text style={styles.rateValue}>
                  {formatCurrency(parking.rates?.motorcycle || 0)}/hour
                </Text>
              </View>
            </View>
          </View>

          {/* Operational Hours */}
          <View style={styles.hoursSection}>
            <Text style={styles.sectionTitle}>Operational Hours</Text>
            <View style={styles.hoursCard}>
              <View style={styles.hourItem}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.hourLabel}>Open</Text>
                <Text style={styles.hourValue}>
                  {formatTime(parking.operational_hours?.open)}
                </Text>
              </View>
              <View style={styles.hourItem}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.hourLabel}>Close</Text>
                <Text style={styles.hourValue}>
                  {formatTime(parking.operational_hours?.close)}
                </Text>
              </View>
            </View>
          </View>

          {/* Facilities */}
          {parking.facilities && parking.facilities.length > 0 && (
            <View style={styles.facilitiesSection}>
              <Text style={styles.sectionTitle}>Facilities</Text>
              <View style={styles.facilitiesList}>
                {parking.facilities.map((facility, index) => (
                  <View key={index} style={styles.facilityItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#059669"
                    />
                    <Text style={styles.facilityText}>{facility}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editActionButton}
          onPress={() =>
            navigation.navigate("EditParkingScreen", { parkingId: parking._id })
          }
        >
          <Ionicons name="create-outline" size={20} color="#FFF" />
          <Text style={styles.editActionText}>Edit Parking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewStatsButton}
          onPress={() => setShowStatsModal(true)}
        >
          <Ionicons name="stats-chart-outline" size={20} color="#FE7A3A" />
          <Text style={styles.viewStatsText}>View Stats</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Modal */}
      {renderStatsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    textAlign: "center",
    marginHorizontal: 10,
  },
  editButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    position: "relative",
  },
  parkingImage: {
    width: width,
    height: 250,
    resizeMode: "cover",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#FFF",
  },
  statusBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.9)",
  },
  inactiveBadge: {
    backgroundColor: "rgba(156, 163, 175, 0.9)",
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#FFF",
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleSection: {
    marginBottom: 15,
  },
  parkingName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F59E0B",
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  address: {
    flex: 1,
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 8,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 15,
  },
  mapSection: {
    marginBottom: 25,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FE7A3A",
  },
  directionsText: {
    color: "#FE7A3A",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    backgroundColor: "#FE7A3A",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapOverlayButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 8,
    padding: 8,
  },
  coordinatesInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  coordinateItem: {
    flex: 1,
    alignItems: "center",
  },
  coordinateLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  ownerSection: {
    marginBottom: 25,
  },
  ownerCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  ownerEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  ownerRole: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerRoleText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
    textTransform: "capitalize",
  },
  capacitySection: {
    marginBottom: 25,
  },
  capacityCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  capacityCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  capacityLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  capacitySubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  ratesSection: {
    marginBottom: 25,
  },
  rateCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rateCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rateLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    textAlign: "center",
  },
  hoursSection: {
    marginBottom: 25,
  },
  hoursCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hourItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  hourLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 10,
    flex: 1,
  },
  hourValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  facilitiesSection: {
    marginBottom: 25,
  },
  facilitiesList: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  editActionButton: {
    flex: 1,
    backgroundColor: "#FE7A3A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    marginRight: 8,
  },
  editActionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  viewStatsButton: {
    flex: 1,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: "#FE7A3A",
  },
  viewStatsText: {
    color: "#FE7A3A",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FE7A3A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Stats Modal Styles
  statsModalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  statsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statsModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  closeModalButton: {
    padding: 8,
  },
  statsLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statsContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsOverviewSection: {
    marginTop: 20,
    marginBottom: 25,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 15,
  },
  statsOverviewCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsCard: {
    width: "31%",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
    textAlign: "center",
  },
  statsLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  statsSection: {
    marginBottom: 25,
  },
  vehicleDistributionCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleDistributionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vehicleDistributionItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  vehicleLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  vehicleCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 2,
  },
  vehiclePercentage: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  peakHoursCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  peakHoursList: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  peakHourItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  peakHourText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FE7A3A",
    marginLeft: 4,
  },
  dailyStatsCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyStatItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dailyStatDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    flex: 1,
  },
  dailyStatRevenue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    flex: 1,
    textAlign: "center",
  },
  dailyStatBookings: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
    textAlign: "right",
  },
  monthlyStatsCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthlyStatItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  monthlyStatMonth: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    flex: 1,
  },
  monthlyStatRevenue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    flex: 1,
    textAlign: "center",
  },
  monthlyStatBookings: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
    textAlign: "right",
  },
  performanceCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  performanceCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
});
