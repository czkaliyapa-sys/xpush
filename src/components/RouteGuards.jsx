import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  return children;
};

export const RequireAdmin = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace state={{ denied: true, from: location.pathname }} />;
  }

  return children;
};