import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PARKING_LOT } from '../../graphql/queries';
import { CREATE_BOOKING } from '../../graphql/mutations';
import { 
  MapPinIcon, 
  ClockIcon, 
  StarIcon, 
  TruckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import ContactOwnerButton from '../../components/chat/ContactOwnerButton';
import { useState } from 'react';
import Swal from 'sweetalert2';

const ParkingDetail = () => {
  const { id } = useParams();
  const { data, loading, error } = useQuery(GET_PARKING_LOT, {
    variables: { id }
  });

  const [vehicleType, setVehicleType] = useState('car');
  const [duration, setDuration] = useState(60); // default 1 jam
  const [createBooking, { loading: bookingLoading }] = useMutation(CREATE_BOOKING);

  if (loading) return (
    <div className="flex justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return (
    <div className="text-red-600 p-4">Error: {error.message}</div>
  );

  const parking = data?.getParking;

  // Ambil koordinat lokasi
  const coordinates = parking?.location?.coordinates;
  const lat = coordinates ? coordinates[1] : null;
  const lng = coordinates ? coordinates[0] : null;

  if (!parking) return (
    <div className="text-center p-8">
      <p className="text-gray-500">Parking lot not found</p>
    </div>
  );
  const handleBook = async () => {
    const confirm = await Swal.fire({
      title: 'Booking Confirmation',
      text: 'Are you sure you want to book this parking lot?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Book',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;
    try {
      const { data } = await createBooking({
        variables: {
          input: {
            parking_id: parking._id,
            vehicle_type: vehicleType,
            start_time: new Date().toISOString(),
            duration: Number(duration)
          }
        }
      });
      if (data?.createBooking?.booking?._id) {
        await Swal.fire({
          title: 'Booking Berhasil!',
          text: 'Booking Anda telah berhasil dibuat.',
          icon: 'success',
        });
        // Redirect ke halaman booking detail jika diinginkan
        // navigate(`/booking/${data.createBooking.booking._id}`);
      }
    } catch (err) {
      await Swal.fire({
        title: 'Gagal Booking',
        text: err.message || 'Unknown error',
        icon: 'error',
      });
    }
  };

  return (
    <div className="w-full py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        {parking.images?.length > 0 && (
          <div className="h-64 bg-gray-200">
            <img
              src={parking.images[0]}
              alt={parking.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#f16634]">{parking.name}</h1>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span>{parking.address}</span>
              </div>
            </div>
            <div className="flex items-center">
              <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="ml-1 text-[#f16634] font-bold text-lg">{parking.rating || 0}</span>
            </div>
          </div>
          {parking.description && (
            <p className="text-gray-600 mb-4">{parking.description}</p>
          )}
          {/* Status */}
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-bold shadow ${
              parking.status === 'active' 
                ? 'bg-[#f16634]/10 text-[#f16634]' 
                : 'bg-red-100 text-red-800'
            }`}>
              {parking.status === 'active' ? 'Open' : 'Closed'}
            </span>
            <div className="flex items-center text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>{parking.operational_hours?.open} - {parking.operational_hours?.close}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Availability */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-bold text-[#f16634] mb-4">Availability</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#f16634]">Cars</h3>
                  <TruckIcon className="w-5 h-5 text-[#f16634]" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{parking.available?.car}/{parking.capacity?.car}</p>
                <p className="text-sm text-gray-600">Available slots</p>
              </div>
              <div className="border border-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#f16634]">Motorcycles</h3>
                  <div className="w-5 h-5 bg-[#f16634] rounded-sm"></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{parking.available?.motorcycle}/{parking.capacity?.motorcycle}</p>
                <p className="text-sm text-gray-600">Available slots</p>
              </div>
            </div>
          </div>
          {/* Facilities */}
          {parking.facilities?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-lg font-bold text-[#f16634] mb-4">Facilities</h2>
              <div className="flex flex-wrap gap-2">
                {parking.facilities.map((facility, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#f16634]/10 text-[#f16634] rounded-full text-sm font-bold shadow"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Map placeholder */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-bold text-[#f16634] mb-4">Location</h2>
            {lat && lng ? (
              <>
                <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                  <iframe
                    title="Parking Location"
                    width="100%"
                    height="100%"
                    className="rounded-lg"
                    frameBorder="0"
                    style={{ border: 0, width: '100%', height: '100%' }}
                    src={`https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`}
                    allowFullScreen
                  />
                </div>                <button
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')}
                >
                  Get Directions
                </button>
              </>
            ) : (
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Map will be displayed here</p>
              </div>
            )}
          </div>
        </div>
        {/* Sidebar */}
        <div className="space-y-8">          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-bold text-[#f16634] mb-4">Pricing</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Car (per hour)</span>
                <span className="font-bold text-[#f16634]">Rp {parking.rates?.car?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Motorcycle (per hour)</span>
                <span className="font-bold text-[#f16634]">Rp {parking.rates?.motorcycle?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Contact Owner */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-bold text-[#f16634] mb-4">Contact Owner</h2>
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-2">
                {parking.owner?.avatar ? (
                  <img
                    src={parking.owner.avatar}
                    alt={parking.owner.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">
                      {parking.owner?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{parking.owner?.name}</p>
                  <p className="text-sm text-gray-500">Parking Owner</p>
                </div>
              </div>
            </div>
            <ContactOwnerButton 
              parking={parking}
              className="w-full"
              size="default"
            />
          </div>

          {/* Book Now */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-bold text-[#f16634] mb-4">Book Now</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={e => setVehicleType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
              >
                <option value="car">Car</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={30}
                step={30}
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <button
              className="w-full bg-[#f16634] text-white py-3 rounded-full font-bold shadow hover:bg-[#d45528] transition"
              onClick={handleBook}
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Booking...' : 'Book This Parking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetail;