import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import BookingForm from '../booking/BookingForm';
import { GET_PARKING_LOT } from '../../graphql/queries';
import { 
  MapPinIcon as MapPin, 
  ClockIcon as Clock, 
  TruckIcon as Car, 
  StarIcon as Star, 
  NavigationIcon as Navigation, 
  PhoneIcon as Phone, 
  WiFiIcon as Wifi, 
  ShieldCheckIcon as Shield, 
  TruckIcon as Truck, 
  CalendarIcon as Calendar 
} from '@heroicons/react/24/outline';
import googleMapsService from '../../services/googleMapsService';
import { useAuthStore } from '../../store/authStore';
import Swal from 'sweetalert2';

const ParkingDetailsModal = ({ parkingId, isOpen, onClose }) => {
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const { data, loading, error } = useQuery(GET_PARKING_LOT, {
    variables: { id: parkingId },
    skip: !parkingId || !isOpen,
  });

  const parking = data?.getParkingLot;

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowBookingForm(true);
  };

  const handleBookingSuccess = (booking) => {
    setShowBookingForm(false);
    onClose();
    // Navigate to booking details or show success message
    navigate(`/bookings/${booking._id}`);
  };

  const handleBookingCancel = () => {
    setShowBookingForm(false);
  };

  const handleGetDirections = async () => {
    if (!parking?.location?.latitude || !parking?.location?.longitude) {
      await Swal.fire({
        title: 'Lokasi Tidak Tersedia',
        text: 'Koordinat lokasi tidak tersedia',
        icon: 'error',
      });
      return;
    }

    setDirectionsLoading(true);
    try {
      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const origin = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            const destination = {
              lat: parseFloat(parking.location.latitude),
              lng: parseFloat(parking.location.longitude)
            };            // Open directions in native maps app
            await googleMapsService.openDirections(destination, origin);
            setDirectionsLoading(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            // Fallback: open directions without origin
            const destination = {
              lat: parseFloat(parking.location.latitude),
              lng: parseFloat(parking.location.longitude)
            };
            googleMapsService.openDirections(destination);
            setDirectionsLoading(false);
          }
        );
      } else {
        // Fallback: open directions without origin
        const destination = {
          lat: parseFloat(parking.location.latitude),
          lng: parseFloat(parking.location.longitude)
        };
        googleMapsService.openDirections(destination);
        setDirectionsLoading(false);
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      await Swal.fire({
        title: 'Gagal Membuka Arah',
        text: 'Tidak dapat membuka arah. Silakan coba lagi.',
        icon: 'error',
      });
      setDirectionsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatOperatingHours = (openTime, closeTime) => {
    if (!openTime || !closeTime) return 'Operating hours not available';
    return `${openTime} - ${closeTime}`;
  };

  const getAvailabilityColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityText = (available, total) => {
    if (total === 0) return 'No spaces';
    const percentage = Math.round((available / total) * 100);
    return `${available}/${total} spaces (${percentage}% available)`;
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading parking details...</span>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <MapPin className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load parking details
          </h3>
          <p className="text-gray-600 mb-4">
            {error.message || 'An error occurred while loading the parking information.'}
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  if (!parking) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <MapPin className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Parking not found
          </h3>
          <p className="text-gray-600 mb-4">
            The requested parking information is not available.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {parking.name}
              </h2>
              <div className="flex items-center mt-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{parking.address}</span>
              </div>
              {parking.rating && (
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-900">
                    {parking.rating.toFixed(1)}
                  </span>
                  <span className="ml-1 text-sm text-gray-600">
                    ({parking.reviewCount || 0} reviews)
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>        {/* Content */}
        <div className="px-6 py-4">
          {/* Show booking form if user clicked Book Now */}
          {showBookingForm ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Book Parking Space</h3>
                <button
                  onClick={handleBookingCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <BookingForm
                parkingLot={parking}
                onSuccess={handleBookingSuccess}
                onCancel={handleBookingCancel}
              />
            </div>
          ) : (
            <>
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <button
                  onClick={handleBookNow}
                  disabled={parking.availableSpaces <= 0}
                  className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {parking.availableSpaces <= 0 ? 'No Spaces' : 'Book Now'}
                </button>
                <button
                  onClick={handleGetDirections}
                  disabled={directionsLoading}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {directionsLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  Get Directions
                </button>
                {parking.phone && (
                  <a
                    href={`tel:${parking.phone}`}
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </a>
                )}
              </div>              {/* Availability Status */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Car className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Availability</span>
                  </div>
                  <span className={`font-semibold ${getAvailabilityColor(parking.availableSpaces, parking.capacity)}`}>
                    {getAvailabilityText(parking.availableSpaces, parking.capacity)}
                  </span>
                </div>
              </div>

              {/* Pricing & Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Pricing */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hourly Rate:</span>
                      <span className="font-medium">{formatPrice(parking.pricePerHour)}</span>
                    </div>
                    {parking.dailyRate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daily Rate:</span>
                        <span className="font-medium">{formatPrice(parking.dailyRate)}</span>
                      </div>
                    )}
                    {parking.monthlyRate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Rate:</span>
                        <span className="font-medium">{formatPrice(parking.monthlyRate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Operating Hours</h3>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {formatOperatingHours(parking.openTime, parking.closeTime)}
                    </span>
                  </div>
                  {parking.is24Hours && (
                    <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      24/7 Available
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {parking.amenities && parking.amenities.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {parking.amenities.map((amenity, index) => {
                      const getAmenityIcon = (amenityName) => {
                        const name = amenityName.toLowerCase();
                        if (name.includes('wifi') || name.includes('internet')) return <Wifi className="h-4 w-4" />;
                        if (name.includes('security') || name.includes('cctv')) return <Shield className="h-4 w-4" />;
                        if (name.includes('truck') || name.includes('large')) return <Truck className="h-4 w-4" />;
                        return <Car className="h-4 w-4" />;
                      };

                      return (
                        <div key={index} className="flex items-center text-sm text-gray-700">
                          <div className="text-blue-600 mr-2">
                            {getAmenityIcon(amenity)}
                          </div>
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              {parking.description && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {parking.description}
                  </p>
                </div>
              )}

              {/* Contact Information */}
              {(parking.phone || parking.email || parking.website) && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    {parking.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <a href={`tel:${parking.phone}`} className="text-blue-600 hover:underline">
                          {parking.phone}
                        </a>
                      </div>
                    )}
                    {parking.email && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${parking.email}`} className="text-blue-600 hover:underline">
                          {parking.email}
                        </a>
                      </div>
                    )}
                    {parking.website && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <a href={parking.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ParkingDetailsModal;
