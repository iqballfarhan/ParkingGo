// src/components/common/Dropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { classNames } from '../../utils/helpers';

const Dropdown = ({
  trigger,
  children,
  placement = 'bottom-left',
  offset = 8,
  className = '',
  onOpen,
  onClose,
  closeOnClick = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  const placements = {
    'bottom-left': 'top-full left-0',
    'bottom-right': 'top-full right-0',
    'top-left': 'bottom-full left-0',
    'top-right': 'bottom-full right-0',
    'left': 'top-0 right-full',
    'right': 'top-0 left-full'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    if (newState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const handleItemClick = () => {
    if (closeOnClick) {
      setIsOpen(false);
      onClose?.();
    }
  };

  return (
    <div className="relative inline-block">
      <div ref={triggerRef} onClick={handleToggle}>
        {trigger}
      </div>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className={classNames(
            'absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-max',
            placements[placement],
            className
          )}
          style={{ 
            marginTop: placement.includes('bottom') ? `${offset}px` : undefined,
            marginBottom: placement.includes('top') ? `${offset}px` : undefined,
            marginLeft: placement === 'right' ? `${offset}px` : undefined,
            marginRight: placement === 'left' ? `${offset}px` : undefined
          }}
          onClick={handleItemClick}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Dropdown item component
Dropdown.Item = ({ children, onClick, disabled = false, className = '', ...props }) => (
  <button
    className={classNames(
      'w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150',
      {
        'opacity-50 cursor-not-allowed': disabled,
        'cursor-pointer': !disabled
      },
      className
    )}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

// Dropdown divider component
Dropdown.Divider = ({ className = '' }) => (
  <div className={classNames('border-t border-gray-200 my-1', className)} />
);

export default Dropdown;
