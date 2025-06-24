import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Card, 
  Button, 
  Badge, 
  Modal, 
  LoadingSpinner, 
  Alert 
} from '../../components/common';
import { 
  GET_BOOKING, 
  GENERATE_BOOKING_QR, 
  GENERATE_PARKING_ACCESS_QR 
} from '../../graphql/queries';
import { 
  CANCEL_BOOKING, 
  EXTEND_BOOKING,
  CONFIRM_BOOKING 
} from '../../graphql/mutations';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { 
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  QrCodeIcon,
  PhoneIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrType, setQrType] = useState(''); // 'booking', 'entry', 'exit'
  const [extensionHours, setExtensionHours] = useState(1);

  // Fetch booking details
  const { data, loading, error, refetch } = useQuery(GET_BOOKING, {
    variables: { id },
    fetchPolicy: 'cache-and-network'
  });

  // Mutations
  const [cancelBooking, { loading: cancelLoading }] = useMutation(CANCEL_BOOKING, {
    onCompleted: () => {
      setShowCancelModal(false);
      refetch();
    }
  });

  const [confirmBooking, { loading: confirmLoading }] = useMutation(CONFIRM_BOOKING, {
    onCompleted: () => {
      refetch();
    }
  });

  const [extendBooking, { loading: extendLoading }] = useMutation(EXTEND_BOOKING, {
    onCompleted: () => {
      setShowExtendModal(false);
      refetch();
    }
  });

  const [generateBookingQR, { loading: generateQRLoading }] = useMutation(GENERATE_BOOKING_QR);
  const [generateAccessQR] = useMutation(GENERATE_PARKING_ACCESS_QR);

  const booking = data?.getBooking;

  // Generate QR Code
  const handleGenerateQR = async (type) => {
    try {
      let qrData = '';
      
      if (type === 'booking') {
        const result = await generateBookingQR({
          variables: { bookingId: id }
        });
        qrData = result.data.generateBookingQR.qrCode;
      } else {
        const result = await generateAccessQR({
          variables: { 
            bookingId: id,
            type: type // 'entry' or 'exit'
          }
        });
        qrData = result.data.generateParkingAccessQR;
      }

      // Generate QR code image
      const qrUrl = await QRCode.toDataURL(qrData);
      setQrCodeUrl(qrUrl);
      setQrType(type);
      setShowQRModal(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async () => {
    try {
      await cancelBooking({ variables: { id } });
    } catch (error) {
      console.error('Error canceling booking:', error);
    }
  };

  // Handle confirm booking
  const handleConfirmBooking = async () => {
    try {
      await confirmBooking({ variables: { id } });
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  // Handle extend booking
  const handleExtendBooking = async () => {
    try {
      await extendBooking({
        variables: {
          id,
          additionalDuration: extensionHours
        }
      });
    } catch (error) {
      console.error('Error extending booking:', error);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'confirmed': return 'green';
      case 'completed': return 'blue';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };
  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Confirmation';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Check if booking can be modified
  const canCancel = booking?.status === 'pending' || booking?.status === 'confirmed';
  const canExtend = booking?.status === 'confirmed';
  const canConfirm = booking?.status === 'pending';
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="large" variant="spinner" color="primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md bg-white/70 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Booking Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.message || "The booking you're looking for was not found or has been deleted."}
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/bookings')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Back to Bookings
          </Button>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ml-2">
            Booking Details
          </h1>
          <span className="ml-auto">
            <Badge color={getStatusColor(booking.status)} size="md">
              {getStatusText(booking.status)}
            </Badge>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}          <div className="lg:col-span-2 space-y-8">
            {/* Parking Information */}
            <Card className="p-6 rounded-2xl shadow-lg border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Parking Information
              </h2>
              <div className="flex items-start gap-4">
                {booking.parking?.images?.[0] && (
                  <img
                    src={booking.parking.images[0]}
                    alt={booking.parking.name}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-md"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {booking.parking?.name}
                  </h3>
                  <div className="flex items-start gap-2 text-gray-600 mb-2">
                    <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span className="text-sm">{booking.parking?.address}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>⭐ {booking.parking?.rating || 0}/5</span>
                    <span>•</span>
                    <span>📍 {booking.distance ? `${booking.distance}m` : 'N/A'}</span>
                  </div>
                  {booking.parking?.owner && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        Owner: <span className="font-medium">{booking.parking.owner.name}</span>
                      </p>                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        onClick={() => navigate(`/chat/${booking.parking.owner._id}`)}
                      >
                        <PhoneIcon className="h-4 w-4" />
                        Contact Owner
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>            {/* Booking Details */}
            <Card className="p-6 rounded-2xl shadow-lg border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Booking Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="font-medium">
                        {formatDateTime(booking.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium">{booking.duration} hours</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <p className="text-sm text-gray-600">Vehicle Type</p>
                      <p className="font-medium">
                        {booking.vehicleType === 'car' ? 'Car' : 'Motorcycle'}
                      </p>
                    </div>
                  </div>
                  {booking.licensePlate && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔢</span>
                      <div>
                        <p className="text-sm text-gray-600">License Plate</p>
                        <p className="font-medium">{booking.licensePlate}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {booking.notes && (
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-gray-600">Notes:</p>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}
            </Card>            {/* Payment Information */}
            <Card className="p-6 rounded-2xl shadow-lg border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Payment Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate per hour:</span>
                  <span className="font-medium">
                    {formatCurrency(booking.hourlyRate || booking.cost / booking.duration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{booking.duration} hours</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3 border-gray-100">
                  <span>Total Cost:</span>
                  <span className="text-blue-600">{formatCurrency(booking.cost)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCardIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">
                    Payment Status: 
                    <span className={`ml-1 font-medium ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </span>
                </div>
              </div>
            </Card>
          </div>          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* QR Codes */}
            <Card className="p-4 rounded-2xl shadow-lg border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <h3 className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                QR Codes
              </h3>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleGenerateQR('booking')}
                  disabled={generateQRLoading}
                  className="w-full flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  <QrCodeIcon className="h-4 w-4" />
                  Booking QR
                </Button>
                {booking.status === 'confirmed' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateQR('entry')}
                      className="w-full flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    >
                      <QrCodeIcon className="h-4 w-4" />
                      Entry QR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateQR('exit')}
                      className="w-full flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    >
                      <QrCodeIcon className="h-4 w-4" />
                      Exit QR
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-4 rounded-2xl shadow-lg border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <h3 className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Actions
              </h3>
              <div className="space-y-2">
                {canConfirm && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmBooking}
                    loading={confirmLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                  >
                    Confirm Booking
                  </Button>
                )}
                {canExtend && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExtendModal(true)}
                    className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                  >
                    Extend Booking
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                    loading={cancelLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 transition-all duration-200"
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={`QR Code ${qrType === 'booking' ? 'Booking' : qrType === 'entry' ? 'Entry' : 'Exit'}`}
      >
        <div className="text-center py-4">
          {qrCodeUrl && (
            <div className="mb-4">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="mx-auto w-64 h-64 rounded-xl shadow-lg"
              />
            </div>
          )}
          
          <p className="text-gray-600 mb-4">
            Show this QR code to the parking attendant
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.download = `qr-${qrType}-${booking._id}.png`;
                link.href = qrCodeUrl;
                link.click();
              }}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              Download
            </Button>
            
            <Button
              variant="primary"
              onClick={() => setShowQRModal(false)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking"
      >
        <div className="py-4">
          <Alert
            type="warning"
            title="Warning"
            message="Are you sure you want to cancel this booking? This action cannot be undone."
            className="mb-4"
          />
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            
            <Button
              variant="primary"
              onClick={handleCancelBooking}
              disabled={cancelLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </div>
        </div>
      </Modal>      {/* Extend Booking Modal */}
      <Modal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        title="Extend Parking Time"
      >
        <div className="py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Duration (hours)
            </label>
            <select
              value={extensionHours}
              onChange={(e) => setExtensionHours(parseInt(e.target.value))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map(hour => (
                <option key={hour} value={hour}>
                  {hour} hour{hour > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg mb-4 border border-blue-100">
            <div className="flex justify-between text-sm">
              <span>Additional cost:</span>
              <span className="font-medium">
                {formatCurrency((booking.hourlyRate || booking.cost / booking.duration) * extensionHours)}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowExtendModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            
            <Button
              variant="primary"
              onClick={handleExtendBooking}
              disabled={extendLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {extendLoading ? 'Extending...' : 'Extend'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingDetail;