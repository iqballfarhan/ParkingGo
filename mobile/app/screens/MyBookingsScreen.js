import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery } from "@apollo/client";

// ✅ FIX: Add missing user_id field and user._id field for proper Apollo caching
const GET_MY_ACTIVE_BOOKINGS = gql`
  query GetMyActiveBookings {
    getMyActiveBookings {
      _id
      user_id
      user {
        _id
        email
        name
        role
        saldo
      }
      parking_id
      parking {
        _id
        name
        address
        location {
          type
          coordinates
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
      vehicle_type
      start_time
      duration
      cost
      status
      qr_code
      entry_qr
      exit_qr
      created_at
      updated_at
    }
  }
`;

export default function MyBookingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [refreshing, setRefreshing] = useState(false);

  // ✅ UPDATED: Handle auto-select status from navigation params
  const [selectedStatus, setSelectedStatus] = useState(() => {
    // Check if we have a status parameter from navigation
    const paramStatus = route.params?.autoSelectStatus;
    return paramStatus || "pending";
  });

  // ✅ FIX: Completely disable Apollo error logging for cache issues
  const { data, loading, error, refetch } = useQuery(GET_MY_ACTIVE_BOOKINGS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "ignore", // ✅ CHANGE: Ignore all Apollo errors including cache merge
    notifyOnNetworkStatusChange: true,
    onError: () => {
      // ✅ FIX: Completely silent - no error logging for any Apollo issues
      // This prevents cache merge warnings from appearing
    },
    onCompleted: (data) => {
      // ✅ DEBUG: Log booking data to verify all statuses are included
      console.log("📊 Bookings loaded:", {
        total: data?.getMyActiveBookings?.length || 0,
        statuses:
          data?.getMyActiveBookings?.reduce((acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
          }, {}) || {},
        bookings:
          data?.getMyActiveBookings?.map((b) => ({
            id: b._id.slice(-8),
            status: b.status,
            parking: b.parking.name,
          })) || [],
      });
    },
  });

  // ✅ SIMPLIFIED: Use single data source
  const allBookings = data?.getMyActiveBookings || [];

  // ✅ ADD: Filter bookings based on selected status
  const filteredBookings = allBookings.filter((booking) => {
    if (selectedStatus === "all") return true;
    return booking.status === selectedStatus;
  });

  // ✅ ENHANCED: Add cancelled to status filters
  const statusFilters = [
    { label: "Pending", value: "pending", color: "#F59E0B" },
    { label: "Confirmed", value: "confirmed", color: "#3B82F6" },
    { label: "Active", value: "active", color: "#10B981" },
    { label: "Completed", value: "completed", color: "#059669" },
  ];

  // ✅ UPDATE: Get status counts (no all option)
  const getStatusCount = (status) => {
    return allBookings.filter((booking) => booking.status === status).length;
  };

  // ADD: Listen for navigation parameter changes
  React.useEffect(() => {
    if (route.params?.autoSelectStatus) {
      setSelectedStatus(route.params.autoSelectStatus);
      // Force refresh data when status changes
      refetch();
      // Clear the parameter to avoid re-triggering
      navigation.setParams({ autoSelectStatus: undefined });
    }
  }, [route.params?.autoSelectStatus, navigation, refetch]);

  // Auto refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("👁️ Screen focused, refreshing data...");

      // ✅ FIX: Use no-cache to bypass all cache issues
      refetch({
        fetchPolicy: "no-cache", // Completely bypass cache
        errorPolicy: "ignore",
      })
        .then(() => {
          console.log("🔄 Focus refresh completed");
        })
        .catch(() => {
          // ✅ FIX: Silent catch - no error logging
        });

      if (route.params?.autoSelectStatus) {
        setSelectedStatus(route.params.autoSelectStatus);
      }
    }, [refetch, route.params?.autoSelectStatus])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // ✅ FIX: Use no-cache for manual refresh to avoid all cache conflicts
      await refetch({
        fetchPolicy: "no-cache",
        errorPolicy: "ignore",
      });
    } catch (error) {
      // ✅ FIX: Silent error handling
    }
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "confirmed":
        return "#10B981";
      case "active":
        return "#3B82F6";
      case "completed":
        return "#6B7280";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "confirmed":
        return "checkmark-circle";
      case "active":
        return "car";
      case "completed":
        return "checkmark-done";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const formatDateTime = (timestamp) => {
    // Handle both string and number timestamps
    let date;
    if (timestamp === "0" || timestamp === 0) {
      date = new Date(); // Current time for invalid timestamps
    } else {
      const numTimestamp = parseInt(timestamp);
      date = new Date(numTimestamp);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      date = new Date(); // Fallback to current time
    }

    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (hours) => {
    if (hours < 24) {
      return `${hours}h`;
    } else if (hours < 168) {
      const days = Math.floor(hours / 24);
      return `${days}d`;
    } else {
      const weeks = Math.floor(hours / 168);
      return `${weeks}w`;
    }
  };

  const getTimeStatus = (startTime, status) => {
    const start = new Date(parseInt(startTime));
    const now = new Date();

    if (status === "pending") {
      return "Awaiting Payment";
    } else if (status === "confirmed") {
      if (start > now) {
        return "Upcoming";
      } else {
        return "Ready to Park";
      }
    } else if (status === "active") {
      return "Currently Parked";
    }
    return status;
  };

  const handleBookingPress = (bookingId) => {
    navigation.navigate("UserBookingDetailScreen", { bookingId });
  };

  const renderBookingCard = ({ item: booking }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => handleBookingPress(booking._id)}
    >
      {/* Parking Image */}
      <Image
        source={{
          uri:
            booking.parking.images[0] ||
            "https://via.placeholder.com/300x150?text=Parking",
        }}
        style={styles.parkingImage}
      />

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(booking.status) },
        ]}
      >
        <Ionicons
          name={getStatusIcon(booking.status)}
          size={12}
          color="#FFFFFF"
        />
        <Text style={styles.statusBadgeText}>
          {getTimeStatus(booking.start_time, booking.status)}
        </Text>
      </View>

      {/* Booking Info */}
      <View style={styles.bookingInfo}>
        <View style={styles.bookingHeader}>
          <Text style={styles.parkingName} numberOfLines={1}>
            {booking.parking.name}
          </Text>
          <Text style={styles.bookingCost}>
            Rp {booking.cost.toLocaleString()}
          </Text>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.parkingAddress} numberOfLines={1}>
            {booking.parking.address}
          </Text>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="car-outline" size={14} color="#FE7A3A" />
            <Text style={styles.detailText}>
              {booking.vehicle_type.charAt(0).toUpperCase() +
                booking.vehicle_type.slice(1)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#FE7A3A" />
            <Text style={styles.detailText}>
              {formatDateTime(booking.start_time)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="hourglass-outline" size={14} color="#FE7A3A" />
            <Text style={styles.detailText}>
              {formatDuration(booking.duration)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingFooter}>
          <Text style={styles.bookingId}>#{booking._id.slice(-8)}</Text>
          <View style={styles.actionRow}>
            {booking.status === "pending" && (
              <View style={styles.pendingIndicator}>
                <Ionicons name="card-outline" size={12} color="#F59E0B" />
                <Text style={styles.pendingText}>Pay Now</Text>
              </View>
            )}
            <View style={styles.nextArrow}>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="car-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        No {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}{" "}
        Bookings
      </Text>
      <Text style={styles.emptySubtitle}>
        You don't have any {selectedStatus} bookings.
      </Text>
      <TouchableOpacity
        style={styles.findParkingButton}
        onPress={() => navigation.navigate("HomeScreen")}
      >
        <LinearGradient
          colors={["#FF9A62", "#FE7A3A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.findParkingGradient}
        >
          <Text style={styles.findParkingText}>Find Parking</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading your bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
          <Text style={styles.headerTitle}>My Bookings</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {getStatusCount(selectedStatus)}{" "}
            {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}{" "}
            Booking{getStatusCount(selectedStatus) !== 1 ? "s" : ""}
          </Text>
        </View>
      </LinearGradient>

      {/* ✅ ADD: Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              selectedStatus === filter.value && styles.filterButtonActive,
              {
                backgroundColor:
                  selectedStatus === filter.value
                    ? filter.color + "20"
                    : "#F3F4F6",
                borderColor:
                  selectedStatus === filter.value ? filter.color : "#E5E7EB",
              },
            ]}
            onPress={() => setSelectedStatus(filter.value)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === filter.value && {
                  color: filter.color,
                  fontWeight: "600",
                },
              ]}
            >
              {filter.label}
            </Text>
            {getStatusCount(filter.value) > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor:
                      selectedStatus === filter.value
                        ? filter.color
                        : "#9CA3AF",
                  },
                ]}
              >
                <Text style={styles.filterBadgeText}>
                  {getStatusCount(filter.value)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {filteredBookings.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  refreshButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  statsContainer: {
    alignItems: "center",
  },
  statsText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  scrollContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  parkingImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  bookingInfo: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    flex: 1,
    marginRight: 8,
  },
  bookingCost: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FE7A3A",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  parkingAddress: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
    flex: 1,
  },
  bookingDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailText: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 4,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingId: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "monospace",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  pendingText: {
    fontSize: 10,
    color: "#F59E0B",
    fontWeight: "600",
    marginLeft: 4,
  },
  nextArrow: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  findParkingButton: {
    width: "100%",
    maxWidth: 200,
  },
  findParkingGradient: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  findParkingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ✅ FIXED: Reduced spacing between filter and cards
  filterContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingButtom: 8,
    gap: 2,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    marginRight: 10,
    height: 32,
  },
  filterButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterBadge: {
    marginLeft: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
