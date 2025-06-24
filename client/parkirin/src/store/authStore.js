import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apolloClient from '../graphql/client.js';
import { LOGIN, REGISTER, GOOGLE_AUTH, UPDATE_PROFILE } from '../graphql/mutations.js';
import { GET_ME } from '../graphql/queries.js';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: true,
      error: null,
      
      // Initialize auth state from token
      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const { data } = await apolloClient.query({
              query: GET_ME,
              fetchPolicy: 'network-only'
            });
            
            if (data?.me) {
              set({
                isAuthenticated: true,
                user: data.me,
                token,
                loading: false,
                error: null
              });
            } else {
              localStorage.removeItem('token');
              set({
                isAuthenticated: false,
                user: null,
                token: null,
                loading: false,
                error: null
              });
            }
          } catch (error) {
            console.error('Auth initialization failed:', error);
            localStorage.removeItem('token');
            set({
              isAuthenticated: false,
              user: null,
              token: null,
              loading: false,
              error: error.message
            });
          }
        } else {
          set({ loading: false });
        }
      },
      
      // Login
      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const { data } = await apolloClient.mutate({
            mutation: LOGIN,
            variables: { input: credentials }
          });
          
          if (data?.login) {
            const { token, user } = data.login;
            localStorage.setItem('token', token);
            set({
              isAuthenticated: true,
              user,
              token,
              loading: false,
              error: null
            });
            toast.success('Login successful!');
            return { success: true, user };
          }
        } catch (error) {
          console.error('Login failed:', error);
          const errorMessage = error.message || 'Login failed';
          set({
            loading: false,
            error: errorMessage
          });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },
      
      // Register
      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const { data } = await apolloClient.mutate({
            mutation: REGISTER,
            variables: { input: userData }
          });
          
          if (data?.register) {
            const { token, user } = data.register;
            localStorage.setItem('token', token);
            set({
              isAuthenticated: true,
              user,
              token,
              loading: false,
              error: null
            });
            toast.success('Registration successful!');
            return { success: true, user };
          }
        } catch (error) {
          console.error('Registration failed:', error);
          const errorMessage = error.message || 'Registration failed';
          set({
            loading: false,
            error: errorMessage
          });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },
      
      // Google Auth
      googleAuth: async (googleToken) => {
        set({ loading: true, error: null });
        try {
          const { data } = await apolloClient.mutate({
            mutation: GOOGLE_AUTH,
            variables: { token: googleToken }
          });
          
          if (data?.googleAuth) {
            const { token, user } = data.googleAuth;
            localStorage.setItem('token', token);
            set({
              isAuthenticated: true,
              user,
              token,
              loading: false,
              error: null
            });
            toast.success('Google authentication successful!');
            return { success: true, user };
          }
        } catch (error) {
          console.error('Google auth failed:', error);
          const errorMessage = error.message || 'Google authentication failed';
          set({
            loading: false,
            error: errorMessage
          });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },
      
      // Update Profile
      updateProfile: async (name) => {
        set({ loading: true, error: null });
        try {
          const { data } = await apolloClient.mutate({
            mutation: UPDATE_PROFILE,
            variables: { name }
          });
          
          if (data?.updateProfile) {
            set(state => ({
              user: { ...state.user, ...data.updateProfile },
              loading: false,
              error: null
            }));
            toast.success('Profile updated successfully!');
            return { success: true, user: data.updateProfile };
          }
        } catch (error) {
          console.error('Profile update failed:', error);
          const errorMessage = error.message || 'Profile update failed';
          set({
            loading: false,
            error: errorMessage
          });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },
      
      // Logout
      logout: async () => {
        localStorage.removeItem('token');
        await apolloClient.clearStore();
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: null
        });
        toast.success('Logged out successfully');
      },

      // Set loading state
      setLoading: (loading) => set({ loading }),
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Set auth (for external use)
      setAuth: (user, token) => set({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export default useAuthStore;
