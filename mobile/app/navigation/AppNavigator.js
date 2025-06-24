import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Import screens
import LoginScreen from "../screens/LoginScreens";
import HomeScreen from "../screens/HomeScreen";
import SearchParkingScreen from "../screens/SearchParkingScreen";
import RegisterScreen from "../screens/RegisterScreen";
import * as SecureStore from "expo-secure-store";
import TopUpScreen from "../screens/TopUpScreen";
import OwnerNavigator from "./OwnerNavigator";
import { useAuth } from "../context/authContext";
import UserParkingDetailScreen from "../screens/UserParkingDetailScreen";
import QRISPaymentScreen from "../screens/QRISPaymentScreen";
import VirtualAccountScreen from "../screens/VirtualAccountScreen";
import EWalletPaymentScreen from "../screens/EWalletPaymentScreen";
import BookingFormScreen from "../screens/BookingFormScreen";
import ChatScreen from "../screens/ChatScreen";
import ChatRoomScreen from "../screens/ChatRoomScreen";
import MyBookingsScreen from "../screens/MyBookingsScreen";
import UserBookingDetailScreen from "../screens/UserBookingDetailScreen";
import UserProfile from "../screens/UserProfile";
import BookingHistoryScreen from "../screens/BookingHistoryScreen";
import AppTest from "../test";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TopUpScreen"
        component={TopUpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserParkingDetailScreen"
        component={UserParkingDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchParking"
        component={SearchParkingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VirtualAccountScreen"
        component={VirtualAccountScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QRISPaymentScreen"
        component={QRISPaymentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EWalletPaymentScreen"
        component={EWalletPaymentScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="BookingFormScreen"
        component={BookingFormScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserBookingDetailScreen"
        component={UserBookingDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyBookingsScreen"
        component={MyBookingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatRoomScreen"
        component={ChatRoomScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const ProfileNavigtor = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TopUpScreen"
        component={TopUpScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#BE5B50",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          height: 65,
          paddingBottom: 5,
          paddingTop: 3,
        },
      }}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeNavigator}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryScreen"
        component={BookingHistoryScreen}
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileNavigtor}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const SearchNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SearchParkingScreen"
        component={SearchParkingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserParkingDetailScreen"
        component={UserParkingDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

function AppNavigator() {
  const { isSignIn, setIsSignIn, role, setRole, setUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await SecureStore.getItemAsync("access_token");
      const savedRole = await SecureStore.getItemAsync("user_role");
      const savedUserData = await SecureStore.getItemAsync("user_data");

      if (token && savedRole) {
        setRole(savedRole);
        setIsSignIn(true);

        if (savedUserData) {
          try {
            const userData = JSON.parse(savedUserData);
            setUser(userData);
          } catch (error) {
            console.error("Error parsing user data:", error);
          }
        }
      } else {
        setIsSignIn(false);
        setRole(null);
        setUser(null);
      }
      setLoading(false);
    };
    checkAuthStatus();
  }, []);

  if (loading) return null;

  if (!isSignIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* <Stack.Screen name="testscreen" component={AppTest} /> */}
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  if (role === "user") return <BottomTabNavigator />;
  if (role === "landowner") return <OwnerNavigator />;

  return <LoginScreen />;
}

export default AppNavigator;
