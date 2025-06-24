import React, { useContext, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import { authContext } from "../context/authContext";

const ME_QUERY = gql`
  query Me {
    me {
      email
      name
      role
      saldo
    }
  }
`;

const { width, height } = Dimensions.get("window");

export default function UserProfile() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const { setIsSignIn } = useContext(authContext);

  // ✅ Query 'me' otomatis mengambil data user yang sedang login
  // berdasarkan token yang ada di Apollo Client header
  const { data, loading, error, refetch } = useQuery(ME_QUERY, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const user = data?.me;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.log("Refresh error:", error);
    }
    setRefreshing(false);
  };

  // ✅ SecureStore digunakan untuk logout
  // Untuk menghapus token dan redirect ke login
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("access_token");
            await SecureStore.deleteItemAsync("user_role");
            setIsSignIn(false);
          } catch (error) {
            console.log("Logout error:", error);
          }
        },
      },
    ]);
  };

  const handleTopUp = () => {
    navigation.navigate("TopUpScreen");
  };

  const formatSaldo = (saldo) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(saldo || 0);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return "shield-checkmark";
      case "owner":
        return "business";
      case "user":
        return "person";
      default:
        return "person";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "#EF4444";
      case "owner":
        return "#3B82F6";
      case "user":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const formatRole = (role) => {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <View style={styles.loadingAvatar}>
              <Ionicons
                name="person-circle-outline"
                size={80}
                color="#94a3b8"
              />
            </View>
            <Text style={styles.loadingText}>Loading Profile...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to load profile</Text>
          <Text style={styles.errorMessage}>Please try again later</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Header Background */}
          <View style={styles.headerBackground}>
            <View style={styles.headerPattern}>
              <View style={[styles.patternDot, styles.dot1]} />
              <View style={[styles.patternDot, styles.dot2]} />
              <View style={[styles.patternDot, styles.dot3]} />
              <View style={[styles.patternDot, styles.dot4]} />
            </View>
          </View>

          {/* Header Content */}
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>My Profile</Text>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Profile Avatar - CLEANED UP */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarGradient}>
                    <Ionicons name="person" size={48} color="white" />
                  </View>
                  <View style={styles.avatarBorder} />
                </View>
                <View style={styles.avatarBadge}>
                  <Ionicons
                    name={getRoleIcon(user?.role)}
                    size={14}
                    color={getRoleColor(user?.role)}
                  />
                </View>
              </View>

              {/* User Info */}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name || "User"}</Text>
                <Text style={styles.userEmail}>
                  {user?.email || "No email"}
                </Text>
                <View style={styles.roleTag}>
                  <Text
                    style={[
                      styles.roleTagText,
                      { color: getRoleColor(user?.role) },
                    ]}
                  >
                    {formatRole(user?.role)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Saldo Card - REDESIGNED */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>
                  {formatSaldo(user?.saldo)}
                </Text>
              </View>
              <View style={styles.balanceIconContainer}>
                <Ionicons name="wallet-outline" size={24} color="#6366f1" />
              </View>
            </View>

            <View style={styles.balanceActions}>
              <TouchableOpacity
                onPress={handleTopUp}
                style={[styles.balanceButton, styles.primaryButton]}
              >
                <Ionicons name="add" size={18} color="white" />
                <Text style={styles.primaryButtonText}>Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.balanceButton, styles.secondaryButton]}
                onPress={() => navigation.navigate("HistoryScreen")}
              >
                <Ionicons name="time-outline" size={18} color="#6366f1" />
                <Text style={styles.secondaryButtonText}>History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Section - REDESIGNED */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            {/* Account Type */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemContent}>
                <View
                  style={[
                    styles.infoIcon,
                    { backgroundColor: getRoleColor(user?.role) + "15" },
                  ]}
                >
                  <Ionicons
                    name={getRoleIcon(user?.role)}
                    size={20}
                    color={getRoleColor(user?.role)}
                  />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Account Type</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: getRoleColor(user?.role) },
                    ]}
                  >
                    {formatRole(user?.role)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Email */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemContent}>
                <View style={styles.infoIcon}>
                  <Ionicons name="mail-outline" size={20} color="#6366f1" />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>
                    {user?.email || "No email"}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editIconButton}>
                  <Ionicons name="pencil-outline" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Name */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemContent}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person-outline" size={20} color="#059669" />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>
                    {user?.name || "No name"}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editIconButton}>
                  <Ionicons name="pencil-outline" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Action Buttons - SIMPLIFIED */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionCardContent}>
                <View style={styles.actionIcon}>
                  <Ionicons name="create-outline" size={20} color="#6366f1" />
                </View>
                <Text style={styles.actionText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionCardContent}>
                <View style={styles.actionIcon}>
                  <Ionicons name="settings-outline" size={20} color="#64748b" />
                </View>
                <Text style={styles.actionText}>Settings</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContainer: {
    flex: 1,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingAvatar: {
    marginBottom: 16,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },

  // Header Section - REDESIGNED
  headerSection: {
    position: "relative",
    paddingBottom: 32,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
  },
  dot1: { top: 40, left: 30 },
  dot2: { top: 60, right: 40 },
  dot3: { top: 100, left: 60 },
  dot4: { top: 80, right: 80 },

  headerContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  // Avatar Section - COMPLETELY REDESIGNED
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    width: 96,
    height: 96,
  },
  avatarGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarBorder: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 51,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  userInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Main Content
  mainContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // Balance Card - REDESIGNED
  balanceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
  },
  balanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceActions: {
    flexDirection: "row",
    gap: 12,
  },
  balanceButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#6366f1",
  },
  secondaryButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButtonText: {
    color: "#6366f1",
    fontWeight: "600",
    fontSize: 14,
  },

  // Info Section - REDESIGNED
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  infoItem: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  infoItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },

  // Actions Section - REDESIGNED
  actionsSection: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  actionCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
});
