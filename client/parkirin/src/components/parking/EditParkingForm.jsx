import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { UPDATE_PARKING } from '../../graphql/mutations';
import ParkingForm from './ParkingForm';
import { toast } from 'react-hot-toast';

const EditParkingForm = ({ parkingId, initialData, onSuccess }) => {
  const [updateParking, { loading }] = useMutation(UPDATE_PARKING);

  const handleSubmit = async (formData) => {
    try {
      const { data } = await updateParking({
        variables: {
          id: parkingId,
          input: formData
        }
      });

      if (data?.updateParking) {
        toast.success('Parking lot updated successfully');
        if (onSuccess) {
          onSuccess(data.updateParking);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update parking lot');
    }
  };

  return (
    <ParkingForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Update Parking Lot"
      mode="edit"
    />
  );
};

EditParkingForm.propTypes = {
  parkingId: PropTypes.string.isRequired,
  initialData: PropTypes.object.isRequired,
  onSuccess: PropTypes.func
};

export default EditParkingForm;
