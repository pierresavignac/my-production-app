import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Vérifie si les informations de connexion à ProgressionLive sont disponibles et valides
 * @returns {boolean} - True si des identifiants valides sont en cache
 */
export const hasValidProgressionCredentials = () => {
  try {
    const cachedUser = localStorage.getItem('progressionUser');
    if (!cachedUser) return false;

    const userData = JSON.parse(cachedUser);
    if (!userData.username || !userData.domain) return false;

    // Vérifier si les identifiants sont encore valides (moins de 4 heures)
    const timestamp = userData.timestamp || 0;
    const now = new Date().getTime();
    const fourHoursInMs = 4 * 60 * 60 * 1000;
    
    return (now - timestamp < fourHoursInMs);
  } catch (error) {
    console.error('❌ [progressionApi] Erreur lors de la vérification des identifiants:', error);
    return false;
  }
};

/**
 * Récupère les fichiers associés à un numéro d'installation
 * @param {string} installationNumber - Numéro d'installation (INS)
 * @returns {Promise<Array>} - Liste des fichiers
 */
export const fetchFilesForInstallation = async (installationNumber) => {
  try {
    if (!installationNumber) {
      throw new Error('Numéro d\'installation requis');
    }
    
    // Log plus distinctif pour identifier d'où vient l'appel
    console.log(`📂 [progressionApi] Récupération des fichiers pour l'installation ${installationNumber}`);

    // Vérifier d'abord si nous avons des identifiants valides en cache
    const hasCredentials = hasValidProgressionCredentials();
    console.log(`🔑 [progressionApi] Identifiants valides en cache: ${hasCredentials}`);
    
    if (!hasCredentials) {
      console.error('🚫 [progressionApi] Aucun identifiant valide disponible');
      return { 
        success: false,
        error: 'login_required',
        message: 'Veuillez vous connecter à ProgressionLive pour voir les fichiers',
        data: []
      };
    }
    
    // Utiliser l'API de progression pour récupérer les données en direct
    // IMPORTANT: L'URL absolue est nécessaire car les serveurs tournent sur des ports différents
    console.log(`🔄 [progressionApi] Appel à l'API avec installation ${installationNumber}`);
    const response = await axios.get(`${API_BASE_URL || 'http://localhost:8080'}/get_progression_files.php?ins=${installationNumber}`);
    
    console.log('📥 [progressionApi] Réponse reçue de l\'API:', response.data);
    
    // Vérifier si nous avons des données valides
    if (!response.data.success) {
      console.error('⚠️ [progressionApi] Erreur signalée par l\'API');
      
      // Vérifier s'il s'agit d'une erreur d'authentification
      if (response.data.error === 'login_required') {
        // Si nous avions des identifiants en cache mais qu'ils n'ont pas fonctionné,
        // c'est qu'ils sont expirés côté serveur - effacer le cache
        if (hasCredentials) {
          console.log('🔐 [progressionApi] Identifiants en cache expirés, nettoyage');
          localStorage.removeItem('progressionUser');
        }
        
        // Signaler qu'une connexion est nécessaire
        return {
          success: false,
          error: 'login_required',
          message: response.data.message || 'Connexion à ProgressionLive requise',
          data: []
        };
      }
      
      throw new Error(response.data.error || 'Erreur lors de la récupération des fichiers');
    }
    
    // Si data.data est absent ou un tableau vide, retourner un tableau vide
    // mais avec success=true pour indiquer que la requête a réussi
    if (!response.data.data || !Array.isArray(response.data.data)) {
      console.warn('⚠️ [progressionApi] Format de réponse incorrect:', response.data);
      return {
        success: true,
        data: []
      };
    }
    
    if (response.data.data.length === 0) {
      console.log('ℹ️ [progressionApi] Aucun fichier trouvé pour cette installation');
      return {
        success: true,
        data: []
      };
    }
    
    console.log(`✅ [progressionApi] ${response.data.data.length} fichiers trouvés:`, response.data.data);
    return response.data;
  } catch (error) {
    console.error('❌ [progressionApi] Erreur lors de la récupération des fichiers:', error);
    
    // Retourner simplement un tableau vide avec une erreur
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des fichiers',
      data: [] // Toujours inclure un tableau vide pour éviter les erreurs côté client
    };
  }
};

/**
 * Extrait les informations des fichiers à partir d'une réponse HTML
 * @param {string} html - Contenu HTML de la réponse
 * @returns {Array} - Liste des fichiers extraits
 */
const extractFilesFromHTML = (html) => {
  const files = [];
  
  // Rechercher les lignes de fichiers dans le HTML
  // Pour extraire les fichiers du HTML renvoyé par test_files_ins_improved.php
  const fileRegex = /<li>(.*?)\s*\(ID:\s*(\d+),\s*(\d+)\s*octets\)(.*?)<\/li>/g;
  let match;
  
  while ((match = fileRegex.exec(html)) !== null) {
    const name = match[1].trim();
    const id = match[2];
    const size = parseInt(match[3], 10);
    const isTargetFile = match[4].includes('Fichier recherché trouvé');
    
    files.push({
      id,
      name,
      size,
      isTargetFile,
      url: `/api/direct_download.php?id=${id}&ins=${html.match(/ins=([^&"]+)/)?.[1] || ''}`
    });
  }
  
  return files;
};

/**
 * Télécharge ou visualise un fichier spécifique par son ID
 * @param {string} fileId - ID du fichier
 * @param {string} installationNumber - Numéro d'installation
 * @param {string} mode - Mode d'ouverture ('download' pour télécharger, 'inline' pour visualiser)
 * @param {string} fileType - Type MIME du fichier (optionnel)
 * @returns {string} - L'URL du fichier
 */
export const downloadFile = (fileId, installationNumber, mode = 'download', fileType = '', fileName = '') => {
  if (!fileId || !installationNumber) {
    console.error('ID de fichier et numéro d\'installation requis');
    return null;
  }
  
  // Vérifier que l'ID du fichier est un nombre valide (pas d'ID fictif)
  if (isNaN(parseInt(fileId))) {
    console.error('ID de fichier invalide:', fileId);
    alert('Ce fichier ne peut pas être téléchargé (ID invalide)');
    return null;
  }
  
  const baseUrl = API_BASE_URL || 'http://localhost:8080';
  let url;
  
  try {
    // Déterminer l'URL en fonction du mode
    if (mode === 'inline') {
      // Créer l'URL du visualiseur simple pour tous les types de fichiers
      // IMPORTANT: Le viewer doit être servi depuis le serveur PHP, pas depuis Vite
      const viewerUrl = `http://localhost:8080/simple-viewer.html?id=${fileId}&ins=${encodeURIComponent(installationNumber)}&api=${encodeURIComponent(baseUrl)}&name=${encodeURIComponent(fileName || '')}`;
      console.log(`👁️ [progressionApi] URL du visualiseur simple: ${viewerUrl}`);
      
      // Ouvrir dans une nouvelle fenêtre ou onglet
      window.open(viewerUrl, `file_viewer_${fileId}`, 'width=1200,height=800,resizable=yes,scrollbars=yes');
      
      // L'URL du fichier direct est toujours retournée pour les cas où nous voudrions l'utiliser autrement
      url = `${baseUrl}/direct_download.php?id=${fileId}&ins=${encodeURIComponent(installationNumber)}&mode=inline`;
      return url;
    } else {
      // Pour le téléchargement standard, utiliser download_attachment.php
      url = `${baseUrl}/download_attachment.php?id=${fileId}&ins=${encodeURIComponent(installationNumber)}`;
      console.log(`📥 [progressionApi] URL de téléchargement: ${url}`);
      
      // Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      return url;
    }
  } catch (error) {
    console.error('Erreur lors de l\'accès au fichier:', error);
    return null;
  }
};

/**
 * Détermine si un fichier peut être visualisé directement dans le navigateur
 * @param {string} fileName - Nom du fichier
 * @returns {boolean} - true si le fichier peut être visualisé, false sinon
 */
export const isViewableFile = (fileName) => {
  if (!fileName) return false;
  
  // Liste des extensions de fichier qui peuvent être affichées dans un navigateur
  const viewableExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.txt'];
  
  // Vérifier si le fichier a une extension compatible
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return viewableExtensions.includes(extension);
};