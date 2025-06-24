import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if specified
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to home page if user doesn't have required role
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOf(['user', 'landowner'])
};

export default ProtectedRoute; 