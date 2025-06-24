import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  CreditCardIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CANCEL_BOOKING, UPDATE_BOOKING_STATUS } from '../../graphql/mutations';
import { Card, Badge, Button, Modal } from '../common';
import { formatDateTime, formatCurrency, formatBookingStatus, getStatusColor } from '../../utils/formatters';
import { BOOKING_STATUS } from '../../utils/constants';

const BookingCard = ({
  booking,
  showActions = true,
  showParkingInfo = true,
  compact = false,
  onUpdate = null,
  userRole = 'customer'
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);

  const [cancelBooking, { loading: cancelLoading }] = useMutation(CANCEL_BOOKING);
  const [updateBookingStatus, { loading: updateLoading }] = useMutation(UPDATE_BOOKING_STATUS);

  const handleCancelBooking = async () => {
    try {
      await cancelBooking({
        variables: { id: booking._id }
      });
      
      if (onUpdate) {
        onUpdate('cancelled');
      }
      
      setShowCancelModal(false);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await updateBookingStatus({
        variables: { 
          id: booking._id,
          status 
        }
      });
      
      if (onUpdate) {
        onUpdate(status);
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const canCancel = booking.status === BOOKING_STATUS.CONFIRMED && 
                   new Date(booking.startTime) > new Date();
  
  const canCheckIn = booking.status === BOOKING_STATUS.CONFIRMED && 
                     userRole === 'landowner' &&
                     new Date(booking.startTime) <= new Date() &&
                     new Date(booking.endTime) > new Date();
  
  const canCheckOut = booking.status === BOOKING_STATUS.ACTIVE && 
                      userRole === 'landowner';

  const isExpired = new Date(booking.endTime) < new Date() && 
                   booking.status !== BOOKING_STATUS.COMPLETED;

  const statusColor = getStatusColor('booking', booking.status);

  return (
    <Card className={`${compact ? 'p-4' : ''} ${isExpired ? 'border-red-200 bg-red-50' : ''}`}>
      <Card.Content className={compact ? 'p-0' : ''}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {showParkingInfo && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {booking.parking?.name || 'Parking Location'}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {booking.parking?.address || 'Address not available'}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <Badge color={statusColor}>
                {formatBookingStatus(booking.status)}
              </Badge>
              {isExpired && (
                <Badge color="red">
                  Expired
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Booking ID: <span className="font-mono">{booking._id}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(booking.totalCost)}
            </div>
            <div className="text-sm text-gray-500">
              {booking.vehicleType}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span className="font-medium">Start:</span>
              <span className="ml-1">{formatDateTime(booking.startTime)}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-2" />
              <span className="font-medium">End:</span>
              <span className="ml-1">{formatDateTime(booking.endTime)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-600">License Plate:</span>
              <span className="ml-2 font-mono">{booking.licensePlate}</span>
            </div>
            
            {booking.qrCode && (
              <div className="text-sm">
                <span className="font-medium text-gray-600">QR Code:</span>
                <span className="ml-2 text-blue-600">Available</span>
              </div>
            )}
          </div>
        </div>

        {booking.notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Notes:</span> {booking.notes}
            </p>
          </div>
        )}

        {/* Payment Information */}
        {booking.payment && (
          <div className="border-t pt-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <CreditCardIcon className="w-4 h-4 mr-2" />
                Payment Status:
              </div>
              <Badge color={getStatusColor('payment', booking.payment.status)}>
                {booking.payment.status}
              </Badge>
            </div>
            {booking.payment.method && (
              <div className="text-sm text-gray-500 mt-1">
                Method: {booking.payment.method}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {/* Customer Actions */}
            {userRole === 'customer' && canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                Cancel Booking
              </Button>
            )}

            {/* Landowner Actions */}
            {canCheckIn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(BOOKING_STATUS.ACTIVE)}
                loading={updateLoading}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                Check In
              </Button>
            )}

            {canCheckOut && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(BOOKING_STATUS.COMPLETED)}
                loading={updateLoading}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                Check Out
              </Button>
            )}

            {/* View QR Code */}
            {booking.qrCode && booking.status === BOOKING_STATUS.CONFIRMED && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(booking.qrCode, '_blank')}
              >
                View QR Code
              </Button>
            )}

            {/* View Details */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to booking details
                if (typeof window !== 'undefined') {
                  window.location.href = `/bookings/${booking._id}`;
                }
              }}
            >
              View Details
            </Button>
          </div>
        )}
      </Card.Content>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking"
      >
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Are you sure you want to cancel this booking?
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                This action cannot be undone. Cancellation fees may apply.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Parking: {booking.parking?.name}</div>
              <div>Time: {formatDateTime(booking.startTime)}</div>
              <div>Total Cost: {formatCurrency(booking.totalCost)}</div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelLoading}
            >
              Keep Booking
            </Button>
            <Button
              variant="primary"
              onClick={handleCancelBooking}
              loading={cancelLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default BookingCard;