import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { fetchRegions, fetchTechnicians, fetchCitiesForRegion, fetchEquipment, fetchInstallationData } from '../../utils/apiUtils';
import '../../styles/Modal.css';

const AddEventModal = ({ show, onHide, onSubmit, event = null, mode = 'add', employees = [] }) => {
    const [formData, setFormData] = useState({
        type: '',
        date: '',
        installation_time: '',
        full_name: '',
        phone: '',
        address: '',
        city: '',
        Sommaire: '',
        Description: '',
        installation_number: '',
        equipment: '',
        amount: '',
        technician1_id: '',
        technician2_id: '',
        technician3_id: '',
        technician4_id: '',
        employee_id: '',
        progression_task_id: '',
        startDate: '',
        endDate: '',
        client_number: '',  // Numéro avantage
        quote_number: '',   // Numéro de soumission
        representative: '' // Représentant
    });

    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);
    const [newEquipment, setNewEquipment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [errors, setErrors] = useState({});
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (show) {
            loadRegions();
            loadTechnicians();
            loadEquipment();
            if (event && mode === 'edit') {
                const normalizedEvent = {
                    type: event.type || '',
                    date: event.date || '',
                    installation_time: event.installation_time || '',
                    full_name: event.full_name || '',
                    phone: event.phone || '',
                    address: event.address || '',
                    city: event.city || '',
                    Sommaire: event.Sommaire || '',
                    Description: event.Description || '',
                    installation_number: event.installation_number || '',
                    equipment: event.equipment || '',
                    amount: event.amount || '',
                    technician1_id: event.technician1_id || '',
                    technician2_id: event.technician2_id || '',
                    technician3_id: event.technician3_id || '',
                    technician4_id: event.technician4_id || '',
                    employee_id: event.employee_id || '',
                    progression_task_id: event.progression_task_id || '',
                    client_number: event.client_number || '',
                    quote_number: event.quote_number || '',
                    representative: event.representative || ''
                };
                setFormData(normalizedEvent);
            }
        }
    }, [show, event, mode]);

    const loadRegions = async () => {
        try {
            const data = await fetchRegions();
            const formattedRegions = data.map(region => ({
                id: region.id,
                name: region.name
            }));
            setRegions(formattedRegions);
        } catch (error) {
            console.error('Error loading regions:', error);
        }
    };

    const loadCitiesForRegion = async (regionId) => {
        try {
            const data = await fetchCitiesForRegion(regionId);
            setCities(data);
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    };

    const loadTechnicians = async () => {
        try {
            const data = await fetchTechnicians();
            setTechnicians(data);
        } catch (error) {
            console.error('Error loading technicians:', error);
        }
    };

    const loadEquipment = async () => {
        try {
            const data = await fetchEquipment();
            setEquipment(data);
        } catch (error) {
            console.error('Error loading equipment:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            console.log('Form Data avant soumission:', formData);
            
            // Validation des champs requis pour une installation
            if (formData.type === 'installation') {
                const requiredFields = {
                    'full_name': 'Nom complet',
                    'phone': 'Téléphone',
                    'address': 'Adresse',
                    'quote_number': 'Numéro de soumission'
                };

                const missingFields = [];
                for (const [field, label] of Object.entries(requiredFields)) {
                    const value = formData[field];
                    if (!value || (typeof value === 'string' && !value.trim())) {
                        missingFields.push(label);
                    }
                }

                if (missingFields.length > 0) {
                    const errorMessage = `Veuillez remplir les champs suivants : \n${missingFields.join('\n')}`;
                    console.error(errorMessage);
                    alert(errorMessage);
                    return;
                }
            }
            
            // Nettoyer les données avant l'envoi
            const submissionData = {
                ...formData,
                full_name: formData.full_name?.trim() || '',
                phone: formData.phone?.trim() || '',
                address: formData.address?.trim() || '',
                quote_number: formData.quote_number?.trim() || '',
                type: formData.type || 'installation'
            };
            
            console.log('Données à envoyer:', submissionData);
            await onSubmit(submissionData);
            onHide();
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            alert(error.message || 'Erreur lors de la soumission du formulaire. Veuillez réessayer.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setFetchError('');
    };

    const handleEquipmentManagement = () => {
        setShowEquipmentModal(true);
    };

    const handleAddEquipment = async () => {
        if (!newEquipment.trim()) return;
        
        try {
            const response = await fetch('/api/equipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newEquipment.trim() })
            });
            
            if (response.ok) {
                const newItem = await response.json();
                setEquipment([...equipment, newItem]);
                setNewEquipment('');
                await loadEquipment(); // Recharger la liste
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'équipement:', error);
        }
    };

    const handleDeleteEquipment = async (equipmentId) => {
        try {
            const response = await fetch(`/api/equipment/${equipmentId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setEquipment(equipment.filter(item => item.id !== equipmentId));
                await loadEquipment(); // Recharger la liste
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'équipement:', error);
        }
    };

    const handleFetch = async () => {
        setIsFetching(true);
        setFetchError('');
        
        try {
            const installationCode = formData.installation_number;
            if (!installationCode) {
                setFetchError('Veuillez entrer un numéro d\'installation');
                return;
            }

            console.log('Fetching data for installation:', installationCode);
            const response = await fetchInstallationData(installationCode);
            console.log('API Response:', response);
            
            // Vérifier si nous avons des données valides
            if (!response.data) {
                throw new Error('Aucune donnée reçue de l\'API');
            }

            const data = response.data;
            console.log('Data to be set:', data);
            
            // Conserver toutes les données existantes du formulaire
            setFormData(prev => {
                const newData = {
                    ...prev, // Garder toutes les données existantes
                    full_name: data.client_name || prev.full_name || '',
                    phone: data.phone || prev.phone || '',
                    address: data.address || prev.address || '',
                    city: data.city || prev.city || '',
                    Sommaire: data.Sommaire || prev.Sommaire || '',
                    Description: data.Description || prev.Description || '',
                    amount: data.amount || prev.amount || '',
                    quote_number: data.quote_number || prev.quote_number || '',
                    representative: data.representative || prev.representative || '',
                    installation_number: data.task_code || installationCode,
                    // Conserver les valeurs existantes si elles ne sont pas dans la réponse API
                    technician1_id: prev.technician1_id || null,
                    technician2_id: prev.technician2_id || null,
                    technician3_id: prev.technician3_id || null,
                    technician4_id: prev.technician4_id || null,
                    employee_id: prev.employee_id || null,
                    type: prev.type || 'installation',
                    date: prev.date || '',
                    installation_time: prev.installation_time || ''
                };
                console.log('New form data after merge:', newData);
                return newData;
            });

            // Afficher un message de succès
            alert('Données récupérées avec succès ! Veuillez vérifier et compléter les informations si nécessaire.');

        } catch (error) {
            console.error('Fetch error:', error);
            setFetchError(error.message || 'Erreur lors de la récupération des données');
            alert('Erreur : ' + (error.message || 'Erreur lors de la récupération des données'));
        } finally {
            setIsFetching(false);
        }
    };

    const renderEquipmentModal = () => (
        <Modal show={showEquipmentModal} onHide={() => setShowEquipmentModal(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Gestion des équipements</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group>
                    <Form.Label>Ajouter un nouvel équipement</Form.Label>
                    <div className="d-flex gap-2">
                        <Form.Control
                            type="text"
                            value={newEquipment}
                            onChange={(e) => setNewEquipment(e.target.value)}
                            placeholder="Nom de l'équipement"
                        />
                        <Button 
                            variant="primary" 
                            onClick={handleAddEquipment}
                            disabled={!newEquipment.trim()}
                        >
                            Ajouter
                        </Button>
                    </div>
                </Form.Group>
                <div className="mt-3">
                    <h6>Équipements existants</h6>
                    <ul className="list-group">
                        {equipment.map((item) => (
                            <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {item.name}
                                <Button 
                                    variant="danger" 
                                    size="sm" 
                                    onClick={() => handleDeleteEquipment(item.id)}
                                >
                                    Supprimer
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </Modal.Body>
        </Modal>
    );

    return (
        <>
            <Modal 
                show={show} 
                onHide={onHide} 
                size="lg"
                centered
                dialogClassName="custom-modal"
            >
                <style>
                    {`
                        .modal {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                        }
                        .custom-modal {
                            max-width: 1000px !important;
                            width: 125% !important;
                            margin: 0 auto !important;
                        }
                        .custom-modal .modal-dialog {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 1.75rem auto !important;
                            width: 100% !important;
                        }
                        .custom-modal .modal-content {
                            width: 100% !important;
                        }
                    `}
                </style>
                <Modal.Header closeButton>
                    <Modal.Title>{mode === 'edit' ? 'Modifier l\'événement' : 'Ajouter un événement'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {fetchError && (
                        <Alert variant="danger" className="mb-3">
                            {fetchError}
                        </Alert>
                    )}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Type de tâche</Form.Label>
                            <Form.Select 
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                disabled={mode === 'edit'}
                                required
                            >
                                <option value="">Sélectionner un type</option>
                                <option value="installation">Installation</option>
                                <option value="conge">Congé</option>
                                <option value="maladie">Maladie</option>
                                <option value="formation">Formation</option>
                                <option value="vacances">Vacances</option>
                            </Form.Select>
                        </Form.Group>

                        {formData.type === 'installation' && (
                            <>
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>Numéro d'installation</Form.Label>
                                    <Col sm={7}>
                                        <Form.Control
                                            type="text"
                                            name="installation_number"
                                            value={formData.installation_number}
                                            onChange={handleChange}
                                            isInvalid={!!errors.installation_number}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.installation_number}
                                        </Form.Control.Feedback>
                                    </Col>
                                    <Col sm={2}>
                                        <Button 
                                            variant="primary" 
                                            onClick={handleFetch}
                                            disabled={isFetching}
                                        >
                                            {isFetching ? 'Chargement...' : 'Fetch'}
                                        </Button>
                                    </Col>
                                </Form.Group>
                                {fetchError && (
                                    <Alert variant="danger" className="mt-2">
                                        {fetchError}
                                    </Alert>
                                )}
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Heure</Form.Label>
                                            <Form.Control
                                                type="time"
                                                name="installation_time"
                                                value={formData.installation_time}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Équipement</Form.Label>
                                            <Form.Select
                                                name="equipment"
                                                value={formData.equipment}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Sélectionner un équipement</option>
                                                {equipment.map(item => (
                                                    <option key={item.id} value={item.name}>
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={8}>
                                        <Form.Group>
                                            <Form.Label>Nom complet</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleChange}
                                                placeholder="Nom complet"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Téléphone</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="Téléphone"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={8}>
                                        <Form.Group>
                                            <Form.Label>Adresse</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                placeholder="Adresse complète"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Ville</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="Ville"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>Sommaire</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="Sommaire"
                                                value={formData.Sommaire}
                                                onChange={handleChange}
                                                placeholder="Sommaire de l'installation"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>Description</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={5}
                                                name="Description"
                                                value={formData.Description}
                                                onChange={handleChange}
                                                placeholder="Description détaillée"
                                                style={{ maxHeight: '200px', overflowY: 'auto' }}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Montant à percevoir</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Row className="mb-3">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Numéro avantage</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="client_number"
                                                value={formData.client_number}
                                                onChange={handleChange}
                                                placeholder="Numéro avantage"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Numéro de soumission</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="quote_number"
                                                value={formData.quote_number}
                                                onChange={handleChange}
                                                placeholder="Numéro de soumission"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Représentant</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="representative"
                                                value={formData.representative}
                                                onChange={handleChange}
                                                placeholder="Représentant"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="form-row">
                                    <Form.Group className="mb-3 me-3">
                                        <Form.Label>Technicien 1</Form.Label>
                                        <Form.Select
                                            name="technician1_id"
                                            value={formData.technician1_id}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner un technicien</option>
                                            {technicians.map(tech => (
                                                <option key={tech.id} value={tech.id}>
                                                    {`${tech.first_name} ${tech.last_name}`}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Technicien 2</Form.Label>
                                        <Form.Select
                                            name="technician2_id"
                                            value={formData.technician2_id}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner un technicien</option>
                                            {technicians.map(tech => (
                                                <option key={tech.id} value={tech.id}>
                                                    {`${tech.first_name} ${tech.last_name}`}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </div>

                                <div className="form-row">
                                    <Form.Group className="mb-3 me-3">
                                        <Form.Label>Technicien 3</Form.Label>
                                        <Form.Select
                                            name="technician3_id"
                                            value={formData.technician3_id}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner un technicien</option>
                                            {technicians.map(tech => (
                                                <option key={tech.id} value={tech.id}>
                                                    {`${tech.first_name} ${tech.last_name}`}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Technicien 4</Form.Label>
                                        <Form.Select
                                            name="technician4_id"
                                            value={formData.technician4_id}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner un technicien</option>
                                            {technicians.map(tech => (
                                                <option key={tech.id} value={tech.id}>
                                                    {`${tech.first_name} ${tech.last_name}`}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </div>
                            </>
                        )}

                        {(formData.type === 'conge' || formData.type === 'maladie' || formData.type === 'formation') && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Employé</Form.Label>
                                    <Form.Select
                                        name="employee_id"
                                        value={formData.employee_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Sélectionner un employé</option>
                                        {employees?.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {`${emp.first_name} ${emp.last_name}`}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </>
                        )}

                        {formData.type === 'vacances' && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de début</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Date de fin</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        required
                                        min={formData.startDate}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Employé</Form.Label>
                                    <Form.Select
                                        name="employee_id"
                                        value={formData.employee_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Sélectionner un employé</option>
                                        {employees?.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {`${emp.first_name} ${emp.last_name}`}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {mode === 'edit' ? 'Modifier' : 'Ajouter'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {renderEquipmentModal()}
        </>
    );
};

export default AddEventModal; 