import axios from 'axios';

const API_URL = 'https://app.vivreenliberte.org/api';

// Configuration de base d'axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    console.log('Tentative de connexion avec:', { email });
    
    const response = await api.post('/auth.php', {
      action: 'login',
      email,
      password,
    });

    console.log('Réponse du serveur:', response.data);

    // Vérifier si la réponse contient des données
    if (!response.data) {
      throw new Error('Réponse invalide du serveur');
    }

    // Si la réponse est un succès avec un message d'erreur
    if (response.data.success === false) {
      throw new Error(response.data.message || response.data.error || 'Erreur de connexion');
    }

    // Si la réponse contient directement le token et les données utilisateur
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      return {
        token: response.data.token,
        user: response.data.user || {
          id: response.data.id,
          email: response.data.email,
          role: response.data.role
        }
      };
    }

    // Si la réponse a une structure success/data
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      return { token, user };
    }

    throw new Error('Format de réponse non reconnu');
  } catch (error) {
    console.error('Erreur détaillée lors de la connexion:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Créer un message d'erreur plus descriptif
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Erreur lors de la connexion';
    
    throw new Error(errorMessage);
  }
};

export const logout = async () => {
  try {
    const response = await api.post('/auth.php', {
      action: 'logout',
      mode: 'logout'
    });
    
    if (response.data && response.data.success) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    } else {
      throw new Error(response.data?.message || 'Erreur lors de la déconnexion');
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    // On supprime quand même les données locales
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // On ne propage pas l'erreur pour permettre la déconnexion même en cas d'erreur API
    return true;
  }
};

export const fetchEvents = async () => {
  try {
    const response = await api.get('/events.php');
    // S'assurer que les données sont dans le bon format
    if (response.data && typeof response.data === 'object') {
      // Si les données sont déjà dans un objet avec une propriété data
      if (Array.isArray(response.data.data)) {
        return response.data;
      }
      // Si les données sont directement un tableau
      if (Array.isArray(response.data)) {
        return { data: response.data };
      }
      // Si les données sont dans un autre format
      console.error('Format de données inattendu:', response.data);
      return { data: [] };
    }
    return { data: [] };
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    throw error;
  }
};

export const fetchEmployees = async () => {
  try {
    const response = await api.get('/employees.php');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des employés:', error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events.php', eventData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    throw error;
  }
};

export const updateEvent = async (eventData) => {
  try {
    const response = await api.post('/events.php', {
      ...eventData,
      action: 'update'
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/events.php?id=${eventId}`);
    return {
      success: true,
      message: response.data?.message || 'Événement supprimé avec succès'
    };
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
};

export default api; 