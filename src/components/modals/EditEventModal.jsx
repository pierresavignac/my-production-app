import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    Button, 
    Row, 
    Col, 
    Alert,
    Form
} from 'react-bootstrap';
import { 
    fetchRegions, 
    fetchTechnicians, 
    fetchCitiesForRegion, 
    fetchEquipment, 
    deleteEvent,
    updateEvent,
    API_BASE_URL,
    fetchInstallationData
} from '../../utils/apiUtils';
import '../../styles/Modal.css';
import DatePicker from 'react-datepicker';
import { fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import ManageEquipmentModal from './ManageEquipmentModal';

const EditEventModal = ({ show, onHide, onSave, event }) => {
    const [formData, setFormData] = useState({});
    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFetchingInstallation, setIsFetchingInstallation] = useState(false);
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);

    // Définition des types d'événements (identique à ProductionCalendar)
    const eventTypes = [
        { value: 'installation', label: 'Installation' },
        { value: 'conge', label: 'Congé' },
        { value: 'maladie', label: 'Maladie' },
        { value: 'formation', label: 'Formation' },
        { value: 'vacances', label: 'Vacances' }
    ];

    // Debug log pour voir l'événement reçu
    useEffect(() => {
        if (show && event) {
            console.log('Event complet reçu dans EditEventModal:', JSON.stringify(event, null, 2));
        }
    }, [show, event]);

    useEffect(() => {
        const initializeForm = async () => {
            if (show && event) {
                try {
                    console.log('Événement reçu dans EditEventModal:', JSON.stringify(event, null, 2));
                    
                    // Charger les techniciens d'abord
                    const techniciansList = await fetchTechnicians();
                    setTechnicians(techniciansList);
                    console.log('Liste des techniciens chargée:', techniciansList);

                    // Charger les équipements
                    const equipmentList = await fetchEquipment();
                    setEquipment(equipmentList);

                    // Trouver le type normalisé correspondant
                    const eventType = eventTypes.find(type => 
                        type.value === event.type.toLowerCase() || 
                        type.label.toLowerCase() === event.type.toLowerCase()
                    )?.value || event.type.toLowerCase();

                    console.log('Type d\'événement normalisé:', eventType);
                    
                    // Trouver les IDs des techniciens à partir de leurs noms
                    const findTechnicianId = (technicianName) => {
                        if (!technicianName) return '';
                        const [firstName, lastName] = technicianName.split(' ');
                        const technician = techniciansList.find(tech => 
                            tech.first_name === firstName && tech.last_name === lastName
                        );
                        return technician ? technician.id.toString() : '';
                    };

                    // Récupérer les IDs des techniciens
                    const tech1Id = findTechnicianId(event.technician1_name);
                    const tech2Id = findTechnicianId(event.technician2_name);
                    const tech3Id = findTechnicianId(event.technician3_name);
                    const tech4Id = findTechnicianId(event.technician4_name);

                    // Corriger le problème de fuseau horaire pour la date
                    let eventDate = null;
                    if (event.date) {
                        const [year, month, day] = event.date.split('-').map(Number);
                        eventDate = new Date(year, month - 1, day);
                    }
                    
                    // Mise à jour du formulaire avec les données de l'événement
                    const updatedFormData = {
                        ...event,
                        type: eventType,  // Utiliser le type normalisé
                        date: eventDate,
                        installation_time: event.installation_time || '08:00:00',
                        equipment: event.equipment || '',
                        technician1_id: tech1Id,
                        technician2_id: tech2Id,
                        technician3_id: tech3Id,
                        technician4_id: tech4Id,
                        full_name: event.full_name || '',
                        phone: event.phone || '',
                        address: event.address || '',
                        city: event.city || '',
                        Sommaire: event.Sommaire || '',
                        Description: event.Description || '',
                        quote_number: event.quote_number || '',
                        amount: event.amount || '',
                        installation_number: event.installation_number || ''
                    };

                    console.log('FormData mis à jour:', updatedFormData);
                    setFormData(updatedFormData);
                } catch (error) {
                    console.error('Erreur lors du chargement des données:', error);
                    setError('Erreur lors du chargement des données');
                }
            }
        };
        initializeForm();
    }, [show, event]);

    useEffect(() => {
        console.log('Rendu EditEventModal - formData:', formData);
    }, [formData]);

    const loadRegions = async () => {
        try {
            const data = await fetchRegions();
            setRegions(data);
        } catch (error) {
            console.error('Error loading regions:', error);
        }
    };

    const loadTechnicians = async () => {
        try {
            console.log('Chargement des techniciens...');
            const data = await fetchTechnicians();
            console.log('Données des techniciens reçues:', data);
            setTechnicians(data);
        } catch (error) {
            console.error('Erreur lors du chargement des techniciens:', error);
            setError('Erreur lors du chargement des techniciens');
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
        if (e) e.preventDefault();
        
        try {
            console.log('Soumission du formulaire avec les données:', formData);
            
            // Préparer les données pour la soumission
            const eventData = {
                ...formData,
                date: formData.date instanceof Date ? 
                    format(formData.date, 'yyyy-MM-dd') : 
                    formData.date
            };

            // Pour les événements de type congé/maladie/formation, copier technician1_id vers employee_id
            if (['conge', 'maladie', 'formation'].includes(formData.type)) {
                eventData.employee_id = formData.technician1_id;
                // Trouver le nom du technicien sélectionné
                const selectedTech = technicians.find(tech => tech.id === formData.technician1_id);
                if (selectedTech) {
                    eventData.employee_name = `${selectedTech.first_name} ${selectedTech.last_name}`;
                    eventData.technician1_name = `${selectedTech.first_name} ${selectedTech.last_name}`;
                }
            }

            console.log('Données préparées pour la soumission:', eventData);
            await onSave(eventData);
            onHide();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setError('Erreur lors de la sauvegarde de l\'événement');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log('Changement de champ:', name, value);
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDelete = async () => {
        try {
            if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
                await deleteEvent(formData.id);
                onHide();
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            setError('Erreur lors de la suppression de l\'événement');
        }
    };

    const handleInputChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFetchInstallation = async () => {
        if (!formData.installation_number) {
            setError('Veuillez entrer un numéro d\'installation');
            return;
        }

        setIsFetchingInstallation(true);
        setError(null);

        try {
            const response = await fetchInstallationData(formData.installation_number);
            console.log('Données d\'installation reçues:', response);
            
            if (response && response.data) {
                // Garder les techniciens actuels lors du fetch
                const currentTechnicians = {
                    technician1_id: formData.technician1_id,
                    technician2_id: formData.technician2_id,
                    technician3_id: formData.technician3_id,
                    technician4_id: formData.technician4_id,
                };

                setFormData(prevData => ({
                    ...prevData,
                    ...currentTechnicians,
                    full_name: response.data.client_name || '',
                    phone: response.data.phone || '',
                    address: response.data.address || '',
                    city: response.data.city || '',
                    amount: response.data.amount?.toString() || '',
                    quote_number: response.data.quote_number || '',
                    Sommaire: response.data.Sommaire || '',
                    Description: response.data.Description || ''
                }));
            }
        } catch (err) {
            console.error('Erreur lors de la récupération des données:', err);
            setError('Erreur lors de la récupération des données d\'installation');
        } finally {
            setIsFetchingInstallation(false);
        }
    };

    const renderTechnicianSelect = (techNumber) => {
        const currentValue = formData[`technician${techNumber}_id`];
        
        return (
            <div className="mb-2">
                <label className="form-label">Technicien {techNumber}</label>
                <select
                    className="form-select"
                    value={currentValue || ''}
                    onChange={(e) => handleInputChange(`technician${techNumber}_id`, e.target.value || null)}
                    disabled={isLoading}
                >
                    <option value="">Sélectionner un technicien</option>
                    {Array.isArray(technicians) && technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                            {`${tech.first_name} ${tech.last_name}`}
                        </option>
                    ))}
                </select>
                {isLoading && <div className="text-muted">Chargement...</div>}
                {error && <div className="text-danger">{error}</div>}
            </div>
        );
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {event ? 'Modifier l\'événement' : 'Créer un événement'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form onSubmit={handleSubmit} id="eventForm">
                        <Row className="mb-2">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Type d'événement</Form.Label>
                                    <Form.Select
                                        value={formData.type}
                                        onChange={(e) => handleChange({
                                            target: {
                                                name: 'type',
                                                value: e.target.value
                                            }
                                        })}
                                        required
                                    >
                                        <option value="">Sélectionner une tâche</option>
                                        {eventTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Champs communs pour tous les types d'événements */}
                        {formData.type && formData.type !== 'installation' && (
                            <>
                                <Row className="mb-2">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Date</Form.Label>
                                            <div className="date-picker-container">
                                                <DatePicker
                                                    selected={formData.date instanceof Date ? formData.date : new Date(formData.date)}
                                                    onChange={(date) => handleChange({
                                                        target: {
                                                            name: 'date',
                                                            value: date
                                                        }
                                                    })}
                                                    dateFormat="yyyy-MM-dd"
                                                    className="form-control"
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Technicien</Form.Label>
                                            <Form.Select
                                                value={formData.technician1_id}
                                                onChange={(e) => handleChange({
                                                    target: {
                                                        name: 'technician1_id',
                                                        value: e.target.value
                                                    }
                                                })}
                                                required
                                            >
                                                <option value="">Sélectionner un technicien</option>
                                                {technicians.map(tech => (
                                                    <option key={tech.id} value={tech.id}>
                                                        {tech.first_name} {tech.last_name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </>
                        )}

                        {formData.type === 'installation' && (
                            <>
                                <Row className="mb-2">
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Date</Form.Label>
                                            <div className="date-picker-container">
                                                <DatePicker
                                                    selected={formData.date}
                                                    onChange={(date) => handleChange({
                                                        target: {
                                                            name: 'date',
                                                            value: date
                                                        }
                                                    })}
                                                    dateFormat="yyyy-MM-dd"
                                                    className="form-control"
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Heure</Form.Label>
                                            <Form.Control
                                                type="time"
                                                value={formData.installation_time ? formData.installation_time.slice(0, 5) : ''}
                                                onChange={(e) => handleChange({
                                                    target: {
                                                        name: 'installation_time',
                                                        value: e.target.value + ':00'
                                                    }
                                                })}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Équipement</Form.Label>
                                            <div>
                                                <Form.Select
                                                    value={formData.equipment || ''}
                                                    onChange={(e) => handleChange({
                                                        target: {
                                                            name: 'equipment',
                                                            value: e.target.value
                                                        }
                                                    })}
                                                    className="mb-2"
                                                >
                                                    <option value="">Sélectionner un équipement</option>
                                                    {equipment && equipment.map(equip => (
                                                        <option key={equip.id} value={equip.name}>
                                                            {equip.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    onClick={() => setShowEquipmentModal(true)}
                                                    className="w-100"
                                                >
                                                    Modifier les équipements
                                                </Button>
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-2">
                                    <Col>
                                        <Form.Group>
                                            <Form.Label>Numéro d'installation</Form.Label>
                                            <div className="d-flex">
                                                <Form.Control
                                                    type="text"
                                                    value={formData.installation_number || ''}
                                                    onChange={(e) => handleChange({
                                                        target: {
                                                            name: 'installation_number',
                                                            value: e.target.value
                                                        }
                                                    })}
                                                    className="me-2"
                                                />
                                                <Button 
                                                    variant="secondary"
                                                    onClick={handleFetchInstallation}
                                                    disabled={isFetchingInstallation}
                                                >
                                                    {isFetchingInstallation ? 'Chargement...' : 'Fetch'}
                                                </Button>
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="border border-dark p-2 mb-2">
                                    <Row className="mb-2">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Nom complet</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.full_name || ''}
                                                    onChange={(e) => handleChange({
                                                        target: {
                                                            name: 'full_name',
                                                            value: e.target.value
                                                        }
                                                    })}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Téléphone</Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    value={formData.phone || ''}
                                                    onChange={(e) => handleChange({
                                                        target: {
                                                            name: 'phone',
                                                            value: e.target.value
                                                        }
                                                    })}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-2">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Adresse</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.address || ''}
                                                    onChange={(e) => handleChange({
                                                        target: {
                                                            name: 'address',
                                                            value: e.target.value
                                                        }
                                                    })}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Ville</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.city || ''}
                                                    onChange={(e) => handleChange({
                                                        target: {
                                                            name: 'city',
                                                            value: e.target.value
                                                        }
                                                    })}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-2">
                                        <Form.Label>Sommaire</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.Sommaire || ''}
                                            onChange={(e) => handleChange({
                                                target: {
                                                    name: 'Sommaire',
                                                    value: e.target.value
                                                }
                                            })}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-2">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            style={{ maxHeight: '100px', overflowY: 'auto' }}
                                            value={formData.Description || ''}
                                            onChange={(e) => handleChange({
                                                target: {
                                                    name: 'Description',
                                                    value: e.target.value
                                                }
                                            })}
                                        />
                                    </Form.Group>

                                    <Row className="mb-2">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Numéro de soumission</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.quote_number || ''}
                                                    onChange={(e) => handleChange({
                                                        target: {
                                                            name: 'quote_number',
                                                            value: e.target.value
                                                        }
                                                    })}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Montant à percevoir</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={formData.amount || ''}
                                                    onChange={(e) => handleChange({
                                                        target: {
                                                            name: 'amount',
                                                            value: e.target.value
                                                        }
                                                    })}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>

                                <Row className="mb-2">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Technicien 1</Form.Label>
                                            <Form.Select
                                                value={formData.technician1_id || ''}
                                                onChange={(e) => handleChange({
                                                    target: {
                                                        name: 'technician1_id',
                                                        value: e.target.value
                                                    }
                                                })}
                                                required
                                            >
                                                <option value="">Sélectionner un technicien</option>
                                                {technicians.map(tech => (
                                                    <option key={tech.id} value={tech.id}>
                                                        {tech.first_name} {tech.last_name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Technicien 2</Form.Label>
                                            <Form.Select
                                                value={formData.technician2_id || ''}
                                                onChange={(e) => handleChange({
                                                    target: {
                                                        name: 'technician2_id',
                                                        value: e.target.value
                                                    }
                                                })}
                                            >
                                                <option value="">Sélectionner un technicien</option>
                                                {technicians.map(tech => (
                                                    <option key={tech.id} value={tech.id}>
                                                        {tech.first_name} {tech.last_name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Technicien 3</Form.Label>
                                            <Form.Select
                                                value={formData.technician3_id || ''}
                                                onChange={(e) => handleChange({
                                                    target: {
                                                        name: 'technician3_id',
                                                        value: e.target.value
                                                    }
                                                })}
                                            >
                                                <option value="">Sélectionner un technicien</option>
                                                {technicians.map(tech => (
                                                    <option key={tech.id} value={tech.id}>
                                                        {tech.first_name} {tech.last_name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Technicien 4</Form.Label>
                                            <Form.Select
                                                value={formData.technician4_id || ''}
                                                onChange={(e) => handleChange({
                                                    target: {
                                                        name: 'technician4_id',
                                                        value: e.target.value
                                                    }
                                                })}
                                            >
                                                <option value="">Sélectionner un technicien</option>
                                                {technicians.map(tech => (
                                                    <option key={tech.id} value={tech.id}>
                                                        {tech.first_name} {tech.last_name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {event ? 'Enregistrer' : 'Créer'}
                    </Button>
                </Modal.Footer>
            </Modal>
            <ManageEquipmentModal 
                show={showEquipmentModal}
                onHide={() => setShowEquipmentModal(false)}
                onEquipmentChange={loadEquipment}
            />
        </>
    );
};

export default EditEventModal;