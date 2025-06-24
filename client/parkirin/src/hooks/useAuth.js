// src/hooks/useAuth.js
import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { useApolloClient } from '@apollo/client';

const useAuth = () => {
  const { 
    user, 
    token, 
    isAuthenticated, 
    login, 
    logout, 
    setUser,
    isLoading 
  } = useAuthStore();
  
  const client = useApolloClient();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser, storedToken);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          logout();
        }
      }
    };

    initAuth();
  }, [setUser, logout]);

  // Enhanced login function
  const handleLogin = async (userData, authToken) => {
    try {
      login(userData, authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Reset Apollo Client cache on login
      await client.resetStore();
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Enhanced logout function
  const handleLogout = async () => {
    try {
      logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear Apollo Client cache on logout
      await client.clearStore();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Normalize role to ensure consistent casing and validation
  const normalizeRole = (role) => {
    if (!role) return null;
    
    // Convert to lowercase for consistent comparison
    const normalizedRole = role.toLowerCase();
    
    // Map to valid roles
    switch (normalizedRole) {
      case 'user':
      case 'USER':
        return 'user';
      case 'landowner':
      case 'LANDOWNER':
        return 'landowner';
      default:
        return null;
    }
  };

  // Enhanced role check function
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    const userRole = normalizeRole(user.role);
    const required = normalizeRole(requiredRole);
    
    return userRole === required;
  };

  // Enhanced role check for multiple roles
  const hasAnyRole = (roles) => {
    if (!user) return false;
    const userRole = normalizeRole(user.role);
    return roles.some(role => normalizeRole(role) === userRole);
  };

  // Specific role checks
  const isLandowner = () => hasRole('landowner');
  const isRegularUser = () => hasRole('user');

  return {
    user: user ? { ...user, role: normalizeRole(user.role) } : null,
    token,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    hasRole,
    hasAnyRole,
    isLandowner,
    isRegularUser
  };
};

export default useAuth;
