import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary',
  text = '',
  fullScreen = false,
  className = '',
  variant = 'spinner'
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-primary-500',
    secondary: 'border-secondary-500',
    success: 'border-success-500',
    warning: 'border-warning-500',
    error: 'border-error-500',
    gray: 'border-gray-500',
    white: 'border-white'
  };

  const pulseColorClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    gray: 'bg-gray-500',
    white: 'bg-white'
  };

  const spinnerClasses = `
    ${sizeClasses[size]}
    ${colorClasses[color]}
    border-2 border-t-transparent rounded-full animate-spin
    ${className}
  `;

  const dotsSize = {
    small: 'w-1 h-1',
    medium: 'w-2 h-2',
    large: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50'
    : 'flex flex-col items-center justify-center p-4';

  const renderSpinner = () => {
    if (variant === 'dots') {
      return (
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${dotsSize[size]} ${pulseColorClasses[color]} rounded-full animate-pulse`}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      );
    }

    if (variant === 'pulse') {
      return (
        <div className={`${sizeClasses[size]} ${pulseColorClasses[color]} rounded-full animate-pulse`} />
      );
    }

    return <div className={spinnerClasses}></div>;
  };

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-3">
        {renderSpinner()}
        {text && (
          <p className={`text-sm font-medium ${
            color === 'white' ? 'text-white' : 'text-gray-600'
          } animate-pulse`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xl']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'error', 'gray', 'white']),
  text: PropTypes.string,
  fullScreen: PropTypes.bool,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['spinner', 'dots', 'pulse'])
};

export default LoadingSpinner;


