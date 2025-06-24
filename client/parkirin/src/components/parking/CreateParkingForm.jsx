import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { CREATE_PARKING } from '../../graphql/mutations';
import ParkingForm from './ParkingForm';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CreateParkingForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [createParking, { loading }] = useMutation(CREATE_PARKING);

  const handleSubmit = async (formData) => {
    try {
      const { data } = await createParking({
        variables: {
          input: formData
        }
      });

      if (data?.createParking) {
        toast.success('Parking lot created successfully');
        if (onSuccess) {
          onSuccess(data.createParking);
        } else {
          navigate(`/parking/${data.createParking._id}`);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create parking lot');
    }
  };

  return (
    <ParkingForm
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Create Parking Lot"
      mode="create"
    />
  );
};

CreateParkingForm.propTypes = {
  onSuccess: PropTypes.func
};

export default CreateParkingForm; 