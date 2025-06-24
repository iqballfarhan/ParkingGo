import { create } from 'zustand';
import apolloClient from '../graphql/client.js';
import {
  GET_NEARBY_PARKINGS,
  GET_PARKING,
  SEARCH_PARKINGS,
  GET_USER_PARKING_LOTS,
  GET_PARKING_ANALYTICS
} from '../graphql/queries.js';
import {
  CREATE_PARKING,
  UPDATE_PARKING,
  DELETE_PARKING
} from '../graphql/mutations.js';
import toast from 'react-hot-toast';

const useParkingStore = create((set, get) => ({
  // Search state
  searchResults: [],
  searchFilters: {
    query: '',
    location: '',
    startDateTime: null,
    endDateTime: null,
    priceRange: [0, 50000],
    amenities: [],
    distance: 5,
    sortBy: 'distance'
  },
  searchLoading: false,
  searchError: null,
  
  // Selected parking lot
  selectedParking: null,
  selectedParkingLoading: false,
  selectedParkingError: null,
  
  // User's parking lots (for landowners)
  userParkingLots: [],
  userParkingLotsLoading: false,
  userParkingLotsError: null,
  
  // Nearby parkings
  nearbyParkings: [],
  nearbyParkingsLoading: false,
  nearbyParkingsError: null,
  userLocation: null,
  
  // Analytics (for landowners and admins)
  parkingAnalytics: null,
  analyticsLoading: false,
  analyticsError: null,
  
  // Actions - Search
  searchParkings: async () => {
    const { searchFilters } = get();
    set({ searchLoading: true, searchError: null });
    
    try {
      const { data } = await apolloClient.query({
        query: SEARCH_PARKINGS,
        variables: {
          query: searchFilters.query,
          location: searchFilters.location,
          startDateTime: searchFilters.startDateTime,
          endDateTime: searchFilters.endDateTime,
          minPrice: searchFilters.priceRange[0],
          maxPrice: searchFilters.priceRange[1],
          amenities: searchFilters.amenities,
          maxDistance: searchFilters.distance,
          sortBy: searchFilters.sortBy
        },
        fetchPolicy: 'network-only'
      });
      
      set({
        searchResults: data.searchParkings || [],
        searchLoading: false,
        searchError: null
      });
      
      return { success: true, results: data.searchParkings };
    } catch (error) {
      console.error('Search parkings failed:', error);
      const errorMessage = error.message || 'Failed to search parkings';
      set({
        searchResults: [],
        searchLoading: false,
        searchError: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
  
  // Fetch nearby parkings
  fetchNearbyParkings: async (longitude, latitude, maxDistance = 5, vehicleType = null) => {
    set({ nearbyParkingsLoading: true, nearbyParkingsError: null });
    
    try {
      const { data } = await apolloClient.query({
        query: GET_NEARBY_PARKINGS,
        variables: {
          longitude,
          latitude,
          maxDistance,
          vehicleType
        },
        fetchPolicy: 'network-only'
      });
      
      set({
        nearbyParkings: data.getNearbyParkings || [],
        nearbyParkingsLoading: false,
        nearbyParkingsError: null,
        userLocation: { longitude, latitude }
      });
      
      return { success: true, parkings: data.getNearbyParkings };
    } catch (error) {
      console.error('Fetch nearby parkings failed:', error);
      const errorMessage = error.message || 'Failed to fetch nearby parkings';
      set({
        nearbyParkings: [],
        nearbyParkingsLoading: false,
        nearbyParkingsError: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
  
  // Fetch parking details
  fetchParkingDetails: async (parkingId) => {
    set({ selectedParkingLoading: true, selectedParkingError: null });
    
    try {
      const { data } = await apolloClient.query({
        query: GET_PARKING,
        variables: { id: parkingId },
        fetchPolicy: 'network-only'
      });
      
      set({
        selectedParking: data.getParking,
        selectedParkingLoading: false,
        selectedParkingError: null
      });
      
      return { success: true, parking: data.getParking };
    } catch (error) {
      console.error('Fetch parking details failed:', error);
      const errorMessage = error.message || 'Failed to fetch parking details';
      set({
        selectedParking: null,
        selectedParkingLoading: false,
        selectedParkingError: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
  
  // Fetch user parking lots (for landowners)
  fetchUserParkingLots: async () => {
    set({ userParkingLotsLoading: true, userParkingLotsError: null });
    
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_PARKING_LOTS,
        fetchPolicy: 'network-only'
      });
      
      set({
        userParkingLots: data.getUserParkingLots || [],
        userParkingLotsLoading: false,
        userParkingLotsError: null
      });
      
      return { success: true, parkingLots: data.getUserParkingLots };
    } catch (error) {
      console.error('Fetch user parking lots failed:', error);
      const errorMessage = error.message || 'Failed to fetch parking lots';
      set({
        userParkingLots: [],
        userParkingLotsLoading: false,
        userParkingLotsError: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
  
  // Create parking lot
  createParkingLot: async (parkingData) => {
    set({ userParkingLotsLoading: true, userParkingLotsError: null });
      try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_PARKING,
        variables: { input: parkingData }
      });
      
      if (data?.createParking) {
        const { userParkingLots } = get();
        set({
          userParkingLots: [data.createParking, ...userParkingLots],
          userParkingLotsLoading: false,
          userParkingLotsError: null
        });
        toast.success('Parking lot created successfully!');
        return { success: true, parkingLot: data.createParking };
      }
    } catch (error) {
      console.error('Create parking lot failed:', error);
      const errorMessage = error.message || 'Failed to create parking lot';
      set({
        userParkingLotsLoading: false,
        userParkingLotsError: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
    // Update parking lot
  updateParkingLot: async (parkingId, updateData) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PARKING,
        variables: { id: parkingId, input: updateData }
      });
      
      if (data?.updateParking) {
        const { userParkingLots } = get();
        const updatedLots = userParkingLots.map(lot =>
          lot._id === parkingId ? { ...lot, ...data.updateParking } : lot
        );
        
        set({
          userParkingLots: updatedLots,
          selectedParking: data.updateParking
        });
        
        toast.success('Parking lot updated successfully!');
        return { success: true, parkingLot: data.updateParking };
      }
    } catch (error) {
      console.error('Update parking lot failed:', error);
      const errorMessage = error.message || 'Failed to update parking lot';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
  
  // Delete parking lot
  deleteParkingLot: async (parkingId) => {    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_PARKING,
        variables: { id: parkingId }
      });
      
      if (data?.deleteParking) {
        const { userParkingLots } = get();
        const filteredLots = userParkingLots.filter(lot => lot._id !== parkingId);
        
        set({
          userParkingLots: filteredLots,
          selectedParking: null
        });
        
        toast.success('Parking lot deleted successfully!');
        return { success: true };
      }
    } catch (error) {
      console.error('Delete parking lot failed:', error);
      const errorMessage = error.message || 'Failed to delete parking lot';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
    // Update parking status (available/unavailable)
  // TODO: Create UPDATE_PARKING_STATUS mutation on server
  updateParkingStatus: async (parkingId, status) => {
    try {
      // Note: This mutation doesn't exist yet
      // const { data } = await apolloClient.mutate({
      //   mutation: UPDATE_PARKING_STATUS,
      //   variables: { id: parkingId, status }
      // });
      
      // For now, just update the local state
      const { userParkingLots } = get();
      const updatedLots = userParkingLots.map(lot =>
        lot._id === parkingId ? { ...lot, status } : lot
      );
      
      set({ userParkingLots: updatedLots });
      toast.success(`Parking lot status updated to ${status}`);
      return { success: true };
      
    } catch (error) {
      console.error('Update parking status failed:', error);
      const errorMessage = error.message || 'Failed to update parking status';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
  
  // Fetch analytics
  fetchAnalytics: async (parkingLotId = null) => {
    set({ analyticsLoading: true, analyticsError: null });
    
    try {
      const { data } = await apolloClient.query({
        query: GET_PARKING_ANALYTICS,
        variables: parkingLotId ? { parkingLotId } : {},
        fetchPolicy: 'network-only'
      });
      
      set({
        parkingAnalytics: data.getParkingAnalytics,
        analyticsLoading: false,
        analyticsError: null
      });
      
      return { success: true, analytics: data.getParkingAnalytics };
    } catch (error) {
      console.error('Fetch analytics failed:', error);
      const errorMessage = error.message || 'Failed to fetch analytics';
      set({
        parkingAnalytics: null,
        analyticsLoading: false,
        analyticsError: errorMessage
      });      return { success: false, error: errorMessage };
    }
  },
  
  // Setter methods for direct state updates
  setSearchResults: (results) => set({ searchResults: results }),
  
  setSearchFilters: (filters) => set(state => ({
    searchFilters: { ...state.searchFilters, ...filters }
  })),
  
  setSearchLoading: (loading) => set({ searchLoading: loading }),
  
  setSelectedParking: (parking) => set({ selectedParking: parking }),
  
  setSelectedParkingLoading: (loading) => set({ selectedParkingLoading: loading }),
  
  setUserParkingLots: (lots) => set({ userParkingLots: lots }),
  
  setUserParkingLotsLoading: (loading) => set({ userParkingLotsLoading: loading }),
  
  setNearbyParkings: (parkings) => set({ nearbyParkings: parkings }),
  
  setNearbyParkingsLoading: (loading) => set({ nearbyParkingsLoading: loading }),
  
  setUserLocation: (location) => set({ userLocation: location }),
  
  // Clear methods
  clearSearch: () => set({
    searchResults: [],
    searchFilters: {
      query: '',
      location: '',
      startDateTime: null,
      endDateTime: null,
      priceRange: [0, 50000],
      amenities: [],
      distance: 5,
      sortBy: 'distance'
    },
    searchError: null
  }),
  
  clearErrors: () => set({
    searchError: null,
    selectedParkingError: null,
    userParkingLotsError: null,
    nearbyParkingsError: null,
    analyticsError: null
  })
}));

export default useParkingStore;
