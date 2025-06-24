import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LandOwnerDashboard from "../screens/LandOwnerDashboard";
import ParkingDetailScreen from "../screens/ParkingDetailScreen";
import AddNewLandScreen from "../screens/AddNewLandScreen";
import EditParkingScreen from "../screens/EditParkingScreen";
import BookingManagementScreen from "../screens/BookingManagementScreen";
import BookingDetailsScreen from "../screens/BookingDetailsScreen";
import ChatRoomScreen from "../screens/ChatRoomScreen";
import ChatScreen from "../screens/ChatScreen";

const Stack = createNativeStackNavigator();

export default function OwnerNavigator() {
  return (
    <SafeAreaProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="DashboardScreen"
          component={LandOwnerDashboard}
        />
        <Stack.Screen
          name="ParkingDetailsScreen"
          component={ParkingDetailScreen}
        />
        <Stack.Screen
          name="AddNewLandScreen"
          component={AddNewLandScreen}
        />
        <Stack.Screen
          name="EditParkingScreen"
          component={EditParkingScreen}
        />
        <Stack.Screen
          name="BookingManagementScreen"
          component={BookingManagementScreen}
        />
        <Stack.Screen
          name="BookingDetailsScreen"
          component={BookingDetailsScreen}
        />
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
        />
        <Stack.Screen
          name="ChatRoomScreen"
          component={ChatRoomScreen}
        />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
}
