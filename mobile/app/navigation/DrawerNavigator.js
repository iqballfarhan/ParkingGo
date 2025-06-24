import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useWindowDimensions } from 'react-native';
import CustomDrawer from '../components/CustomDrawer';
import LandOwnerDashboard from '../screens/LandOwnerDashboard';
import ChatScreen from '../screens/ChatScreen';
import BookingManagementScreen from '../screens/BookingManagementScreen';
import { useQuery } from '@apollo/client';
import { GET_UNREAD_COUNT } from '../apollo/chat';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const dimensions = useWindowDimensions();
  
  // Get unread message count
  const { data: unreadData } = useQuery(GET_UNREAD_COUNT, {
    pollInterval: 5000, // Poll every 5 seconds for new messages
  });

  const unreadCount = unreadData?.getUnreadCount || 0;

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerType: dimensions.width >= 768 ? 'permanent' : 'front',
        drawerStyle: {
          width: '80%',
          backgroundColor: 'transparent',
        },
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
      drawerContent={(props) => (
        <CustomDrawer {...props} unreadCount={unreadCount} />
      )}
    >
      <Drawer.Screen 
        name="DashboardScreen" 
        component={LandOwnerDashboard}
        options={{
          headerShown: false,
        }}
      />
      <Drawer.Screen 
        name="ChatScreen" 
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Drawer.Screen 
        name="BookingManagementScreen" 
        component={BookingManagementScreen}
        options={{
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
