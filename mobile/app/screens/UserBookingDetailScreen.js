import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery, useMutation } from "@apollo/client";
import QRCode from "react-native-qrcode-svg";

const GET_BOOKING = gql`
  query GetBooking($getBookingId: ID!) {
    getBooking(id: $getBookingId) {
      _id
      user_id
      user {
        email
        name
        role
        saldo
      }
      parking_id
      parking {
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
        owner {
          _id
          name
          email
          role
        }
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

// Add mutations for chat functionality
const CREATE_PRIVATE_ROOM = gql`
  mutation CreatePrivateRoom($input: CreatePrivateRoomInput!) {
    createPrivateRoom(input: $input) {
      _id
      name
      participants {
        _id
        name
        email
        role
      }
      created_at
    }
  }
`;

const GET_USER_CHATS = gql`
  query GetMyRooms {
    getMyRooms {
      _id
      name
      participants {
        _id
        name
        email
        role
      }
      last_message {
        _id
        message
        created_at
        sender {
          _id
          name
        }
      }
      created_at
    }
  }
`;

const PROCESS_PAYMENT = gql`
  mutation ProcessBookingPayment($bookingId: ID!) {
    processBookingPayment(bookingId: $bookingId) {
      success
      message
      booking {
        _id
        status
        updated_at
      }
    }
  }
`;

const CONFIRM_BOOKING = gql`
  mutation ConfirmBooking($confirmBookingId: ID!) {
    confirmBooking(id: $confirmBookingId) {
      _id
      user {
        email
        name
        role
        saldo
      }
      parking_id
      parking {
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

const GENERATE_ENTRY_QR = gql`
  mutation GenerateEntryQR($bookingId: ID!) {
    generateEntryQR(bookingId: $bookingId) {
      qrCode
      qrType
      expiresAt
      instructions
      booking {
        _id
        user {
          email
          name
          role
          saldo
        }
        parking {
          name
          address
          location {
            type
            coordinates
          }
          images
          status
          rating
          review_count
        }
        status
        entry_qr
        updated_at
      }
    }
  }
`;

const CANCEL_BOOKING = gql`
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) {
      refund_amount
      message
      user {
        _id
        email
        name
        saldo
      }
      booking {
        _id
        user {
          name
          email
        }
        parking {
          name
          address
        }
        vehicle_type
        start_time
        duration
        cost
        status
        updated_at
      }
    }
  }
`;

const GENERATE_EXIT_QR = gql`
  mutation GenerateExitQR($bookingId: ID!) {
    generateExitQR(bookingId: $bookingId) {
      qrCode
      qrType
      expiresAt
      instructions
      booking {
        _id
        status
        exit_qr
        updated_at
      }
    }
  }
`;

export default function UserBookingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params;
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentQRData, setCurrentQRData] = useState(null);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);

  // Add chat mutations
  const [createPrivateRoom] = useMutation(CREATE_PRIVATE_ROOM, {
    errorPolicy: "all",
    onError: (error) => {
      console.log("Create chat room error (silent):", error.message);
    },
  });

  const { data, loading, error, refetch } = useQuery(GET_BOOKING, {
    variables: { getBookingId: bookingId },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      const currentBooking = data?.getBooking;
      if (currentBooking) {
        if (previousStatus && previousStatus !== currentBooking.status) {
          handleStatusChange(previousStatus, currentBooking.status);
        }
        setPreviousStatus(currentBooking.status);
      }
    },
    onError: (error) => {
      // Error handling without console log
    },
  });

  const handleStatusChange = (oldStatus, newStatus) => {
    let message = "";
    let shouldNavigateBack = false;
    let targetStatus = newStatus;

    switch (newStatus) {
      case "active":
        if (oldStatus === "confirmed") {
          message =
            "🎉 Entry QR Successfully Scanned!\n\nYou are now parked. Status updated to Active.";
          shouldNavigateBack = true;
          targetStatus = "active";
        }
        break;
      case "completed":
        if (oldStatus === "active") {
          message =
            "✅ Exit QR Successfully Scanned!\n\nParking completed successfully!";
          shouldNavigateBack = true;
          targetStatus = "completed";
        }
        break;
      case "cancelled":
        message = "❌ Booking has been cancelled.";
        shouldNavigateBack = true;
        targetStatus = "pending";
        break;
    }

    if (message && shouldNavigateBack) {
      setQrModalVisible(false);
      setCurrentQRData(null);

      Alert.alert("Status Updated", message, [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("MyBookingsScreen", {
              autoSelectStatus: targetStatus,
              forceRefresh: true,
            });
          },
        },
      ]);
    }
  };

  const [processPayment, { loading: paymentLoading }] = useMutation(
    PROCESS_PAYMENT,
    {
      onCompleted: (data) => {
        if (data.processBookingPayment.success) {
          Alert.alert(
            "Payment Success! 🎉",
            data.processBookingPayment.message,
            [{ text: "OK", onPress: () => refetch() }]
          );
        } else {
          Alert.alert("Payment Failed", data.processBookingPayment.message);
        }
      },
      onError: (error) => {
        Alert.alert("Payment Error", error.message);
      },
    }
  );

  const [confirmBooking, { loading: confirmLoading }] = useMutation(
    CONFIRM_BOOKING,
    {
      onCompleted: (data) => {
        Alert.alert(
          "Payment Success! 🎉",
          `Booking confirmed! Your balance: Rp ${data.confirmBooking.user.saldo.toLocaleString()}`,
          [
            {
              text: "OK",
              onPress: () => {
                generateEntryQR({
                  variables: { bookingId: data.confirmBooking._id },
                  onCompleted: () => {
                    navigation.navigate("MyBookingsScreen", {
                      autoSelectStatus: "confirmed",
                    });
                  },
                });
              },
            },
          ]
        );
      },
      onError: () => {
        // ✅ FIX: Silent error handling for cache issues
      },
      // ✅ FIX: Simplified cache update - just evict everything
      update: (cache) => {
        try {
          cache.evict({ fieldName: "getMyActiveBookings" });
          cache.evict({ fieldName: "getBooking" });
          cache.gc();
        } catch (error) {
          // Silent cache error handling
        }
      },
      errorPolicy: "ignore", // ✅ ADD: Ignore all errors including cache merge
    }
  );

  const [generateEntryQR, { loading: qrLoading }] = useMutation(
    GENERATE_ENTRY_QR,
    {
      onCompleted: (data) => {
        const qrData = data.generateEntryQR;
        showQRCode(
          qrData.qrCode,
          "Show this QR code at parking entrance for scanning. This booking will become active after scanning."
        );
        refetch();
      },
      onError: (error) => {
        Alert.alert("QR Generation Failed", error.message);
      },
      update: (cache, { data }) => {
        if (data?.generateEntryQR?.booking) {
          const existingBooking = cache.readQuery({
            query: GET_BOOKING,
            variables: { getBookingId: bookingId },
          });

          if (existingBooking?.getBooking) {
            const updatedBooking = {
              ...existingBooking.getBooking,
              entry_qr: data.generateEntryQR.qrCode,
              updated_at: data.generateEntryQR.booking.updated_at,
            };

            cache.writeQuery({
              query: GET_BOOKING,
              variables: { getBookingId: bookingId },
              data: {
                getBooking: updatedBooking,
              },
            });
          }
          cache.evict({ fieldName: "getMyActiveBookings" });
          cache.gc();
        }
      },
    }
  );

  const [cancelBooking, { loading: cancelLoading }] = useMutation(
    CANCEL_BOOKING,
    {
      onCompleted: (data) => {
        const { refund_amount, message, user, booking } = data.cancelBooking;

        Alert.alert(
          "🎉 Booking Cancelled!",
          `${message}\n\nRefund: Rp ${
            refund_amount?.toLocaleString() || 0
          }\nCurrent Balance: Rp ${user?.saldo?.toLocaleString() || 0}`,
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("MyBookingsScreen", {
                  autoSelectStatus: "pending",
                });
              },
            },
          ]
        );
      },
      onError: (error) => {
        let errorMessage = "Terjadi kesalahan saat membatalkan booking";

        if (error.graphQLErrors && error.graphQLErrors.length > 0) {
          errorMessage = error.graphQLErrors[0].message;
        } else if (error.networkError) {
          if (error.networkError.statusCode === 400) {
            errorMessage = "Permintaan tidak valid. Silakan coba lagi.";
          } else if (error.networkError.statusCode === 401) {
            errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
          } else if (error.networkError.statusCode >= 500) {
            errorMessage = "Server sedang bermasalah. Silakan coba lagi nanti.";
          } else {
            errorMessage = `Network error: ${error.networkError.message}`;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        Alert.alert("❌ Cancellation Failed", errorMessage);
      },
      update: (cache, { data }) => {
        if (data?.cancelBooking?.booking) {
          try {
            const existingData = cache.readQuery({
              query: GET_BOOKING,
              variables: { getBookingId: bookingId },
            });

            if (existingData?.getBooking) {
              const updatedBooking = {
                ...existingData.getBooking,
                ...data.cancelBooking.booking,
                user: {
                  ...existingData.getBooking.user,
                  saldo: data.cancelBooking.user.saldo,
                },
                status: "cancelled",
                updated_at:
                  data.cancelBooking.booking.updated_at ||
                  new Date().toISOString(),
              };

              cache.writeQuery({
                query: GET_BOOKING,
                variables: { getBookingId: bookingId },
                data: {
                  getBooking: updatedBooking,
                },
              });
            } else {
              cache.evict({ fieldName: "getBooking" });
            }
            cache.evict({ fieldName: "getMyActiveBookings" });
            cache.evict({ fieldName: "getMyBookingHistory" });
          } catch (cacheError) {
            cache.evict({
              id: cache.identify({ __typename: "Booking", _id: bookingId }),
            });
            cache.evict({ fieldName: "getMyActiveBookings" });
            cache.evict({ fieldName: "getMyBookingHistory" });
          }
        }
      },
    }
  );

  const booking = data?.getBooking;
  const landowner = booking?.parking?.owner;

  // Add chat functionality
  const handleChatWithOwner = async () => {
    if (!landowner || !landowner._id) {
      Alert.alert("Error", "Landowner information not available");
      return;
    }

    try {
      console.log("Creating chat room with landowner:", landowner.name);

      const response = await createPrivateRoom({
        variables: {
          input: {
            participant_id: landowner._id,
          },
        },
      });

      if (response.data?.createPrivateRoom) {
        // Navigate to chat room with landowner's name
        navigation.navigate("ChatRoomScreen", {
          roomId: response.data.createPrivateRoom._id,
          contactName: landowner.name,
          bookingContext: {
            bookingId: booking._id,
            parkingName: booking.parking.name,
            vehicleType: booking.vehicle_type,
            startTime: booking.start_time,
            duration: booking.duration,
          },
        });
      } else if (response.errors) {
        // Check if room already exists error
        const errorMessage =
          response.errors[0]?.message || "Failed to create chat room";

        if (
          errorMessage.includes("already exists") ||
          errorMessage.includes("sudah ada")
        ) {
          // Room exists, try to find it and navigate
          console.log("Chat room already exists, navigating...");
          navigation.navigate("ChatRoomScreen", {
            roomId: "existing", // We'll handle this in ChatRoomScreen
            contactName: landowner.name,
            landownerId: landowner._id,
            bookingContext: {
              bookingId: booking._id,
              parkingName: booking.parking.name,
              vehicleType: booking.vehicle_type,
              startTime: booking.start_time,
              duration: booking.duration,
            },
          });
        } else {
          Alert.alert("Chat Error", errorMessage);
        }
      }
    } catch (error) {
      console.error("Error creating chat room:", error);
      Alert.alert("Error", "Failed to start chat. Please try again.");
    }
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
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (hours) => {
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (hours < 168) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? "s" : ""}`;
    } else {
      const weeks = Math.floor(hours / 168);
      return `${weeks} week${weeks > 1 ? "s" : ""}`;
    }
  };

  const calculateEndTime = (startTime, duration) => {
    const start = new Date(parseInt(startTime));
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    return end;
  };

  const handlePayment = async () => {
    Alert.alert(
      "Confirm Payment",
      `Pay Rp ${booking.cost.toLocaleString()} for this booking?\n\nCurrent balance: Rp ${booking.user.saldo.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: () => {
            if (booking.user.saldo < booking.cost) {
              Alert.alert(
                "Insufficient Balance",
                `You need Rp ${booking.cost.toLocaleString()} but only have Rp ${booking.user.saldo.toLocaleString()}.\n\nPlease top up your balance first.`,
                [
                  {
                    text: "OK",
                    onPress: () => navigation.navigate("TopUpScreen"),
                  },
                ]
              );
              return;
            }
            confirmBooking({ variables: { confirmBookingId: booking._id } });
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (booking.status !== "pending") {
      Alert.alert(
        "❌ Cannot Cancel",
        `Booking with status "${booking.status}" cannot be cancelled. Only pending bookings can be cancelled.`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel this booking?
      \n\n✅ No charges will be applied since payment hasn't been made.`,
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await cancelBooking({
                variables: { id: booking._id },
                errorPolicy: "all",
              });
            } catch (mutationError) {
              // Error handled by onError callback
            }
          },
        },
      ]
    );
  };

  const handleGenerateEntryQR = () => {
    Alert.alert(
      "Generate Entry QR Code",
      "Generate QR code for parking entry? This QR will be valid for 24 hours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: () => {
            generateEntryQR({ variables: { bookingId: booking._id } });
          },
        },
      ]
    );
  };

  const showQRCode = (qrCode, instructions) => {
    setCurrentQRData({ qrCode, instructions });
    setQrModalVisible(true);
  };

  const closeQRModal = () => {
    setQrModalVisible(false);
    setCurrentQRData(null);
  };

  const handleQRModalDone = () => {
    setQrModalVisible(false);
    setCurrentQRData(null);

    let targetStatus = "confirmed";

    if (booking) {
      switch (booking.status) {
        case "confirmed":
          targetStatus = "confirmed";
          break;
        case "active":
          targetStatus = "active";
          break;
        case "completed":
          targetStatus = "completed";
          break;
        default:
          targetStatus = booking.status;
      }
    }

    navigation.navigate("MyBookingsScreen", {
      autoSelectStatus: targetStatus,
      forceRefresh: true,
    });
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "pending":
        return "Complete payment to proceed";
      case "confirmed":
        return "Generate QR code to enter parking";
      case "active":
        return "Currently parked - Generate exit QR when ready to leave";
      case "completed":
        return "Parking completed";
      case "cancelled":
        return "Booking cancelled";
      default:
        return "";
    }
  };

  // ✅ ADD: Manual refresh function for better control
  const handleManualRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      // Error handled by onError callback
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // ✅ ENHANCED: Only refresh when screen comes into focus, not continuously
      handleManualRefresh();
      if (booking && !previousStatus) {
        setPreviousStatus(booking.status);
      }
    }, [booking, previousStatus])
  );

  React.useEffect(() => {
    return () => {
      // Component cleanup
    };
  }, []);

  // ✅ ADD: Timer calculation for active bookings
  const calculateTimeRemaining = (startTime, duration) => {
    const start = new Date(parseInt(startTime));
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    const now = new Date();
    const remaining = end.getTime() - now.getTime();

    return remaining > 0 ? remaining : 0;
  };

  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return "Time expired";

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // ✅ ADD: Timer effect for active bookings
  useEffect(() => {
    if (booking && booking.status === "active") {
      const updateTimer = () => {
        const remaining = calculateTimeRemaining(
          booking.start_time,
          booking.duration
        );
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
      };

      updateTimer(); // Initial calculation
      const interval = setInterval(updateTimer, 1000);
      setTimerInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setTimeRemaining(null);
    }
  }, [booking?.status, booking?.start_time, booking?.duration]);

  // ✅ ADD: Generate Exit QR handler
  const handleGenerateExitQR = () => {
    Alert.alert(
      "Generate Exit QR Code",
      "Generate QR code for parking exit? This QR will be valid for 2 hours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: () => {
            generateExitQR({ variables: { bookingId: booking._id } });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Error loading booking details</Text>
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
          <Text style={styles.headerTitle}>Booking Details</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleManualRefresh}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusHeader,
              { backgroundColor: getStatusColor(booking.status) },
            ]}
          >
            <Ionicons
              name={getStatusIcon(booking.status)}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>

            {/* ✅ ADD: Timer in status header for active bookings */}
            {booking.status === "active" && (
              <View style={styles.timerInHeader}>
                <Ionicons name="timer-outline" size={16} color="#FFFFFF" />
                <Text style={styles.timerInHeaderText}>
                  {timeRemaining !== null
                    ? formatTimeRemaining(timeRemaining)
                    : "Loading..."}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statusBody}>
            <Text style={styles.bookingId}>
              Booking ID: #{booking._id.slice(-8)}
            </Text>
            <Text style={styles.bookingDate}>
              Created: {formatDateTime(booking.created_at)}
            </Text>

            {/* ✅ ADD: Timer warning/expired messages in status body */}
            {booking.status === "active" && (
              <>
                {timeRemaining <= 300000 && timeRemaining > 0 && (
                  <View style={styles.warningInCard}>
                    <Ionicons name="warning" size={14} color="#F59E0B" />
                    <Text style={styles.warningInCardText}>
                      Parking time almost up!
                    </Text>
                  </View>
                )}

                {timeRemaining <= 0 && (
                  <View style={styles.expiredInCard}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.expiredInCardText}>
                      Time expired - Exit soon!
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Parking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parking Location</Text>
          <View style={styles.parkingCard}>
            <Image
              source={{
                uri:
                  booking.parking.images[0] ||
                  "https://via.placeholder.com/300x150?text=Parking",
              }}
              style={styles.parkingImage}
            />
            <View style={styles.parkingInfo}>
              <Text style={styles.parkingName}>{booking.parking.name}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.parkingAddress}>
                  {booking.parking.address}
                </Text>
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>
                  {booking.parking.rating.toFixed(1)} (
                  {booking.parking.review_count} reviews)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="car" size={16} color="#FE7A3A" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Vehicle Type</Text>
                <Text style={styles.detailValue}>
                  {booking.vehicle_type.charAt(0).toUpperCase() +
                    booking.vehicle_type.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={16} color="#FE7A3A" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Start Time</Text>
                <Text style={styles.detailValue}>
                  {formatDateTime(booking.start_time)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="hourglass" size={16} color="#FE7A3A" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {formatDuration(booking.duration)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="flag" size={16} color="#FE7A3A" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>End Time</Text>
                <Text style={styles.detailValue}>
                  {calculateEndTime(
                    booking.start_time,
                    booking.duration
                  ).toLocaleDateString("id-ID", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.costCard}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Duration</Text>
              <Text style={styles.costValue}>
                {formatDuration(booking.duration)}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Rate per Hour</Text>
              <Text style={styles.costValue}>
                Rp{" "}
                {Math.round(booking.cost / booking.duration).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.costRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                Rp {booking.cost.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        {(booking.entry_qr || booking.exit_qr || booking.qr_code) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR Codes</Text>
            <View style={styles.qrCard}>
              <>
                {booking.status === "confirmed" && (
                  <View style={styles.qrSection}>
                    <Text style={styles.qrText}>Entry QR Code</Text>
                    {booking.entry_qr ? (
                      <View style={styles.qrGenerated}>
                        <Ionicons name="qr-code" size={48} color="#10B981" />
                        <Text style={styles.qrGeneratedText}>
                          Entry QR Generated
                        </Text>
                        <TouchableOpacity
                          style={styles.viewQrButton}
                          onPress={() =>
                            showQRCode(
                              booking.entry_qr,
                              "Show this QR code at parking entrance"
                            )
                          }
                        >
                          <Text style={styles.viewQrButtonText}>
                            View QR Code
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.qrPlaceholder}>
                        <Ionicons
                          name="qr-code-outline"
                          size={48}
                          color="#6B7280"
                        />
                        <Text style={styles.qrPlaceholderText}>
                          Generate entry QR code below
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {booking.status === "active" && booking.entry_qr && (
                  <View style={styles.qrSection}>
                    <Text style={styles.qrText}>Entry QR Used</Text>
                    <View style={styles.qrUsed}>
                      <Ionicons
                        name="checkmark-circle"
                        size={48}
                        color="#10B981"
                      />
                      <Text style={styles.qrUsedText}>
                        Successfully entered parking
                      </Text>
                    </View>
                  </View>
                )}

                {booking.exit_qr && (
                  <View style={styles.qrSection}>
                    <Text style={styles.qrText}>Exit QR Code</Text>
                    <View style={styles.qrGenerated}>
                      <Ionicons name="qr-code" size={48} color="#F59E0B" />
                      <Text style={styles.qrGeneratedText}>
                        Exit QR Generated
                      </Text>
                      <TouchableOpacity
                        style={styles.viewQrButton}
                        onPress={() =>
                          showQRCode(
                            booking.exit_qr,
                            "Show this QR code at parking exit"
                          )
                        }
                      >
                        <Text style={styles.viewQrButtonText}>
                          View QR Code
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            </View>
          </View>
        )}

        {/* Landowner Contact Section - Show only for confirmed status */}
        {booking.status === "confirmed" && landowner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Landowner</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerInfo}>
                <View style={styles.ownerAvatar}>
                  <Text style={styles.ownerAvatarText}>
                    {landowner.name?.charAt(0)?.toUpperCase() || "L"}
                  </Text>
                </View>
                <View style={styles.ownerDetails}>
                  <Text style={styles.ownerName}>{landowner.name}</Text>
                  <Text style={styles.ownerRole}>Parking Owner</Text>
                  <Text style={styles.ownerEmail}>{landowner.email}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={handleChatWithOwner}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.chatGradient}
                >
                  <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                  <Text style={styles.chatButtonText}>Chat Owner</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Status Instructions */}
        <View style={styles.section}>
          <View style={styles.instructionCard}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <Text style={styles.instructionText}>
              {getStatusMessage(booking.status)}
              {booking.status === "confirmed" &&
                landowner &&
                "\n\nYou can now chat with the parking owner for any questions about your booking."}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Enhanced Bottom Actions */}
      <View style={styles.bottomActions}>
        {booking.status === "pending" && (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <ActivityIndicator color="#6B7280" size="small" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={confirmLoading}
            >
              <LinearGradient
                colors={["#FF9A62", "#FE7A3A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payGradient}
              >
                {confirmLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.payButtonText}>Pay Now</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {booking.status === "confirmed" && (
          <View style={styles.confirmedActions}>
            {/* Chat Button */}
            {landowner && (
              <TouchableOpacity
                style={styles.chatOwnerButton}
                onPress={handleChatWithOwner}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payGradient}
                >
                  <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                  <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                    Chat with {landowner.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* QR Button */}
            {booking.entry_qr ? (
              <TouchableOpacity
                style={styles.qrButton}
                onPress={() =>
                  showQRCode(
                    booking.entry_qr,
                    "Show this QR code at parking entrance"
                  )
                }
              >
                <LinearGradient
                  colors={["#3B82F6", "#1D4ED8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payGradient}
                >
                  <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                  <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                    Show QR Code
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.qrButton}
                onPress={handleGenerateEntryQR}
                disabled={qrLoading}
              >
                <LinearGradient
                  colors={["#3B82F6", "#1D4ED8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payGradient}
                >
                  {qrLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                      <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                        Generate QR
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {booking.status === "active" && (
          <>
            {booking.exit_qr ? (
              <TouchableOpacity
                style={styles.fullWidthButton}
                onPress={() =>
                  showQRCode(
                    booking.exit_qr,
                    "Show this QR code at parking exit"
                  )
                }
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payGradient}
                >
                  <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                  <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                    Show Exit QR Code
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.fullWidthButton}
                onPress={handleGenerateExitQR}
                disabled={exitQrLoading}
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payGradient}
                >
                  {exitQrLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="log-out" size={20} color="#FFFFFF" />
                      <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                        Generate Exit QR
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        )}

        {booking.status === "completed" && (
          <TouchableOpacity style={styles.fullWidthButton}>
            <LinearGradient
              colors={["#6B7280", "#4B5563"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payGradient}
            >
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                Parking Completed
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {booking.status === "cancelled" && (
          <TouchableOpacity style={styles.fullWidthButton}>
            <LinearGradient
              colors={["#EF4444", "#DC2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payGradient}
            >
              <Ionicons name="close-circle" size={20} color="#FFFFFF" />
              <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                Booking Cancelled
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {booking.status !== "pending" && booking.status !== "cancelled" && (
          <View style={styles.cancellationInfo}>
            <Ionicons name="information-circle" size={16} color="#6B7280" />
            <Text style={styles.cancellationInfoText}>
              {booking.status === "confirmed"
                ? "You can now chat with the parking owner and use your QR code"
                : 'Booking can only be cancelled when status is "pending"'}
            </Text>
          </View>
        )}
      </View>

      {/* QR Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={qrModalVisible}
        onRequestClose={closeQRModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QR Code</Text>
              <TouchableOpacity
                onPress={closeQRModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {currentQRData && (
              <View style={styles.qrModalBody}>
                <Text style={styles.qrInstructions}>
                  {currentQRData.instructions}
                </Text>

                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={currentQRData.qrCode}
                    size={250}
                    backgroundColor="white"
                    color="black"
                  />
                </View>

                <View style={styles.qrDetails}>
                  <Text style={styles.qrDetailLabel}>Booking ID:</Text>
                  <Text style={styles.qrDetailValue}>
                    #{booking?._id?.slice(-8)}
                  </Text>
                </View>

                <View style={styles.qrDetails}>
                  <Text style={styles.qrDetailLabel}>Vehicle Type:</Text>
                  <Text style={styles.qrDetailValue}>
                    {booking?.vehicle_type?.charAt(0).toUpperCase() +
                      booking?.vehicle_type?.slice(1)}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => {
                      Alert.alert("QR Code", "QR Code ready to scan!");
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleQRModalDone}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  refreshButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // ✅ STATUS CARD STYLES
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 20,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
    flex: 1,
  },
  timerInHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  timerInHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  statusBody: {
    padding: 16,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  warningInCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  warningInCardText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
    marginLeft: 6,
  },
  expiredInCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  expiredInCardText: {
    fontSize: 12,
    color: "#991B1B",
    fontWeight: "500",
    marginLeft: 6,
  },

  // ✅ SECTION STYLES
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 12,
  },

  // ✅ PARKING CARD STYLES
  parkingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  parkingImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  parkingInfo: {
    padding: 16,
  },
  parkingName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },

  // ✅ DETAILS CARD STYLES
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF5F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },

  // ✅ COST CARD STYLES
  costCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
    paddingTop: 16,
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

  // ✅ QR CARD STYLES
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrSection: {
    marginBottom: 20,
  },
  qrText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  qrPlaceholderText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  qrGenerated: {
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  qrGeneratedText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 12,
  },
  qrUsed: {
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  qrUsedText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginTop: 8,
  },
  viewQrButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewQrButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  // ✅ INSTRUCTION CARD STYLES
  instructionCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  instructionText: {
    fontSize: 14,
    color: "#1E40AF",
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },

  // ✅ BOTTOM SPACING AND ACTIONS
  bottomSpacing: {
    height: 100,
  },
  bottomActions: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    padding: 20,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  payButton: {
    flex: 2,
    marginLeft: 10,
  },
  fullWidthButton: {
    flex: 1,
  },
  payGradient: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancellationInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginTop: 10,
  },
  cancellationInfoText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
    fontStyle: "italic",
  },

  // ✅ LOADING AND ERROR STYLES
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },

  // ✅ MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: "80%",
    width: Dimensions.get("window").width - 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  closeButton: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
  },
  qrModalBody: {
    alignItems: "center",
  },
  qrInstructions: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  qrCodeContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 25,
  },
  qrDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  qrDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  qrDetailValue: {
    fontSize: 14,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 25,
  },
  shareButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },

  // Add new styles for landowner contact
  ownerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E6FFFA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#10B981",
  },
  ownerAvatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#059669",
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  ownerRole: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginBottom: 2,
  },
  ownerEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  chatButton: {
    alignSelf: "flex-start",
  },
  chatGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  // Enhanced bottom action styles
  confirmedActions: {
    flex: 1,
    gap: 12,
  },
  chatOwnerButton: {
    flex: 1,
  },
  qrButton: {
    flex: 1,
  },
});
