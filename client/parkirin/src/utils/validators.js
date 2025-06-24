// src/utils/validators.js

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  
  if (password.length > 50) {
    return { isValid: false, message: 'Password must be less than 50 characters' };
  }
  
  return { isValid: true, message: 'Password is valid' };
};

/**
 * Validate Indonesian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if not empty
 */
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if within range
 */
export const isInRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate parking name
 * @param {string} name - Parking name to validate
 * @returns {object} Validation result
 */
export const validateParkingName = (name) => {
  if (!isRequired(name)) {
    return { isValid: false, message: 'Parking name is required' };
  }
  
  if (name.length < 3) {
    return { isValid: false, message: 'Parking name must be at least 3 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, message: 'Parking name must be less than 100 characters' };
  }
  
  return { isValid: true, message: 'Valid parking name' };
};

/**
 * Validate address
 * @param {string} address - Address to validate
 * @returns {object} Validation result
 */
export const validateAddress = (address) => {
  if (!isRequired(address)) {
    return { isValid: false, message: 'Address is required' };
  }
  
  if (address.length < 10) {
    return { isValid: false, message: 'Address must be at least 10 characters' };
  }
  
  if (address.length > 255) {
    return { isValid: false, message: 'Address must be less than 255 characters' };
  }
  
  return { isValid: true, message: 'Valid address' };
};

/**
 * Validate coordinates
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {object} Validation result
 */
export const validateCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return { isValid: false, message: 'Invalid coordinates format' };
  }
  
  if (lat < -90 || lat > 90) {
    return { isValid: false, message: 'Latitude must be between -90 and 90' };
  }
  
  if (lng < -180 || lng > 180) {
    return { isValid: false, message: 'Longitude must be between -180 and 180' };
  }
  
  return { isValid: true, message: 'Valid coordinates' };
};

/**
 * Validate price/rate
 * @param {number} price - Price to validate
 * @returns {object} Validation result
 */
export const validatePrice = (price) => {
  const num = Number(price);
  
  if (isNaN(num)) {
    return { isValid: false, message: 'Price must be a number' };
  }
  
  if (num < 0) {
    return { isValid: false, message: 'Price must be positive' };
  }
  
  if (num > 1000000) {
    return { isValid: false, message: 'Price must be less than Rp 1,000,000' };
  }
  
  return { isValid: true, message: 'Valid price' };
};

/**
 * Validate capacity
 * @param {number} capacity - Capacity to validate
 * @returns {object} Validation result
 */
export const validateCapacity = (capacity) => {
  const num = Number(capacity);
  
  if (isNaN(num)) {
    return { isValid: false, message: 'Capacity must be a number' };
  }
  
  if (num < 1) {
    return { isValid: false, message: 'Capacity must be at least 1' };
  }
  
  if (num > 1000) {
    return { isValid: false, message: 'Capacity must be less than 1000' };
  }
  
  return { isValid: true, message: 'Valid capacity' };
};

/**
 * Validate operational hours
 * @param {string} openTime - Opening time (HH:MM format)
 * @param {string} closeTime - Closing time (HH:MM format)
 * @returns {object} Validation result
 */
export const validateOperationalHours = (openTime, closeTime) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(openTime)) {
    return { isValid: false, message: 'Invalid opening time format (use HH:MM)' };
  }
  
  if (!timeRegex.test(closeTime)) {
    return { isValid: false, message: 'Invalid closing time format (use HH:MM)' };
  }
  
  const open = new Date(`2000-01-01T${openTime}:00`);
  const close = new Date(`2000-01-01T${closeTime}:00`);
  
  if (close <= open) {
    return { isValid: false, message: 'Closing time must be after opening time' };
  }
  
  return { isValid: true, message: 'Valid operational hours' };
};

/**
 * Validate vehicle type
 * @param {string} vehicleType - Vehicle type to validate
 * @returns {boolean} True if valid vehicle type
 */
export const validateVehicleType = (vehicleType) => {
  const validTypes = ['car', 'motorcycle'];
  return validTypes.includes(vehicleType);
};

/**
 * Validate booking time
 * @param {string} date - Date string (YYYY-MM-DD format)
 * @param {string} time - Time string (HH:MM format)
 * @returns {object} Validation result
 */
export const validateBookingTime = (date, time) => {
  if (!date || !time) {
    return { isValid: false, message: 'Date and time are required' };
  }
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(date)) {
    return { isValid: false, message: 'Invalid date format (use YYYY-MM-DD)' };
  }
  
  if (!timeRegex.test(time)) {
    return { isValid: false, message: 'Invalid time format (use HH:MM)' };
  }
  
  const selectedDateTime = new Date(`${date}T${time}:00`);
  const now = new Date();
  
  if (isNaN(selectedDateTime.getTime())) {
    return { isValid: false, message: 'Invalid date or time' };
  }
  
  if (selectedDateTime <= now) {
    return { isValid: false, message: 'Booking time must be in the future' };
  }
  
  // Check if booking is too far in the future (e.g., max 3 months)
  const maxFutureDate = new Date();
  maxFutureDate.setMonth(maxFutureDate.getMonth() + 3);
  
  if (selectedDateTime > maxFutureDate) {
    return { isValid: false, message: 'Booking cannot be more than 3 months in advance' };
  }
  
  return { isValid: true, message: 'Valid booking time' };
};
