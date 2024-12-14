const API_BASE_URL = 'https://app.vivreenliberte.org/api';

export const fetchEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events.php`, {
      credentials: 'include'
    });
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const jsonResponse = JSON.parse(text);
        if (jsonResponse.message) {
          errorMessage = jsonResponse.message;
        }
      } catch (e) {
        console.error('La réponse n\'est pas du JSON valide:', text);
        throw new Error('Réponse invalide du serveur');
      }
      throw new Error(errorMessage);
    }
    const text = await response.text();
    const data = JSON.parse(text);
    
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Format de données invalide');
    }
    
    return data.data;
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error);
    throw error;
  }
};

export const fetchEmployees = async () => {
  try {
    const response = await fetch('/api/employees.php', {
      credentials: 'include'
    });
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const jsonResponse = JSON.parse(text);
        if (jsonResponse.message) {
          errorMessage = jsonResponse.message;
        }
      } catch (e) {
        console.error('La réponse n\'est pas du JSON valide:', text);
        throw new Error('Réponse invalide du serveur');
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

export const fetchTechnicians = async () => {
  try {
    const response = await fetch('/api/employees.php?type=technicians', {
      credentials: 'include'
    });
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const jsonResponse = JSON.parse(text);
        if (jsonResponse.message) {
          errorMessage = jsonResponse.message;
        }
      } catch (e) {
        console.error('La réponse n\'est pas du JSON valide:', text);
        throw new Error('Réponse invalide du serveur');
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

export const fetchRegions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/regions.php?type=regions`, {
      credentials: 'include'
    });
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const jsonResponse = JSON.parse(text);
        if (jsonResponse.message) {
          errorMessage = jsonResponse.message;
        }
      } catch (e) {
        console.error('La réponse n\'est pas du JSON valide:', text);
        throw new Error('Réponse invalide du serveur');
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du chargement des régions:', error);
    throw error;
  }
};

export const fetchCitiesForRegion = async (regionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/regions.php?region_id=${regionId}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const jsonResponse = JSON.parse(text);
        if (jsonResponse.message) {
          errorMessage = jsonResponse.message;
        }
      } catch (e) {
        console.error('La réponse n\'est pas du JSON valide:', text);
        throw new Error('Réponse invalide du serveur');
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du chargement des villes:', error);
    throw error;
  }
};

export const fetchEquipment = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/equipment.php`, {
      credentials: 'include'
    });
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const jsonResponse = JSON.parse(text);
        if (jsonResponse.message) {
          errorMessage = jsonResponse.message;
        }
      } catch (e) {
        console.error('La réponse n\'est pas du JSON valide:', text);
        throw new Error('Réponse invalide du serveur');
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du chargement des équipements:', error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    console.log('Envoi des données:', eventData);
    const response = await fetch(`${API_BASE_URL}/events.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(eventData)
    });

    const text = await response.text();
    console.log('Réponse brute:', text);

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(text);
      console.log('Réponse JSON:', jsonResponse);
    } catch (e) {
      console.error('La réponse n\'est pas du JSON valide:', text);
      throw new Error('Réponse invalide du serveur');
    }

    if (!response.ok) {
      if (jsonResponse.debug) {
        console.log('Détails de validation:', jsonResponse.debug);
      }
      throw new Error(jsonResponse.message || `Erreur HTTP: ${response.status}`);
    }

    if (!jsonResponse.success) {
      throw new Error(jsonResponse.message || 'Erreur lors de la création de l\'événement');
    }

    return jsonResponse;
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    throw error;
  }
};

export const updateEvent = async (eventData) => {
  try {
    const normalizedData = {
      id: eventData.id,
      type: eventData.type,
      date: eventData.date,
      installation_time: eventData.installation_time,
      first_name: eventData.first_name,
      last_name: eventData.last_name,
      installation_number: eventData.installation_number,
      city: eventData.city,
      equipment: eventData.equipment,
      amount: eventData.amount,
      region_id: eventData.region,
      technician1_id: eventData.technician1,
      technician2_id: eventData.technician2,
      technician3_id: eventData.technician3,
      technician4_id: eventData.technician4,
      employee_id: eventData.employee_id
    };

    const response = await fetch(`${API_BASE_URL}/events.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(normalizedData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const jsonResponse = JSON.parse(errorText);
        if (jsonResponse.message) {
          errorMessage = jsonResponse.message;
        }
      } catch (e) {
        console.error('La réponse n\'est pas du JSON valide:', errorText);
        throw new Error('Réponse invalide du serveur');
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Erreur lors de la modification de l\'événement:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId, deleteMode = 'single') => {
  try {
    const response = await fetch(`${API_BASE_URL}/events.php?id=${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ deleteMode })
    });
    
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const jsonResponse = JSON.parse(text);
        if (jsonResponse.message) {
          errorMessage = jsonResponse.message;
        }
      } catch (e) {
        console.error('La réponse n\'est pas du JSON valide:', text);
        throw new Error('Réponse invalide du serveur');
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

// Fonction de lecture seule pour ProgressionLive
export const fetchInstallationData = async (installationNumber) => {
  try {
    // Nettoyer et formater le numéro d'installation
    const cleanNumber = installationNumber.replace(/[^0-9A-Za-z]/g, '');
    
    // Vérification préliminaire
    if (!cleanNumber) {
      throw new Error('Numéro d\'installation invalide');
    }

    // Formater le code d'installation
    const formattedCode = cleanNumber.startsWith('INS') ? cleanNumber : `INS${cleanNumber.padStart(6, '0')}`;

    // Utiliser URLSearchParams pour encoder correctement les paramètres
    const params = new URLSearchParams({
      code: formattedCode
    });

    console.log('Calling API with code:', formattedCode);
    const response = await fetch(`${API_BASE_URL}/progression/tasks.php?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    // Log pour le débogage
    console.log('URL appelée:', `${API_BASE_URL}/progression/tasks.php?${params}`);
    console.log('Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur serveur:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      if (response.status === 500) {
        throw new Error('Erreur interne du serveur. Veuillez réessayer plus tard.');
      }
      
      throw new Error(`Erreur lors de la récupération des données (${response.status})`);
    }

    // Récupérer d'abord le texte brut
    const responseText = await response.text();
    console.log('Réponse brute de l\'API:', responseText);

    // Essayer de parser le JSON
    try {
      const data = JSON.parse(responseText);
      console.log('API response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des données');
      }

      return data;
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      throw new Error('La réponse du serveur n\'est pas au format JSON valide');
    }
  } catch (error) {
    console.error('Erreur complète:', error);
    throw error;
  }
};