import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Alert } from 'react-bootstrap';
import { fetchRegions, fetchTechnicians, fetchCitiesForRegion, fetchEquipment, fetchInstallationData } from '../../utils/apiUtils';

const HOUSE_TYPES = [
    'Bungalow', 'Cottage', 'Maison de ville', 'Split Level', 'Maison mobile',
    'Condo', 'Bloc appartement', 'Duplex', 'Triplex', 'Quatriplex'
];

const SUPPORT_TYPES = [
    'Au sol', 'Au mur', 'Au sol nain', 'Au mur nain'
];

const DEFAULT_ALUMINUM_COLORS = [
    'Blanc', 'Ivoire', 'Argile', 'Kaki', 'Sable', 'Gris Granite',
    'Brun Commercial', 'Noir', 'Rouge Majestueux'
];

const DEFAULT_PANELS = [
    'I-T-E', 'Commander', 'Cutler-Hammer', 'Fereral Pioneer', 'GE', 'Schneider',
    'Seimens', 'SquareD', 'Stab-Lok', 'Sylvania', 'Westinghouse'
];

const WorksheetModal = ({ show, onHide, installation, employees = [], mode = 'worksheet' }) => {
    const [isReadOnly] = useState(mode === 'worksheet');
    const [formData, setFormData] = useState({
        full_name: installation?.full_name || '',
        address: '',
        phone: '',
        city: '',
        date: '',
        time: '',
        installation_number: installation?.installation_number ? installation.installation_number : '',
        Sommaire: '',
        Description: '',
        amount: '',
        progression_task_id: '',
        client_number: installation?.client_number || '',  // Numéro avantage
        quote_number: installation?.quote_number || '',    // Numéro de soumission
        representative: installation?.representative || '', // Représentant
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
            onRoof: false
        }
    });

    const [showPanelManagement, setShowPanelManagement] = useState(false);
    const [showAluminumManagement, setShowAluminumManagement] = useState(false);
    
    const [panels, setPanels] = useState(
        DEFAULT_PANELS
            .map((name, id) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    );
    const [aluminumColors, setAluminumColors] = useState(
        DEFAULT_ALUMINUM_COLORS
            .map((name, id) => ({ id, name }))
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
        if (installation) {
            setFormData(prev => ({
                ...prev,
                full_name: installation.full_name || '',
                installation_number: installation.installation_number ? installation.installation_number : ''
            }));
        }
    }, [installation]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setNotification({ type: '', message: '' });

            const worksheetData = {
                installation_id: parseInt(installation.id, 10),
                full_name: formData.full_name || '',
                address: formData.address || '',
                phone: formData.phone || '',
                city: formData.city || '',
                has_visit: Boolean(formData.hasVisit),
                visitor_name: formData.visitorName || '',
                house_type: formData.houseType || '',
                aluminum1: formData.aluminum1 || '',
                length_count1: parseInt(formData.lengthCount1, 10) || 1,
                aluminum2: formData.aluminum2 || '',
                length_count2: parseInt(formData.lengthCount2, 10) || 1,
                support_type: formData.supportType || '',
                electric_panel: formData.electricPanel || '',
                has_panel_space: Boolean(formData.hasPanelSpace),
                basement: formData.basement || '',
                installation_type: formData.installationType || '',
                sub_installation_type: formData.subInstallationType || '',
                amount: formData.amount || '',
                progression_task_id: formData.progression_task_id || '',
                client_number: formData.client_number || '',
                quote_number: formData.quote_number || '',
                representative: formData.representative || '',
                particularities: {
                    drainPump: Boolean(formData.particularities.drainPump),
                    backToBack: Boolean(formData.particularities.backToBack),
                    replacement: Boolean(formData.particularities.replacement),
                    attic: Boolean(formData.particularities.attic),
                    onRoof: Boolean(formData.particularities.onRoof)
                }
            };

            console.log('Données formatées à envoyer:', worksheetData);

            const response = await fetch('../api/worksheets.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(worksheetData)
            });

            console.log('URL de l\'API:', response.url);

            const responseText = await response.text();
            console.log('Réponse brute du serveur:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Réponse invalide du serveur: ${responseText}`);
            }

            if (!response.ok) {
                throw new Error(data.error || `Erreur HTTP: ${response.status}`);
            }

            console.log('Réponse du serveur (parsée):', data);

            setNotification({
                type: 'success',
                message: 'Feuille de travail enregistrée avec succès'
            });

            setTimeout(() => {
                onHide();
            }, 1500);
        } catch (error) {
            console.error('Erreur détaillée:', error);
            setNotification({
                type: 'error',
                message: `Erreur lors de la sauvegarde: ${error.message}`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFetchData = async () => {
        setIsLoading(true);
        setFetchError('');
        
        try {
            const installationNumber = formData.installation_number;
            console.log('Tentative de fetch pour le numéro:', installationNumber);
            
            if (!installationNumber) {
                throw new Error('Veuillez entrer un numéro d\'installation valide');
            }

            console.log('Appel de fetchInstallationData...');
            const progressionData = await fetchInstallationData(installationNumber);
            console.log('Données reçues:', progressionData);

            console.log('Mise à jour du formulaire avec les données:', {
                name: progressionData.customer.name,
                phone: progressionData.customer.phoneNumber,
                address: progressionData.customer.address.street,
                city: progressionData.customer.address.city,
                summary: progressionData.task.title,
                description: progressionData.task.description,
                amount: progressionData.task.priceWithTaxes,
                taskId: progressionData.task.id
            });

            setFormData(prev => ({
                ...prev,
                full_name: progressionData.customer.name,
                phone: progressionData.customer.phoneNumber,
                address: progressionData.customer.address.street,
                city: progressionData.customer.address.city,
                Sommaire: progressionData.task.title,
                Description: progressionData.task.description,
                amount: progressionData.task.priceWithTaxes,
                progression_task_id: progressionData.task.id,
                client_number: progressionData.customer.clientNumber,
                quote_number: progressionData.task.quoteNumber,
                representative: progressionData.task.representative
            }));
        } catch (error) {
            console.error('Erreur détaillée du Fetch:', {
                message: error.message,
                stack: error.stack,
                formData: formData
            });
            setFetchError(error.message);
        } finally {
            setIsLoading(false);
        }
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
        <>
            <Modal show={show} onHide={onHide} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {mode === 'worksheet' 
                            ? `Feuille de travail - Installation ${installation?.installation_number}`
                            : 'Ajouter une tâche Installation'
                        }
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {fetchError && (
                        <Alert variant="danger" className="mb-3">
                            {fetchError}
                        </Alert>
                    )}
                    {notification.message && (
                        <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
                            {notification.message}
                        </div>
                    )}
                    <form>
                        <Row className="mb-3">
                            <Col md={6}>
                                <div className="mb-3">
                                    <label>Numéro d'installation</label>
                                    <input
                                        type="text"
                                        className={`form-control ${fetchError ? 'is-invalid' : ''}`}
                                        id="installation_number"
                                        name="installation_number"
                                        value={formData.installation_number}
                                        onChange={handleChange}
                                        placeholder="Numéro d'installation"
                                    />
                                    {fetchError && (
                                        <div className="invalid-feedback">
                                            {fetchError}
                                        </div>
                                    )}
                                    <Button 
                                        variant="primary" 
                                        onClick={handleFetchData}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Chargement...' : 'Fetch'}
                                    </Button>
                                </div>
                            </Col>
                            <Col md={3}>
                                <div className="mb-3">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                    />
                                </div>
                            </Col>
                            <Col md={3}>
                                <div className="mb-3">
                                    <label>Heure</label>
                                    <input
                                        type="time"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleChange}
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={8}>
                                <div className="mb-3">
                                    <label>Nom complet</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Nom complet"
                                        required
                                    />
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <label>Téléphone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Téléphone"
                                        required
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={8}>
                                <div className="mb-3">
                                    <label>Adresse</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Adresse complète"
                                        required
                                    />
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <label>Ville</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Ville"
                                        required
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={12}>
                                <div className="mb-3">
                                    <label>Sommaire</label>
                                    <input
                                        type="text"
                                        name="Sommaire"
                                        value={formData.Sommaire}
                                        onChange={handleChange}
                                        placeholder="Sommaire de l'installation"
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={12}>
                                <div className="mb-3">
                                    <label>Description</label>
                                    <textarea
                                        rows={5}
                                        name="Description"
                                        value={formData.Description}
                                        onChange={handleChange}
                                        placeholder="Description détaillée"
                                        style={{ maxHeight: '200px', overflowY: 'auto' }}
                                    />
                                </div>
                            </Col>
                        </Row>

                        <div className="mb-3">
                            <label>Équipement</label>
                            <input
                                type="text"
                                name="equipment"
                                value={formData.equipment}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label>Montant</label>
                            <input
                                type="number"
                                step="0.01"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Row className="mb-3">
                            <Col md={4}>
                                <div className="mb-3">
                                    <label>Numéro avantage</label>
                                    <input
                                        type="text"
                                        name="client_number"
                                        value={formData.client_number}
                                        onChange={handleChange}
                                        placeholder="Numéro avantage"
                                    />
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <label>Numéro de soumission</label>
                                    <input
                                        type="text"
                                        name="quote_number"
                                        value={formData.quote_number}
                                        onChange={handleChange}
                                        placeholder="Numéro de soumission"
                                    />
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <label>Représentant</label>
                                    <input
                                        type="text"
                                        name="representative"
                                        value={formData.representative}
                                        onChange={handleChange}
                                        placeholder="Représentant"
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <div className="mb-3">
                                    <label>Visite</label>
                                    <select
                                        name="hasVisit"
                                        value={formData.hasVisit}
                                        onChange={handleChange}
                                    >
                                        <option value={false}>Non</option>
                                        <option value={true}>Oui</option>
                                    </select>
                                </div>
                            </Col>
                            {formData.hasVisit && (
                                <Col md={6}>
                                    <div className="mb-3">
                                        <label>Nom du visiteur</label>
                                        <select
                                            name="visitorName"
                                            value={formData.visitorName}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner un employé</option>
                                            {employees.map(employee => (
                                                <option key={employee.id} value={`${employee.first_name} ${employee.last_name}`}>
                                                    {`${employee.first_name} ${employee.last_name}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </Col>
                            )}
                        </Row>

                        <div className="mb-3">
                            <label>Type de construction</label>
                            <select
                                name="houseType"
                                value={formData.houseType}
                                onChange={handleChange}
                            >
                                <option value="">Sélectionner un type</option>
                                {HOUSE_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <Row className="mb-3">
                            <Col md={8}>
                                <div className="mb-3">
                                    <label>Aluminium #1</label>
                                    <div className="d-flex gap-2">
                                        <select
                                            name="aluminum1"
                                            value={formData.aluminum1}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner une couleur</option>
                                            {aluminumColors.map(color => (
                                                <option key={color.id} value={color.name}>
                                                    {color.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Button variant="outline-primary" onClick={handleAluminumManagement}>
                                            Gérer
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <label>Nombre de longueur #1</label>
                                    <input
                                        type="number"
                                        name="lengthCount1"
                                        value={formData.lengthCount1}
                                        onChange={handleChange}
                                        min="1"
                                        max="5"
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={8}>
                                <div className="mb-3">
                                    <label>Aluminium #2</label>
                                    <div className="d-flex gap-2">
                                        <select
                                            name="aluminum2"
                                            value={formData.aluminum2}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner une couleur</option>
                                            {aluminumColors.map(color => (
                                                <option key={color.id} value={color.name}>
                                                    {color.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Button variant="outline-primary" onClick={handleAluminumManagement}>
                                            Gérer
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="mb-3">
                                    <label>Nombre de longueur #2</label>
                                    <input
                                        type="number"
                                        name="lengthCount2"
                                        value={formData.lengthCount2}
                                        onChange={handleChange}
                                        min="1"
                                        max="5"
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <div className="mb-3">
                                    <label>Type de support</label>
                                    <select
                                        name="supportType"
                                        value={formData.supportType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Sélectionner un type</option>
                                        {SUPPORT_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="mb-3">
                                    <label>Panneau électrique</label>
                                    <div className="d-flex gap-2">
                                        <select
                                            name="electricPanel"
                                            value={formData.electricPanel}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner un type</option>
                                            {panels.map(panel => (
                                                <option key={panel.id} value={panel.id}>{panel.name}</option>
                                            ))}
                                        </select>
                                        <Button variant="outline-primary" onClick={handlePanelManagement}>
                                            Gérer
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <div className="mb-3">
                                    <label>Espace disponible dans le panneau</label>
                                    <select
                                        name="hasPanelSpace"
                                        value={formData.hasPanelSpace}
                                        onChange={handleChange}
                                    >
                                        <option value={true}>Oui</option>
                                        <option value={false}>Non</option>
                                    </select>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="mb-3">
                                    <label>Sous-sol</label>
                                    <select
                                        name="basement"
                                        value={formData.basement}
                                        onChange={handleChange}
                                    >
                                        <option value="">Sélectionner un type</option>
                                        <option value="Ouvert">Ouvert</option>
                                        <option value="Fermé">Fermé</option>
                                        <option value="Suspendu">Suspendu</option>
                                    </select>
                                </div>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <div className="mb-3">
                                    <label>Type d'installation</label>
                                    <select
                                        name="installationType"
                                        value={formData.installationType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Sélectionner un type</option>
                                        <option value="Plafonnier">Plafonnier</option>
                                        <option value="Murale">Murale</option>
                                        <option value="Addon">Addon</option>
                                        <option value="Complet">Complet</option>
                                    </select>
                                </div>
                            </Col>
                            {(formData.installationType === 'Addon' || formData.installationType === 'Complet') && (
                                <Col md={6}>
                                    <div className="mb-3">
                                        <label>Sous-type d'installation</label>
                                        <select
                                            name="subInstallationType"
                                            value={formData.subInstallationType}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner un type</option>
                                            {formData.installationType === 'Addon' && (
                                                <>
                                                    <option value="Électrique">Électrique</option>
                                                    <option value="Gaz">Gaz</option>
                                                    <option value="Huile">Huile</option>
                                                </>
                                            )}
                                            {formData.installationType === 'Complet' && (
                                                <>
                                                    <option value="Électrique">Électrique</option>
                                                    <option value="Gaz">Gaz</option>
                                                    <option value="Ventillo Convecteur">Ventillo Convecteur</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </Col>
                            )}
                        </Row>

                        <div className="mb-3">
                            <label>Particularités</label>
                            <div className="d-flex flex-column gap-2">
                                <input
                                    type="checkbox"
                                    label="Pompe à Drain"
                                    name="drainPump"
                                    checked={formData.particularities.drainPump}
                                    onChange={handleChange}
                                />
                                <input
                                    type="checkbox"
                                    label="Back à Back"
                                    name="backToBack"
                                    checked={formData.particularities.backToBack}
                                    onChange={handleChange}
                                />
                                <input
                                    type="checkbox"
                                    label="Remplacement"
                                    name="replacement"
                                    checked={formData.particularities.replacement}
                                    onChange={handleChange}
                                />
                                <input
                                    type="checkbox"
                                    label="Grenier"
                                    name="attic"
                                    checked={formData.particularities.attic}
                                    onChange={handleChange}
                                />
                                <input
                                    type="checkbox"
                                    label="Sur le toit"
                                    name="onRoof"
                                    checked={formData.particularities.onRoof}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {renderPanelManagementModal()}
            {renderAluminumManagementModal()}
        </>
    );
};

export default WorksheetModal; 