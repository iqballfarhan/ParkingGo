import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/authContext';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  withSpring 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const CustomDrawer = ({ progress, navigation, ...props }) => {
  const { user, setIsSignIn } = useAuth();

  // Drawer slide animation
  const drawerAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.8, 1]);
    const borderRadius = interpolate(progress.value, [0, 1], [25, 0]);

    return {
      transform: [{ scale }],
      borderRadius,
    };
  });

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("user_role");
      await SecureStore.deleteItemAsync("user_data");
      setIsSignIn(false);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
  };

  return (
    <DrawerContentScrollView 
      {...props}
      scrollEnabled={true}
      contentContainerStyle={styles.container}
    >
      <Animated.View style={[styles.mainContainer, drawerAnimatedStyle]}>
        {/* Profile Section */}
        <LinearGradient
          colors={["#FF9A62", "#FE7A3A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.profileSection}
        >
          <View style={styles.profilePic}>
            <Text style={styles.initialsText}>
              {getInitials(user?.name)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="business-outline" size={12} color="#FFF" />
              <Text style={styles.roleText}>Land Owner</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('DashboardScreen')}
          >
            <Ionicons name="home-outline" size={24} color="#4B5563" />
            <Text style={styles.menuText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChatScreen')}
          >
            <View style={styles.chatIconContainer}>
              <Ionicons name="chatbubbles-outline" size={24} color="#4B5563" />
              {props.unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>{props.unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.menuText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('BookingManagementScreen')}
          >
            <Ionicons name="calendar-outline" size={24} color="#4B5563" />
            <Text style={styles.menuText}>Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    padding: 20,
    paddingTop: 40,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  initialsText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileInfo: {
    marginTop: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  menuContainer: {
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  chatIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 12,
    fontWeight: '500',
  },
  logoutText: {
    color: '#EF4444',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CustomDrawer;
