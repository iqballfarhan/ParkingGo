import React from 'react';
import PropTypes from 'prop-types';

const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive',
  icon: Icon,
  color = 'primary',
  loading = false,
  className = '',
  description
}) => {
  const colorClasses = {
    primary: {
      bg: 'bg-gradient-to-r from-primary-500 to-primary-600',
      light: 'bg-primary-50',
      text: 'text-primary-600',
      icon: 'text-primary-500',
      border: 'border-primary-100'
    },
    secondary: {
      bg: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
      light: 'bg-secondary-50',
      text: 'text-secondary-600',
      icon: 'text-secondary-500',
      border: 'border-secondary-100'
    },
    success: {
      bg: 'bg-gradient-to-r from-success-500 to-success-600',
      light: 'bg-success-50',
      text: 'text-success-600',
      icon: 'text-success-500',
      border: 'border-success-100'
    },
    warning: {
      bg: 'bg-gradient-to-r from-warning-500 to-warning-600',
      light: 'bg-warning-50',
      text: 'text-warning-600',
      icon: 'text-warning-500',
      border: 'border-warning-100'
    },
    error: {
      bg: 'bg-gradient-to-r from-error-500 to-error-600',
      light: 'bg-error-50',
      text: 'text-error-600',
      icon: 'text-error-500',
      border: 'border-error-100'
    },
    accent: {
      bg: 'bg-gradient-to-r from-accent-500 to-accent-600',
      light: 'bg-accent-50',
      text: 'text-accent-600',
      icon: 'text-accent-500',
      border: 'border-accent-100'
    }
  };

  const changeTypeClasses = {
    positive: 'text-success-600 bg-success-50',
    negative: 'text-error-600 bg-error-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl border border-gray-100 bg-white shadow-soft ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }  return (
    <div className={`p-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-medium transition-all duration-300 group ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
          {title}
        </h3>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colorClasses[color]?.bg} text-white shadow-sm group-hover:shadow-md transition-all duration-200 transform group-hover:-translate-y-0.5`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      
      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        {description && (
          <p className="text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
      
      {change !== undefined && (
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${changeTypeClasses[changeType]}`}>
            {changeType === 'positive' && (
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {changeType === 'negative' && (
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {Math.abs(change)}%
          </span>
          <span className="ml-2 text-xs text-gray-500">
            vs last month
          </span>
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  changeType: PropTypes.oneOf(['positive', 'negative', 'neutral']),
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'error', 'accent']),
  loading: PropTypes.bool,
  className: PropTypes.string,
  description: PropTypes.string
};

export default StatCard;