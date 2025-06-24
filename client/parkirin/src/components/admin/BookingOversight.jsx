import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const BookingOversight = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - replace with actual GraphQL query
  useEffect(() => {
    const mockData = [
      {
        id: 'BK001',
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        parkingLotName: 'Central Plaza Parking',
        parkingSpot: 'A-15',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T18:00:00Z',
        duration: 8,
        totalAmount: 120000,
        status: 'confirmed',
        paymentStatus: 'paid',
        bookingDate: '2024-01-14T15:30:00Z',
        qrCode: 'QR123456789',
        checkInTime: '2024-01-15T10:15:00Z',
        checkOutTime: null
      },
      {
        id: 'BK002',
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        parkingLotName: 'Mall Taman Anggrek',
        parkingSpot: 'B-23',
        startTime: '2024-01-15T14:00:00Z',
        endTime: '2024-01-15T20:00:00Z',
        duration: 6,
        totalAmount: 72000,
        status: 'active',
        paymentStatus: 'paid',
        bookingDate: '2024-01-15T08:45:00Z',
        qrCode: 'QR987654321',
        checkInTime: '2024-01-15T14:05:00Z',
        checkOutTime: null
      },
      {
        id: 'BK003',
        userId: 'user3',
        userName: 'Bob Wilson',
        userEmail: 'bob@example.com',
        parkingLotName: 'Office Tower Beta',
        parkingSpot: 'C-08',
        startTime: '2024-01-16T09:00:00Z',
        endTime: '2024-01-16T17:00:00Z',
        duration: 8,
        totalAmount: 160000,
        status: 'pending',
        paymentStatus: 'pending',
        bookingDate: '2024-01-15T20:15:00Z',
        qrCode: 'QR456789123',
        checkInTime: null,
        checkOutTime: null
      },
      {
        id: 'BK004',
        userId: 'user4',
        userName: 'Alice Brown',
        userEmail: 'alice@example.com',
        parkingLotName: 'Central Plaza Parking',
        parkingSpot: 'A-22',
        startTime: '2024-01-14T12:00:00Z',
        endTime: '2024-01-14T18:00:00Z',
        duration: 6,
        totalAmount: 90000,
        status: 'completed',
        paymentStatus: 'paid',
        bookingDate: '2024-01-14T10:20:00Z',
        qrCode: 'QR789123456',
        checkInTime: '2024-01-14T12:10:00Z',
        checkOutTime: '2024-01-14T17:45:00Z'
      },
      {
        id: 'BK005',
        userId: 'user5',
        userName: 'Charlie Davis',
        userEmail: 'charlie@example.com',
        parkingLotName: 'Mall Taman Anggrek',
        parkingSpot: 'B-15',
        startTime: '2024-01-13T16:00:00Z',
        endTime: '2024-01-13T22:00:00Z',
        duration: 6,
        totalAmount: 72000,
        status: 'cancelled',
        paymentStatus: 'refunded',
        bookingDate: '2024-01-13T14:30:00Z',
        qrCode: 'QR321654987',
        checkInTime: null,
        checkOutTime: null
      }
    ];
    
    setTimeout(() => {
      setBookings(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.parkingLotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.parkingSpot.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;

    let matchesDate = true;
    if (selectedDateRange !== 'all') {
      const bookingDate = new Date(booking.bookingDate);
      const today = new Date();
      const daysDiff = Math.floor((today - bookingDate) / (1000 * 60 * 60 * 24));
      
      switch (selectedDateRange) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ExclamationTriangleIcon },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircleIcon },
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircleIcon },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon },
      expired: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusConfig[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    };
  };

  const handleStatusUpdate = (bookingId, newStatus) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Oversight</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor and manage all parking bookings in the system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-500">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredBookings.map((booking) => {
            const startDateTime = formatDateTime(booking.startTime);
            const endDateTime = formatDateTime(booking.endTime);
            
            return (
              <li key={booking.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    {/* Main Info */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CalendarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            #{booking.id}
                          </p>
                          {getStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            <span>{booking.userName}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            <span>{booking.parkingLotName} - {booking.parkingSpot}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Time & Amount */}
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {startDateTime.date}
                        </p>
                        <p className="text-sm text-gray-500">
                          {startDateTime.time} - {endDateTime.time}
                        </p>
                        <p className="text-xs text-gray-400">
                          {booking.duration}h duration
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Rp {booking.totalAmount.toLocaleString()}
                        </p>
                        {booking.checkInTime && (
                          <p className="text-xs text-green-600">
                            Checked in: {formatDateTime(booking.checkInTime).time}
                          </p>
                        )}
                        {booking.checkOutTime && (
                          <p className="text-xs text-blue-600">
                            Checked out: {formatDateTime(booking.checkOutTime).time}
                          </p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col space-y-1">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'active')}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                          >
                            Activate
                          </button>
                        )}
                        {booking.status === 'active' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedStatus !== 'all' || selectedDateRange !== 'all'
              ? 'Try adjusting your search criteria or filters.' 
              : 'No bookings have been made yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingOversight;
