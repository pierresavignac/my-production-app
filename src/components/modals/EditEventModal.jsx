import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { 
    fetchTechnicians, 
    fetchEquipment,
    fetchInstallationData,
    updateEvent,
    deleteEvent
} from '../../utils/apiUtils';
import { 
    fetchFilesForInstallation, 
    hasValidProgressionCredentials
} from '../../utils/progressionApi';
import { getProgressionDirectUrl, canUseDirectProgressionUrl } from '../../utils/progressionFileUtils';
import ProgressionLoginForm from '../ProgressionLoginForm';
import InstallationStatusSelect from '../InstallationStatusSelect';
import ManageEquipmentModal from './ManageEquipmentModal';
import WorksheetModal from './WorksheetModal';
import FileViewerModal from '../FileViewerModal';
import '../../styles/Modal.css';

const EditEventModal = ({ show, onHide, onSave, onDelete, event, employees }) => {
    const initialFormData = useMemo(() => ({
        id: event ? event.id : '',
        type: event ? event.type || 'installation' : 'installation',
        date: event ? event.date : '',
        status: event ? event.status || 'En approbation' : 'En approbation',
        installation_number: event ? event.installation_number : '',
        quote_number: event ? event.quote_number : '',
        full_name: event ? event.full_name : '',
        phone: event ? event.phone : '',
        address: event ? event.address : '',
        city: event ? event.city : '',
        representative: event ? event.representative || '' : '',
        amount: event ? event.amount : '',
        installation_time: event ? event.installation_time : '',
        client_number: event ? event.client_number : '',
        Sommaire: event ? event.Sommaire : '',
        Description: event ? event.Description : '',
        technician1_id: event ? event.technician1_id : '',
        technician2_id: event ? event.technician2_id : '',
        technician3_id: event ? event.technician3_id : '',
        technician4_id: event ? event.technician4_id : '',
        equipment: event ? event.equipment : [],
        no_appointment: event ? event.no_appointment : false
    }), [event]);

    const [formData, setFormData] = useState(initialFormData);
    const [availableTechnicians, setAvailableTechnicians] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);
    const [showWorksheetModal, setShowWorksheetModal] = useState(false);
    const [installationFiles, setInstallationFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showFileViewer, setShowFileViewer] = useState(false);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString;
    };
    
    const formatFileSize = (bytes) => {
        if (!bytes || isNaN(bytes)) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
    };
    
    const handleFilePreview = (e, file) => {
        // Bloquer la propagation et le comportement par défaut
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Vérifications de sécurité
        if (!file) {
            console.error("Aucun fichier fourni");
            return;
        }
        
        if (!formData.installation_number) {
            console.error("Numéro d'installation manquant");
            return;
        }
        
        // Log détaillé pour débogage
        console.log("Prévisualisation demandée pour le fichier:", file);
        
        try {
            // Référence aux fichiers depuis le state
            if (!installationFiles || !installationFiles.length) {
                console.warn("Aucun fichier disponible dans la liste");
                return;
            }
            
            // Trouver l'index du fichier actuel dans la liste des fichiers
            const fileIndex = installationFiles.findIndex(f => f.id === file.id);
            if (fileIndex === -1) {
                console.error("Fichier non trouvé dans la liste:", file);
                return;
            }
            
            console.log(`👁️ [EditEventModal] Tentative de prévisualisation du fichier: ${file.name} (index ${fileIndex}/${installationFiles.length-1})`);
            setSelectedFile(file);
            setCurrentFileIndex(fileIndex);
            
            // Utiliser FileViewerModal pour la navigation entre fichiers
            setShowFileViewer(true);
        } catch (error) {
            console.error("Erreur lors de la préparation de la prévisualisation:", error);
        }
    };
    
    // Fonction de téléchargement - commentée car on ne télécharge plus les fichiers
    /*
    const handleFileDownload = (e, fileId) => {
        // Empêcher la propagation de l'événement pour éviter la fermeture du modal
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (!fileId || !formData.installation_number) return;
        
        try {
            // Utiliser notre fonction utilitaire mise à jour avec mode download
            console.log(`📥 [EditEventModal] Téléchargement du fichier ID: ${fileId}`);
            // Utiliser directement l'API pour télécharger le fichier
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
            
            // Trouver le fichier dans la liste pour obtenir son nom
            const file = installationFiles.find(f => f.id === fileId);
            
            if (file) {
                // SOLUTION POUR ENCODAGE: utiliser le serveur universel en mode téléchargement
                const apiBaseUrl = 'http://localhost:8080';  // URL du serveur API
                const downloadUrl = `${apiBaseUrl}/download_attachment.php?id=${file.id}&ins=${encodeURIComponent(formData.installation_number)}&mode=attachment`;
                
                console.log(`Téléchargement du fichier via le serveur universel: ${downloadUrl}`);
                
                // Ouvrir dans un nouvel onglet pour télécharger
                window.open(downloadUrl, '_blank');
            } else {
                // Fallback vers l'ancienne méthode
                downloadFile(fileId, formData.installation_number, 'download');
            }
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
        }
    };
    */

    useEffect(() => {
        if (show && event) {
            console.log('=== INITIALISATION DU MODAL ===');
            console.log('Date dans la base:', event.date);
            
            const normalizedData = {
                ...event,
                date: event.date,  // Utiliser la date telle quelle
                status: event.status || 'En approbation'
            };
            
            console.log('Date utilisée dans le modal:', normalizedData.date);
            setFormData(normalizedData);
            loadInitialData();
            
            // Définir la fonction de navigation globale pour la communication entre fenêtres
            window.navigateToFileIndex = function(index) {
                console.log(`Fonction navigateToFileIndex appelée avec index=${index}`);
                if (installationFiles && installationFiles.length > index) {
                    // Fermer toutes les fenêtres PDF
                    if (window.openedPdfWindows) {
                        window.openedPdfWindows.forEach(win => {
                            if (win && !win.closed) {
                                win.close();
                            }
                        });
                        window.openedPdfWindows = [];
                    }
                    
                    // Naviguer vers le nouvel index
                    setCurrentFileIndex(index);
                    handleFilePreview(null, installationFiles[index]);
                }
            };
            
            // Stocker les informations sur le nombre total de fichiers
            window.totalFilesCount = 0;  // Sera mis à jour après le chargement des fichiers
        }
        
        // Nettoyer lors de la fermeture du modal
        return () => {
            delete window.navigateToFileIndex;
            delete window.currentFileIndex;
            delete window.totalFilesCount;
        };
    }, [show, event]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            console.log('Chargement des données initiales...');
            
            // Charger les données de base (techniciens et équipements)
            const [techData, equipData] = await Promise.all([
                fetchTechnicians(),
                fetchEquipment()
            ]);
            
            // Si un numéro d'installation est présent, charger les données de ProgressionLive
            if (formData.installation_number) {
                console.log('Chargement des données de ProgressionLive pour installation:', formData.installation_number);
                const progressionData = await fetchInstallationData(formData.installation_number);
                
                // Charger également les fichiers associés à l'installation
                await fetchInstallationFiles(formData.installation_number);
                
                if (progressionData && progressionData.success) {
                    const data = progressionData.data;
                    console.log('=== Données ProgressionLive reçues ===');
                    console.log(JSON.stringify(data, null, 2));
                    
                    setFormData(prev => {
                        const newData = {
                            ...prev,
                            full_name: data.fullName || prev.full_name,
                            phone: data.phoneNumber || prev.phone,
                            address: data.address || prev.address,
                            city: data.city || prev.city,
                            quote_number: data.quoteNumber || prev.quote_number,
                            client_number: data.clientNumber || prev.client_number,
                            representative: data.representative || prev.representative,
                            Sommaire: data.summary || prev.Sommaire,
                            Description: data.description || prev.Description,
                            amount: data.totalAmount || prev.amount
                        };
                        
                        console.log('=== Mise à jour du formulaire ===');
                        console.log('Changements:', {
                            fullName: { old: prev.full_name, new: newData.full_name },
                            phone: { old: prev.phone, new: newData.phone },
                            amount: { old: prev.amount, new: newData.amount },
                            representative: { old: prev.representative, new: newData.representative }
                        });
                        
                        return newData;
                    });
                }
            }
            
            console.log('Techniciens chargés:', techData);
            console.log('Équipements chargés:', equipData);
            
            setAvailableTechnicians(techData);
            if (equipData && equipData.success) {
                setEquipment(equipData.data || []);
            } else {
                console.error('Format de données invalide:', equipData);
                setEquipment([]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleEquipmentChange = (e) => {
        const value = e.target.value;
        if (value === 'manage') {
            fetchEquipment()
                .then(data => {
                    if (data && data.success) {
                        setEquipment(data.data || []);
                    }
                    setShowEquipmentModal(true);
                })
                .catch(error => {
                    console.error('Erreur lors du chargement des équipements:', error);
                });
            handleChange('equipment', '');
        } else {
            handleChange('equipment', value);
        }
    };

    const handleEquipmentModalClose = async () => {
        setShowEquipmentModal(false);
        // Recharger la liste des équipements
        const equipData = await fetchEquipment();
        if (equipData && equipData.success) {
            setEquipment(equipData.data || []);
        }
    };


    // Log à chaque rendu pour voir l'état actuel
    console.log('État actuel du formData:', formData);
    console.log('État actuel des techniciens:', availableTechnicians);
    console.log('État actuel des équipements:', equipment);

    const handleChange = (field, value) => {
        console.log('Changement de champ:', field, 'Nouvelle valeur:', value);
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFetchData = async () => {
        try {
            setFetchingData(true);
            setError('');
            
            console.log('Chargement des données depuis ProgressionLive...');
            const response = await fetchInstallationData(formData.installation_number);
            
            if (response && response.success) {
                const data = response.data;
                console.log('=== DONNÉES BRUTES REÇUES DE PROGRESSIONLIVE ===');
                console.log(JSON.stringify(data, null, 2));
                
                // Créer un nouvel objet avec les données mises à jour
                const updatedData = {
                    ...formData,
                    // Mettre à jour tous les champs avec les valeurs de l'API
                    full_name: data.client_name,
                    phone: data.phone,
                    address: data.address,
                    city: data.city,
                    quote_number: data.quote_number,
                    client_number: data.client_number,
                    representative: data.representative,
                    Sommaire: data.Sommaire,
                    Description: data.Description,
                    amount: data.amount
                };
                
                // Vérifier si les valeurs ont changé et les afficher
                console.log('=== DONNÉES AVANT/APRÈS ===');
                Object.keys(updatedData).forEach(key => {
                    const oldValue = formData[key];
                    const newValue = updatedData[key];
                    const apiValue = data[key.toLowerCase()] || data[key];
                    
                    if (oldValue !== newValue) {
                        console.log(`${key}:`, {
                            avant: oldValue,
                            après: newValue,
                            'valeur API': apiValue,
                            'valeur mise à jour': true
                        });
                    }
                });
                
                // Mettre à jour le formulaire avec toutes les données
                setFormData(updatedData);
                
                console.log('=== MISE À JOUR TERMINÉE ===');
                
                // Récupérer les fichiers associés à cette installation
                // IMPORTANT: Utiliser le numéro d'installation du formulaire mis à jour
                if (updatedData.installation_number) {
                    await fetchInstallationFiles(updatedData.installation_number);
                }
            } else {
                console.log('=== ERREUR OU PAS DE DONNÉES ===');
                console.log('Response:', response);
                setError('Aucune donnée trouvée pour ce numéro d\'installation');
            }
        } catch (error) {
            console.error('=== ERREUR LORS DU CHARGEMENT ===');
            console.error(error);
            setError('Erreur lors du chargement des données');
        } finally {
            setFetchingData(false);
        }
    };
    
    const fetchInstallationFiles = async (installationNumber) => {
        if (!installationNumber) {
            console.warn('🚫 [EditEventModal] fetchInstallationFiles: Numéro d\'installation manquant');
            return;
        }
        
        try {
            setLoadingFiles(true);
            console.log('🔍 [EditEventModal] Chargement des fichiers pour l\'installation:', installationNumber);
            
            // Vérifier si l'utilisateur a des identifiants valides pour ProgressionLive
            if (!hasValidProgressionCredentials()) {
                console.log('🔑 [EditEventModal] Aucun identifiant valide pour ProgressionLive trouvé');
                setShowLoginForm(true);
                setInstallationFiles([]);
                return;
            }
            
            // Récupérer directement les fichiers de ProgressionLive
            const result = await fetchFilesForInstallation(installationNumber);
            
            if (result && result.success) {
                // S'assurer que le résultat est bien un tableau
                if (Array.isArray(result.data)) {
                    console.log(`📋 [EditEventModal] ${result.data.length} fichiers récupérés:`, result.data);
                    setInstallationFiles(result.data);
                    
                    // Mettre à jour les variables globales pour la navigation entre fichiers
                    window.totalFilesCount = result.data.length;
                    console.log(`Total files count: ${window.totalFilesCount}`);
                } else {
                    console.warn('⚠️ [EditEventModal] Les données reçues ne sont pas un tableau:', result.data);
                    setInstallationFiles([]);
                }
            } else {
                // Vérifier si une connexion à ProgressionLive est nécessaire
                if (result && result.error === 'login_required') {
                    console.log('🔑 [EditEventModal] Connexion à ProgressionLive requise');
                    setShowLoginForm(true);
                } else {
                    console.error('❌ [EditEventModal] Erreur lors de la récupération des fichiers:', result?.error);
                }
                setInstallationFiles([]);
            }
        } catch (error) {
            console.error('💥 [EditEventModal] Exception lors de la récupération des fichiers:', error);
            setInstallationFiles([]);
        } finally {
            setLoadingFiles(false);
        }
    };
    
    const handleLoginSuccess = (loginData) => {
        console.log('✅ [EditEventModal] Connexion à ProgressionLive réussie', loginData);
        setShowLoginForm(false);
        
        // Ajouter un court délai pour s'assurer que le serveur a bien traité les identifiants
        setTimeout(() => {
            // Refetch des fichiers après connexion
            if (formData.installation_number) {
                console.log('🔄 [EditEventModal] Récupération des fichiers après connexion réussie...');
                fetchInstallationFiles(formData.installation_number);
            }
        }, 500); // Délai de 500ms
    };
    
    // Fonction pour se déconnecter de ProgressionLive
    const handleLogout = () => {
        // Supprimer les informations d'identification stockées
        localStorage.removeItem('progressionUser');
        setInstallationFiles([]); // Vider la liste des fichiers
        
        // Afficher un message temporaire
        setError('Déconnecté de ProgressionLive. Reconnectez-vous pour voir les fichiers.');
        setTimeout(() => {
            if (error.includes('Déconnecté de ProgressionLive')) {
                setError('');
            }
        }, 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log('Date envoyée au serveur:', formData.date);
            const result = await updateEvent(formData);
            
            if (result.success) {
                onSave(formData);
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError(error.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };
    
    const handleOpenWorksheetModal = () => {
        setShowWorksheetModal(true);
    };

    const handleCloseWorksheetModal = () => {
        setShowWorksheetModal(false);
    };
    
    const handleWorksheetSave = (worksheetData) => {
        console.log('WorksheetModal a sauvegardé:', worksheetData);
        // Fusionner les données de la worksheet avec le formData actuel
        setFormData(prevFormData => ({
            ...prevFormData,
            ...worksheetData
        }));
        setShowWorksheetModal(false);
    };

    return (
        <>
            {showLoginForm ? (
                <Modal 
                    show={true} 
                    onHide={() => setShowLoginForm(false)}
                    size="lg"
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Connexion à ProgressionLive</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ProgressionLoginForm onLoginSuccess={handleLoginSuccess} />
                    </Modal.Body>
                </Modal>
            ) : null}
            
            <Modal 
                show={show} 
                onHide={onHide}
                size="xl"
                centered
                dialogClassName="custom-modal-wide"
                backdrop="static" // Empêche la fermeture en cliquant sur l'arrière-plan
                keyboard={false} // Désactive la fermeture avec la touche Escape
            >
                <Modal.Header closeButton>
                    <Modal.Title>Modifier l'événement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {error && <Alert variant="danger">{error}</Alert>}
                        
                        <div className="row mb-2">
                            <div className="col-10">
                                <Form.Group>
                                    <Form.Select 
                                        value={formData.type} 
                                        onChange={(e) => handleChange('type', e.target.value)}
                                        disabled
                                    >
                                        <option value="installation">Installation</option>
                                        <option value="conge">Congé</option>
                                        <option value="maladie">Maladie</option>
                                        <option value="formation">Formation</option>
                                        <option value="vacances">Vacances</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-2">
                                <Form.Group className="mt-1">
                                    <Form.Check 
                                        type="checkbox" 
                                        id="no-appointment-check-edit" 
                                        label="Sans rendez-vous"
                                        checked={formData.no_appointment}
                                        onChange={(e) => handleChange('no_appointment', e.target.checked)}
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="row mb-2">
                            <div className="col-2">
                                <Form.Group>
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={(e) => handleChange('date', e.target.value)} 
                                        required 
                                        disabled={formData.no_appointment}
                                        className={formData.no_appointment ? "bg-light text-muted" : ""}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-2">
                                <Form.Group>
                                    <Form.Label>Heure</Form.Label>
                                    <Form.Control 
                                        type="time" 
                                        value={formData.installation_time} 
                                        onChange={(e) => handleChange('installation_time', e.target.value)} 
                                        required 
                                        disabled={formData.no_appointment}
                                        className={formData.no_appointment ? "bg-light text-muted" : ""}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-5">
                                <Form.Group>
                                    <Form.Label>Équipement</Form.Label>
                                    <Form.Select 
                                        value={formData.equipment === null ? '' : formData.equipment} 
                                        onChange={handleEquipmentChange}
                                        required
                                    >
                                        <option value="">Sélectionner un équipement</option>
                                        {Array.isArray(equipment) && equipment.map(item => (
                                            <option key={item.id} value={item.name}>
                                                {item.name}
                                            </option>
                                        ))}
                                        <option value="manage">Gérer les équipements...</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-3">
                                <Form.Group>
                                    <Form.Label>Statut</Form.Label>
                                    <InstallationStatusSelect
                                        value={formData.status}
                                        onChange={(e) => {
                                            console.log('Changement de statut:', e.target.value);
                                            handleChange('status', e.target.value);
                                        }}
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="p-3 bg-light rounded">
                            <div className="row mb-2">
                                <div className="col-3">
                                    <Form.Control 
                                        type="text" 
                                        placeholder="№ Installation" 
                                        value={formData.installation_number} 
                                        onChange={(e) => handleChange('installation_number', e.target.value)}
                                    />
                                </div>
                                <div className="col-3 text-center">
                                    <Button 
                                        variant="secondary" 
                                        onClick={handleFetchData} 
                                        disabled={!formData.installation_number || fetchingData}
                                    >
                                        {fetchingData ? 'Chargement...' : 'Fetch'}
                                    </Button>
                                </div>
                                <div className="col-6">
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Soumission" 
                                        value={formData.quote_number} 
                                        onChange={(e) => handleChange('quote_number', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-9">
                                    <Form.Group>
                                        <Form.Label>Nom complet <span className="text-danger">*</span></Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={formData.full_name} 
                                            onChange={(e) => handleChange('full_name', e.target.value)} 
                                            required 
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-3">
                                    <Form.Group>
                                        <Form.Label>Téléphone</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={formData.phone} 
                                            onChange={(e) => handleChange('phone', e.target.value)} 
                                        />
                                    </Form.Group>
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-8">
                                    <Form.Group>
                                        <Form.Label>Adresse</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={formData.address} 
                                            onChange={(e) => handleChange('address', e.target.value)} 
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-4">
                                    <Form.Group>
                                        <Form.Label>Ville</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={formData.city} 
                                            onChange={(e) => handleChange('city', e.target.value)} 
                                        />
                                    </Form.Group>
                                </div>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Sommaire</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={formData.Sommaire} 
                                    onChange={(e) => handleChange('Sommaire', e.target.value)} 
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={4} 
                                    className="description-scroll" 
                                    value={formData.Description} 
                                    onChange={(e) => handleChange('Description', e.target.value)} 
                                />
                            </Form.Group>

                            <div className="row mb-2">
                                <div className="col-9">
                                    <Form.Group>
                                        <Form.Label>Représentant</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={formData.representative} 
                                            onChange={(e) => handleChange('representative', e.target.value)} 
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-3">
                                    <Form.Group>
                                        <Form.Label>Montant à percevoir</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={formData.amount} 
                                            onChange={(e) => handleChange('amount', e.target.value)} 
                                        />
                                    </Form.Group>
                                </div>
                            </div>
                            
                            {/* Section des fichiers d'installation - Maintenant à l'intérieur du conteneur gris */}
                            <div className="row mb-3">
                                <div className="col-12">
                                    <Form.Group>
                                        <Form.Label>Fichiers liés à l'installation</Form.Label>
                                        <div className="installation-files-container">
                                            <div className="installation-files-header">
                                                {hasValidProgressionCredentials() && (
                                                    <Button 
                                                        variant="link" 
                                                        size="sm"
                                                        className="ms-2 text-danger"
                                                        onClick={handleLogout}
                                                        title="Se déconnecter de ProgressionLive"
                                                        style={{ marginLeft: 'auto' }}
                                                    >
                                                        <small>(Déconnexion)</small>
                                                    </Button>
                                                )}
                                                {loadingFiles && <span><small>Chargement...</small></span>}
                                            </div>
                                            
                                            {/* Liste des fichiers */}
                                            {Array.isArray(installationFiles) && installationFiles.length > 0 ? (
                                                <ul className="installation-files-list">
                                                    {installationFiles.map((file) => (
                                                        <li 
                                                            key={file.id} 
                                                            className={`installation-file-item ${file.isTargetFile ? 'installation-file-target' : ''}`}
                                                        >
                                                            <div className="installation-file-name">{file.name}</div>
                                                            <div className="installation-file-size">{formatFileSize(file.size)}</div>
                                                            <div className="installation-file-actions">
                                                                <button 
                                                                    className="installation-file-view" 
                                                                    onClick={(e) => handleFilePreview(e, file)}
                                                                >
                                                                    Consulter
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="installation-files-empty">
                                                    {formData.installation_number ? 
                                                        (loadingFiles ? 'Chargement des fichiers...' : 'Aucun fichier trouvé') : 
                                                        'Entrez un numéro d\'installation et cliquez sur Fetch'
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </Form.Group>
                                </div>
                            </div>
                        </div>

                        <div className="row mb-3 mt-2">
                            <div className="col-6">
                                <Form.Select 
                                    value={formData.technician1_id === null ? '' : formData.technician1_id} 
                                    onChange={(e) => handleChange('technician1_id', e.target.value)}
                                >
                                    <option value="">Technicien 1</option>
                                    {availableTechnicians.map(tech => (
                                        <option key={tech.id} value={tech.id}>
                                            {tech.name.includes(' ') ? tech.name.split(' ').slice(1).join(' ') : tech.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-6">
                                <Form.Select 
                                    value={formData.technician2_id === null ? '' : formData.technician2_id} 
                                    onChange={(e) => handleChange('technician2_id', e.target.value)}
                                >
                                    <option value="">Technicien 2</option>
                                    {availableTechnicians.map(tech => (
                                        <option key={tech.id} value={tech.id}>
                                            {tech.name.includes(' ') ? tech.name.split(' ').slice(1).join(' ') : tech.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                        </div>

                        <div className="row mb-2">
                            <div className="col-6">
                                <Form.Select 
                                    value={formData.technician3_id === null ? '' : formData.technician3_id} 
                                    onChange={(e) => handleChange('technician3_id', e.target.value)}
                                >
                                    <option value="">Technicien 3</option>
                                    {availableTechnicians.map(tech => (
                                        <option key={tech.id} value={tech.id}>
                                            {tech.name.includes(' ') ? tech.name.split(' ').slice(1).join(' ') : tech.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-6">
                                <Form.Select 
                                    value={formData.technician4_id === null ? '' : formData.technician4_id} 
                                    onChange={(e) => handleChange('technician4_id', e.target.value)}
                                >
                                    <option value="">Technicien 4</option>
                                    {availableTechnicians.map(tech => (
                                        <option key={tech.id} value={tech.id}>
                                            {tech.name.includes(' ') ? tech.name.split(' ').slice(1).join(' ') : tech.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Fermer</Button>
                    <Button variant="danger" onClick={() => onDelete(event)}>Supprimer</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ManageEquipmentModal 
                show={showEquipmentModal}
                onHide={handleEquipmentModalClose}
                onEquipmentChange={handleEquipmentModalClose}
            />
            
            {/* Modal de prévisualisation de fichier avec navigation */}
            <FileViewerModal
                show={showFileViewer}
                onHide={() => setShowFileViewer(false)}
                fileId={selectedFile?.id}
                fileName={selectedFile?.name}
                installationNumber={formData.installation_number}
                files={installationFiles}
                currentIndex={currentFileIndex}
                onNavigate={(newIndex) => {
                    console.log(`Navigation vers l'index ${newIndex}`);
                    if (installationFiles && installationFiles[newIndex]) {
                        setCurrentFileIndex(newIndex);
                        setSelectedFile(installationFiles[newIndex]);
                    }
                }}
            />
            
            {/* Utilisation d'un seul visualiseur pour tous les types de fichiers */}
        </>
    );
};

export default EditEventModal;