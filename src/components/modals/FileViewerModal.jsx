import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';

/**
 * Modal universel pour afficher tous types de fichiers (PDF, images, etc.)
 * avec support de navigation entre fichiers
 */
const FileViewerModal = ({ 
  show, 
  onHide, 
  fileId, 
  fileName, 
  installationNumber, 
  files = [], 
  currentIndex = 0, 
  onNavigate 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerHeight, setViewerHeight] = useState('75vh');

  // URL du service API
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // URL principale - notre page HTML proxy robuste qui gère l'affichage de tous types de fichiers
  const proxyViewerUrl = fileId && installationNumber 
    ? `${window.location.origin}/file-proxy-viewer.html?id=${fileId}&ins=${encodeURIComponent(installationNumber)}${fileName ? `&name=${encodeURIComponent(fileName)}` : ''}&api=${API_BASE_URL}&index=${currentIndex}&total=${files.length}` 
    : '';
  
  // URL pour téléchargement du fichier
  const downloadUrl = fileId && installationNumber 
    ? `${API_BASE_URL}/download_attachment.php?id=${fileId}&ins=${encodeURIComponent(installationNumber)}` 
    : '';

  // Déterminer le type de fichier en fonction de l'extension
  useEffect(() => {
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      if (extension === 'pdf') {
        setViewerHeight('80vh'); // Plus grand pour les PDFs
      } else {
        setViewerHeight('75vh');
      }
    }
  }, [fileName]);

  // Réinitialiser l'état lorsque le modal est ouvert ou le fichier change
  useEffect(() => {
    if (show) {
      setError(null);
      setLoading(true);
      
      // Simuler un chargement rapide car notre page proxy gère son propre indicateur de chargement
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [show, fileId]); 

  // Fonction pour naviguer vers le fichier précédent
  const handlePrevious = () => {
    if (onNavigate && Array.isArray(files) && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  // Fonction pour naviguer vers le fichier suivant
  const handleNext = () => {
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

  // Téléchargement du fichier
  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };
  
  // Fonction pour ouvrir le visualiseur dans un nouvel onglet
  const handleOpenInNewTab = () => {
    if (proxyViewerUrl) {
      window.open(proxyViewerUrl, '_blank');
    }
  };

  // Vérification si les boutons de navigation doivent être affichés
  const showNavigation = Array.isArray(files) && files.length > 1 && onNavigate;
  const isPrevDisabled = !showNavigation || currentIndex <= 0;
  const isNextDisabled = !showNavigation || currentIndex >= files.length - 1;

  // Rendu du contenu du fichier
  const renderFileContent = () => {
    // Afficher un message d'erreur si présent
    if (error) {
      return (
        <Alert variant="danger" className="m-3">
          {error}
          <div className="mt-3">
            <Button variant="primary" onClick={handleDownload}>
              Télécharger le fichier à la place
            </Button>
          </div>
        </Alert>
      );
    }

    // Afficher un indicateur de chargement
    if (loading) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: viewerHeight }}>
          <Spinner animation="border" role="status" />
          <p className="mt-3">Chargement...</p>
        </div>
      );
    }

    // Vérifier si l'URL est valide
    if (!proxyViewerUrl) {
      return <Alert variant="warning" className="m-3">Aucun fichier à afficher</Alert>;
    }

    // Utiliser l'iframe pour charger la page proxy qui gère la visualisation
    return (
      <div className="d-flex flex-column" style={{ height: viewerHeight }}>
        <iframe
          src={proxyViewerUrl}
          title="Visualiseur de fichier"
          width="100%"
          height="100%"
          frameBorder="0"
          onError={() => setError("Impossible de charger le fichier. Veuillez essayer de le télécharger.")}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{ background: 'white' }}
        />
      </div>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl"
      centered
      fullscreen={window.innerWidth < 992}
      className="file-viewer-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          {fileName || 'Visualisation du fichier'}
          {showNavigation && (
            <span className="ms-3 text-muted small">
              Fichier {currentIndex + 1} sur {files.length}
            </span>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        {renderFileContent()}
      </Modal.Body>
      
      <Modal.Footer>
        {showNavigation && (
          <div className="me-auto">
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
          </div>
        )}
        <Button 
          variant="outline-primary" 
          onClick={handleOpenInNewTab}
          disabled={!proxyViewerUrl}
        >
          Ouvrir dans un nouvel onglet
        </Button>
        <Button variant="secondary" onClick={onHide}>Fermer</Button>
        <Button 
          variant="primary" 
          onClick={handleDownload}
          disabled={!downloadUrl}
        >
          Télécharger
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FileViewerModal;