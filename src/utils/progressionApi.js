import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/progression';

export const fetchInstallationData = async (installationCode) => {
  try {
    // Validation du format du code d'installation
    if (!installationCode || !installationCode.match(/^INS\d{6}$/)) {
      throw new Error('Veuillez entrer un numéro d\'installation valide (format: INS######)');
    }

    // Appel à l'API
    const response = await axios.get(`${API_BASE_URL}/tasks.php`, {
      params: { code: installationCode },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Vérification de la réponse
    if (!response.data) {
      throw new Error('Aucune donnée reçue du serveur');
    }

    // Log pour le débogage
    console.log('Données reçues:', response.data);

    return response.data;

  } catch (error) {
    // Log détaillé de l'erreur
    console.error('Erreur détaillée:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });

    // Gestion des différents types d'erreurs
    if (error.response) {
      // Erreur de réponse du serveur
      if (error.response.status === 500) {
        throw new Error('Erreur interne du serveur. Veuillez réessayer plus tard.');
      } else if (error.response.status === 404) {
        throw new Error('Installation non trouvée.');
      } else {
        throw new Error(error.response.data?.message || 'Erreur lors de la récupération des données.');
      }
    } else if (error.request) {
      // Erreur de réseau
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
    } else {
      // Autres erreurs
      throw error;
    }
  }
};

export const createInstallationTask = async (taskData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/tasks.php`, taskData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de la création de la tâche');
  }
};

export const updateInstallationTask = async (taskId, taskData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/tasks.php`, {
      taskId,
      ...taskData
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la tâche');
  }
};

export const getWorksheet = async (worksheetId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/worksheets.php`, {
      params: { id: worksheetId },
      headers: {
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de la feuille de travail:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération de la feuille de travail');
  }
};
