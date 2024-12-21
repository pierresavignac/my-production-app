import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://app.vivreenliberte.org/api'; // URL de production
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Tentative de connexion avec:', { email }); // Log pour debug
      const response = await axios.post(`${API_URL}/auth.php`, {
        action: 'login',
        email,
        password
      });

      console.log('Réponse du serveur:', response.data); // Log pour debug

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Erreur de connexion:', error.response || error); // Log détaillé de l'erreur
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur de connexion au serveur'
      };
    }
  };

  const register = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth.php`, {
        action: 'register',
        email,
        password
      });

      return {
        success: response.data.success,
        message: response.data.message,
        error: response.data.error
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de l\'inscription'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const resetPasswordRequest = async (email) => {
    try {
      const response = await axios.post(`${API_URL}/auth.php`, {
        action: 'reset-password-request',
        email
      });

      return {
        success: response.data.success,
        message: response.data.message,
        error: response.data.error
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de la demande'
      };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth.php`, {
        action: 'reset-password',
        token,
        password
      });

      return {
        success: response.data.success,
        message: response.data.message,
        error: response.data.error
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de la réinitialisation'
      };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth.php?action=verify&token=${token}`);
      return {
        success: response.data.success,
        message: response.data.message,
        error: response.data.error
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de la vérification'
      };
    }
  };

  // Intercepteur pour ajouter le token aux requêtes
  axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Intercepteur pour gérer les erreurs d'authentification
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    resetPasswordRequest,
    resetPassword,
    verifyEmail,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
