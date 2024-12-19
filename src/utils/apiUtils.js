// Configuration de l'API
export const API_BASE_URL = import.meta.env.VITE_API_URL;

// Fonctions d'API
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
    console.log('Réponse brute de l\'API:', text);
    
    const data = JSON.parse(text);
    console.log('Données parsées de l\'API:', data);
    
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Format de données invalide');
    }
    
    // Normaliser les données reçues
    const normalizedEvents = data.data.map(event => {
      console.log('Normalisation de l\'événement:', event);
      
      const normalizedEvent = {
        id: event.id,
        type: event.type || 'installation',
        date: event.date || '',
        installation_time: event.installation_time || event.heure_installation || '',
        full_name: event.full_name || event.nom_complet || '',
        phone: event.phone || event.telephone || '',
        address: event.address || event.adresse || '',
        city: event.city || event.ville || '',
        Sommaire: event.Sommaire || event.sommaire || '',
        Description: event.Description || event.description || '',
        installation_number: event.installation_number || event.numero_installation || '',
        equipment: event.equipment || event.equipement || '',
        amount: event.amount || event.montant || '0.00',
        technician1_id: event.technician1_id || event.technicien1_id || '',
        technician2_id: event.technician2_id || event.technicien2_id || '',
        technician3_id: event.technician3_id || event.technicien3_id || '',
        technician4_id: event.technician4_id || event.technicien4_id || '',
        client_number: event.client_number || event.numero_client || '',
        quote_number: event.quote_number || event.numero_soumission || '',
        representative: event.representative || event.representant || '',
        progression_task_id: event.progression_task_id || '',
        technician1_name: event.technician1_name || '',
        technician2_name: event.technician2_name || '',
        technician3_name: event.technician3_name || '',
        technician4_name: event.technician4_name || '',
        region_name: event.region_name || '',
        region_id: event.region_id || null,
        employee_name: event.employee_name || '',
        employee_id: event.employee_id || null
      };

      // Ajouter start_date et end_date uniquement pour les vacances
      if (event.type === 'vacances') {
        normalizedEvent.start_date = event.start_date || event.startDate || event.date_debut || event.date || '';
        normalizedEvent.end_date = event.end_date || event.endDate || event.date_fin || event.date || '';
      }

      // Convertir les valeurs null en chaînes vides
      Object.keys(normalizedEvent).forEach(key => {
        if (normalizedEvent[key] === null || normalizedEvent[key] === undefined) {
          if (typeof normalizedEvent[key] === 'number') {
            normalizedEvent[key] = 0;
          } else {
            normalizedEvent[key] = '';
          }
        }
      });
      
      console.log('Événement normalisé:', normalizedEvent);
      return normalizedEvent;
    });
    
    return normalizedEvents;
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
        console.log('Appel à fetchTechnicians...');
        const response = await fetch(`${API_BASE_URL}/employees.php?type=technicians`, {
            method: 'GET',
            credentials: 'include'
        });

        // En cas d'erreur, retournons un tableau vide
        if (!response.ok) {
            console.error('Erreur HTTP:', response.status);
            return [];
        }

        try {
            const data = await response.json();
            console.log('Données des techniciens reçues:', data);
            return Array.isArray(data) ? data : [];
        } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            return [];
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des techniciens:', error);
        return [];
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
    // Nettoyer et formater les données avant l'envoi
    const cleanedData = {
      type: eventData.type || 'installation',
      date: eventData.date || '',
      installation_time: eventData.installation_time || eventData.heure_installation || '',
      full_name: eventData.full_name?.trim() || eventData.nom_complet?.trim() || '',
      phone: eventData.phone?.trim() || eventData.telephone?.trim() || '',
      address: eventData.address?.trim() || eventData.adresse?.trim() || '',
      city: eventData.city?.trim() || eventData.ville?.trim() || '',
      Sommaire: eventData.Sommaire?.trim() || eventData.sommaire?.trim() || '',
      Description: eventData.Description?.trim() || eventData.description?.trim() || '',
      installation_number: eventData.installation_number?.trim() || eventData.numero_installation?.trim() || '',
      equipment: eventData.equipment?.trim() || eventData.equipement?.trim() || '',
      amount: eventData.amount || eventData.montant || '',
      technician1_id: eventData.technician1_id || eventData.technicien1_id || null,
      technician2_id: eventData.technician2_id || eventData.technicien2_id || null,
      technician3_id: eventData.technician3_id || eventData.technicien3_id || null,
      technician4_id: eventData.technician4_id || eventData.technicien4_id || null,
      client_number: eventData.client_number?.trim() || eventData.numero_client?.trim() || '',
      quote_number: eventData.quote_number?.trim() || eventData.numero_soumission?.trim() || '',
      representative: eventData.representative?.trim() || eventData.representant?.trim() || '',
      progression_task_id: eventData.progression_task_id || ''
    };

    // Ajouter start_date et end_date uniquement pour les vacances
    if (eventData.type === 'vacances') {
      cleanedData.start_date = eventData.start_date || eventData.startDate || eventData.date_debut || eventData.date || '';
      cleanedData.end_date = eventData.end_date || eventData.endDate || eventData.date_fin || eventData.date || '';
    }

    console.log('Envoi des données:', cleanedData);
    const response = await fetch(`${API_BASE_URL}/events.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(cleanedData)
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
    console.log('Données reçues pour la mise à jour:', eventData);
    
    // Vérifier que l'ID est présent
    if (!eventData.id) {
      throw new Error('ID manquant pour la mise à jour de l\'événement');
    }
    
    // Nettoyer et formater les données avant l'envoi
    const cleanedData = {
      ...eventData,
      mode: 'edit'  // Définir le mode d'édition ici
    };

    // Ajouter start_date et end_date uniquement pour les vacances
    if (eventData.type === 'vacances') {
      cleanedData.start_date = eventData.start_date || eventData.startDate || eventData.date_debut || '';
      cleanedData.end_date = eventData.end_date || eventData.endDate || eventData.date_fin || '';
    }

    console.log('Données nettoyées pour la mise à jour:', cleanedData);

    const response = await fetch(`${API_BASE_URL}/events.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(cleanedData),
      credentials: 'include'
    });

    // Log de la réponse brute
    const responseText = await response.text();
    console.log('Réponse brute du serveur:', responseText);

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (e) {
      console.error('Erreur lors du parsing de la réponse:', e);
      throw new Error('Réponse invalide du serveur');
    }

    console.log('Réponse parsée du serveur:', jsonResponse);

    if (!response.ok) {
      throw new Error(jsonResponse.message || `Erreur HTTP: ${response.status}`);
    }

    if (!jsonResponse.success) {
      throw new Error(jsonResponse.message || 'Erreur lors de la mise à jour de l\'événement');
    }

    return jsonResponse;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/events.php?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
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