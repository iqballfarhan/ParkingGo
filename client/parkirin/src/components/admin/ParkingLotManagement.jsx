import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const ParkingLotManagement = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLot, setSelectedLot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('view'); // view, edit, delete

  // Mock data - replace with actual GraphQL query
  useEffect(() => {
    const mockData = [
      {
        id: '1',
        name: 'Central Plaza Parking',
        address: 'Jl. Sudirman No. 123, Jakarta',
        owner: 'John Doe',
        totalSpots: 150,
        availableSpots: 45,
        pricePerHour: 15000,
        status: 'active',
        coordinates: [-6.208763, 106.845599],
        amenities: ['CCTV', 'Security', '24/7'],
        createdAt: '2024-01-15T08:00:00Z'
      },
      {
        id: '2',
        name: 'Mall Taman Anggrek',
        address: 'Jl. Letjen S. Parman, Jakarta',
        owner: 'Jane Smith',
        totalSpots: 300,
        availableSpots: 120,
        pricePerHour: 12000,
        status: 'active',
        coordinates: [-6.178306, 106.790584],
        amenities: ['CCTV', 'Valet', 'EV Charging'],
        createdAt: '2024-01-10T10:30:00Z'
      },
      {
        id: '3',
        name: 'Office Tower Beta',
        address: 'Jl. HR Rasuna Said, Jakarta',
        owner: 'Bob Wilson',
        totalSpots: 80,
        availableSpots: 0,
        pricePerHour: 20000,
        status: 'maintenance',
        coordinates: [-6.224895, 106.823337],
        amenities: ['CCTV', 'Security'],
        createdAt: '2024-01-08T14:15:00Z'
      }
    ];
    
    setTimeout(() => {
      setParkingLots(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLots = parkingLots.filter(lot => {
    const matchesSearch = lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || lot.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (lot) => {
    setSelectedLot(lot);
    setModalType('view');
    setShowModal(true);
  };

  const handleEdit = (lot) => {
    setSelectedLot(lot);
    setModalType('edit');
    setShowModal(true);
  };

  const handleDelete = (lot) => {
    setSelectedLot(lot);
    setModalType('delete');
    setShowModal(true);
  };

  const handleStatusChange = (lotId, newStatus) => {
    setParkingLots(prev => 
      prev.map(lot => 
        lot.id === lotId ? { ...lot, status: newStatus } : lot
      )
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status]}`}>
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
          <h1 className="text-2xl font-bold text-gray-900">Parking Lot Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and monitor all parking lots in the system
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Parking Lot
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search parking lots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-500">
            Showing {filteredLots.length} of {parkingLots.length} parking lots
          </div>
        </div>
      </div>

      {/* Parking Lots Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredLots.map((lot) => (
            <li key={lot.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <MapPinIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lot.name}
                        </p>
                        {getStatusBadge(lot.status)}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {lot.address}
                      </p>
                      <p className="text-sm text-gray-500">
                        Owner: {lot.owner}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    {/* Occupancy */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {lot.totalSpots} spots
                      </p>
                      <p className={`text-sm ${getOccupancyColor(lot.availableSpots, lot.totalSpots)}`}>
                        {lot.availableSpots} available
                      </p>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Rp {lot.pricePerHour.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">per hour</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(lot)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(lot)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(lot)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Empty State */}
      {filteredLots.length === 0 && (
        <div className="text-center py-12">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No parking lots found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedStatus !== 'all' 
              ? 'Try adjusting your search criteria.' 
              : 'Get started by adding a new parking lot.'}
          </p>
          {!searchTerm && selectedStatus === 'all' && (
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Parking Lot
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal placeholder - implement based on modalType */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalType === 'view' && 'Parking Lot Details'}
                {modalType === 'edit' && 'Edit Parking Lot'}
                {modalType === 'delete' && 'Delete Parking Lot'}
              </h3>
              
              {modalType === 'view' && selectedLot && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedLot.name}</h4>
                    <p className="text-sm text-gray-500">{selectedLot.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Spots:</span> {selectedLot.totalSpots}
                    </div>
                    <div>
                      <span className="font-medium">Available:</span> {selectedLot.availableSpots}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> Rp {selectedLot.pricePerHour.toLocaleString()}/hour
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {getStatusBadge(selectedLot.status)}
                    </div>
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

              {modalType === 'delete' && selectedLot && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Are you sure you want to delete "{selectedLot.name}"? This action cannot be undone.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {modalType === 'delete' ? 'Cancel' : 'Close'}
                </button>
                {modalType === 'delete' && (
                  <button
                    onClick={() => {
                      // Handle delete
                      setShowModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
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

export default ParkingLotManagement;
