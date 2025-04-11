import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Form, Alert } from 'react-bootstrap';
import '../../styles/Modal.css';
import VacationActionModal from './VacationActionModal';
import WorksheetModal from './WorksheetModal';
import { 
    fetchProgressionTask, 
    fetchRegions, 
    fetchTechnicians, 
    fetchCitiesForRegion, 
    fetchEquipment, 
    fetchInstallationData 
} from '../../utils/apiUtils';

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
        summary: '',
        description: '',
        installation_number: '',
        equipment: '',
        amount: '',
        technician1_id: '',
        technician2_id: '',
        technician3_id: '',
        technician4_id: '',
        employee_id: '',
        progression_task_id: ''
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
                summary: event.summary || '',
                description: event.description || '',
                installation_number: event.installation_number || '',
                equipment: event.equipment || '',
                amount: event.amount || '',
                technician1_id: event.technician1_id || '',
                technician2_id: event.technician2_id || '',
                technician3_id: event.technician3_id || '',
                technician4_id: event.technician4_id || '',
                employee_id: event.employee_id || '',
                progression_task_id: event.progression_task_id || ''
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
                summary: progressionData.task.title,
                description: progressionData.task.description,
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
        onEdit({ ...event, mode: 'edit' });
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

    const renderEventDetails = () => {
        if (!event.type) return null;

        switch (event.type) {
            case 'installation':
                return (
                    <div className="details-grid">
                        <div className="detail-row">
                            <div className="detail-item">
                                <label>Type :</label>
                                <span>{getEventTypeLabel(event.type)}</span>
                            </div>
                            <div className="detail-item small-width">
                                <label>Date :</label>
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-item small-width">
                                <label>Heure :</label>
                                <span>{event.installation_time}</span>
                            </div>
                            <div className="detail-item">
                                <label>Statut :</label>
                                <span>{event.status || event.installation_status || 'En approbation'}</span>
                            </div>
                        </div>

                        <div className="imported-data-container">
                            <div className="imported-data-header">
                                <h5>Informations ProgressionLive</h5>
                                <span className="imported-data-badge">#{event.installation_number}</span>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <label>Nom complet :</label>
                                    <span>{event.full_name}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Téléphone :</label>
                                    <span>{event.phone}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <label>Adresse :</label>
                                    <span>{event.address}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Ville :</label>
                                    <span>{event.city}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <label>Équipement :</label>
                                    <span>{event.equipment}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Montant :</label>
                                    <span>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(event.amount)}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <label>Numéro de soumission :</label>
                                    <span>{event.quote_number || '-'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Représentant :</label>
                                    <span>{event.sales_rep || '-'}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item">
                                    <label>Sommaire :</label>
                                    <span>{event.Sommaire || '-'}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-item full-width">
                                    <label>Description :</label>
                                    <span>{event.Description || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-item">
                                <label>Technicien 1</label>
                                <span>{event.technician1_name || '-'}</span>
                            </div>
                            <div className="detail-item">
                                <label>Technicien 2 :</label>
                                <span>{event.technician2_name || '-'}</span>
                            </div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-item">
                                <label>Technicien 3 :</label>
                                <span>{event.technician3_name || '-'}</span>
                            </div>
                            <div className="detail-item">
                                <label>Technicien 4 :</label>
                                <span>{event.technician4_name || '-'}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'formation':
            case 'maladie':
            case 'conge':
                return (
                    <div className="details-grid">
                        <div className="detail-item">
                            <label>Type :</label>
                            <span>{getEventTypeLabel(event.type)}</span>
                        </div>
                        <div className="detail-item">
                            <label>Date :</label>
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                            <label>Commercial :</label>
                            <span>{event.employee_name}</span>
                        </div>
                    </div>
                );
            case 'vacances':
                return (
                    <div className="details-grid">
                        <div className="detail-item">
                            <label>Type :</label>
                            <span>{getEventTypeLabel(event.type)}</span>
                        </div>
                        <div className="detail-item">
                            <label>Date :</label>
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                            <label>Commercial :</label>
                            <span>{event.employee_name}</span>
                        </div>
                        {event.vacation_group_id && (
                            <>
                                <div className="detail-item">
                                    <label>Période de vacances :</label>
                                    <span>
                                        Du {new Date(event.vacation_group_start_date).toLocaleDateString()} au {new Date(event.vacation_group_end_date).toLocaleDateString()}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Modal 
                show={show} 
                onHide={onHide} 
                centered 
                dialogClassName="custom-modal-wide"
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Détails de l'événement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-2">
                            <Form.Control
                                type="text"
                                value={getEventTypeLabel(event.type)}
                                disabled
                            />
                        </Form.Group>

                        <div className="row mb-2">
                            <div className="col-2">
                                <Form.Group>
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={new Date(event.date).toLocaleDateString()}
                                        disabled 
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-2">
                                <Form.Group>
                                    <Form.Label>Heure</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={event.installation_time}
                                        disabled 
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-5">
                                <Form.Group>
                                    <Form.Label>Équipement</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={event.equipment}
                                        disabled 
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-3">
                                <Form.Group>
                                    <Form.Label>Statut</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={event.status || event.installation_status || 'En approbation'}
                                        disabled 
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
                                        value={event.installation_number}
                                        disabled 
                                    />
                                </div>
                                <div className="col-3 text-center">
                                    <Button 
                                        variant="secondary" 
                                        onClick={handleEdit}
                                    >
                                        Modifier
                                    </Button>
                                </div>
                                <div className="col-6">
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Soumission" 
                                        value={event.quote_number}
                                        disabled 
                                    />
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-9">
                                    <Form.Group>
                                        <Form.Label>Nom complet</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={event.full_name}
                                            disabled 
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-3">
                                    <Form.Group>
                                        <Form.Label>Téléphone</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={event.phone}
                                            disabled 
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
                                            value={event.address}
                                            disabled 
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-4">
                                    <Form.Group>
                                        <Form.Label>Ville</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={event.city}
                                            disabled 
                                        />
                                    </Form.Group>
                                </div>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Sommaire</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={event.Sommaire}
                                    disabled 
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={4} 
                                    className="description-scroll" 
                                    value={event.Description}
                                    disabled 
                                />
                            </Form.Group>

                            <div className="row mb-2">
                                <div className="col-9">
                                    <Form.Group>
                                        <Form.Label>Représentant</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={event.representative}
                                            disabled 
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-3">
                                    <Form.Group>
                                        <Form.Label>Montant à percevoir</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={event.amount}
                                            disabled 
                                        />
                                    </Form.Group>
                                </div>
                            </div>
                        </div>

                        <div className="row mb-2">
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label>Technicien 1</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={event.technician1_name}
                                        disabled 
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label>Technicien 2</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={event.technician2_name}
                                        disabled 
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="row mb-2">
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label>Technicien 3</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={event.technician3_name}
                                        disabled 
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label>Technicien 4</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={event.technician4_name}
                                        disabled 
                                    />
                                </Form.Group>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Fermer</Button>
                    <Button variant="primary" onClick={handleEdit}>Modifier</Button>
                    <Button variant="danger" onClick={() => onDelete(event)}>Supprimer</Button>
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