// AJOUT LOG DE VERIFICATION - VERSION FICHIER
console.log('--- Chargement de apiUtils.js - Version avec logs de retour --- ');

// Configuration de l'API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Log pour débogage
console.log('VITE_API_BASE_URL utilisée par apiUtils:', API_BASE_URL);

// Fonctions d'API
export const fetchEvents = async () => {
    try {
        console.log('Début du chargement des événements');
        const response = await fetch(`${API_BASE_URL}/events.php`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Décommenter si l'auth est nécessaire
            },
            // credentials: 'include' // Décommenter si nécessaire pour les cookies cross-origin
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Données brutes reçues du serveur (GET /events.php):', data);

        // Vérifier si la réponse du backend est déjà dans le bon format
        if (data && data.success && Array.isArray(data.data)) {
            // Normaliser les dates dans les données reçues
            const normalizedEvents = data.data.map(event => {
                // console.log('Normalisation de l\'événement:', event); // Peut être bruyant
                try {
                    // Assurer que start et end sont des objets Date valides
                    const start = event.start ? new Date(event.start) : null;
                    const end = event.end ? new Date(event.end) : null;
                    
                    // Vérifier si les dates sont valides
                    if (isNaN(start?.getTime()) || isNaN(end?.getTime())) {
                        console.warn(`Dates invalides pour l'événement ID ${event.id}: start=${event.start}, end=${event.end}`);
                        return { ...event, start: null, end: null }; // Retourner avec dates nulles
                    }
                    
                    return { ...event, start, end };
                } catch (dateError) {
                    console.error(`Erreur lors de la normalisation des dates pour l'événement ID ${event.id}:`, dateError);
                    return { ...event, start: null, end: null }; // Gérer l'erreur
                }
            });
            
            // Filtrer les événements avec des dates invalides après normalisation
            const validEvents = normalizedEvents.filter(ev => ev.start && ev.end);
            console.log(`${validEvents.length} événements normalisés et valides trouvés.`);
            
            // Préparer l'objet de retour
            const resultObject = { 
                success: true, 
                data: validEvents 
            };
            // LOG AJOUTÉ
            console.log('[apiUtils.js] fetchEvents is returning (success):', JSON.stringify(resultObject)); 
            return resultObject;
        } else {
             console.error('Format de réponse inattendu du backend (GET /events.php):', data);
             // Préparer l'objet d'erreur
             const errorObject = { success: false, data: [], message: 'Format de réponse inattendu du serveur.' };
             // LOG AJOUTÉ
             console.log('[apiUtils.js] fetchEvents is returning (unexpected format):', JSON.stringify(errorObject));
             return errorObject;
        }

    } catch (error) {
        console.error('Erreur fetchEvents:', error);
        // Préparer l'objet d'erreur
        const catchObject = { success: false, data: [], message: error.message }; 
        // LOG AJOUTÉ
        console.log('[apiUtils.js] fetchEvents is returning (catch block):', JSON.stringify(catchObject));
        return catchObject; 
    }
};

export const fetchEmployees = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees.php`, {
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
        const response = await fetch(`${API_BASE_URL}/technicians.php`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données des techniciens reçues:', data);
        // Retourner directement le tableau de techniciens s'il existe
        return data && data.success ? data.data : []; 
    } catch (error) {
        console.error('Erreur lors du chargement des techniciens:', error);
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
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données équipements reçues:', data);

        // S'assurer que nous renvoyons un objet avec la bonne structure
        return {
            success: true,
            data: Array.isArray(data.data) ? data.data : []
        };
    } catch (error) {
        console.error('Erreur lors du chargement des équipements:', error);
        return {
            success: false,
            data: []
        };
    }
};

export const createEvent = async (eventData) => {
    try {
        const cleanedData = {
            type: eventData.type || 'installation',
            date: eventData.date || '',
            installation_time: eventData.installation_time || '',
            full_name: eventData.full_name || '',
            phone: eventData.phone || '',
            address: eventData.address || '',
            city: eventData.city || '',
            equipment: eventData.equipment || '',
            amount: eventData.amount || '',
            technician1_id: eventData.technician1_id || null,
            technician2_id: eventData.technician2_id || null,
            technician3_id: eventData.technician3_id || null,
            technician4_id: eventData.technician4_id || null,
            Sommaire: eventData.Sommaire || '',
            Description: eventData.Description || '',
            client_number: eventData.client_number || '',
            quote_number: eventData.quote_number || '',
            representative: eventData.representative || '',
            installation_number: eventData.installation_number || '',
            status: 'En approbation'
        };

        console.log('Données nettoyées à envoyer:', cleanedData);

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
        console.log('Réponse brute du serveur:', text);

        const result = JSON.parse(text);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result;
    } catch (error) {
        console.error('Erreur createEvent:', error);
        throw error;
    }
};

export const updateEvent = async (eventData) => {
    try {
        // Vérifier si un ID est présent, essentiel pour une mise à jour
        if (!eventData || !eventData.id) {
            console.error("updateEvent: ID manquant dans eventData:", eventData);
            throw new Error("ID de l'événement manquant pour la mise à jour.");
        }

        console.log("[apiUtils] Appel updateEvent pour ID:", eventData.id, "avec données complètes:", eventData);

        // Envoyer directement eventData, le backend devra gérer les champs
        const response = await fetch(`${API_BASE_URL}/events.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' // Bonne pratique d'ajouter Accept
            },
            // body: JSON.stringify(cleanedData), // Ancien code
            body: JSON.stringify(eventData), // Envoyer l'objet complet
            credentials: 'include'
        });

        const responseText = await response.text(); // Lire d'abord comme texte
        console.log("[apiUtils] Réponse brute updateEvent:", responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error("[apiUtils] Erreur parsing JSON updateEvent:", parseError, "Réponse:", responseText);
            throw new Error(`Réponse invalide du serveur: ${response.status}`);
        }

        if (!response.ok || !result.success) {
            const errorMessage = result?.message || result?.error || `Erreur HTTP ${response.status}`;
            console.error(`[apiUtils] Erreur API updateEvent: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        console.log("[apiUtils] updateEvent réussi:", result);
        return result;
    } catch (error) {
        console.error('[apiUtils] Erreur catch updateEvent:', error);
        throw error; // Propager l'erreur
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

export const fetchProgressionTask = async (taskId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/progression/tasks.php?id=${taskId}`, {
            credentials: 'include'
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement de la tâche:', error);
        throw error;
    }
};

// Fonction pour mettre à jour un utilisateur
export const updateUser = async (userData) => {
    // Vérifier si l'ID utilisateur est présent
    if (!userData || !userData.id) {
        console.error('updateUser: ID utilisateur manquant dans les données.', userData);
        throw new Error('ID utilisateur manquant pour la mise à jour.');
    }

    console.log('[apiUtils] Appel updateUser pour ID:', userData.id, 'avec données:', userData);
    
    try {
        // Utiliser le préfixe /api/ pour le proxy
        const response = await fetch(`${API_BASE_URL}/admin/users.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Assurer l'authentification
            },
            body: JSON.stringify({
                id: userData.id,
                role: userData.role, // Envoyer les champs attendus par le backend
                status: userData.status 
                // Ajouter d'autres champs si nécessaire
            })
        });

        // Lire la réponse brute pour débogage
        const responseText = await response.text();
        console.log('[apiUtils] Réponse brute updateUser:', responseText);
        
        // Tenter de parser en JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[apiUtils] Erreur parsing JSON updateUser:', parseError);
            console.error('[apiUtils] Réponse reçue qui a causé l\'erreur:', responseText);
            throw new Error(`Réponse invalide du serveur: ${response.status} ${response.statusText}`);
        }

        console.log('[apiUtils] Réponse JSON updateUser:', result);

        if (!response.ok || !result.success) {
             // Utiliser le message de l'API s'il existe, sinon un message par défaut
             const errorMessage = result?.message || `Erreur HTTP ${response.status}`;
             console.error(`[apiUtils] Erreur updateUser API: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        return result; // Devrait contenir { success: true, message: "..." }

    } catch (error) {
        console.error('[apiUtils] Erreur catch updateUser:', error);
        // Renvoyer l'erreur pour qu'elle soit traitée dans la modale
        throw error; 
    }
};

// Fonction pour supprimer un utilisateur
export const deleteUser = async (userId) => {
    // Vérifier si l'ID utilisateur est présent
    if (!userId) {
        console.error('deleteUser: ID utilisateur manquant.');
        throw new Error('ID utilisateur manquant pour la suppression.');
    }

    console.log('[apiUtils] Appel deleteUser pour ID:', userId);
    
    try {
        // Utiliser le préfixe /api/ pour le proxy
        // Passer l'ID dans l'URL comme paramètre query
        const response = await fetch(`${API_BASE_URL}/admin/users.php?id=${userId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Authentification
            }
        });

        // Lire la réponse brute pour débogage
        const responseText = await response.text();
        console.log('[apiUtils] Réponse brute deleteUser:', responseText);
        
        // Tenter de parser en JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[apiUtils] Erreur parsing JSON deleteUser:', parseError);
            console.error('[apiUtils] Réponse reçue qui a causé l\'erreur:', responseText);
            throw new Error(`Réponse invalide du serveur: ${response.status} ${response.statusText}`);
        }

        console.log('[apiUtils] Réponse JSON deleteUser:', result);

        if (!response.ok || !result.success) {
             const errorMessage = result?.message || `Erreur HTTP ${response.status}`;
             console.error(`[apiUtils] Erreur deleteUser API: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        return result; // Devrait contenir { success: true, message: "..." }

    } catch (error) {
        console.error('[apiUtils] Erreur catch deleteUser:', error);
        throw error; 
    }
};

// Décommenter la fonction createUser
// /* // Retirer ce début de commentaire
// Fonction pour créer un utilisateur
export const createUser = async (userData) => {
    // userData devrait contenir email, password, role, status
    console.log('[apiUtils] Appel createUser avec données:', userData);
    
    try {
        // Utiliser le préfixe /api/ pour le proxy
        const response = await fetch(`${API_BASE_URL}/admin/users.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Authentification
            },
            body: JSON.stringify(userData)
        });

        // Lire la réponse brute pour débogage
        const responseText = await response.text();
        console.log('[apiUtils] Réponse brute createUser:', responseText);
        
        // Tenter de parser en JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[apiUtils] Erreur parsing JSON createUser:', parseError);
            console.error('[apiUtils] Réponse reçue qui a causé l\'erreur:', responseText);
            throw new Error(`Réponse invalide du serveur: ${response.status} ${response.statusText}`);
        }

        console.log('[apiUtils] Réponse JSON createUser:', result);

        // Vérifier le statut HTTP et le success de l'API
        // Le backend renvoie 201 Created en cas de succès
        if ((response.status !== 201 && response.status !== 200) || !result.success) {
             const errorMessage = result?.message || `Erreur HTTP ${response.status}`;
             console.error(`[apiUtils] Erreur createUser API: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        return result; // Devrait contenir { success: true, message: "...", id: ... }

    } catch (error) {
        console.error('[apiUtils] Erreur catch createUser:', error);
        throw error; 
    }
};
// */ // Retirer cette fin de commentaire