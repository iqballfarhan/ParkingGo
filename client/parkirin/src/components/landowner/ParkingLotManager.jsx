import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhotoIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

const ParkingLotManager = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit, view
  const [selectedLot, setSelectedLot] = useState(null);

  // Mock data - replace with actual GraphQL query
  useEffect(() => {
    const mockData = [
      {
        id: '1',
        name: 'Central Plaza Parking',
        address: 'Jl. Sudirman No. 123, Jakarta',
        description: 'Secure parking facility in the heart of Jakarta business district',
        totalSpots: 150,
        availableSpots: 45,
        pricePerHour: 15000,
        coordinates: { lat: -6.208763, lng: 106.845599 },
        images: ['/api/placeholder/400/300'],
        amenities: ['CCTV', 'Security Guard', '24/7 Access', 'Covered Parking'],
        operatingHours: {
          open: '00:00',
          close: '23:59',
          is24Hours: true
        },
        status: 'active',
        weeklyRevenue: 8400000,
        monthlyBookings: 342,
        averageRating: 4.5,
        createdAt: '2024-01-15T08:00:00Z'
      },
      {
        id: '2',
        name: 'Office Tower Beta Parking',
        address: 'Jl. HR Rasuna Said, Jakarta',
        description: 'Premium parking for office workers',
        totalSpots: 80,
        availableSpots: 12,
        pricePerHour: 20000,
        coordinates: { lat: -6.224895, lng: 106.823337 },
        images: ['/api/placeholder/400/300'],
        amenities: ['CCTV', 'Security Guard', 'Valet Service'],
        operatingHours: {
          open: '06:00',
          close: '22:00',
          is24Hours: false
        },
        status: 'active',
        weeklyRevenue: 6720000,
        monthlyBookings: 168,
        averageRating: 4.8,
        createdAt: '2024-01-10T10:30:00Z'
      },
      {
        id: '3',
        name: 'Shopping Mall Parking',
        address: 'Jl. Letjen S. Parman, Jakarta',
        description: 'Convenient parking for mall visitors',
        totalSpots: 200,
        availableSpots: 0,
        pricePerHour: 10000,
        coordinates: { lat: -6.178306, lng: 106.790584 },
        images: ['/api/placeholder/400/300'],
        amenities: ['CCTV', 'EV Charging', 'Wheelchair Access'],
        operatingHours: {
          open: '08:00',
          close: '22:00',
          is24Hours: false
        },
        status: 'maintenance',
        weeklyRevenue: 0,
        monthlyBookings: 0,
        averageRating: 4.2,
        createdAt: '2024-01-08T14:15:00Z'
      }
    ];
    
    setTimeout(() => {
      setParkingLots(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddParkingLot = () => {
    setSelectedLot(null);
    setModalType('add');
    setShowModal(true);
  };

  const handleEditParkingLot = (lot) => {
    setSelectedLot(lot);
    setModalType('edit');
    setShowModal(true);
  };

  const handleViewParkingLot = (lot) => {
    setSelectedLot(lot);
    setModalType('view');
    setShowModal(true);
  };

  const handleDeleteParkingLot = async (lot) => {
    const confirm = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus "${lot.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    setParkingLots(prev => prev.filter(p => p.id !== lot.id));
  };

  const handleStatusToggle = (lotId) => {
    setParkingLots(prev => 
      prev.map(lot => 
        lot.id === lotId 
          ? { ...lot, status: lot.status === 'active' ? 'inactive' : 'active' }
          : lot
      )
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircleIcon },
      maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getOccupancyColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatOperatingHours = (hours) => {
    if (hours.is24Hours) return '24/7';
    return `${hours.open} - ${hours.close}`;
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
          <h1 className="text-2xl font-bold text-gray-900">My Parking Lots</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your parking facilities and monitor their performance
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleAddParkingLot}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Parking Lot
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Parking Lots
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {parkingLots.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Spots
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {parkingLots.reduce((sum, lot) => sum + lot.totalSpots, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Weekly Revenue
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    Rp {parkingLots.reduce((sum, lot) => sum + lot.weeklyRevenue, 0).toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parking Lots Grid */}
      {parkingLots.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {parkingLots.map((lot) => (
            <div key={lot.id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Image */}
              <div className="h-48 bg-gray-200 relative">
                {lot.images && lot.images[0] ? (
                  <img 
                    src={lot.images[0]} 
                    alt={lot.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  {getStatusBadge(lot.status)}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {lot.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm text-gray-600">{lot.averageRating}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-4 truncate">
                  {lot.address}
                </p>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Capacity:</span>
                    <span className="font-medium">{lot.totalSpots} spots</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Available:</span>
                    <span className={`font-medium ${getOccupancyColor(lot.availableSpots, lot.totalSpots)}`}>
                      {lot.availableSpots} spots
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium">Rp {lot.pricePerHour.toLocaleString()}/hour</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Hours:</span>
                    <span className="font-medium">{formatOperatingHours(lot.operatingHours)}</span>
                  </div>
                </div>

                {/* Performance */}
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Weekly Revenue:</span>
                    <span className="font-medium text-green-600">
                      Rp {lot.weeklyRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly Bookings:</span>
                    <span className="font-medium">{lot.monthlyBookings}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewParkingLot(lot)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <EyeIcon className="w-4 h-4 inline mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditParkingLot(lot)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteParkingLot(lot)}
                    className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Toggle */}
                <div className="mt-3 pt-3 border-t">
                  <button
                    onClick={() => handleStatusToggle(lot.id)}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      lot.status === 'active'
                        ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                        : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                    }`}
                  >
                    {lot.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-12">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No parking lots</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first parking lot.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddParkingLot}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Parking Lot
            </button>
          </div>
        </div>
      )}

      {/* Modal placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalType === 'add' && 'Add New Parking Lot'}
                {modalType === 'edit' && 'Edit Parking Lot'}
                {modalType === 'view' && 'Parking Lot Details'}
              </h3>
              
              <div className="text-center py-8 text-gray-500">
                {modalType === 'add' && 'Add parking lot form would go here'}
                {modalType === 'edit' && 'Edit parking lot form would go here'}
                {modalType === 'view' && selectedLot && (
                  <div className="text-left space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedLot.name}</h4>
                      <p className="text-sm text-gray-500">{selectedLot.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Address:</span> {selectedLot.address}</div>
                      <div><span className="font-medium">Capacity:</span> {selectedLot.totalSpots} spots</div>
                      <div><span className="font-medium">Price:</span> Rp {selectedLot.pricePerHour.toLocaleString()}/hour</div>
                      <div><span className="font-medium">Rating:</span> {selectedLot.averageRating}/5</div>
                    </div>
                    <div>
                      <span className="font-medium">Amenities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedLot.amenities.map((amenity, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
                {modalType !== 'view' && (
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {modalType === 'add' ? 'Add' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingLotManager;
