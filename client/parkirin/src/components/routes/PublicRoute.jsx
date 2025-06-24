import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common';
import PropTypes from 'prop-types';

const PublicRoute = ({ children, redirectTo = '/' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    // Get the intended destination from location state or use default
    const from = location.state?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string
};

export default PublicRoute; 