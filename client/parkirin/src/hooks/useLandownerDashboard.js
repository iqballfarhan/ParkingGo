import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { GET_ME, GET_MY_ACTIVE_BOOKINGS, GET_MY_PARKINGS } from '../graphql/queries/landowner';

export const useLandownerDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: userData, loading: userLoading } = useQuery(GET_ME);
  const { data: bookingsData, loading: bookingsLoading } = useQuery(GET_MY_ACTIVE_BOOKINGS);
  const { data: parkingsData, loading: parkingsLoading } = useQuery(GET_MY_PARKINGS, {
    skip: user?.role !== 'landowner'
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount || 0);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isLoading = userLoading || bookingsLoading || parkingsLoading;
  const userInfo = userData?.me || user;
  const bookings = bookingsData?.getMyActiveBookings || [];
  const parkings = parkingsData?.getMyParkings || [];

  return {
    isLoading,
    userInfo,
    bookings,
    parkings,
    formatCurrency,
    handleNavigate
  };
}; 