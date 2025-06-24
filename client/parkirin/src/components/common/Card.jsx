// src/components/common/Card.jsx
import React from 'react';
import { classNames } from '../../utils/helpers';

const Card = ({
  children,
  className = '',
  padding = 'medium',
  shadow = 'medium',
  rounded = 'medium',
  border = true,
  hover = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-white transition-all duration-200';
  
  const paddings = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };
  
  const shadows = {
    none: '',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
    xlarge: 'shadow-xl'
  };
  
  const roundeds = {
    none: '',
    small: 'rounded',
    medium: 'rounded-lg',
    large: 'rounded-xl'
  };

  const cardClasses = classNames(
    baseClasses,
    paddings[padding],
    shadows[shadow],
    roundeds[rounded],
    {
      'border border-[#f16634]/30': border,
      'hover:shadow-lg cursor-pointer': hover,
      'cursor-pointer': onClick
    },
    className
  );

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
};

// Card sub-components
Card.Header = ({ children, className = '', ...props }) => (
  <div className={classNames('mb-4', className)} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className = '', ...props }) => (
  <h3 className={classNames('text-lg font-bold text-[#f16634]', className)} {...props}>
    {children}
  </h3>
);

Card.Subtitle = ({ children, className = '', ...props }) => (
  <p className={classNames('text-sm text-gray-600', className)} {...props}>
    {children}
  </p>
);

Card.Content = ({ children, className = '', ...props }) => (
  <div className={classNames('text-gray-700', className)} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={classNames('mt-4 pt-4 border-t border-gray-200', className)} {...props}>
    {children}
  </div>
);

export default Card;
