import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery } from "@apollo/client";

const GET_MY_BOOKING_HISTORY = gql`
  query GetMyBookingHistory {
    getMyBookingHistory {
      _id
      user {
        email
        name
      }
      parking {
        name
        address
        location {
          type
          coordinates
        }
        capacity {
          car
          motorcycle
        }
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
    }
  }
`;

const { width } = Dimensions.get("window");

export default function BookingHistoryScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_MY_BOOKING_HISTORY, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  // Filter only completed bookings
  const completedBookings =
    data?.getMyBookingHistory?.filter(
      (booking) => booking.status === "completed"
    ) || [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.log("Refresh error:", error);
    }
    setRefreshing(false);
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    return {
      date: date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatDuration = (hours) => {
    if (hours < 24) {
      return `${hours} jam`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0
        ? `${days}h ${remainingHours}j`
        : `${days} hari`;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVehicleIcon = (type) => {
    return type === "car" ? "car" : "bicycle";
  };

  const getVehicleColor = (type) => {
    return type === "car" ? "#f97316" : "#ea580c";
  };

  const handleBookingPress = (bookingId) => {
    navigation.navigate("UserBookingDetailScreen", { bookingId });
  };

  const renderBookingCard = ({ item: booking, index }) => {
    const { date, time } = formatDateTime(booking.start_time);

    return (
      <View style={styles.bookingCard}>
        {/* Main Content */}
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleBookingPress(booking._id)}
          activeOpacity={0.8}
        >
          {/* Left: Parking Image */}
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri:
                  booking.parking.images[0] ||
                  "https://via.placeholder.com/100x80?text=Parking",
              }}
              style={styles.parkingImage}
            />
            <View style={styles.ratingOverlay}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.ratingText}>
                {(booking.parking.rating || 0).toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Right: Details */}
          <View style={styles.detailsWrapper}>
            {/* Header: Date & Status */}
            <View style={styles.cardTopRow}>
              <View style={styles.dateInfo}>
                <Text style={styles.dateText}>{date}</Text>
                <Text style={styles.timeText}>{time}</Text>
              </View>
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Selesai</Text>
              </View>
            </View>

            {/* Parking Name & Address */}
            <View style={styles.parkingDetails}>
              <Text style={styles.parkingName} numberOfLines={1}>
                {booking.parking.name}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color="#64748b" />
                <Text style={styles.addressText} numberOfLines={1}>
                  {booking.parking.address}
                </Text>
              </View>
            </View>

            {/* Booking Info */}
            <View style={styles.bookingSpecs}>
              <View style={styles.specRow}>
                <View style={styles.specItem}>
                  <View
                    style={[
                      styles.vehicleIcon,
                      {
                        backgroundColor:
                          getVehicleColor(booking.vehicle_type) + "15",
                      },
                    ]}
                  >
                    <Ionicons
                      name={getVehicleIcon(booking.vehicle_type)}
                      size={14}
                      color={getVehicleColor(booking.vehicle_type)}
                    />
                  </View>
                  <Text style={styles.specLabel}>
                    {booking.vehicle_type === "car" ? "Mobil" : "Motor"}
                  </Text>
                </View>

                <View style={styles.specItem}>
                  <View style={styles.timeIcon}>
                    <Ionicons name="time" size={14} color="#6366f1" />
                  </View>
                  <Text style={styles.specLabel}>
                    {formatDuration(booking.duration)}
                  </Text>
                </View>
              </View>

              {/* Cost */}
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Total</Text>
                <Text style={styles.costValue}>
                  {formatCurrency(booking.cost)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Bottom: Booking ID */}
        <View style={styles.cardFooter}>
          <Text style={styles.bookingId}>#{booking._id.slice(-8)}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="receipt-outline" size={72} color="#cbd5e1" />
      </View>
      <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
      <Text style={styles.emptyMessage}>
        Riwayat booking yang sudah selesai{"\n"}akan ditampilkan di sini
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate("HomeScreen")}
      >
        <Ionicons name="search" size={18} color="white" />
        <Text style={styles.exploreText}>Mulai Parkir</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.statsSection}>
      <Text style={styles.statsTitle}>Summary</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="calendar" size={20} color="#6366f1" />
          </View>
          <Text style={styles.statNumber}>{completedBookings.length}</Text>
          <Text style={styles.statLabel}>Booking</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="time" size={20} color="#059669" />
          </View>
          <Text style={styles.statNumber}>
            {completedBookings.reduce(
              (total, booking) => total + booking.duration,
              0
            )}
          </Text>
          <Text style={styles.statLabel}>Jam</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="wallet" size={20} color="#dc2626" />
          </View>
          <Text style={styles.statNumber}>
            {formatCurrency(
              completedBookings.reduce(
                (total, booking) => total + booking.cost,
                0
              )
            )
              .replace("Rp", "")
              .replace(",00", "")}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Ionicons name="receipt-outline" size={48} color="#6366f1" />
          </View>
          <Text style={styles.loadingText}>Memuat riwayat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Boking History</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {completedBookings.length === 0 ? (
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
          data={completedBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
          ListHeaderComponent={renderHeader}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Clean Header
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },

  // Content
  scrollContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Modern Booking Card
  bookingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  cardContent: {
    flexDirection: "row",
    padding: 16,
  },

  // Image Section
  imageWrapper: {
    position: "relative",
    marginRight: 16,
  },
  parkingImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
  },
  ratingOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },

  // Details Section
  detailsWrapper: {
    flex: 1,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  timeText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#059669",
  },

  parkingDetails: {
    marginBottom: 12,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addressText: {
    fontSize: 13,
    color: "#64748b",
    flex: 1,
  },

  bookingSpecs: {
    gap: 8,
  },
  specRow: {
    flexDirection: "row",
    gap: 16,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vehicleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  timeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
  },
  specLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },

  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  costLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  costValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  bookingId: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "monospace",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconWrapper: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  exploreText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
});
