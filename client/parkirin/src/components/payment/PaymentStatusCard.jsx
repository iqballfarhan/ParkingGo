import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const PaymentStatusCard = ({ payment, onRetryPayment, onViewDetails }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case 'pending':
      case 'processing':
        return <ClockIcon className="w-6 h-6 text-yellow-600" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Status Icon */}
        <div className="mt-1">
          {getStatusIcon(payment.status)}
        </div>

        {/* Payment Details */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              Payment #{payment.transactionId || payment.id}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
              {formatStatus(payment.status)}
            </span>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium text-gray-900">
                Rp {payment.amount?.toLocaleString('id-ID')}
              </span>
            </div>
              <div className="flex justify-between">
              <span>Method:</span>
              <span className="font-medium text-gray-900">
                {payment.payment_method || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-medium text-gray-900">
                {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            {payment.booking && (
              <div className="flex justify-between">
                <span>Booking:</span>
                <span className="font-medium text-gray-900">
                  #{payment.booking.id || payment.bookingId}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex space-x-2">
            {payment.status === 'failed' && onRetryPayment && (
              <button
                onClick={() => onRetryPayment(payment)}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry Payment
              </button>
            )}
            
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(payment)}
                className="text-sm px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusCard;
