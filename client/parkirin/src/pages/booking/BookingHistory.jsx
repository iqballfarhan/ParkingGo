import { useQuery, gql } from '@apollo/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const GET_BOOKING_HISTORY = gql`  query GetMyBookingHistory {
    getMyBookingHistory {
      _id
      start_time
      duration
      cost
      status
    }
  }
`;

const BookingHistory = () => {
  const { loading, error, data } = useQuery(GET_BOOKING_HISTORY);

  if (loading) return <LoadingSpinner size="large" />;
  if (error) return <div>Error loading booking history</div>;

  const bookings = data?.getMyBookingHistory || [];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full py-6 px-2 sm:px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#f16634] mb-6">Booking History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f16634]/10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-[#f16634]">Date</th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-[#f16634]">Duration</th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-[#f16634]">Cost</th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-[#f16634]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-sm text-gray-400 text-center">No booking history found</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-[#f16634]/5 transition">
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{new Date(parseInt(booking.start_time)).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{booking.duration} hours</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">Rp {booking.cost.toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(booking.status)}`}>{booking.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;
