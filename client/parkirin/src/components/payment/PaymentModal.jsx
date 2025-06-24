import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import PaymentMethodSelector from './PaymentMethodSelector';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  onPaymentSuccess, 
  onPaymentError,
  loading = false 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) {
      onPaymentError?.('Please select a payment method');
      return;
    }

    try {
      setProcessing(true);

      // Simulate payment processing
      // In a real implementation, this would integrate with Midtrans or other payment gateway
      const paymentData = {
        bookingId: booking.id,
        amount: booking.totalPrice,
        paymentMethod: selectedMethod,
        timestamp: new Date().toISOString()
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment
      onPaymentSuccess?.(paymentData);
      
      // Reset state
      setSelectedMethod('');
      onClose();
    } catch (error) {
      onPaymentError?.(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-90vh overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payment</h2>
          <button
            onClick={onClose}
            disabled={processing || loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Parking Location:</span>
              <span className="font-medium">{booking.parkingName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{booking.duration} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Start Time:</span>
              <span className="font-medium">
                {new Date(booking.startTime).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">End Time:</span>
              <span className="font-medium">
                {new Date(booking.endTime).toLocaleString()}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-blue-600">
                Rp {booking.totalPrice?.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
          />
        </div>

        {/* Payment Button */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={processing || loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={!selectedMethod || processing || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing || loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              `Pay Rp ${booking.totalPrice?.toLocaleString('id-ID')}`
            )}
          </button>
        </div>

        {/* Terms */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          By proceeding with payment, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Terms & Conditions
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
