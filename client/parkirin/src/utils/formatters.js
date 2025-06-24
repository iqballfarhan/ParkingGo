// src/utils/formatters.js

/**
 * Format vehicle type for display
 * @param {string} vehicleType - Vehicle type (car/motorcycle)
 * @returns {string} Formatted vehicle type
 */
export const formatVehicleType = (vehicleType) => {
  const types = {
    car: 'Car',
    motorcycle: 'Motorcycle'
  };
  return types[vehicleType] || vehicleType;
};

/**
 * Format booking status for display
 * @param {string} status - Booking status
 * @returns {string} Formatted status
 */
export const formatBookingStatus = (status) => {
  const statusMap = {
    pending: 'Pending Confirmation',
    confirmed: 'Confirmed',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    expired: 'Expired'
  };
  return statusMap[status] || status;
};

/**
 * Format payment status for display
 * @param {string} status - Payment status
 * @returns {string} Formatted status
 */
export const formatPaymentStatus = (status) => {
  const statusMap = {
    pending: 'Pending Payment',
    success: 'Success',
    failed: 'Failed',
    expired: 'Expired'
  };
  return statusMap[status] || status;
};

/**
 * Get status color class
 * @param {string} status - Status string
 * @returns {string} Tailwind CSS color classes
 */
export const getStatusColor = (status) => {
  const colorMap = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format Indonesian phone number
  if (digits.startsWith('62')) {
    return `+${digits}`;
  } else if (digits.startsWith('0')) {
    return `+62${digits.substring(1)}`;
  }
  
  return phone;
};

/**
 * Format operational hours for display
 * @param {object} hours - Operational hours object with open and close
 * @returns {string} Formatted operational hours
 */
export const formatOperationalHours = (hours) => {
  if (!hours || !hours.open || !hours.close) {
    return 'Not available';
  }
  
  return `${hours.open} - ${hours.close}`;
};

/**
 * Format rating for display
 * @param {number} rating - Rating value
 * @returns {string} Formatted rating
 */
export const formatRating = (rating) => {
  if (!rating) return '0.0';
  return rating.toFixed(1);
};

/**
 * Format facilities list for display
 * @param {array} facilities - Array of facility strings
 * @returns {string} Formatted facilities
 */
export const formatFacilities = (facilities) => {
  if (!facilities || facilities.length === 0) {
    return 'No facilities available';
  }
  
  if (facilities.length <= 3) {
    return facilities.join(', ');
  }
  
  return `${facilities.slice(0, 3).join(', ')}, +${facilities.length - 3} more`;
};

/**
 * Format booking duration for display
 * @param {Date} startTime - Start time
 * @param {number} duration - Duration in hours
 * @returns {string} Formatted booking time range
 */
export const formatBookingTime = (startTime, duration) => {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const dateOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  
  const startTime12 = start.toLocaleTimeString('en-US', timeOptions);
  const endTime12 = end.toLocaleTimeString('en-US', timeOptions);
  const dateStr = start.toLocaleDateString('en-US', dateOptions);
  
  // If same day
  if (start.toDateString() === end.toDateString()) {
    return `${dateStr}, ${startTime12} - ${endTime12}`;
  }
  
  // If different days
  const endDateStr = end.toLocaleDateString('en-US', dateOptions);
  return `${dateStr} ${startTime12} - ${endDateStr} ${endTime12}`;
};

/**
 * Format chat message timestamp for display
 * @param {string|Date} timestamp - Message timestamp
 * @returns {string} Formatted time for chat display
 */
export const formatChatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
    // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Same day
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`;
  }
  
  // This week
  if (diff < 604800000) { // 7 days
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[date.getDay()]} ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`;
  }
  
  // Older than a week
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
    const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return dateObj.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format time for display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time
 */
export const formatTime = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
    const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  };
  
  return dateObj.toLocaleTimeString('en-US', defaultOptions);
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: IDR)
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'IDR') => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date and time for display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
    const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  };
  
  return dateObj.toLocaleDateString('en-US', defaultOptions);
};
