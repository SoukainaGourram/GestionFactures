import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, role }) {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (role === 'admin' && userRole !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;