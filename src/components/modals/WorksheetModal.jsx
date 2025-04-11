import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Row, Col, Alert, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { fetchRegions, fetchTechnicians, fetchCitiesForRegion, fetchEquipment, fetchInstallationData } from '../../utils/apiUtils';
import '../../styles/WorksheetModal.css';

const HOUSE_TYPES = [
    'Bloc appartement', 'Bungalow', 'Condo', 'Cottage', 'Duplex', 
    'Maison de ville', 'Maison mobile', 'Quatriplex', 'Split Level', 'Triplex'
];

const SUPPORT_TYPES = [
    'Au sol', 'Au mur', 'Au sol nain', 'Au mur nain'
];

const VISITOR_NAMES = [
    'Benoit', 'Gérard', 'Jean-François', 'Jonathan', 
    'Patrice', 'Pierre', 'Stefan', 'Thierry' 
];

const DEFAULT_ALUMINUM_COLORS = [
    'Blanc', 'Ivoire', 'Argile', 'Kaki', 'Sable', 'Gris Granite',
    'Brun Commercial', 'Noir', 'Rouge Majestueux'
];

const DEFAULT_PANELS = [
    'I-T-E', 'Commander', 'Cutler-Hammer', 'Fereral Pioneer', 'GE', 'Schneider',
    'Seimens', 'SquareD', 'Stab-Lok', 'Sylvania', 'Westinghouse'
];

const WorksheetModal = ({ show, onHide, eventData, employees = [], mode = 'worksheet', handleSave }) => {
    const { user } = useAuth();
    const [isReadOnly] = useState(mode === 'worksheet');
    const worksheetRef = useRef(null);
    
    const [formData, setFormData] = useState({
        full_name: eventData?.full_name || '',
        address: eventData?.address || '',
        phone: eventData?.phone || '',
        city: eventData?.city || '',
        date: eventData?.date || '',
        time: eventData?.installation_time || '',
        installation_number: eventData?.installation_number || '',
        Sommaire: eventData?.Sommaire || '',
        Description: eventData?.Description || '',
        amount: eventData?.amount || '',
        progression_task_id: eventData?.id || '',
        client_number: eventData?.client_number || '',
        quote_number: eventData?.quote_number || '',
        representative: eventData?.representative || '',
        floor: '',
        hasVisit: false,
        visitorName: '',
        houseType: '',
        aluminum1: '',
        lengthCount1: 1,
        aluminum2: '',
        lengthCount2: 1,
        supportType: '',
        electricPanel: '',
        hasPanelSpace: true,
        basement: '',
        installationType: '',
        subInstallationType: '',
        particularities: {
            drainPump: false,
            backToBack: false,
            replacement: false,
            attic: false,
            onRoof: false,
            recovery: false
        }
    });

    const [showPanelManagement, setShowPanelManagement] = useState(false);
    const [showAluminumManagement, setShowAluminumManagement] = useState(false);
    
    const [panels, setPanels] = useState(
        DEFAULT_PANELS
            .map((name, id) => ({ id: id.toString(), name }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    );
    const [aluminumColors, setAluminumColors] = useState(
        DEFAULT_ALUMINUM_COLORS
            .map((name, id) => ({ id: id.toString(), name }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    );
    const [newPanelName, setNewPanelName] = useState('');
    const [newColorName, setNewColorName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({ type: '', message: '' });
    const [fetchError, setFetchError] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (eventData) {
            setFormData(prev => ({
                ...prev,
                full_name: eventData.full_name || prev.full_name || '',
                address: eventData.address || prev.address || '',
                phone: eventData.phone || prev.phone || '',
                city: eventData.city || prev.city || '',
                date: eventData.date || prev.date || '',
                time: eventData.installation_time || prev.time || '',
                installation_number: eventData.installation_number || prev.installation_number || '',
                Sommaire: eventData.Sommaire || prev.Sommaire || '',
                Description: eventData.Description || prev.Description || '',
                amount: eventData.amount || prev.amount || '',
                client_number: eventData.client_number || prev.client_number || '',
                quote_number: eventData.quote_number || prev.quote_number || '',
                representative: eventData.representative || prev.representative || '',
                progression_task_id: eventData.id || prev.progression_task_id || '',
                floor: eventData.floor !== undefined ? eventData.floor : prev.floor || '',
                hasVisit: typeof eventData.has_visit === 'boolean' ? eventData.has_visit : prev.hasVisit || false,
                visitorName: eventData.visitor_name || prev.visitorName || '',
                houseType: eventData.house_type || prev.houseType || '',
                aluminum1: eventData.aluminum1 || prev.aluminum1 || '',
                lengthCount1: eventData.length_count1 || prev.lengthCount1 || 1,
                aluminum2: eventData.aluminum2 || prev.aluminum2 || '',
                lengthCount2: eventData.length_count2 || prev.lengthCount2 || 1,
                supportType: eventData.support_type || prev.supportType || '',
                electricPanel: eventData.electric_panel || prev.electricPanel || '',
                hasPanelSpace: typeof eventData.has_panel_space === 'boolean' ? eventData.has_panel_space : prev.hasPanelSpace !== undefined ? prev.hasPanelSpace : true,
                basement: eventData.basement || prev.basement || '',
                installationType: eventData.installation_type || prev.installationType || '',
                subInstallationType: eventData.sub_installation_type || prev.subInstallationType || '',
                particularities: eventData.particularities ? {
                    drainPump: typeof eventData.particularities.drainPump === 'boolean' ? eventData.particularities.drainPump : prev.particularities?.drainPump || false,
                    backToBack: typeof eventData.particularities.backToBack === 'boolean' ? eventData.particularities.backToBack : prev.particularities?.backToBack || false,
                    replacement: typeof eventData.particularities.replacement === 'boolean' ? eventData.particularities.replacement : prev.particularities?.replacement || false,
                    attic: typeof eventData.particularities.attic === 'boolean' ? eventData.particularities.attic : prev.particularities?.attic || false,
                    onRoof: typeof eventData.particularities.onRoof === 'boolean' ? eventData.particularities.onRoof : prev.particularities?.onRoof || false,
                    recovery: typeof eventData.particularities.recovery === 'boolean' ? eventData.particularities.recovery : prev.particularities?.recovery || false,
                } : (prev.particularities || {
                    drainPump: false, backToBack: false, replacement: false, attic: false, onRoof: false, recovery: false
                })
            }));
        } else {
            setFormData({
                full_name: '',
                address: '',
                phone: '',
                city: '',
                date: '',
                time: '',
                installation_number: '',
                Sommaire: '',
                Description: '',
                amount: '',
                client_number: '',
                quote_number: '',
                representative: '',
                floor: '',
                hasVisit: false,
                visitorName: '',
                houseType: '',
                aluminum1: '',
                lengthCount1: 1,
                aluminum2: '',
                lengthCount2: 1,
                supportType: '',
                electricPanel: '',
                hasPanelSpace: true,
                basement: '',
                installationType: '',
                subInstallationType: '',
                particularities: {
                    drainPump: false,
                    backToBack: false,
                    replacement: false,
                    attic: false,
                    onRoof: false,
                    recovery: false
                }
            });
        }
    }, [eventData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let processedValue;
        if (type === 'checkbox' || type === 'radio') {
            if (name === 'hasVisit') {
                processedValue = value === 'true';
            } else if (name.startsWith('particularities.')) {
                const key = name.split('.')[1];
        setFormData(prev => ({
            ...prev,
                    particularities: { ...prev.particularities, [key]: checked }
                }));
                return;
            } else {
                processedValue = checked;
            }
        } else {
            processedValue = value;
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));
        
        setFetchError('');
    };

    const handlePanelManagement = () => {
        setShowPanelManagement(true);
    };

    const handleAluminumManagement = () => {
        setShowAluminumManagement(true);
    };

    const handleAddPanel = async () => {
        if (!newPanelName.trim()) return;
        
        const newPanel = {
            id: panels.length,
            name: newPanelName.trim()
        };

        setPanels(prevPanels => 
            [...prevPanels, newPanel]
                .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        );
        setNewPanelName('');
    };

    const handleDeletePanel = async (panelId) => {
        setPanels(panels.filter(panel => panel.id !== panelId));
    };

    const handleAddColor = async () => {
        if (!newColorName.trim()) return;
        
        const newColor = {
            id: aluminumColors.length,
            name: newColorName.trim()
        };

        setAluminumColors(prevColors => 
            [...prevColors, newColor]
                .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        );
        setNewColorName('');
    };

    const handleDeleteColor = async (colorId) => {
        setAluminumColors(aluminumColors.filter(color => color.id !== colorId));
    };

    // --- Fonction de Validation --- 
    const validateFormData = () => {
        const newErrors = {};
        
        // Règle 1: Visite Oui => Par Requis
        if (formData.hasVisit && !formData.visitorName) {
            newErrors.visitorName = "Le champ 'Par:' est requis si 'Visite du site' est Oui.";
        }
        
        // Règle 2: Type Construction Requis
        if (!formData.houseType) {
            newErrors.houseType = "Le champ 'Type construction' est requis.";
        }
        
        // Règle 3: Aluminium 1 & 2 Différents (si les deux sont sélectionnés)
        if (formData.aluminum1 && formData.aluminum2 && formData.aluminum1 === formData.aluminum2) {
            // Mettre l'erreur sur aluminum2 pour simplicité
            newErrors.aluminum2 = "Les couleurs d'aluminium #1 et #2 doivent être différentes si les deux sont choisies."; 
        }
        
        // Règle 4: Type Support Requis
        if (!formData.supportType) {
            newErrors.supportType = "Le champ 'Type de support' est requis.";
        }
        
        // Règle 5: Panneau Électrique Requis
        if (!formData.electricPanel) {
            newErrors.electricPanel = "Le champ 'Panneau électrique' est requis.";
        }
        
        // Règle 6: Sous-sol Requis
        if (!formData.basement) {
            newErrors.basement = "Le champ 'Sous-sol' est requis.";
        }
        
        // Règle 7 & 8 (Espace dispo, Particularités): Pas de validation spécifique requise ici
        
        return newErrors;
    };
    // --- Fin Fonction de Validation --- 

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // --- Exécuter la validation --- 
        const validationErrors = validateFormData();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors); // Mettre à jour l'état des erreurs
            setNotification({ type: 'warning', message: 'Veuillez corriger les erreurs indiquées.' });
            console.warn("Erreurs de validation:", validationErrors);
            return; // Arrêter la soumission
        }
        // --- Fin Validation --- 

        // Si validation OK, effacer les erreurs précédentes et la notification
        setErrors({}); 
        setNotification({ type: '', message: '' });

        const formattedData = {
            installation_id: eventData?.id || formData.progression_task_id || null,
            full_name: formData.full_name,
            name: formData.full_name,
            address: formData.address,
            phone: formData.phone,
            city: formData.city,
            floor: formData.floor,
            hasVisit: formData.hasVisit,
            visitorName: formData.visitorName,
            houseType: formData.houseType,
            contractNumber: formData.contractNumber,
            siteVisit: formData.siteVisit,
            visitedBy: formData.visitedBy,
            aluminum1: formData.aluminum1,
            lengthCount1: formData.lengthCount1,
            aluminum2: formData.aluminum2,
            lengthCount2: formData.lengthCount2,
            supportType: formData.supportType,
            electricPanel: formData.electricPanel,
            hasPanelSpace: formData.hasPanelSpace,
            basement: formData.basement,
            installationType: formData.installationType,
            subInstallationType: formData.subInstallationType,
            particularities: formData.particularities,
            sketch_data: formData.sketch_data,
        };

        console.log("Données formatées à envoyer (après validation):", formattedData);

        if (handleSave) {
            console.log("Appel de handleSave (prop)");
            try {
                await handleSave(formattedData);
            } catch (err) {
                console.error("Erreur lors de l'appel de handleSave:", err);
                setError("Erreur lors de la sauvegarde via le parent.");
            }
            return;
        }

        console.log("Exécution de l'appel API interne vers worksheets.php");
        setIsSubmitting(true);
        setFetchError('');
        const apiUrl = `${API_BASE_URL}/worksheets.php`;
        console.log("URL de l'API:", apiUrl);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formattedData)
            });

            const responseText = await response.text();
            console.log("Réponse brute du serveur:", responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error("Erreur de parsing JSON:", jsonError);
                throw new Error(`Réponse invalide du serveur: ${responseText}`);
            }

            if (!response.ok || !result.success) {
                throw new Error(result.error || `Erreur HTTP ${response.status}`);
            }

            console.log('Sauvegarde réussie:', result);
            setNotification({ type: 'success', message: 'Fiche sauvegardée avec succès!' });
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            console.error('Erreur détaillée:', error);
            setFetchError(error.message || 'Une erreur est survenue lors de la sauvegarde.');
            setNotification({ type: 'danger', message: `Erreur: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        const printContents = worksheetRef.current.innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    const renderPanelManagementModal = () => (
        <Modal show={showPanelManagement} onHide={() => setShowPanelManagement(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Gestion des panneaux électriques</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}
                <div className="mb-3">
                    <label>Ajouter un nouveau panneau</label>
                    <div className="d-flex gap-2">
                        <input
                            type="text"
                            value={newPanelName}
                            onChange={(e) => setNewPanelName(e.target.value)}
                            placeholder="Nom du panneau"
                        />
                        <Button 
                            variant="primary" 
                            onClick={handleAddPanel}
                            disabled={isLoading || !newPanelName.trim()}
                        >
                            Ajouter
                        </Button>
                    </div>
                </div>
                <div className="mt-3">
                    <h6>Panneaux existants</h6>
                    {isLoading ? (
                        <p>Chargement...</p>
                    ) : (
                        <ul className="list-group">
                            {panels.map((panel) => (
                                <li key={panel.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    {panel.name}
                                    <Button 
                                        variant="danger" 
                                        size="sm" 
                                        onClick={() => handleDeletePanel(panel.id)}
                                        disabled={isLoading}
                                    >
                                        Supprimer
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );

    const renderAluminumManagementModal = () => (
        <Modal show={showAluminumManagement} onHide={() => setShowAluminumManagement(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Gestion des couleurs d'aluminium</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}
                <div className="mb-3">
                    <label>Ajouter une nouvelle couleur</label>
                    <div className="d-flex gap-2">
                        <input
                            type="text"
                            value={newColorName}
                            onChange={(e) => setNewColorName(e.target.value)}
                            placeholder="Nom de la couleur"
                        />
                        <Button 
                            variant="primary" 
                            onClick={handleAddColor}
                            disabled={isLoading || !newColorName.trim()}
                        >
                            Ajouter
                        </Button>
                    </div>
                </div>
                <div className="mt-3">
                    <h6>Couleurs existantes</h6>
                    {isLoading ? (
                        <p>Chargement...</p>
                    ) : (
                        <ul className="list-group">
                            {aluminumColors.map((color) => (
                                <li key={color.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    {color.name}
                                    <Button 
                                        variant="danger" 
                                        size="sm" 
                                        onClick={() => handleDeleteColor(color.id)}
                                        disabled={isLoading}
                                    >
                                        Supprimer
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );

    return (
        <Modal show={show} onHide={onHide} size="xl" centered className="worksheet-modal worksheet-modal-compact">
                <Modal.Header closeButton>
                    <Modal.Title>
                    Feuille de travail - Installation {eventData?.installation_number}
                    </Modal.Title>
                </Modal.Header>
            <Modal.Body ref={worksheetRef} className="worksheet-body worksheet-modal-compact">
                {error && <Alert variant="danger">{error}</Alert>}

                {/* Affichage de la notification de validation */} 
                    {notification.message && (
                    <Alert variant={notification.type} onClose={() => setNotification({ type: '', message: '' })} dismissible>
                            {notification.message}
                    </Alert>
                )} 

                <Row>
                    <Col md={9}>
                        <Row className="mb-2 gx-2">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Client:</Form.Label>
                                    <Form.Control type="text" readOnly value={formData.full_name} />
                                </Form.Group>
                            </Col>
                             <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Adresse:</Form.Label>
                                    <Form.Control type="text" readOnly value={`${formData.address}, ${formData.city}`} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3 gx-2">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Téléphone:</Form.Label>
                                    <Form.Control type="text" readOnly value={formData.phone} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Étage:</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="floor" 
                                        value={formData.floor} 
                                        onChange={handleChange}
                                        readOnly={isReadOnly}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="worksheet-plan-area mt-3">
                            <Col xs={12}>
                                <h6>Plan / Croquis</h6>
                                <div className="plan-placeholder" style={{ minHeight: '300px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                   (Espace réservé pour le plan - à implémenter)
                                </div>
                            </Col>
                        </Row>
                            </Col>

                    <Col md={3} className="worksheet-details-area border rounded p-2">
                        <h6>Détails Techniques</h6>

                        <Form.Group className="mb-2">
                            <Form.Label># Contrat:</Form.Label>
                            <Form.Control type="text" 
                                name="installation_number"
                                value={formData.installation_number || ''} 
                                readOnly 
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-2">
                            <Form.Label>Visite du site:</Form.Label>
                            <div>
                                <Form.Check
                                    inline
                                    type="radio"
                                    label="Oui"
                                    name="hasVisit"
                                    value="true"
                                    checked={formData.hasVisit === true}
                                        onChange={handleChange}
                                    disabled={isReadOnly}
                                    id="visit-yes"
                                />
                                <Form.Check
                                    inline
                                    type="radio"
                                    label="Non"
                                    name="hasVisit"
                                    value="false"
                                    checked={formData.hasVisit === false}
                                        onChange={handleChange}
                                    disabled={isReadOnly}
                                    id="visit-no"
                                    />
                                </div>
                        </Form.Group>
                        
                        <Form.Group className="mb-2">
                            <Form.Label>Par:</Form.Label>
                            <Form.Select 
                                            name="visitorName"
                                value={formData.visitorName || ''} 
                                            onChange={handleChange}
                                disabled={isReadOnly}
                                isInvalid={!!errors.visitorName}
                            >
                                <option value="">Sélectionner...</option>
                                {VISITOR_NAMES.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.visitorName}
                            </Form.Control.Feedback>
                        </Form.Group>
                        
                        <Form.Group className="mb-2">
                            <Form.Label>Type construction:</Form.Label>
                            <Form.Select 
                                name="houseType"
                                value={formData.houseType || ''} 
                                onChange={handleChange}
                                disabled={isReadOnly}
                                isInvalid={!!errors.houseType}
                            >
                                <option value="">Sélectionner...</option>
                                {HOUSE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.houseType}
                            </Form.Control.Feedback>
                        </Form.Group>
                        
                        <Form.Group className="mb-2">
                            <Form.Label>Aluminium #1:</Form.Label>
                            <Form.Select name="aluminum1" value={formData.aluminum1} onChange={handleChange} disabled={isReadOnly}>
                                <option value="">Couleur...</option>
                                {aluminumColors.map(color => <option key={color.id} value={color.name}>{color.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Nb Longueurs #1:</Form.Label>
                            <Form.Control type="number" name="lengthCount1" value={formData.lengthCount1} onChange={handleChange} disabled={isReadOnly} min="1" />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Aluminium #2:</Form.Label>
                            <Form.Select 
                                            name="aluminum2"
                                            value={formData.aluminum2}
                                            onChange={handleChange}
                                disabled={isReadOnly}
                                isInvalid={!!errors.aluminum2}
                            >
                                <option value="">Couleur...</option>
                                {aluminumColors.map(color => <option key={color.id} value={color.name}>{color.name}</option>)}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.aluminum2}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nb Longueurs #2:</Form.Label>
                            <Form.Control type="number" name="lengthCount2" value={formData.lengthCount2} onChange={handleChange} disabled={isReadOnly} min="1" />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Type de support:</Form.Label>
                            <Form.Select 
                                        name="supportType"
                                        value={formData.supportType}
                                        onChange={handleChange}
                                disabled={isReadOnly}
                                isInvalid={!!errors.supportType}
                            >
                                <option value="">Sélectionner...</option>
                                {SUPPORT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.supportType}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Panneau électrique:</Form.Label>
                            <Form.Select 
                                            name="electricPanel"
                                            value={formData.electricPanel}
                                            onChange={handleChange}
                                disabled={isReadOnly}
                                isInvalid={!!errors.electricPanel}
                            >
                                <option value="">Sélectionner...</option>
                                {panels.map(panel => <option key={panel.id} value={panel.id}>{panel.name}</option>)}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.electricPanel}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Espace disponible:</Form.Label>
                            <div>
                                <Form.Check 
                                    type="switch" 
                                    id="hasPanelSpaceSwitch" 
                                        name="hasPanelSpace"
                                    label={formData.hasPanelSpace ? "Oui" : "Non"} 
                                    checked={formData.hasPanelSpace} 
                                        onChange={handleChange}
                                    disabled={isReadOnly} 
                                />
                                </div>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Sous-sol:</Form.Label>
                            <Form.Select 
                                        name="basement"
                                        value={formData.basement}
                                        onChange={handleChange}
                                disabled={isReadOnly}
                                isInvalid={!!errors.basement}
                            >
                                <option value="">Sélectionner...</option>
                                <option value="Fini">Fini</option>
                                <option value="Non Fini">Non Fini</option>
                                <option value="Plafond Suspendu">Plafond Suspendu</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.basement}
                            </Form.Control.Feedback>
                        </Form.Group>
                        
                        <Form.Group className="mb-2">
                            <Form.Label>Type d'installation:</Form.Label>
                            <Form.Control type="text" name="installationType" value={formData.installationType} onChange={handleChange} readOnly={isReadOnly} placeholder="(Ex: Thermopompe Murale)"/>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Particularités:</Form.Label>
                            <div>
                                <Form.Check type="checkbox" id="drainPumpCheck" name="particularities.drainPump" label="Pompe à Drain" checked={formData.particularities.drainPump} onChange={handleChange} disabled={isReadOnly} />
                                <Form.Check type="checkbox" id="backToBackCheck" name="particularities.backToBack" label="Back à back" checked={formData.particularities.backToBack} onChange={handleChange} disabled={isReadOnly} />
                                <Form.Check type="checkbox" id="replacementCheck" name="particularities.replacement" label="Remplacement" checked={formData.particularities.replacement} onChange={handleChange} disabled={isReadOnly} />
                                <Form.Check type="checkbox" id="recoveryCheck" name="particularities.recovery" label="Récupération" checked={formData.particularities.recovery} onChange={handleChange} disabled={isReadOnly} />
                                <Form.Check type="checkbox" id="atticCheck" name="particularities.attic" label="Grenier" checked={formData.particularities.attic} onChange={handleChange} disabled={isReadOnly} />
                                <Form.Check type="checkbox" id="onRoofCheck" name="particularities.onRoof" label="Sur le toit" checked={formData.particularities.onRoof} onChange={handleChange} disabled={isReadOnly} />
                                </div>
                        </Form.Group>
                            </Col>
                        </Row>
                </Modal.Body>
            <Modal.Footer className="worksheet-footer">
                 <Button variant="secondary" onClick={onHide}>Fermer</Button>
                 <Button variant="success" onClick={handlePrint}><i className="fas fa-print"></i> Imprimer</Button>
                 {!isReadOnly && (
                    <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                         {isSubmitting ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Sauvegarder'}
                    </Button>
                 )}
                </Modal.Footer>

            {renderPanelManagementModal()}
            {renderAluminumManagementModal()}
        </Modal>
    );
};

export default WorksheetModal; 