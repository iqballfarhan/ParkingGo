import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import CreateParkingForm from '../../components/parking/CreateParkingForm';
import EditParkingForm from '../../components/parking/EditParkingForm';
import { LoadingSpinner } from '../../components/common';
import { DELETE_PARKING } from '../../graphql/mutations';
import Swal from 'sweetalert2';

const GET_MY_PARKINGS = gql`
  query GetMyParkings {
    getMyParkings {
      _id
      name
      address
      location {
        type
        coordinates
      }
      capacity {
        car
        motorcycle
      }
      available {
        car
        motorcycle
      }
      rates {
        car
        motorcycle
      }
      operational_hours {
        open
        close
      }
      facilities
      images
      status
      rating
      review_count
      created_at
    }
  }
`;

const ManageParking = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingParking, setEditingParking] = useState(null);
  const { data, loading, error, refetch } = useQuery(GET_MY_PARKINGS);
  const [deleteParkingLot] = useMutation(DELETE_PARKING);
  
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: 'Apakah Anda yakin ingin menghapus parking lot ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteParkingLot({
        variables: { id }
      });
      refetch();
      await Swal.fire({
        title: 'Berhasil',
        text: 'Parking lot berhasil dihapus.',
        icon: 'success',
      });
    } catch (error) {
      console.error('Error deleting parking lot:', error);
      await Swal.fire({
        title: 'Gagal',
        text: 'Gagal menghapus parking lot: ' + (error.message || 'Unknown error'),
        icon: 'error',
      });
    }
  };

  const handleEdit = (parking) => {
    setEditingParking(parking);
    setShowEditForm(true);
  };

  const handleCreateSuccess = (newParking) => {
    refetch(); // Refresh data
    Swal.fire({
      title: 'Berhasil',
      text: `Parking lot "${newParking.name}" berhasil dibuat!`,
      icon: 'success',
    });
  };

  const handleEditSuccess = (updatedParking) => {
    refetch(); // Refresh data
    Swal.fire({
      title: 'Berhasil',
      text: `Parking lot "${updatedParking.name}" berhasil diperbarui!`,
      icon: 'success',
    });
  };
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <LoadingSpinner size="large" color="primary" text="Loading parking lots..." />
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <div className="text-center p-8">
        <div className="bg-error-50 border border-error-200 rounded-2xl p-8 max-w-md">
          <svg className="w-16 h-16 text-error-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-error-800 mb-2">Error Loading Data</h3>
          <p className="text-error-600">{error.message}</p>
        </div>
      </div>
    </div>
  );
  return (
    <div className="w-full p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Manage My Parking Lots
          </h1>
          <p className="text-gray-600 mt-2">Create and manage your parking spaces</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New Parking Lot
        </button>
      </div>      {data?.getMyParkings?.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-12 max-w-md mx-auto border border-primary-100">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <PlusIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No Parking Lots Yet</h3>
            <p className="text-gray-600 mb-6">
              Start earning by creating your first parking lot
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Create First Parking Lot
            </button>
          </div>
        </div>
      ) : (        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data?.getMyParkings?.map((parking) => (
            <div key={parking._id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              {parking.images?.[0] && (
                <div className="relative overflow-hidden h-48">
                  <img
                    src={parking.images[0]}
                    alt={parking.name}
                    className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{parking.name}</h3>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    parking.status === 'active' 
                      ? 'bg-success-100 text-success-700 border border-success-200' 
                      : 'bg-error-100 text-error-700 border border-error-200'
                  }`}>
                    {parking.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{parking.address}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-3 border border-primary-200">
                    <p className="text-xs text-primary-600 font-medium">Car Slots</p>
                    <p className="text-lg font-bold text-primary-800">{parking.available.car}/{parking.capacity.car}</p>
                  </div>
                  <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-3 border border-success-200">
                    <p className="text-xs text-success-600 font-medium">Motorcycle Slots</p>
                    <p className="text-lg font-bold text-success-800">{parking.available.motorcycle}/{parking.capacity.motorcycle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Car Rate</p>
                    <p className="font-semibold text-gray-900">Rp {parking.rates.car.toLocaleString()}/hour</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Motorcycle Rate</p>
                    <p className="font-semibold text-gray-900">Rp {parking.rates.motorcycle.toLocaleString()}/hour</p>
                  </div>
                </div>                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm text-gray-600 ml-1 font-medium">{parking.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs text-gray-400 ml-1">({parking.review_count || 0} reviews)</span>
                  </div>
                    <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEdit(parking)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(parking._id)}
                      className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}      {showCreateForm && (
        <CreateParkingForm 
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditForm && editingParking && (
        <EditParkingForm 
          parking={editingParking}
          onClose={() => {
            setShowEditForm(false);
            setEditingParking(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ManageParking;
