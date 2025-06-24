// src/components/common/Button.jsx
import React from 'react';
import { classNames } from '../../utils/helpers';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#f16634] hover:bg-[#d45528] text-white focus:ring-[#f16634]',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    outline: 'border border-[#f16634] bg-white hover:bg-[#f16634]/10 text-[#f16634] focus:ring-[#f16634]',
    ghost: 'text-[#f16634] hover:bg-[#f16634]/10 focus:ring-[#f16634]'
  };
  
  const sizes = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const buttonClasses = classNames(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
