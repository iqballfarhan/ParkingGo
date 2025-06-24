import { create } from 'zustand';

const useBookingStore = create((set, get) => ({
  // Current bookings
  userBookings: [],
  userBookingsLoading: false,
  
  // Current booking process
  currentBooking: null,
  bookingStep: 'parking', // parking, details, payment, confirmation
  
  // Admin/Landowner bookings oversight
  allBookings: [],
  allBookingsLoading: false,
  bookingFilters: {
    status: 'all',
    dateRange: 'all',
    searchTerm: ''
  },
  
  // Booking details for current booking
  bookingDetails: {
    parkingLotId: null,
    parkingSpot: null,
    startDateTime: null,
    endDateTime: null,
    duration: 0,
    totalAmount: 0,
    vehicleType: 'car',
    licensePlate: '',
    contactPhone: ''
  },
  
  // Payment details
  paymentDetails: {
    method: null,
    amount: 0,
    status: 'pending'
  },
  
  // Actions
  setUserBookings: (bookings) => set({ userBookings: bookings }),
  
  setUserBookingsLoading: (loading) => set({ userBookingsLoading: loading }),
  
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  
  setBookingStep: (step) => set({ bookingStep: step }),
  
  setAllBookings: (bookings) => set({ allBookings: bookings }),
  
  setAllBookingsLoading: (loading) => set({ allBookingsLoading: loading }),
  
  setBookingFilters: (filters) => set(state => ({
    bookingFilters: { ...state.bookingFilters, ...filters }
  })),
  
  setBookingDetails: (details) => set(state => ({
    bookingDetails: { ...state.bookingDetails, ...details }
  })),
  
  setPaymentDetails: (details) => set(state => ({
    paymentDetails: { ...state.paymentDetails, ...details }
  })),
  
  // Start new booking
  startBooking: (parkingLot) => {
    set({
      currentBooking: parkingLot,
      bookingStep: 'details',
      bookingDetails: {
        parkingLotId: parkingLot.id,
        parkingSpot: null,
        startDateTime: null,
        endDateTime: null,
        duration: 0,
        totalAmount: 0,
        vehicleType: 'car',
        licensePlate: '',
        contactPhone: ''
      },
      paymentDetails: {
        method: null,
        amount: 0,
        status: 'pending'
      }
    });
  },
  
  // Calculate booking amount
  calculateAmount: () => {
    const { bookingDetails, currentBooking } = get();
    if (bookingDetails.duration && currentBooking?.pricePerHour) {
      const amount = bookingDetails.duration * currentBooking.pricePerHour;
      set(state => ({
        bookingDetails: { ...state.bookingDetails, totalAmount: amount },
        paymentDetails: { ...state.paymentDetails, amount: amount }
      }));
      return amount;
    }
    return 0;
  },
  
  // Fetch user bookings
  fetchUserBookings: async () => {
    set({ userBookingsLoading: true });
    
    try {
      // This would be replaced with actual GraphQL query
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBookings = [
        {
          id: 'BK001',
          parkingLotName: 'Central Plaza Parking',
          parkingSpot: 'A-15',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T18:00:00Z',
          duration: 8,
          totalAmount: 120000,
          status: 'confirmed',
          paymentStatus: 'paid',
          qrCode: 'QR123456789',
          createdAt: '2024-01-14T15:30:00Z'
        },
        {
          id: 'BK002',
          parkingLotName: 'Mall Taman Anggrek',
          parkingSpot: 'B-23',
          startTime: '2024-01-16T14:00:00Z',
          endTime: '2024-01-16T20:00:00Z',
          duration: 6,
          totalAmount: 72000,
          status: 'pending',
          paymentStatus: 'pending',
          qrCode: 'QR987654321',
          createdAt: '2024-01-15T08:45:00Z'
        }
      ];
      
      set({ userBookings: mockBookings });
    } catch (error) {
      console.error('Fetch user bookings error:', error);
    } finally {
      set({ userBookingsLoading: false });
    }
  },
  
  // Create booking
  createBooking: async () => {
    const { bookingDetails, paymentDetails } = get();
    
    try {
      // This would be replaced with actual GraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBooking = {
        id: `BK${Date.now()}`,
        ...bookingDetails,
        paymentStatus: paymentDetails.status,
        status: 'confirmed',
        qrCode: `QR${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      // Add to user bookings
      set(state => ({
        userBookings: [newBooking, ...state.userBookings],
        bookingStep: 'confirmation'
      }));
      
      return newBooking;
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  },
  
  // Cancel booking
  cancelBooking: async (bookingId) => {
    try {
      // This would be replaced with actual GraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => ({
        userBookings: state.userBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      }));
      
      return true;
    } catch (error) {
      console.error('Cancel booking error:', error);
      throw error;
    }
  },
  
  // Update booking status (for admin/landowner)
  updateBookingStatus: async (bookingId, newStatus) => {
    try {
      // This would be replaced with actual GraphQL mutation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => ({
        allBookings: state.allBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
      }));
      
      return true;
    } catch (error) {
      console.error('Update booking status error:', error);
      throw error;
    }
  },
  
  // Clear current booking
  clearCurrentBooking: () => set({
    currentBooking: null,
    bookingStep: 'parking',
    bookingDetails: {
      parkingLotId: null,
      parkingSpot: null,
      startDateTime: null,
      endDateTime: null,
      duration: 0,
      totalAmount: 0,
      vehicleType: 'car',
      licensePlate: '',
      contactPhone: ''
    },
    paymentDetails: {
      method: null,
      amount: 0,
      status: 'pending'
    }
  })
}));

export default useBookingStore;
