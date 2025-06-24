import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { gql, useMutation, useQuery } from "@apollo/client";

const UPDATE_PARKING_MUTATION = gql`
  mutation UpdateParking($updateParkingId: ID!, $input: UpdateParkingInput!) {
    updateParking(id: $updateParkingId, input: $input) {
      _id
      name
      address
      location {
        type
        coordinates
      }
      owner_id
      owner {
        _id
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
      capacity {
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
    }
  }
`;

const GET_ALL_PARKING = gql`
  query GetMyParkings {
    getMyParkings {
      _id
      name
      address
      location {
        type
        coordinates
      }
      owner_id
      owner {
        _id
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

export default function EditParkingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { parkingId } = route.params;

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [images, setImages] = useState("");
  const [startHour, setStartHour] = useState(new Date());
  const [endHour, setEndHour] = useState(new Date());
  const [location, setLocation] = useState({
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Capacity fields
  const [carCapacity, setCarCapacity] = useState("");
  const [motorcycleCapacity, setMotorcycleCapacity] = useState("");

  // Rate fields
  const [carRate, setCarRate] = useState("");
  const [motorcycleRate, setMotorcycleRate] = useState("");

  // Facilities
  const [facilities, setFacilities] = useState("");

  // UI state
  const [errors, setErrors] = useState({});
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [isMapModalVisible, setMapModalVisible] = useState(false);
  const [mapAddress, setMapAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Get existing parking data
  const { data: parkingData, loading: loadingData } = useQuery(
    GET_PARKING_DETAIL,
    {
      variables: { getParkingId: parkingId },
      onCompleted: (data) => {
        if (data?.getParking) {
          const parking = data.getParking;
          // Populate form with existing data
          setName(parking.name || "");
          setAddress(parking.address || "");
          setImages(parking.images ? parking.images.join(", ") : "");
          setCarCapacity(parking.capacity?.car?.toString() || "");
          setMotorcycleCapacity(parking.capacity?.motorcycle?.toString() || "");
          setCarRate(parking.rates?.car?.toString() || "");
          setMotorcycleRate(parking.rates?.motorcycle?.toString() || "");
          setFacilities(
            parking.facilities ? parking.facilities.join(", ") : ""
          );

          // Set operational hours
          if (parking.operational_hours?.open) {
            const [openHour, openMinute] =
              parking.operational_hours.open.split(":");
            const openDate = new Date();
            openDate.setHours(parseInt(openHour), parseInt(openMinute));
            setStartHour(openDate);
          }
          if (parking.operational_hours?.close) {
            const [closeHour, closeMinute] =
              parking.operational_hours.close.split(":");
            const closeDate = new Date();
            closeDate.setHours(parseInt(closeHour), parseInt(closeMinute));
            setEndHour(closeDate);
          }

          // Set location
          if (parking.location?.coordinates) {
            setLocation({
              latitude: parking.location.coordinates[1],
              longitude: parking.location.coordinates[0],
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      },
    }
  );

  // Update mutation
  const [updateParking, { loading: isLoading }] = useMutation(
    UPDATE_PARKING_MUTATION,
    {
      update(cache, { data }) {
        try {
          if (data && data.updateParking) {
            // Update the single parking in cache
            cache.writeQuery({
              query: GET_PARKING_DETAIL,
              variables: { getParkingId: parkingId },
              data: {
                getParking: data.updateParking,
              },
            });

            // Update the parking list in cache
            const existingData = cache.readQuery({ query: GET_ALL_PARKING });
            if (existingData && existingData.getMyParkings) {
              const updatedParkings = existingData.getMyParkings.map(
                (parking) =>
                  parking._id === parkingId ? data.updateParking : parking
              );

              cache.writeQuery({
                query: GET_ALL_PARKING,
                data: {
                  getMyParkings: updatedParkings,
                },
              });
            }
          }
        } catch (error) {
          console.error("Cache update error:", error);
        }
      },
      onCompleted: (data) => {
        Alert.alert("Success", "Parking updated successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Navigate to DashboardScreen instead of just going back
              navigation.navigate("DashboardScreen");
            },
          },
        ]);
      },
      onError: (error) => {
        console.error("Update error:", error);
        Alert.alert("Error", error.message || "Failed to update parking");
      },
    }
  );

  const formatTime24 = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleStartTimeConfirm = (time) => {
    setStartHour(time);
    setStartTimePickerVisible(false);
  };

  const handleEndTimeConfirm = (time) => {
    setEndHour(time);
    setEndTimePickerVisible(false);
  };

  const geocodeAddress = async (addressText) => {
    if (!addressText.trim()) {
      Alert.alert("Error", "Please enter an address");
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressText
        )}&limit=1`
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newLocation = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setLocation(newLocation);
        Alert.alert("Success", "Address found and location updated!");
      } else {
        Alert.alert(
          "Error",
          "Address not found. Please try a different address or manually select on map."
        );
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      Alert.alert(
        "Error",
        "Failed to find address. Please try again or select manually on map."
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapConfirm = () => {
    setMapModalVisible(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!address.trim()) newErrors.address = "Address is required";
    if (!images.trim()) newErrors.images = "Image URL is required";

    const carCapacityNum = parseInt(carCapacity);
    if (isNaN(carCapacityNum) || carCapacityNum < 0) {
      newErrors.carCapacity = "Car capacity must be a non-negative number";
    }

    const motorcycleCapacityNum = parseInt(motorcycleCapacity);
    if (isNaN(motorcycleCapacityNum) || motorcycleCapacityNum < 0) {
      newErrors.motorcycleCapacity =
        "Motorcycle capacity must be a non-negative number";
    }

    if (carCapacityNum === 0 && motorcycleCapacityNum === 0) {
      newErrors.capacity = "At least one vehicle type must have capacity > 0";
    }

    const carRateNum = parseFloat(carRate);
    if (carCapacityNum > 0 && (isNaN(carRateNum) || carRateNum <= 0)) {
      newErrors.carRate = "Car rate must be a positive number";
    }

    const motorcycleRateNum = parseFloat(motorcycleRate);
    if (
      motorcycleCapacityNum > 0 &&
      (isNaN(motorcycleRateNum) || motorcycleRateNum <= 0)
    ) {
      newErrors.motorcycleRate = "Motorcycle rate must be a positive number";
    }

    if (endHour <= startHour) {
      newErrors.hours = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const facilitiesArray = facilities
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const imagesArray = images
        .split(",")
        .map((img) => img.trim())
        .filter((img) => img.length > 0);

      // Format input to match exact UpdateParkingInput schema based on Apollo server test
      const input = {
        name: name.trim(),
        address: address.trim(),
        rates: {
          car: parseFloat(carRate) || 0,
          motorcycle: parseFloat(motorcycleRate) || 0,
        },
        operational_hours: {
          open: formatTime24(startHour),
          close: formatTime24(endHour),
        },
        facilities: facilitiesArray,
        images: imagesArray,
        status: "active", // Add status field as shown in the test
      };

      console.log(
        "Submitting update with input:",
        JSON.stringify(input, null, 2)
      );

      await updateParking({
        variables: {
          updateParkingId: parkingId,
          input,
        },
        refetchQueries: [
          { query: GET_ALL_PARKING },
          { query: GET_PARKING_DETAIL, variables: { getParkingId: parkingId } },
        ],
      });
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("Error", error.message || "Failed to update parking");
    }
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FE7A3A" />
          <Text style={styles.loadingText}>Loading parking data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
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
            <Text style={styles.headerTitle}>Edit Parking</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parking Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter parking name"
              value={name}
              onChangeText={setName}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Address Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.address && styles.inputError,
              ]}
              placeholder="Enter complete address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>

          {/* Images Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Images URL</Text>
            <TextInput
              style={[styles.input, errors.images && styles.inputError]}
              placeholder="Enter image URLs separated by commas"
              value={images}
              onChangeText={setImages}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>
              Separate multiple image URLs with commas
            </Text>
            {errors.images && (
              <Text style={styles.errorText}>{errors.images}</Text>
            )}
          </View>

          {/* Operating Hours */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Hours</Text>
            <View style={styles.timeInputRow}>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setStartTimePickerVisible(true)}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <Text style={styles.timeText}>{formatTime(startHour)}</Text>
              </TouchableOpacity>

              <Text style={styles.toText}>to</Text>

              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setEndTimePickerVisible(true)}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <Text style={styles.timeText}>{formatTime(endHour)}</Text>
              </TouchableOpacity>
            </View>
            {errors.hours && (
              <Text style={styles.errorText}>{errors.hours}</Text>
            )}

            <DateTimePickerModal
              isVisible={isStartTimePickerVisible}
              mode="time"
              onConfirm={handleStartTimeConfirm}
              onCancel={() => setStartTimePickerVisible(false)}
            />

            <DateTimePickerModal
              isVisible={isEndTimePickerVisible}
              mode="time"
              onConfirm={handleEndTimeConfirm}
              onCancel={() => setEndTimePickerVisible(false)}
            />
          </View>

          {/* Location Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TouchableOpacity
              style={styles.mapPreview}
              onPress={() => setMapModalVisible(true)}
            >
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.mapPreviewInner}
                region={location}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                />
              </MapView>

              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>Tap to Edit Location</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.locationInfo}>
              <View style={styles.locationDetail}>
                <Text style={styles.locationLabel}>Latitude</Text>
                <Text style={styles.locationValue}>
                  {location.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.locationDetail}>
                <Text style={styles.locationLabel}>Longitude</Text>
                <Text style={styles.locationValue}>
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>

          {/* Capacity Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Capacity</Text>

            <View style={styles.capacityRow}>
              <View style={styles.capacityField}>
                <Text style={styles.subLabel}>Car Slots</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.carCapacity && styles.inputError,
                  ]}
                  placeholder="0"
                  value={carCapacity}
                  onChangeText={setCarCapacity}
                  keyboardType="numeric"
                />
                {errors.carCapacity && (
                  <Text style={styles.errorText}>{errors.carCapacity}</Text>
                )}
              </View>

              <View style={styles.capacityField}>
                <Text style={styles.subLabel}>Motorcycle Slots</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.motorcycleCapacity && styles.inputError,
                  ]}
                  placeholder="0"
                  value={motorcycleCapacity}
                  onChangeText={setMotorcycleCapacity}
                  keyboardType="numeric"
                />
                {errors.motorcycleCapacity && (
                  <Text style={styles.errorText}>
                    {errors.motorcycleCapacity}
                  </Text>
                )}
              </View>
            </View>

            {errors.capacity && (
              <Text style={styles.errorText}>{errors.capacity}</Text>
            )}
          </View>

          {/* Rates Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hourly Rates (Rp)</Text>

            <View style={styles.capacityRow}>
              <View style={styles.capacityField}>
                <Text style={styles.subLabel}>Car Rate</Text>
                <TextInput
                  style={[styles.input, errors.carRate && styles.inputError]}
                  placeholder="0"
                  value={carRate}
                  onChangeText={setCarRate}
                  keyboardType="numeric"
                  editable={parseInt(carCapacity) > 0}
                />
                {errors.carRate && (
                  <Text style={styles.errorText}>{errors.carRate}</Text>
                )}
              </View>

              <View style={styles.capacityField}>
                <Text style={styles.subLabel}>Motorcycle Rate</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.motorcycleRate && styles.inputError,
                  ]}
                  placeholder="0"
                  value={motorcycleRate}
                  onChangeText={setMotorcycleRate}
                  keyboardType="numeric"
                  editable={parseInt(motorcycleCapacity) > 0}
                />
                {errors.motorcycleRate && (
                  <Text style={styles.errorText}>{errors.motorcycleRate}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Facilities Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Facilities (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter facilities separated by commas (e.g., CCTV, Security, Toilet)"
              value={facilities}
              onChangeText={setFacilities}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>
              Separate multiple facilities with commas
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Update Parking</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#FFF"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Map Modal */}
        <Modal
          visible={isMapModalVisible}
          animationType="slide"
          onRequestClose={() => setMapModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setMapModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Location</Text>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleMapConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>

            {/* Address Input Section */}
            <View style={styles.addressInputSection}>
              <Text style={styles.addressInputLabel}>Enter Address:</Text>
              <View style={styles.addressInputRow}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Enter address to find location"
                  value={mapAddress}
                  onChangeText={setMapAddress}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.geocodeButton,
                    isGeocoding && styles.geocodeButtonDisabled,
                  ]}
                  onPress={() => geocodeAddress(mapAddress)}
                  disabled={isGeocoding}
                >
                  {isGeocoding ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="search" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalBody}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={location}
                onRegionChangeComplete={setLocation}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  draggable
                  onDragEnd={(e) => {
                    setLocation({
                      ...location,
                      latitude: e.nativeEvent.coordinate.latitude,
                      longitude: e.nativeEvent.coordinate.longitude,
                    });
                  }}
                />
              </MapView>

              <View style={styles.coordinatesDisplay}>
                <Text style={styles.coordinatesText}>
                  Coordinates: [{location.longitude.toFixed(6)},{" "}
                  {location.latitude.toFixed(6)}]
                </Text>
              </View>

              <View style={styles.mapHelperText}>
                <Text style={styles.mapHelperTextContent}>
                  Enter address above or drag the map to position the marker at
                  your parking location
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1E293B",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: "#1E293B",
  },
  toText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  mapPreview: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mapPreviewInner: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapOverlayText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  locationInfo: {
    flexDirection: "row",
    marginTop: 8,
  },
  locationDetail: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  locationValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  capacityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  capacityField: {
    flex: 1,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
    fontStyle: "italic",
  },
  submitButton: {
    backgroundColor: "#FE7A3A",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#FE7A3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  modalConfirmButton: {
    padding: 8,
  },
  modalConfirmText: {
    color: "#FE7A3A",
    fontWeight: "600",
    fontSize: 16,
  },
  modalBody: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  addressInputSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  addressInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  addressInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  addressInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    maxHeight: 80,
  },
  geocodeButton: {
    backgroundColor: "#FE7A3A",
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 48,
  },
  geocodeButtonDisabled: {
    opacity: 0.7,
  },
  coordinatesDisplay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 12,
  },
  coordinatesText: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  mapHelperText: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    padding: 12,
  },
  mapHelperTextContent: {
    color: "#FFFFFF",
    textAlign: "center",
  },
});
