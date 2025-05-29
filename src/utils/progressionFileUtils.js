// Utilitaire pour construire l'URL directe vers ProgressionLive
export const getProgressionDirectUrl = (fileId, fileName) => {
  // Récupérer les informations de l'utilisateur depuis le localStorage
  const cachedUser = localStorage.getItem('progressionUser');
  
  if (!cachedUser) {
    console.error('Pas d\'informations ProgressionLive en cache');
    return null;
  }
  
  try {
    const userData = JSON.parse(cachedUser);
    const domain = userData.domain;
    
    if (!domain) {
      console.error('Domaine ProgressionLive manquant');
      return null;
    }
    
    // Construire l'URL directe vers ProgressionLive
    // Format: https://[domain].progressionlive.com/web/exe/attachment/[filename]?id=[id]&entityName=TXAttachment
    const url = `https://${domain}.progressionlive.com/web/exe/attachment/${encodeURIComponent(fileName)}?id=${fileId}&entityName=TXAttachment`;
    
    return url;
    
  } catch (error) {
    console.error('Erreur lors de la construction de l\'URL:', error);
    return null;
  }
};

// Vérifier si on peut utiliser l'ouverture directe ProgressionLive
export const canUseDirectProgressionUrl = () => {
  const cachedUser = localStorage.getItem('progressionUser');
  if (!cachedUser) return false;
  
  try {
    const userData = JSON.parse(cachedUser);
    return userData.domain ? true : false;
  } catch {
    return false;
  }
};
