import React from 'react';
import PropTypes from 'prop-types';
import { FormField, Select, Textarea } from '../forms';
import { Button } from '../common';

const ParkingForm = ({
  initialData = {},
  onSubmit,
  isLoading,
  submitLabel = 'Save',
  mode = 'create'
}) => {
  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    description: '',
    capacity: {
      car: 0,
      motorcycle: 0
    },
    price: {
      car: {
        hourly: 0,
        daily: 0
      },
      motorcycle: {
        hourly: 0,
        daily: 0
      }
    },
    features: [],
    images: [],
    ...initialData
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handlePriceChange = (vehicleType, priceType, value) => {
    setFormData(prev => ({
      ...prev,
      price: {
        ...prev.price,
        [vehicleType]: {
          ...prev.price[vehicleType],
          [priceType]: Number(value)
        }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Parking Name"
        required
      >
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="form-input"
          required
        />
      </FormField>

      <FormField
        label="Address"
        required
      >
        <Textarea
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          required
        />
      </FormField>

      <FormField
        label="Description"
      >
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Capacity</h3>
          <div className="space-y-4">
            <FormField label="Car Spaces">
              <input
                type="number"
                min="0"
                value={formData.capacity.car}
                onChange={(e) => handleNestedChange('capacity', 'car', Number(e.target.value))}
                className="form-input"
              />
            </FormField>

            <FormField label="Motorcycle Spaces">
              <input
                type="number"
                min="0"
                value={formData.capacity.motorcycle}
                onChange={(e) => handleNestedChange('capacity', 'motorcycle', Number(e.target.value))}
                className="form-input"
              />
            </FormField>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Pricing</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Car Pricing</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Hourly Rate">
                  <input
                    type="number"
                    min="0"
                    value={formData.price.car.hourly}
                    onChange={(e) => handlePriceChange('car', 'hourly', e.target.value)}
                    className="form-input"
                  />
                </FormField>
                <FormField label="Daily Rate">
                  <input
                    type="number"
                    min="0"
                    value={formData.price.car.daily}
                    onChange={(e) => handlePriceChange('car', 'daily', e.target.value)}
                    className="form-input"
                  />
                </FormField>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Motorcycle Pricing</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Hourly Rate">
                  <input
                    type="number"
                    min="0"
                    value={formData.price.motorcycle.hourly}
                    onChange={(e) => handlePriceChange('motorcycle', 'hourly', e.target.value)}
                    className="form-input"
                  />
                </FormField>
                <FormField label="Daily Rate">
                  <input
                    type="number"
                    min="0"
                    value={formData.price.motorcycle.daily}
                    onChange={(e) => handlePriceChange('motorcycle', 'daily', e.target.value)}
                    className="form-input"
                  />
                </FormField>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FormField label="Features">
        <Select
          isMulti
          value={formData.features}
          onChange={(value) => handleChange('features', value)}
          options={[
            { value: 'cctv', label: 'CCTV' },
            { value: 'security', label: '24/7 Security' },
            { value: 'covered', label: 'Covered Parking' },
            { value: 'valet', label: 'Valet Service' },
            { value: 'ev_charging', label: 'EV Charging' }
          ]}
        />
      </FormField>

      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

ParkingForm.propTypes = {
  initialData: PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.string,
    description: PropTypes.string,
    capacity: PropTypes.shape({
      car: PropTypes.number,
      motorcycle: PropTypes.number
    }),
    price: PropTypes.shape({
      car: PropTypes.shape({
        hourly: PropTypes.number,
        daily: PropTypes.number
      }),
      motorcycle: PropTypes.shape({
        hourly: PropTypes.number,
        daily: PropTypes.number
      })
    }),
    features: PropTypes.arrayOf(PropTypes.string)
  }),
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  submitLabel: PropTypes.string,
  mode: PropTypes.oneOf(['create', 'edit'])
};

export default ParkingForm; 