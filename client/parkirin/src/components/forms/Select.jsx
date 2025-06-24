// src/components/forms/Select.jsx
import React, { useState, useRef, useEffect } from 'react';
import { classNames } from '../../utils/helpers';

const Select = ({
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error,
  helperText,
  required = false,
  disabled = false,
  searchable = false,
  multiple = false,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const getDisplayValue = () => {
    if (multiple) {
      const selectedOptions = options.filter(option => 
        Array.isArray(value) && value.includes(option.value)
      );
      return selectedOptions.length > 0 
        ? `${selectedOptions.length} selected`
        : placeholder;
    }
    
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  const handleOptionSelect = (optionValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange({ target: { name, value: newValues } });
    } else {
      onChange({ target: { name, value: optionValue } });
      setIsOpen(false);
    }
    setSearchTerm('');
  };

  const isSelected = (optionValue) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className={classNames('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          className={classNames(
            'relative w-full rounded-lg border shadow-sm pl-4 pr-10 py-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200',
            {
              'border-gray-300': !error,
              'border-red-300': error,
              'opacity-50 cursor-not-allowed': disabled
            }
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          {...props}
        >
          <span className={classNames(
            'block truncate text-sm',
            {
              'text-gray-500': !value || (multiple && (!value || value.length === 0)),
              'text-gray-900': value && (!multiple || (multiple && value.length > 0))
            }
          )}>
            {getDisplayValue()}
          </span>
          
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {searchable && (
              <div className="p-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                No options available
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={classNames(
                    'w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors duration-150',
                    {
                      'bg-blue-100 text-blue-900': isSelected(option.value),
                      'text-gray-900 hover:bg-gray-100': !isSelected(option.value)
                    }
                  )}
                  onClick={() => handleOptionSelect(option.value)}
                >
                  <div className="flex items-center">
                    {multiple && (
                      <input
                        type="checkbox"
                        className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300"
                        checked={isSelected(option.value)}
                        readOnly
                      />
                    )}
                    <span className="block truncate">{option.label}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      
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
};

export default Select;
