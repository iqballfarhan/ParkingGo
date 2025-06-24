import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PARKING, GET_PARKING_BOOKINGS } from '../../graphql/queries';
import { GENERATE_BOOKING_QR } from '../../graphql/mutations';
import Swal from 'sweetalert2';

const ParkingDetail = () => {
  const { id } = useParams();
  const { data: parkingData, loading: parkingLoading, error: parkingError } = useQuery(GET_PARKING, { variables: { id } });
  const { data: bookingsData, loading: bookingsLoading } = useQuery(GET_PARKING_BOOKINGS, { variables: { parking_id: id } });
  const [generateQR] = useMutation(GENERATE_BOOKING_QR);

  if (parkingLoading || bookingsLoading) return <div className="p-8 text-center">Loading...</div>;
  if (parkingError) return <div className="p-8 text-red-600">{parkingError.message}</div>;
  if (!parkingData?.getParking) return <div className="p-8 text-gray-500">Parking lot not found</div>;

  const parking = parkingData.getParking;
  const bookings = bookingsData?.getParkingBookings || [];

  // Statistik sederhana
  const totalEarning = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.payment?.amount || 0), 0);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const activeCount = bookings.filter(b => b.status === 'active').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  const handleShowQR = async (bookingId) => {
    try {
      const { data } = await generateQR({ variables: { bookingId } });
      if (data?.generateBookingQR) {
        await Swal.fire({
          title: 'Scan QR untuk Masuk',
          html: `<img src='${data.generateBookingQR}' alt='QR Code' style='width:200px;height:200px;' />`,
          confirmButtonText: 'Tutup',
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Gagal generate QR',
        text: err.message || 'Unknown error',
        icon: 'error',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header & Maps */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#f16634] mb-2">{parking.name}</h1>
          <div className="text-gray-600 mb-2">{parking.address}</div>
          <div className="mb-4">
            <button
              className="text-blue-600 underline"
              onClick={() => {
                const [lng, lat] = parking.location.coordinates;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
              }}            >
              View on Google Maps
            </button>
          </div>
          <div className="mb-4">
            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold mr-2">Active</span>
            <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">{parking.capacity.car + parking.capacity.motorcycle} Slots</span>
          </div>
          <div className="mb-4 text-gray-700">{parking.description}</div>
        </div>
        <div className="w-full md:w-96 h-64 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
          <iframe
            title="Parking Location"
            width="100%"
            height="100%"
            className="rounded-lg"
            frameBorder="0"
            style={{ border: 0, width: '100%', height: '100%' }}
            src={`https://www.google.com/maps?q=${parking.location.coordinates[1]},${parking.location.coordinates[0]}&z=17&output=embed`}
            allowFullScreen
          />
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="text-gray-500 text-sm mb-1">Total Earning</div>
          <div className="text-2xl font-bold text-[#f16634]">Rp {totalEarning.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="text-gray-500 text-sm mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="text-gray-500 text-sm mb-1">Confirmed</div>
          <div className="text-2xl font-bold text-blue-500">{confirmedCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="text-gray-500 text-sm mb-1">Active</div>
          <div className="text-2xl font-bold text-green-500">{activeCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center col-span-2 md:col-span-4">
          <div className="text-gray-500 text-sm mb-1">Completed</div>
          <div className="text-2xl font-bold text-gray-700">{completedCount}</div>
        </div>
      </div>

      {/* Booking Management */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-[#f16634] mb-4">Booking Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Payment</th>                
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id} className="border-b">
                  <td className="px-4 py-2">{booking.user?.name}</td>
                  <td className="px-4 py-2">{booking.vehicle_type}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'active' ? 'bg-green-100 text-green-700' :
                      booking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{booking.payment?.status === 'paid' ? 'Paid' : 'Unpaid'}</td>
                  <td className="px-4 py-2">
                    {booking.status === 'pending' && (
                      <span className="text-gray-400 text-xs">Waiting for payment</span>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
                        onClick={() => handleShowQR(booking._id)}
                      >
                        Show Entry QR
                      </button>
                    )}
                    {booking.status === 'active' && (
                      <span className="text-green-600 text-xs font-bold">Currently Parked</span>
                    )}
                    {booking.status === 'completed' && (
                      <span className="text-gray-500 text-xs">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetail; 