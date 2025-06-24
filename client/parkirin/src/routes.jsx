import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import useAuthStore from './store/authStore.js';

// Lazy load components
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));
const ParkingSearch = React.lazy(() => import('./pages/parking/ParkingSearch'));
const ParkingDetail = React.lazy(() => import('./pages/parking/ParkingDetail'));
const ManageParking = React.lazy(() => import('./pages/parking/ManageParking'));
const BookingHistory = React.lazy(() => import('./pages/booking/BookingHistory'));
const Chat = React.lazy(() => import('./pages/chat/Chat'));
const Profile = React.lazy(() => import('./pages/profile/Profile'));
const Wallet = React.lazy(() => import('./pages/wallet/Wallet'));
const LandownerParkingDetail = React.lazy(() => import('./pages/landownerdashboard/LandownerParkingDetail'));

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Landowner: hanya boleh akses /parking/manage dan /chat
  if (user?.role === 'landowner') {
    const allowedLandownerRoutes = ['/parking/manage', '/chat'];
    if (!allowedLandownerRoutes.includes(location.pathname)) {
      return <Navigate to="/parking/manage" replace />;
    }
  }

  // User: akses sesuai allowedRoles jika ada
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        } />

        {/* Protected Routes */}
        {/* Landowner: hanya /parking/manage dan /chat, User: semua fitur */}        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/parking/search" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ParkingSearch />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/parking/:id" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ParkingDetail />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/parking/manage" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ManageParking />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute>
            <DashboardLayout>
              <BookingHistory />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Chat />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        } />        <Route path="/wallet" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Wallet />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/landownerdashboard/parking/:id" element={
          <ProtectedRoute allowedRoles={['landowner']}>
            <DashboardLayout>
              <LandownerParkingDetail />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;