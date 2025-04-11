import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      console.log('Tentative de connexion depuis AuthContext');
      const response = await apiLogin(email, password);
      console.log('Réponse de login:', response);
      
      // Extraire les données utilisateur selon la structure de la réponse
      const userData = response.user || {
        id: response.id,
        email: response.email,
        role: response.role
      };
      
      if (!userData || !userData.email) {
        console.error('Données utilisateur invalides:', userData);
        throw new Error('Données utilisateur invalides dans la réponse');
      }
      
      console.log('Données utilisateur extraites:', userData);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur complète de connexion:', error);
      
      // Créer un message d'erreur plus descriptif
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Erreur lors de la connexion';
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Même en cas d'erreur, on déconnecte localement
      setUser(null);
      localStorage.removeItem('user');
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export default AuthContext;
