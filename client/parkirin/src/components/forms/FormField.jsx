// src/components/forms/FormField.jsx
import React from 'react';
import { Input } from '../common';
import { classNames } from '../../utils/helpers';

const FormField = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  placeholder,
  helperText,
  className = '',
  startIcon,
  endIcon,
  ...props
}) => {
  const showError = error && touched;

  return (
    <div className={classNames('space-y-1', className)}>
      <Input
        name={name}
        label={label}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={showError ? error : undefined}
        helperText={!showError ? helperText : undefined}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        startIcon={startIcon}
        endIcon={endIcon}
        {...props}
      />
    </div>
  );
};

export default FormField;
