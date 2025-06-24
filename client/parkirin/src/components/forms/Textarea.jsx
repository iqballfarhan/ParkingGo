// src/components/forms/Textarea.jsx
import React, { forwardRef } from 'react';
import { classNames } from '../../utils/helpers';

const Textarea = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  disabled = false,
  required = false,
  rows = 4,
  resize = 'vertical',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'block w-full rounded-lg border shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500'
  };
  
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

  const textareaVariant = error ? 'error' : 'default';
  
  const textareaClasses = classNames(
    baseClasses,
    variants[textareaVariant],
    resizeClasses[resize],
    'px-4 py-2.5 text-sm',
    {
      'opacity-50 cursor-not-allowed': disabled
    },
    className
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={textareaClasses}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={classNames(
          'text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
