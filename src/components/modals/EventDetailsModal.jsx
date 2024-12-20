import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Form } from 'react-bootstrap';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchInstallationData } from '../../utils/apiUtils';
import '../../styles/Modal.css';
import VacationActionModal from './VacationActionModal';
import WorksheetModal from './WorksheetModal';

const EventDetailsModal = ({ show, onHide, event, onEdit, onDelete }) => {
    const [showVacationModal, setShowVacationModal] = useState(false);
    const [vacationModalMode, setVacationModalMode] = useState('edit');
    const [showWorksheet, setShowWorksheet] = useState(false);
    const [employees, setEmployees] = useState([]);
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
        client_number: '',
        quote_number: '',
        representative: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        if (show) {
            fetchEmployees();
        }
    }, [show]);

    useEffect(() => {
        if (event) {
            setFormData({
                type: event.type || '',
                date: event.date || '',
                installation_time: event.installation_time || '',
                full_name: event.full_name || '',
                phone: event.phone || '',
                address: event.address || '',
                city: event.city || '',
                Sommaire: event.Sommaire || event.sommaire || '',
                Description: event.Description || event.description || '',
                installation_number: event.installation_number || '',
                equipment: event.equipment || '',
                amount: event.amount || '',
                technician1_id: event.technician1_id || '',
                technician2_id: event.technician2_id || '',
                technician3_id: event.technician3_id || '',
                technician4_id: event.technician4_id || '',
                client_number: event.client_number || '',
                quote_number: event.quote_number || '',
                representative: event.representative || ''
            });
        }
    }, [event]);

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/employees');
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des employés:', error);
        }
    };

    const handleFetchData = async () => {
        setIsLoading(true);
        setFetchError('');
        
        try {
            const installationNumber = formData.installation_number;
            if (!installationNumber) {
                throw new Error('Veuillez entrer un numéro d\'installation valide');
            }

            const progressionData = await fetchInstallationData(installationNumber);

            setFormData(prev => ({
                ...prev,
                full_name: progressionData.customer.name,
                phone: progressionData.customer.phoneNumber,
                address: progressionData.customer.address.street,
                city: progressionData.customer.address.city,
                Sommaire: progressionData.task.title,
                Description: progressionData.task.description,
                amount: progressionData.task.priceWithTaxes,
                progression_task_id: progressionData.task.id
            }));
        } catch (error) {
            console.error('Erreur Fetch:', error);
            setFetchError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!event) {
        return null;
    }

    const getEventTypeLabel = (type) => {
        switch (type) {
            case 'installation':
                return 'Installation';
            case 'conge':
                return 'Congé';
            case 'maladie':
                return 'Maladie';
            case 'formation':
                return 'Formation';
            case 'vacances':
                return 'Vacances';
            default:
                return type;
        }
    };

    const handleVacationAction = (data) => {
        if (data.mode === 'edit') {
            onEdit({ ...event, updateMode: 'group', startDate: data.startDate, endDate: data.endDate });
        } else {
            onDelete({ ...event, deleteMode: 'group' });
        }
        setShowVacationModal(false);
    };

    const handleOpenWorksheet = () => {
        setShowWorksheet(true);
    };

    const handleCloseWorksheet = () => {
        setShowWorksheet(false);
    };

    const handleEdit = () => {
        const normalizedEvent = {
            ...event,
            type: event.type.toLowerCase(),
            date: event.date,
            installation_time: event.installation_time || '08:00:00',
            technician1_id: event.technician1_id || '',
            technician2_id: event.technician2_id || '',
            technician3_id: event.technician3_id || '',
            technician4_id: event.technician4_id || '',
            technician1_name: event.technician1_name || '',
            technician2_name: event.technician2_name || '',
            technician3_name: event.technician3_name || '',
            technician4_name: event.technician4_name || '',
            full_name: event.full_name || '',
            phone: event.phone || '',
            address: event.address || '',
            city: event.city || '',
            equipment: event.equipment || '',
            amount: event.amount || '',
            quote_number: event.quote_number || '',
            installation_number: event.installation_number || '',
            client_number: event.client_number || '',
            representative: event.representative || '',
            Sommaire: event.Sommaire || '',
            Description: event.Description || ''
        };
        console.log('Événement normalisé pour édition:', normalizedEvent);
        onEdit(normalizedEvent);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSave = async () => {
        try {
            const updatedEvent = {
                ...event,
                type: formData.type,
                date: formData.date,
                installation_time: formData.installation_time,
                full_name: formData.full_name,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                equipment: formData.equipment,
                amount: formData.amount,
                technician1_id: formData.technician1_id,
                technician2_id: formData.technician2_id,
                technician3_id: formData.technician3_id,
                technician4_id: formData.technician4_id,
                employee_id: formData.employee_id,
                progression_task_id: formData.progression_task_id
            };
            onEdit(updatedEvent);
            onHide();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    };

    const normalizedType = {
        'conge': 'Congé',
        'congé': 'Congé',
        'maladie': 'Maladie',
        'formation': 'Formation',
        'vacances': 'Vacances',
        'installation': 'Installation'
    }[event.type.toLowerCase()] || event.type;

    const technicians = [
        event.technician1_name,
        event.technician2_name,
        event.technician3_name,
        event.technician4_name
    ].filter(Boolean);

    const renderEventDetails = () => {
        return (
            <Form>
                <Form.Group className="mb-2">
                    <Form.Label>Type d'événement</Form.Label>
                    <Form.Control plaintext readOnly value={normalizedType} />
                </Form.Group>

                {event.type.toLowerCase() === 'installation' && (
                    <>
                        <Row className="mb-2">
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control 
                                        plaintext 
                                        readOnly 
                                        value={formData.date ? format(new Date(formData.date + 'T00:00:00'), 'yyyy-MM-dd', { locale: fr }) : ''}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Heure</Form.Label>
                                    <Form.Control 
                                        plaintext 
                                        readOnly 
                                        value={event.installation_time ? event.installation_time.slice(0, 5) : ''}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Équipement</Form.Label>
                                    <Form.Control 
                                        plaintext 
                                        readOnly 
                                        value={event.equipment || ''}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-2">
                            <Col>
                                <Form.Group>
                                    <Form.Label>Numéro d'installation</Form.Label>
                                    <Form.Control 
                                        plaintext 
                                        readOnly 
                                        value={event.installation_number || ''}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="client-section">
                            <Row className="mb-2">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Nom complet</Form.Label>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={event.full_name || ''}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Téléphone</Form.Label>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={event.phone || ''}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="mb-2">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Adresse</Form.Label>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={event.address || ''}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Ville</Form.Label>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={event.city || ''}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-2">
                                <Form.Label>Sommaire</Form.Label>
                                <Form.Control 
                                    plaintext 
                                    readOnly 
                                    value={event.Sommaire || ''}
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    plaintext
                                    readOnly
                                    value={event.Description || ''}
                                    style={{ maxHeight: '100px', overflowY: 'auto' }}
                                />
                            </Form.Group>

                            <Row className="mb-2">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Numéro de soumission</Form.Label>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={event.quote_number || ''}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Montant à percevoir</Form.Label>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={event.amount || ''}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        <Row className="mb-2">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Technicien 1</Form.Label>
                                    <Form.Control 
                                        plaintext 
                                        readOnly 
                                        value={event.technician1_name || ''}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Technicien 2</Form.Label>
                                    <Form.Control 
                                        plaintext 
                                        readOnly 
                                        value={event.technician2_name || ''}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label>Technicien 3</Form.Label>
                                    <Form.Control 
                                        plaintext 
                                        readOnly 
                                        value={event.technician3_name || ''}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label>Technicien 4</Form.Label>
                                    <Form.Control 
                                        plaintext 
                                        readOnly 
                                        value={event.technician4_name || ''}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </>
                )}

                {/* Pour les autres types d'événements */}
                {event.type.toLowerCase() !== 'installation' && (
                    <Row className="mb-2">
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Date</Form.Label>
                                <Form.Control 
                                    plaintext 
                                    readOnly 
                                    value={formData.date ? format(new Date(formData.date + 'T00:00:00'), 'yyyy-MM-dd', { locale: fr }) : ''}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Heure</Form.Label>
                                <Form.Control 
                                    plaintext 
                                    readOnly 
                                    value={event.installation_time ? event.installation_time.slice(0, 5) : ''}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Équipement</Form.Label>
                                <Form.Control 
                                    plaintext 
                                    readOnly 
                                    value={event.equipment || ''}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                )}
            </Form>
        );
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Détails de l'événement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {renderEventDetails()}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={() => onEdit(event)}>
                        Modifier
                    </Button>
                    <Button variant="danger" onClick={() => onDelete(event)}>
                        Supprimer
                    </Button>
                </Modal.Footer>
            </Modal>

            {showVacationModal && (
                <VacationActionModal
                    show={showVacationModal}
                    onHide={() => setShowVacationModal(false)}
                    onConfirm={handleVacationAction}
                    event={event}
                    mode={vacationModalMode}
                />
            )}

            {showWorksheet && (
                <WorksheetModal
                    show={showWorksheet}
                    onHide={handleCloseWorksheet}
                    installation={event}
                    employees={employees}
                    mode="installation"
                />
            )}
        </>
    );
};

export default EventDetailsModal;