import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { getProgressionDirectUrl } from '../utils/progressionFileUtils';

/**
 * Modal pour afficher tous types de fichiers (PDF, images, etc.)
 * avec support de navigation entre fichiers
 */
const FileViewerModal = ({ show, onHide, file, fileId, fileName, installationNumber, files, currentIndex, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerHeight, setViewerHeight] = useState('75vh');

  // URL du service API
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  
  // Utiliser file s'il existe, sinon créer un objet file à partir de fileId et fileName
  // useMemo pour éviter de recréer l'objet à chaque rendu
  const currentFile = useMemo(() => {
    return file || (fileId && fileName ? { id: fileId, name: fileName } : null);
  }, [file, fileId, fileName]);

  // URL directe vers ProgressionLive
  const directProgressionUrl = useMemo(() => {
    return currentFile ? getProgressionDirectUrl(currentFile.id, currentFile.name) : null;
  }, [currentFile]);

  // URL principale - utiliser l'URL directe de ProgressionLive si disponible
  const proxyViewerUrl = useMemo(() => {
    return directProgressionUrl || (currentFile && installationNumber 
      ? `/file-proxy-viewer.html?id=${currentFile.id}&ins=${encodeURIComponent(installationNumber)}${currentFile.name ? `&name=${encodeURIComponent(currentFile.name)}` : ''}&api=${API_BASE_URL}&index=${currentIndex || 0}&total=${files?.length || 1}` 
      : '');
  }, [directProgressionUrl, currentFile, installationNumber, API_BASE_URL, currentIndex, files]);
  // URL pour téléchargement du fichier - on n'en a plus besoin
  const downloadUrl = null;

  // Déterminer le type de fichier en fonction de l'extension
  useEffect(() => {
    if (currentFile?.name) {
      const extension = currentFile.name.toLowerCase().split('.').pop();
      if (extension === 'pdf') {
        setViewerHeight('80vh'); // Plus grand pour les PDFs
      } else {
        setViewerHeight('75vh');
      }
    }
  }, [currentFile?.name]); // Dépendre uniquement du nom du fichier

  // Réinitialiser l'état lorsque le modal est ouvert ou le fichier change
  useEffect(() => {
    let timer;
    
    if (show && currentFile && currentFile.id) {
      setError(null);
      setLoading(true);
      
      // Simuler un chargement rapide car notre page proxy gère son propre indicateur de chargement
      timer = setTimeout(() => {
        setLoading(false);
      }, 500);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [show, currentFile?.id]); // Dépendre de l'ID du fichier plutôt que de l'objet complet 

  // Fonction pour naviguer vers le fichier précédent
  const handlePrevious = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (onNavigate && Array.isArray(files) && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  // Fonction pour naviguer vers le fichier suivant
  const handleNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (onNavigate && Array.isArray(files) && currentIndex < files.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  // Gérer la communication avec l'iframe
  useEffect(() => {
    // Fonction pour gérer les messages reçus de l'iframe
    const handleMessage = (event) => {
      // Vérifier que le message vient d'une source fiable
      if (event.origin === window.location.origin) {
        if (event.data && event.data.type === 'navigate-to-file') {
          // Navigation demandée par l'iframe
          if (onNavigate && typeof event.data.index === 'number') {
            onNavigate(event.data.index);
          }
        }
      }
    };

    // Ajouter l'écouteur d'événements
    window.addEventListener('message', handleMessage);

    // Nettoyer l'écouteur lors du démontage
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onNavigate]);

  // Fonction pour ouvrir le visualiseur dans un nouvel onglet
  const handleOpenInNewTab = () => {
    const urlToOpen = directProgressionUrl || proxyViewerUrl;
    if (urlToOpen) {
      window.open(urlToOpen, '_blank');
    }
  };

  // Vérification si les boutons de navigation doivent être affichés
  const showNavigation = useMemo(() => {
    return Array.isArray(files) && files.length > 1 && onNavigate !== undefined;
  }, [files, onNavigate]);
  
  const isPrevDisabled = useMemo(() => {
    return !showNavigation || currentIndex <= 0;
  }, [showNavigation, currentIndex]);
  
  const isNextDisabled = useMemo(() => {
    return !showNavigation || currentIndex >= files.length - 1;
  }, [showNavigation, currentIndex, files?.length]);

  // Rendu du contenu du fichier
  const renderFileContent = () => {
    // Afficher un message d'erreur si présent
    if (error) {
      return (
        <Alert variant="danger" className="m-3" style={{ backgroundColor: 'white' }}>
          {error}
        </Alert>
      );
    }

    // Afficher un indicateur de chargement
    if (loading) {
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'white'
        }}>
          <Spinner animation="border" role="status" />
          <p className="mt-3">Chargement...</p>
        </div>
      );
    }

    // Vérifier si l'URL est valide
    if (!directProgressionUrl && !proxyViewerUrl) {
      return <Alert variant="warning" className="m-3">Aucun fichier à afficher</Alert>;
    }

    // Si on a une URL directe vers ProgressionLive, l'utiliser directement
    if (directProgressionUrl) {
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'white'
        }}>
          <iframe
            key={`progression-${currentFile.id}`}
            src={directProgressionUrl}
            title="Visualiseur de fichier"
            style={{ width: '100%', height: '100%', border: 'none' }}
            onError={() => setError("Impossible de charger le fichier depuis ProgressionLive.")}
          />
        </div>
      );
    }

    // Utiliser l'iframe pour charger la page proxy qui gère la visualisation
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'white',
        position: 'relative'
      }}>
        <iframe
          key={`proxy-${currentFile.id}`}
          src={proxyViewerUrl}
          title="Visualiseur de fichier"
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 'none',
            backgroundColor: 'white'
          }}
          onError={() => setError("Impossible de charger le fichier. Veuillez essayer de le télécharger.")}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      backdrop="static"
      dialogClassName="modal-dialog-95vw"
      contentClassName="modal-content-full"
      style={{
        display: show ? 'block' : 'none',
        backgroundColor: 'white'
      }}
      dialogAs={props => (
        <div {...props} style={{
          ...props.style,
          maxWidth: '95vw',
          width: '95vw',
          margin: '2.5vh auto',
          backgroundColor: 'white'
        }} />
      )}
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          {currentFile ? currentFile.name : 'Visualisation de fichier'}
          {showNavigation && (
            <span className="ms-3 text-muted small">
              Fichier {currentIndex + 1} sur {files.length}
            </span>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0" style={{ 
        height: '85vh', 
        maxHeight: '85vh', 
        overflow: 'hidden',
        backgroundColor: 'white',
        opacity: '1',
        position: 'relative',
        zIndex: '10'
      }}>
        {renderFileContent()}
      </Modal.Body>
      
      <Modal.Footer className="justify-content-center">
        {showNavigation && (
          <>
            <Button 
              variant="outline-secondary" 
              disabled={isPrevDisabled}
              onClick={handlePrevious}
            >
              &lt; Précédent
            </Button>
            <Button 
              variant="outline-secondary" 
              disabled={isNextDisabled}
              onClick={handleNext}
              className="ms-2"
            >
              Suivant &gt;
            </Button>
          </>
        )}
        <Button variant="secondary" onClick={onHide} className={showNavigation ? "ms-2" : ""}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FileViewerModal;