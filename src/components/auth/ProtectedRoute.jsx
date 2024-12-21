import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated) {
    // Rediriger vers la page de connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    // Rediriger vers le calendrier si l'utilisateur n'est pas admin
    return <Navigate to="/calendar" replace />;
  }

  return children;
};

export default ProtectedRoute;
