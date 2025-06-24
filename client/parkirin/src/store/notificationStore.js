import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  // Notifications list
  notifications: [],
  notificationsLoading: false,
  unreadCount: 0,
  
  // Notification filters
  filters: {
    type: 'all', // all, booking, payment, system, promotion
    read: 'all'  // all, read, unread
  },
  
  // Notification types for UI
  notificationTypes: {
    booking: {
      icon: '📅',
      color: 'blue',
      label: 'Booking'
    },
    payment: {
      icon: '💳',
      color: 'green',
      label: 'Payment'
    },
    system: {
      icon: '⚙️',
      color: 'gray',
      label: 'System'
    },
    promotion: {
      icon: '🎉',
      color: 'purple',
      label: 'Promotion'
    },
    security: {
      icon: '🔒',
      color: 'red',
      label: 'Security'
    }
  },
  
  // Actions
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.read).length;
    set({ 
      notifications, 
      unreadCount,
      notificationsLoading: false 
    });
  },
  
  setNotificationsLoading: (loading) => set({ notificationsLoading: loading }),
  
  setFilters: (filters) => set(state => ({
    filters: { ...state.filters, ...filters }
  })),
  
  // Add new notification
  addNotification: (notification) => set(state => {
    const newNotification = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    const updatedNotifications = [newNotification, ...state.notifications];
    const unreadCount = updatedNotifications.filter(n => !n.read).length;
    
    return {
      notifications: updatedNotifications,
      unreadCount
    };
  }),
  
  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      // This would be replaced with actual GraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => {
        const updatedNotifications = state.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        );
        
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount
        };
      });
      
      return true;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  },
  
  // Mark all as read
  markAllAsRead: async () => {
    try {
      // This would be replaced with actual GraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          read: true
        })),
        unreadCount: 0
      }));
      
      return true;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  },
  
  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      // This would be replaced with actual GraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => {
        const updatedNotifications = state.notifications.filter(
          notification => notification.id !== notificationId
        );
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount
        };
      });
      
      return true;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  },
  
  // Fetch notifications
  fetchNotifications: async () => {
    set({ notificationsLoading: true });
    
    try {
      // This would be replaced with actual GraphQL query
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockNotifications = [
        {
          id: 'notif_1',
          type: 'booking',
          title: 'Booking Confirmed',
          message: 'Your parking booking at Central Plaza has been confirmed.',
          timestamp: '2024-01-15T10:30:00Z',
          read: false,
          data: {
            bookingId: 'BK001',
            parkingLot: 'Central Plaza Parking'
          }
        },
        {
          id: 'notif_2',
          type: 'payment',
          title: 'Payment Successful',
          message: 'Payment of Rp 120,000 has been processed successfully.',
          timestamp: '2024-01-15T10:25:00Z',
          read: false,
          data: {
            amount: 120000,
            paymentId: 'PAY001'
          }
        },
        {
          id: 'notif_3',
          type: 'promotion',
          title: 'Special Discount Available',
          message: 'Get 20% off on weekend parking bookings. Limited time offer!',
          timestamp: '2024-01-14T14:00:00Z',
          read: true,
          data: {
            discount: 20,
            validUntil: '2024-01-31T23:59:59Z'
          }
        },
        {
          id: 'notif_4',
          type: 'booking',
          title: 'Booking Reminder',
          message: 'Your parking session will start in 30 minutes.',
          timestamp: '2024-01-14T09:30:00Z',
          read: true,
          data: {
            bookingId: 'BK002',
            startTime: '2024-01-14T10:00:00Z'
          }
        },
        {
          id: 'notif_5',
          type: 'system',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM.',
          timestamp: '2024-01-13T18:00:00Z',
          read: true,
          data: {
            maintenanceStart: '2024-01-14T02:00:00Z',
            maintenanceEnd: '2024-01-14T04:00:00Z'
          }
        }
      ];
      
      const unreadCount = mockNotifications.filter(n => !n.read).length;
      
      set({ 
        notifications: mockNotifications,
        unreadCount,
        notificationsLoading: false 
      });
    } catch (error) {
      console.error('Fetch notifications error:', error);
      set({ notificationsLoading: false });
    }
  },
  
  // Get filtered notifications
  getFilteredNotifications: () => {
    const { notifications, filters } = get();
    
    return notifications.filter(notification => {
      // Filter by type
      if (filters.type !== 'all' && notification.type !== filters.type) {
        return false;
      }
      
      // Filter by read status
      if (filters.read === 'read' && !notification.read) {
        return false;
      }
      if (filters.read === 'unread' && notification.read) {
        return false;
      }
      
      return true;
    });
  },
  
  // Clear all notifications
  clearAllNotifications: async () => {
    try {
      // This would be replaced with actual GraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({
        notifications: [],
        unreadCount: 0
      });
      
      return true;
    } catch (error) {
      console.error('Clear all notifications error:', error);
      throw error;
    }
  },
  
  // Simulate real-time notification
  simulateNotification: (type, title, message, data = {}) => {
    const { addNotification } = get();
    addNotification({
      type,
      title,
      message,
      data
    });
  }
}));

export default useNotificationStore;
