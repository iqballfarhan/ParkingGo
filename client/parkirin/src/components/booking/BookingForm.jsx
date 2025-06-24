import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_BOOKING } from '../../graphql/mutations';
import { Button, Card, Alert } from '../common';
import { FormField, Select } from '../forms';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { VEHICLE_TYPES } from '../../utils/constants';
import { validateBookingTime, validateVehicleType } from '../../utils/validators';

const BookingForm = ({
  parking,
  selectedDate = null,
  selectedTime = null,
  onSuccess = null,
  onCancel = null,
  userLocation = null
}) => {
  const [formData, setFormData] = useState({
    vehicleType: '',
    licensePlate: '',
    startDate: selectedDate || '',
    startTime: selectedTime || '',
    duration: 1,
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [totalCost, setTotalCost] = useState(0);

  const [createBooking, { loading, error }] = useMutation(CREATE_BOOKING);

  // Calculate total cost when form data changes
  useEffect(() => {
    if (formData.vehicleType && formData.duration && parking) {
      const rate = parking.rates[formData.vehicleType] || 0;
      setTotalCost(rate * formData.duration);
    }
  }, [formData.vehicleType, formData.duration, parking]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Vehicle type validation
    if (!formData.vehicleType) {
      newErrors.vehicleType = 'Please select a vehicle type';
    } else if (!validateVehicleType(formData.vehicleType)) {
      newErrors.vehicleType = 'Invalid vehicle type';
    }

    // License plate validation
    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    } else if (formData.licensePlate.length < 3) {
      newErrors.licensePlate = 'License plate must be at least 3 characters';
    }

    // Date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const selectedDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const now = new Date();
      
      if (selectedDateTime <= now) {
        newErrors.startDate = 'Booking time must be in the future';
      }
    }

    // Time validation
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    // Duration validation
    if (!formData.duration || formData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 hour';
    } else if (formData.duration > 24) {
      newErrors.duration = 'Duration cannot exceed 24 hours';
    }

    // Check availability for selected vehicle type
    if (formData.vehicleType && parking) {
      const available = parking.available[formData.vehicleType] || 0;
      if (available <= 0) {
        newErrors.vehicleType = `No ${formData.vehicleType} slots available`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (formData.duration * 60 * 60 * 1000));

      const bookingData = {
        parking_id: parking._id,
        vehicle_type: formData.vehicleType,
        license_plate: formData.licensePlate.toUpperCase(),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        total_cost: totalCost,
        notes: formData.notes.trim()
      };

      const { data } = await createBooking({
        variables: { input: bookingData }
      });

      if (onSuccess) {
        onSuccess(data.createBooking);
      }
    } catch (err) {
      console.error('Booking creation failed:', err);
    }
  };

  const vehicleOptions = Object.values(VEHICLE_TYPES).map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1)
  }));

  const durationOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} hour${i + 1 > 1 ? 's' : ''}`
  }));

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get minimum time for today
  const now = new Date();
  const minTime = formData.startDate === today 
    ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    : '00:00';

  return (
    <Card className="max-w-2xl mx-auto">
      <Card.Header>
        <Card.Title>Book Parking Slot</Card.Title>
        <p className="text-sm text-gray-600 mt-1">
          Complete the form below to book your parking slot
        </p>
      </Card.Header>

      <Card.Content>
        {/* Parking Info Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">{parking.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{parking.address}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Car Rate:</span>
              <span className="font-medium ml-2">{formatCurrency(parking.rates.car)}/hour</span>
            </div>
            <div>
              <span className="text-gray-500">Motorcycle Rate:</span>
              <span className="font-medium ml-2">{formatCurrency(parking.rates.motorcycle)}/hour</span>
            </div>
            <div>
              <span className="text-gray-500">Car Available:</span>
              <span className="font-medium ml-2">{parking.available.car} slots</span>
            </div>
            <div>
              <span className="text-gray-500">Motorcycle Available:</span>
              <span className="font-medium ml-2">{parking.available.motorcycle} slots</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert type="error" className="mb-6">
            {error.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Vehicle Information</h4>
            
            <FormField
              label="Vehicle Type"
              error={errors.vehicleType}
              required
            >
              <Select
                value={formData.vehicleType}
                onChange={(value) => handleInputChange('vehicleType', value)}
                options={vehicleOptions}
                placeholder="Select vehicle type"
                error={!!errors.vehicleType}
              />
            </FormField>

            <FormField
              label="License Plate"
              error={errors.licensePlate}
              required
            >
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                placeholder="Enter license plate number"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.licensePlate ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={15}
              />
            </FormField>
          </div>

          {/* Booking Time */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Booking Time</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Start Date"
                error={errors.startDate}
                required
              >
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  min={today}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </FormField>

              <FormField
                label="Start Time"
                error={errors.startTime}
                required
              >
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  min={minTime}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.startTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </FormField>
            </div>

            <FormField
              label="Duration"
              error={errors.duration}
              required
            >
              <Select
                value={formData.duration}
                onChange={(value) => handleInputChange('duration', parseInt(value))}
                options={durationOptions}
                placeholder="Select duration"
                error={!!errors.duration}
              />
            </FormField>
          </div>

          {/* Additional Notes */}
          <FormField
            label="Additional Notes (Optional)"
            error={errors.notes}
          >
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any special requirements or notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.notes.length}/500 characters
            </p>
          </FormField>

          {/* Cost Summary */}
          {totalCost > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle Type:</span>
                  <span className="font-medium">{formData.vehicleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{formData.duration} hour{formData.duration > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate per hour:</span>
                  <span className="font-medium">{formatCurrency(parking.rates[formData.vehicleType] || 0)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Total Cost:</span>
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </Card.Content>

      <Card.Footer>
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || totalCost === 0}
          >
            Book Now - {formatCurrency(totalCost)}
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default BookingForm;