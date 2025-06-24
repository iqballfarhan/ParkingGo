// src/utils/constants.js

// API Status Constants
export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Booking Status Constants
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

// Payment Status Constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

// Vehicle Types
export const VEHICLE_TYPES = {
  CAR: 'car',
  MOTORCYCLE: 'motorcycle'
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  LANDOWNER: 'landowner',
  ADMIN: 'admin'
};

// Map Constants
export const MAP_DEFAULTS = {
  CENTER: {
    latitude: -6.2088,
    longitude: 106.8456 // Jakarta coordinates
  },
  ZOOM: 12
};

// Error Messages
export const ERROR_MESSAGES = {  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  REGISTER_SUCCESS: 'Account created successfully!',
  BOOKING_CREATED: 'Booking created successfully!',
  BOOKING_CANCELLED: 'Booking cancelled successfully!',
  PAYMENT_SUCCESS: 'Payment completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!'
};
