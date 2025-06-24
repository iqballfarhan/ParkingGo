import React, { useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

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

const ParkingCard = ({ item, onPress, formatDistance }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const isOpen = isParkingOpen(item.operational_hours);

  return (
    <Animated.View
      style={[
        styles.parkingCard,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                item.images?.[0] ||
                "https://via.placeholder.com/400x200?text=Parking",
            }}
            style={styles.parkingImage}
          />
          <Animated.View
            style={[
              styles.imageOverlay,
              {
                opacity: overlayOpacity,
              },
            ]}
          />

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              isOpen ? styles.openBadge : styles.closedBadge,
            ]}
          >
            <Text style={styles.statusText}>{isOpen ? "OPEN" : "CLOSED"}</Text>
          </View>

          {/* Rating Badge */}
          {item.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="white" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}

          {/* Distance Badge */}
          {item.calculatedDistance !== undefined && (
            <View style={styles.nearBadge}>
              <Text style={styles.nearBadgeText}>
                {formatDistance(item.calculatedDistance)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.parkingCardContent}>
          <Text style={styles.parkingCardName}>{item.name}</Text>
          <Text style={styles.parkingCardAddress} numberOfLines={1}>
            {item.address}
          </Text>

          <View style={styles.parkingCardDetails}>
            <View style={styles.parkingCardDetail}>
              <Ionicons name="car-outline" size={14} color="#6B7280" />
              <Text style={styles.parkingCardDetailText}>
                {item.available?.car || 0}/{item.capacity?.car || 0}
              </Text>
            </View>
            <View style={styles.parkingCardDetail}>
              <Ionicons name="bicycle-outline" size={14} color="#6B7280" />
              <Text style={styles.parkingCardDetailText}>
                {item.available?.motorcycle || 0}/
                {item.capacity?.motorcycle || 0}
              </Text>
            </View>
          </View>

          <View style={styles.parkingCardPrice}>
            <Text style={styles.parkingCardPriceValue}>
              Rp{" "}
              {Math.min(
                item.rates?.car || 0,
                item.rates?.motorcycle || 0
              ).toLocaleString()}
            </Text>
            <Text style={styles.parkingCardPriceUnit}>/hour</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  parkingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    width: width * 0.65,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  parkingImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.8)",
  },
  closedBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.8)",
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  parkingCardContent: {
    padding: 12,
  },
  parkingCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  parkingCardAddress: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  parkingCardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  parkingCardDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  parkingCardDetailText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 3,
  },
  parkingCardPrice: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  parkingCardPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FE7A3A",
  },
  parkingCardPriceUnit: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 2,
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(254, 122, 58, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 2,
  },
  nearBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(30, 58, 138, 0.8)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  nearBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});

export default ParkingCard;
