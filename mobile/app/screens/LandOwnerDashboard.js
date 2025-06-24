import React, { useEffect, useState, useRef } from "react";
import { PanResponder } from "react-native";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useAuth } from "../context/authContext";
import * as SecureStore from "expo-secure-store";
import ChatBubble from "../components/ChatBubble";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Dummy data untuk owner
const OWNER_DATA = {
  name: "John Doe",
  profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
};

const GET_OWNER_STATS = gql`
  query GetOwnerStats {
    getOwnerStats {
      totalBalance
      currentBalance
      totalIncome
      totalBookings
      averageRating
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

// Mutation untuk menghapus parking
const DELETE_PARKING = gql`
  mutation DeleteParking($deleteParkingId: ID!) {
    deleteParking(id: $deleteParkingId)
  }
`;

export default function LandOwnerDashboard() {
  const navigation = useNavigation();
  const { setIsSignIn, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLand, setSelectedLand] = useState(null);
  const [statsView, setStatsView] = useState("income");
  const [ownerData, setOwnerData] = useState(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 50 && !chatDrawerOpen) {
          setChatDrawerOpen(true);
        } else if (gestureState.dx < -50 && chatDrawerOpen) {
          setChatDrawerOpen(false);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) < 50) {
          setChatDrawerOpen(false);
        }
      }
    })
  ).current;

  const { data, loading, error, refetch } = useQuery(GET_ALL_PARKING);
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats,
  } = useQuery(GET_OWNER_STATS);

  // Mutation untuk delete parking
  const [deleteParking, { loading: deleteLoading }] = useMutation(
    DELETE_PARKING,
    {
      update(cache, { data: deletedData }) {
        try {
          // Update cache setelah delete berhasil
          const existingData = cache.readQuery({ query: GET_ALL_PARKING });
          if (existingData && existingData.getMyParkings) {
            const updatedParkings = existingData.getMyParkings.filter(
              (parking) => parking._id !== selectedLand?._id
            );

            cache.writeQuery({
              query: GET_ALL_PARKING,
              data: {
                getMyParkings: updatedParkings,
              },
            });
          }
        } catch (error) {
          console.error("Cache update error:", error);
          // Jika cache update gagal, fallback ke refetch
          refetch();
        }
      },
      onCompleted: (data) => {
        console.log("Delete completed:", data);
        Alert.alert(
          "Success",
          `"${selectedLand?.name}" has been deleted successfully`
        );
        setSelectedLand(null);
        setShowDeleteConfirm(false);
        // Pastikan data terbaru dengan refetch setelah delete berhasil
        refetch();
      },
      onError: (error) => {
        console.error("Delete error details:", error);
        Alert.alert("Error", `Failed to delete parking: ${error.message}`);
        setShowDeleteConfirm(false);
      },
    }
  );

  useEffect(() => {
    const fetchOwnerData = async () => {
      const ownerData = await SecureStore.getItemAsync("user_data");
      if (ownerData) {
        const parsedData = JSON.parse(ownerData);
        setOwnerData(parsedData);
      }
    };
    fetchOwnerData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchStats()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteLand = (land) => {
    setSelectedLand(land);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!selectedLand) return;

    console.log("Deleting parking with ID:", selectedLand._id);
    console.log("Selected land data:", selectedLand);

    deleteParking({
      variables: { deleteParkingId: selectedLand._id },
      // Tambahkan refetchQueries untuk memastikan data terbaru
      refetchQueries: [{ query: GET_ALL_PARKING }],
      // Tambahkan awaitRefetchQueries untuk menunggu refetch selesai
      awaitRefetchQueries: true,
    });
  };

  const handleAddNewLand = () => {
    navigation.navigate("AddNewLandScreen");
  };

  const handleEditLand = (land) => {
    navigation.navigate("EditParkingScreen", { parkingId: land._id });
  };

  const formatCurrency = (amount) => {
    return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };
  // Get stats from query instead of dummy data
  const stats = statsData?.getOwnerStats || {
    totalBalance: 0,
    currentBalance: 0,
    totalIncome: 0,
    totalBookings: 0,
    averageRating: 0,
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("access_token");
            await SecureStore.deleteItemAsync("user_role");
            await SecureStore.deleteItemAsync("user_data");
            setIsSignIn(false);
          } catch (error) {
            console.log("Logout error:", error);
          }
        },
      },
    ]);
  };

  const renderLandItem = ({ item }) => {
    const imageUrl = item.images?.[0] || "https://via.placeholder.com/150";
    const availableSpots = item.available?.car ?? 0;
    const totalSpots = item.capacity?.car ?? 0;
    const hourlyRate = item.rates?.car ?? 0;

    // Animation values
    const scaleValue = new Animated.Value(1);
    const imageScale = new Animated.Value(1);
    const overlayOpacity = new Animated.Value(0);

    const handlePressIn = () => {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1.03,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(imageScale, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(imageScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <Animated.View
        style={[
          styles.landCard,
          {
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.landCardInner}
          onPress={() =>
            navigation.navigate("ParkingDetailsScreen", { parkingId: item._id })
          }
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.imageContainer}>
            <Animated.Image
              source={{ uri: imageUrl }}
              style={[
                styles.landImage,
                {
                  transform: [{ scale: imageScale }],
                },
              ]}
              defaultSource={require("../assets/logo.png")}
            />
            <Animated.View
              style={[
                styles.imageOverlay,
                {
                  opacity: overlayOpacity,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.statusBadge,
              item.status === "active"
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === "active" ? "Active" : "Inactive"}
            </Text>
          </View>

          <View style={styles.landContent}>
            <Text style={styles.landName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.landAddress} numberOfLines={1}>
              {item.address}
            </Text>

            <View style={styles.landStats}>
              <View style={styles.landStat}>
                <Ionicons name="car-outline" size={14} color="#4B5563" />
                <Text style={styles.landStatText}>
                  {availableSpots}/{totalSpots} spots
                </Text>
              </View>
              <View style={styles.landStat}>
                <Ionicons name="cash-outline" size={14} color="#4B5563" />
                <Text style={styles.landStatText}>
                  {formatCurrency(hourlyRate)}/h
                </Text>
              </View>
            </View>

            <View style={styles.landFooter}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{item.rating ?? "-"}</Text>
              </View>

              <Text style={styles.incomeText}>
                {formatCurrency(item.income ?? 0)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() =>
              navigation.navigate("ParkingDetailsScreen", {
                parkingId: item._id,
              })
            }
          >
            <Ionicons name="eye-outline" size={14} color="#4B5563" />
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>

          <View style={styles.actionButtonsContainer}>
            {/* ✅ NEW: Add Booking Management Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.bookingButton]}
              onPress={() =>
                navigation.navigate("BookingManagementScreen", {
                  parkingId: item._id,
                  parkingName: item.name,
                })
              }
            >
              <Ionicons name="list-outline" size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEditLand(item)}
            >
              <Ionicons name="create-outline" size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteLand(item)}
              disabled={deleteLoading}
            >
              {deleteLoading && selectedLand?._id === item._id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color="#FFF" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
  };
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          {/* Chat Bubble */}
          <ChatBubble />

          {/* Header */}
          <LinearGradient
            colors={["#FE7A3A", "#FF9A62"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.profileSection}>
              <View style={styles.profileLeft}>
                <View style={styles.profilePic}>
                  <Text style={styles.initialsText}>
                    {getInitials(ownerData?.name)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.greeting}>Hello,</Text>
                  <Text style={styles.ownerName}>{ownerData?.name}</Text>
                  <View style={styles.roleBadge}>
                    <Ionicons name="business-outline" size={12} color="#FFF" />
                    <Text style={styles.roleText}>Land Owner</Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.balanceCard}>
              <View>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>
                  {statsLoading
                    ? "Loading..."
                    : formatCurrency(stats.currentBalance)}
                </Text>
              </View>
              <TouchableOpacity style={styles.withdrawButton}>
                <Ionicons name="cash-outline" size={18} color="#FE7A3A" />
                <Text style={styles.withdrawText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Stats Overview */}
            <View style={styles.statsSection}>
              <View style={styles.statsHeader}>
                <Text style={styles.sectionTitle}>Stats Overview</Text>
                <View style={styles.statsToggle}>
                  <TouchableOpacity
                    style={[
                      styles.statsToggleButton,
                      statsView === "income" && styles.activeStatsToggle,
                    ]}
                    onPress={() => setStatsView("income")}
                  >
                    <Text
                      style={[
                        styles.statsToggleText,
                        statsView === "income" && styles.activeStatsToggleText,
                      ]}
                    >
                      Income
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statsToggleButton,
                      statsView === "traffic" && styles.activeStatsToggle,
                    ]}
                    onPress={() => setStatsView("traffic")}
                  >
                    <Text
                      style={[
                        styles.statsToggleText,
                        statsView === "traffic" && styles.activeStatsToggleText,
                      ]}
                    >
                      Traffic
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statsCards}>
                {statsView === "income" ? (
                  <>
                    <View
                      style={[styles.statsCard, { backgroundColor: "#FFF5F0" }]}
                    >
                      <View
                        style={[styles.statsIconBg, { backgroundColor: "#FDDED3" }]}
                      >
                        <Ionicons name="cash-outline" size={24} color="#FE7A3A" />
                      </View>
                      <Text style={styles.statsValue}>
                        {statsLoading
                          ? "Loading..."
                          : formatCurrency(stats.totalIncome)}
                      </Text>
                      <Text style={styles.statsLabel}>Total Income</Text>
                    </View>

                    <View
                      style={[styles.statsCard, { backgroundColor: "#EDF5FF" }]}
                    >
                      <View
                        style={[styles.statsIconBg, { backgroundColor: "#D7E8FF" }]}
                      >
                        <Ionicons name="card-outline" size={24} color="#1E3A8A" />
                      </View>
                      <Text style={styles.statsValue}>
                        {statsLoading
                          ? "Loading..."
                          : formatCurrency(stats.currentBalance)}
                      </Text>
                      <Text style={styles.statsLabel}>Current Balance</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View
                      style={[styles.statsCard, { backgroundColor: "#F3F9FF" }]}
                    >
                      <View
                        style={[styles.statsIconBg, { backgroundColor: "#D9EDFF" }]}
                      >
                        <Ionicons name="car-outline" size={24} color="#2563EB" />
                      </View>
                      <Text style={styles.statsValue}>
                        {statsLoading ? "Loading..." : stats.totalBookings}
                      </Text>
                      <Text style={styles.statsLabel}>Total Bookings</Text>
                    </View>

                    <View
                      style={[styles.statsCard, { backgroundColor: "#F0FFF4" }]}
                    >
                      <View
                        style={[styles.statsIconBg, { backgroundColor: "#DBFDE6" }]}
                      >
                        <Ionicons name="star-outline" size={24} color="#059669" />
                      </View>
                      <Text style={styles.statsValue}>
                        {statsLoading ? "Loading..." : stats.averageRating}
                      </Text>
                      <Text style={styles.statsLabel}>Average Rating</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* My Parking Lands */}
            <View style={styles.landsSection}>
              <View style={styles.landsSectionHeader}>
                <Text style={styles.sectionTitle}>My Parking Lands</Text>
                <Text style={styles.landCount}>
                  {data?.getMyParkings?.length || 0} lands
                </Text>
              </View>

              <FlatList
                data={data?.getMyParkings || []}
                keyExtractor={(item) => item._id}
                renderItem={renderLandItem}
                scrollEnabled={false}
                contentContainerStyle={styles.landsList}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="car-outline" size={60} color="#D1D5DB" />
                    <Text style={styles.emptyStateTitle}>No Parking Lands</Text>
                    <Text style={styles.emptyStateDescription}>
                      You haven't added any parking lands yet.
                    </Text>
                  </View>
                }
              />

              <TouchableOpacity style={styles.addButton} onPress={handleAddNewLand}>
                <LinearGradient
                  colors={["#FE7A3A", "#FF9A62"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addButtonGradient}
                >
                  <Ionicons name="add" size={24} color="#FFF" />
                  <Text style={styles.addButtonText}>Add New Parking Land</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Delete Confirmation Modal */}
          <Modal visible={showDeleteConfirm} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
                <Text style={styles.modalTitle}>Delete Parking Land</Text>
                <Text style={styles.modalDescription}>
                  Are you sure you want to delete "{selectedLand?.name}"? This
                  action cannot be undone.
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteConfirmButton]}
                    onPress={confirmDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.deleteConfirmText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 35,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FE7A3A",
  },
  greeting: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: "center",
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  withdrawText: {
    color: "#FE7A3A",
    fontWeight: "600",
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsSection: {
    marginTop: 25,
    marginBottom: 15,
  },
  statsHeader: {
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
  statsToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 2,
  },
  statsToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeStatsToggle: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsToggleText: {
    color: "#6B7280",
    fontWeight: "500",
    fontSize: 13,
  },
  activeStatsToggleText: {
    color: "#1E3A8A",
    fontWeight: "600",
  },
  statsCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsCard: {
    width: "48%",
    borderRadius: 16,
    padding: 15,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  landsSection: {
    marginTop: 10,
    paddingBottom: 30,
  },
  landsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  landCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  landsList: {
    paddingBottom: 10,
  },
  landCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    transform: [{ scale: 1 }],
  },
  landCardInner: {
    flexDirection: "row",
  },
  imageContainer: {
    position: "relative",
    width: 100,
    height: 100,
    overflow: "hidden",
    borderTopLeftRadius: 16,
  },
  landImage: {
    width: "100%",
    height: "100%",
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
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
  },
  activeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.8)",
  },
  inactiveBadge: {
    backgroundColor: "rgba(156, 163, 175, 0.8)",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  landContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  landName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  landAddress: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  landStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  landStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  landStatText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  landFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
    marginLeft: 2,
  },
  incomeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  // Gaya baru untuk footer card
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  detailsButtonText: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  actionButtonsContainer: {
    flexDirection: "row",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: "#3B82F6",
  },
  // ✅ NEW: Add booking button style
  bookingButton: {
    backgroundColor: "#10B981",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  addButton: {
    shadowColor: "#FE7A3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 5,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  deleteConfirmButton: {
    backgroundColor: "#EF4444",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 16,
  },
  deleteConfirmText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  // Chat drawer related styles
  swipeIndicator: {
    position: "absolute",
    right: 0,
    top: "50%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 100,
  },
  swipeText: {
    marginLeft: 8,
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
  },
});
