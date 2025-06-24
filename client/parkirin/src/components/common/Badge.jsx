// src/components/common/Badge.jsx
import React from 'react';
import { classNames } from '../../utils/helpers';

const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  rounded = true,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium';
  
  const variants = {
    default: 'bg-[#f16634]/10 text-[#f16634]',
    primary: 'bg-[#f16634]/20 text-[#f16634]',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-[#f16634]/20 text-[#f16634]'
  };
  
  const sizes = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-2.5 py-0.5 text-sm',
    large: 'px-3 py-1 text-sm'
  };

  const badgeClasses = classNames(
    baseClasses,
    variants[variant],
    sizes[size],
    {
      'rounded-full': rounded,
      'rounded': !rounded
    },
    className
  );

  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;
