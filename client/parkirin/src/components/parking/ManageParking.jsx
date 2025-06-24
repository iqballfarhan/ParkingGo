import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import CreateParkingForm from './CreateParkingForm';
import EditParkingForm from './EditParkingForm';
import { DELETE_PARKING } from '../../graphql/mutations';

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
  const { data, loading, error, refetch } = useQuery(GET_MY_PARKINGS);  const [deleteParkingLot] = useMutation(DELETE_PARKING);
  
  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus parking lot ini?')) {
      try {
        await deleteParkingLot({
          variables: { id }
        });
        refetch();
      } catch (error) {
        console.error('Error deleting parking lot:', error);
        alert('Gagal menghapus parking lot: ' + error.message);
      }
    }
  };

  const handleEdit = (parking) => {
    setEditingParking(parking);
    setShowEditForm(true);
  };

  const handleCreateSuccess = (newParking) => {
    refetch(); // Refresh data
    alert(`Parking lot "${newParking.name}" berhasil dibuat!`);
  };

  const handleEditSuccess = (updatedParking) => {
    refetch(); // Refresh data
    alert(`Parking lot "${updatedParking.name}" berhasil diperbarui!`);
  };

  if (loading) return (
    <div className="flex justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-600 p-4">Error: {error.message}</div>
  );

  return (
    <div className="w-full p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage My Parking Lots</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New Parking Lot
        </button>
      </div>

      {data?.getMyParkings?.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">No parking lots yet</p>
            <p className="text-gray-400 mb-4">Create your first parking lot to start earning</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Create Parking Lot Now
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.getMyParkings?.map((parking) => (
            <div key={parking._id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
              {parking.images?.[0] && (
                <img
                  src={parking.images[0]}
                  alt={parking.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{parking.name}</h3>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    parking.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {parking.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{parking.address}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium">Car Slots</p>
                    <p className="text-lg font-bold text-blue-800">{parking.available.car}/{parking.capacity.car}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600 font-medium">Motorcycle Slots</p>
                    <p className="text-lg font-bold text-green-800">{parking.available.motorcycle}/{parking.capacity.motorcycle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Tarif Mobil</p>
                    <p className="font-medium text-gray-900">Rp {parking.rates.car.toLocaleString()}/jam</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tarif Motor</p>
                    <p className="font-medium text-gray-900">Rp {parking.rates.motorcycle.toLocaleString()}/jam</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-lg">★</span>
                    <span className="text-sm text-gray-600 ml-1">{parking.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs text-gray-400 ml-1">({parking.review_count || 0})</span>
                  </div>
                    <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEdit(parking)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(parking._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
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