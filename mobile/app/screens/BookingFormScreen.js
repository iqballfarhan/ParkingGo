import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useMutation } from "@apollo/client";

const CREATE_BOOKING = gql`
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      booking {
        _id
        user_id
        parking_id
        vehicle_type
        start_time
        duration
        cost
        status
        created_at
        updated_at
        user {
          _id
          name
          email
          saldo
        }
        parking {
          _id
          name
          address
          rates {
            car
            motorcycle
          }
        }
      }
      qr_code
      total_cost
      message
    }
  }
`;

const DURATION_OPTIONS = [
  // Short term parking
  { value: 1, label: "1 Hour", price: "1x", category: "short" },
  { value: 2, label: "2 Hours", price: "2x", category: "short" },
  { value: 3, label: "3 Hours", price: "3x", category: "short" },
  { value: 4, label: "4 Hours", price: "4x", category: "short" },
  { value: 6, label: "6 Hours", price: "6x", category: "short" },
  { value: 8, label: "8 Hours", price: "8x", category: "short" },

  // Long term parking
  { value: 12, label: "12 Hours", price: "12x", category: "long" },
  { value: 24, label: "1 Day", price: "24x", category: "long", popular: true },
  { value: 48, label: "2 Days", price: "48x", category: "long" },
  { value: 72, label: "3 Days", price: "72x", category: "long" },
  { value: 168, label: "1 Week", price: "168x", category: "long" },
  { value: 336, label: "2 Weeks", price: "336x", category: "long" },
  { value: 720, label: "1 Month", price: "720x", category: "long" },
];

export default function BookingFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { parking } = route.params;

  const [selectedVehicle, setSelectedVehicle] = useState("car");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [showDurationCategory, setShowDurationCategory] = useState("short");

  // Auto set to current time + 15 minutes
  const getInitialStartTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15); // Add 15 minutes buffer
    return now;
  };

  const [startTime, setStartTime] = useState(getInitialStartTime());
  const [showConfirmTime, setShowConfirmTime] = useState(false);

  const [createBooking, { loading }] = useMutation(CREATE_BOOKING, {
    onCompleted: (data) => {
      Alert.alert(
        "Booking Created! 📝",
        `${
          data.createBooking.message
        }\nTotal Cost: Rp ${data.createBooking.total_cost.toLocaleString()}\n\nPlease complete payment to confirm your booking.`,
        [
          {
            text: "Pay Now",
            onPress: () =>
              navigation.navigate("UserBookingDetailScreen", {
                bookingId: data.createBooking.booking._id,
              }),
          },
          {
            text: "Pay Later",
            onPress: () => navigation.navigate("MyBookingsScreen"),
            style: "cancel",
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Booking Failed", error.message);
    },
  });

  const calculateTotalCost = () => {
    const rate = parking.rates?.[selectedVehicle] || 0;
    return rate * selectedDuration;
  };

  const handleBooking = async () => {
    try {
      await createBooking({
        variables: {
          input: {
            parking_id: parking._id,
            vehicle_type: selectedVehicle,
            start_time: startTime.toISOString(),
            duration: selectedDuration,
          },
        },
      });
    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeOnly = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getQuickTimeOptions = () => {
    const options = [];
    const now = new Date();

    // Current time + 15 minutes
    const option1 = new Date(now);
    option1.setMinutes(now.getMinutes() + 15);
    options.push({
      label: "Start Now",
      sublabel: `${formatTimeOnly(option1)}`,
      value: option1,
      recommended: true,
    });

    // Current time + 30 minutes
    const option2 = new Date(now);
    option2.setMinutes(now.getMinutes() + 30);
    options.push({
      label: "Start in 30 min",
      sublabel: `${formatTimeOnly(option2)}`,
      value: option2,
    });

    // Current time + 1 hour
    const option3 = new Date(now);
    option3.setMinutes(now.getMinutes() + 60);
    options.push({
      label: "Start in 1 hour",
      sublabel: `${formatTimeOnly(option3)}`,
      value: option3,
    });

    // Current time + 2 hours
    const option4 = new Date(now);
    option4.setMinutes(now.getMinutes() + 120);
    options.push({
      label: "Start in 2 hours",
      sublabel: `${formatTimeOnly(option4)}`,
      value: option4,
    });

    return options;
  };

  const handleQuickTimeSelect = (selectedTime) => {
    setStartTime(selectedTime);
    setShowConfirmTime(false);
  };

  const getShortTermOptions = () => {
    return DURATION_OPTIONS.filter((option) => option.category === "short");
  };

  const getLongTermOptions = () => {
    return DURATION_OPTIONS.filter((option) => option.category === "long");
  };

  const getDurationDisplay = (duration) => {
    const option = DURATION_OPTIONS.find((opt) => opt.value === duration);
    return option ? option.label : `${duration} hours`;
  };

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
          <Text style={styles.headerTitle}>Book Parking</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.parkingInfo}>
          <Text style={styles.parkingName}>{parking.name}</Text>
          <Text style={styles.parkingAddress}>{parking.address}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
          <View style={styles.vehicleGrid}>
            <TouchableOpacity
              style={[
                styles.vehicleCard,
                selectedVehicle === "car" && styles.selectedVehicleCard,
              ]}
              onPress={() => setSelectedVehicle("car")}
            >
              <Ionicons
                name="car"
                size={32}
                color={selectedVehicle === "car" ? "#FE7A3A" : "#6B7280"}
              />
              <Text
                style={[
                  styles.vehicleLabel,
                  selectedVehicle === "car" && styles.selectedVehicleLabel,
                ]}
              >
                Car
              </Text>
              <Text style={styles.vehiclePrice}>
                Rp {(parking.rates?.car || 0).toLocaleString()}/hr
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.vehicleCard,
                selectedVehicle === "motorcycle" && styles.selectedVehicleCard,
              ]}
              onPress={() => setSelectedVehicle("motorcycle")}
            >
              <Ionicons
                name="bicycle"
                size={32}
                color={selectedVehicle === "motorcycle" ? "#FE7A3A" : "#6B7280"}
              />
              <Text
                style={[
                  styles.vehicleLabel,
                  selectedVehicle === "motorcycle" &&
                    styles.selectedVehicleLabel,
                ]}
              >
                Motorcycle
              </Text>
              <Text style={styles.vehiclePrice}>
                Rp {(parking.rates?.motorcycle || 0).toLocaleString()}/hr
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start Time Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Start Time</Text>
            <TouchableOpacity
              style={styles.autoTimeButton}
              onPress={() => {
                setStartTime(getInitialStartTime());
              }}
            >
              <Ionicons name="refresh" size={16} color="#FE7A3A" />
              <Text style={styles.autoTimeText}>Now</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => setShowConfirmTime(true)}
          >
            <Ionicons name="time-outline" size={20} color="#FE7A3A" />
            <View style={styles.timeContent}>
              <Text style={styles.timeText}>{formatDateTime(startTime)}</Text>
              <Text style={styles.timeSubtext}>Tap to change</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>

          {/* Duration Category Tabs */}
          <View style={styles.categoryTabs}>
            <TouchableOpacity
              style={[
                styles.categoryTab,
                showDurationCategory === "short" && styles.activeCategoryTab,
              ]}
              onPress={() => setShowDurationCategory("short")}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  showDurationCategory === "short" &&
                    styles.activeCategoryTabText,
                ]}
              >
                Short Term
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryTab,
                showDurationCategory === "long" && styles.activeCategoryTab,
              ]}
              onPress={() => setShowDurationCategory("long")}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  showDurationCategory === "long" &&
                    styles.activeCategoryTabText,
                ]}
              >
                Long Term
              </Text>
            </TouchableOpacity>
          </View>

          {/* Duration Grid */}
          <View style={styles.durationGrid}>
            {(showDurationCategory === "short"
              ? getShortTermOptions()
              : getLongTermOptions()
            ).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.durationCard,
                  selectedDuration === option.value &&
                    styles.selectedDurationCard,
                  option.popular && styles.popularDurationCard,
                ]}
                onPress={() => setSelectedDuration(option.value)}
              >
                {option.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.durationLabel,
                    selectedDuration === option.value &&
                      styles.selectedDurationLabel,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.durationPrice,
                    selectedDuration === option.value &&
                      styles.selectedDurationPrice,
                  ]}
                >
                  {option.price}
                </Text>
                {option.value >= 24 && (
                  <Text style={styles.durationDiscount}>Save more!</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cost Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Summary</Text>
          <View style={styles.costSummary}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Vehicle Type:</Text>
              <Text style={styles.costValue}>
                {selectedVehicle.charAt(0).toUpperCase() +
                  selectedVehicle.slice(1)}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Rate per Hour:</Text>
              <Text style={styles.costValue}>
                Rp {(parking.rates?.[selectedVehicle] || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Duration:</Text>
              <Text style={styles.costValue}>
                {getDurationDisplay(selectedDuration)}
              </Text>
            </View>
            {selectedDuration >= 24 && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Total Hours:</Text>
                <Text style={styles.costValue}>{selectedDuration} hours</Text>
              </View>
            )}
            <View style={[styles.costRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Cost:</Text>
              <Text style={styles.totalValue}>
                Rp {calculateTotalCost().toLocaleString()}
              </Text>
            </View>
            {selectedDuration >= 168 && (
              <View style={styles.longTermNotice}>
                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                <Text style={styles.longTermNoticeText}>
                  Long-term parking rates may apply. Please confirm with parking
                  owner.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.totalInfo}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalAmount}>
            Rp {calculateTotalCost().toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBooking}
          disabled={loading}
        >
          <LinearGradient
            colors={["#FF9A62", "#FE7A3A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Time Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showConfirmTime}
        onRequestClose={() => setShowConfirmTime(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowConfirmTime(false)}>
                <Text style={styles.modalButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Start Time</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.optionsList}>
              {getQuickTimeOptions().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    option.recommended && styles.recommendedOption,
                  ]}
                  onPress={() => handleQuickTimeSelect(option.value)}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionTextContainer}>
                      <Text
                        style={[
                          styles.optionText,
                          option.recommended && styles.recommendedText,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.optionSubtext}>
                        {option.sublabel}
                      </Text>
                    </View>
                    {option.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>
                          Recommended
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
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
  parkingInfo: {
    alignItems: "center",
  },
  parkingName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 15,
  },
  vehicleGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    padding: 20,
    alignItems: "center",
    marginHorizontal: 5,
  },
  selectedVehicleCard: {
    borderColor: "#FE7A3A",
    backgroundColor: "#FFF5F0",
  },
  vehicleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  selectedVehicleLabel: {
    color: "#FE7A3A",
  },
  vehiclePrice: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
  },
  timeText: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    marginLeft: 10,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  durationCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  selectedDurationCard: {
    borderColor: "#FE7A3A",
    backgroundColor: "#FFF5F0",
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  selectedDurationLabel: {
    color: "#FE7A3A",
  },
  durationPrice: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  selectedDurationPrice: {
    color: "#FE7A3A",
  },
  costSummary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FE7A3A",
  },
  bottomSpacing: {
    height: 100,
  },
  bottomAction: {
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
  totalInfo: {
    flex: 1,
  },
  totalText: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  bookButton: {
    marginLeft: 15,
  },
  bookGradient: {
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  modalButton: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  confirmButton: {
    color: "#FE7A3A",
    fontWeight: "600",
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 2,
  },
  optionSubtext: {
    fontSize: 14,
    color: "#6B7280",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  autoTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FE7A3A",
  },
  autoTimeText: {
    fontSize: 12,
    color: "#FE7A3A",
    fontWeight: "600",
    marginLeft: 4,
  },
  timeContent: {
    flex: 1,
    marginLeft: 10,
  },
  timeSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionTextContainer: {
    flex: 1,
  },
  recommendedOption: {
    backgroundColor: "#FFF5F0",
    borderLeftWidth: 3,
    borderLeftColor: "#FE7A3A",
  },
  recommendedText: {
    color: "#FE7A3A",
    fontWeight: "700",
  },
  recommendedBadge: {
    backgroundColor: "#FE7A3A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  categoryTabs: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
    marginBottom: 15,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeCategoryTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeCategoryTabText: {
    color: "#FE7A3A",
  },
  popularDurationCard: {
    borderColor: "#3B82F6",
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  durationDiscount: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "500",
    marginTop: 2,
  },
  longTermNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  longTermNoticeText: {
    fontSize: 12,
    color: "#3B82F6",
    marginLeft: 6,
    flex: 1,
  },
});
