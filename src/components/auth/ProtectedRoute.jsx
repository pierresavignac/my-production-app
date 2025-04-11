import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        console.log('[ProtectedRoute] Token décodé:', decoded);
        
        // Vérifier si le token est expiré
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        console.log('[ProtectedRoute] Expiration (ms):', expirationTime);
        console.log('[ProtectedRoute] Temps actuel (ms):', currentTime);
        console.log('[ProtectedRoute] Est expiré ?:', expirationTime < currentTime);

        if (expirationTime < currentTime) {
            console.log('[ProtectedRoute] Token expiré, redirection vers login...');
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }

        // Vérifier les droits d'admin si nécessaire
        console.log('[ProtectedRoute] Admin requis ?:', requireAdmin);
        console.log('[ProtectedRoute] Rôle utilisateur:', decoded.role);
        if (requireAdmin && decoded.role !== 'admin') {
            console.log('[ProtectedRoute] Admin requis mais rôle différent, redirection vers calendrier...');
            return <Navigate to="/calendar" replace />;
        }

        console.log('[ProtectedRoute] Accès autorisé.');
        return children;
    } catch (error) {
        console.error('[ProtectedRoute] Erreur de décodage du token:', error);
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;
