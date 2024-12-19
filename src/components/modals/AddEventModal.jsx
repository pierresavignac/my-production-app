import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    Button, 
    Form, 
    Row, 
    Col, 
    Alert 
} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
    fetchRegions, 
    fetchTechnicians, 
    fetchCitiesForRegion, 
    fetchEquipment, 
    fetchInstallationData 
} from '../../utils/apiUtils';
import ManageEquipmentModal from './ManageEquipmentModal';

const AddEventModal = ({ show, onHide, onSubmit, event = null, mode = 'add', employees = [], selectedDate = null }) => {
    // Utiliser la date sélectionnée si elle existe, sinon utiliser la date du jour
    const initialDate = selectedDate ? new Date(selectedDate) : new Date();

    const [formData, setFormData] = useState({
        type: '',  
        date: initialDate,
        installation_time: '08:00:00',
        technician1_id: '',
        technician2_id: '',
        technician3_id: '',
        technician4_id: '',
        equipment: '',
        full_name: '',
        phone: '',
        address: '',
        city: '',
        installation_number: '',
        amount: '',
        quote_number: '',
        Sommaire: '',
        Description: ''
    });

    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFetchingInstallation, setIsFetchingInstallation] = useState(false);
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);

    const eventTypes = [
        { value: 'installation', label: 'Installation' },
        { value: 'conge', label: 'Congé' },
        { value: 'maladie', label: 'Maladie' },
        { value: 'formation', label: 'Formation' },
        { value: 'vacances', label: 'Vacances' }
    ];

    useEffect(() => {
        if (show) {
            const loadInitialData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    // Charger les techniciens
                    const techData = await fetchTechnicians();
                    setTechnicians(techData);
                    
                    // Charger les autres données
                    await loadRegions();
                    await loadEquipment();
                } catch (err) {
                    console.error('Erreur de chargement:', err);
                    setError('Erreur lors du chargement des données');
                } finally {
                    setIsLoading(false);
                }
            };
            
            loadInitialData();
        }
    }, [show]);

    const loadRegions = async () => {
        try {
            const regionData = await fetchRegions();
            setRegions(regionData);
        } catch (err) {
            console.error('Erreur lors du chargement des régions:', err);
        }
    };

    const loadEquipment = async () => {
        try {
            const equipmentData = await fetchEquipment();
            setEquipment(equipmentData);
        } catch (err) {
            console.error('Erreur lors du chargement des équipements:', err);
        }
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
                setFormData(prevData => ({
                    ...prevData,
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await onSubmit(formData);
            onHide();
        } catch (err) {
            console.error('Erreur lors de la soumission:', err);
            setError('Erreur lors de la sauvegarde de l\'événement');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{mode === 'add' ? 'Ajouter un événement' : 'Modifier l\'événement'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit} id="eventForm">
                        <Form.Group className="mb-2">
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

                        {/* Champs communs pour tous les types d'événements */}
                        {formData.type && formData.type !== 'installation' && (
                            <>
                                <Row className="mb-2">
                                    <Col md={6}>
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
                                                value={formData.installation_time.slice(0, 5)}
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
                                                    value={formData.equipment}
                                                    onChange={(e) => handleChange({
                                                        target: {
                                                            name: 'equipment',
                                                            value: e.target.value
                                                        }
                                                    })}
                                                    className="mb-1"
                                                >
                                                    <option value="">Sélectionner un équipement</option>
                                                    {equipment.map(equip => (
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
                                                    value={formData.installation_number}
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
                                                    value={formData.full_name}
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
                                                    value={formData.phone}
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
                                                    value={formData.address}
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
                                                    value={formData.city}
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
                                            value={formData.Sommaire}
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
                                            value={formData.Description}
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
                                                    value={formData.quote_number}
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
                                                    value={formData.amount}
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
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Technicien 2</Form.Label>
                                            <Form.Select
                                                value={formData.technician2_id}
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
                                                value={formData.technician3_id}
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
                                                value={formData.technician4_id}
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
                    <Button variant="primary" type="submit" form="eventForm">
                        Enregistrer
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

export default AddEventModal;