import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { fetchTechnicians, createEvent, fetchInstallationData, fetchEquipment } from '../../utils/apiUtils';
import { useNavigate } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import ManageEquipmentModal from './ManageEquipmentModal';

const AddEventModal = ({ show, onHide, onSave, selectedDate }) => {
    const [formData, setFormData] = useState({
        type: 'installation',
        date: selectedDate || '',
        installation_time: '08:00',
        full_name: '',
        phone: '',
        address: '',
        city: '',
        equipment: '',
        amount: '',
        technician1_id: '',
        technician2_id: '',
        technician3_id: '',
        technician4_id: '',
        Sommaire: '',
        Description: '',
        representative: '',
        quote_number: '',
        installation_number: ''
    });

    const [technicians, setTechnicians] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const navigate = useNavigate();
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [techData, equipData] = await Promise.all([
                    fetchTechnicians(),
                    fetchEquipment()
                ]);
                console.log('Techniciens chargés:', techData);
                console.log('Équipements chargés:', equipData);
                setTechnicians(techData || []);
                if (equipData && equipData.success) {
                    setEquipment(equipData.data || []);
                } else {
                    setEquipment([]);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                setError('Erreur lors du chargement des données');
            }
        };

        if (show) {
            setFormData({
                type: 'installation',
                date: selectedDate || '',
                installation_time: '08:00',
                full_name: '',
                phone: '',
                address: '',
                city: '',
                equipment: '',
                amount: '',
                technician1_id: '',
                technician2_id: '',
                technician3_id: '',
                technician4_id: '',
                Sommaire: '',
                Description: '',
                representative: '',
                quote_number: '',
                installation_number: ''
            });
            setError('');
            
            loadData();
        }
    }, [show, selectedDate]);

    const handleEquipmentChange = (e) => {
        const value = e.target.value;
        if (value === 'manage') {
            fetchEquipment()
                .then(data => {
                    setEquipment(data || []);
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

    const handleFetchInstallation = async () => {
        if (!formData.installation_number) {
            setError('Veuillez entrer un numéro d\'installation');
            return;
        }

        setFetchingData(true);
        setError('');

        try {
            const response = await fetchInstallationData(formData.installation_number);
            console.log('Données brutes de ProgressionLive:', response);
            
            if (response.success && response.data) {
                const data = response.data;
                setFormData(prev => ({
                    ...prev,
                    full_name: data.client_name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    equipment: data.equipment || '',
                    amount: data.amount || '',
                    Sommaire: data.Sommaire || '',
                    Description: data.Description || '',
                    quote_number: data.quote_number || '',
                    representative: data.representative || ''
                }));
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            setError('Erreur lors de la récupération des données');
        } finally {
            setFetchingData(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log('=== DÉBUT SOUMISSION ===');
            
            // Utiliser la date telle quelle car elle est déjà dans le bon format
            const submissionData = {
                ...formData
            };
            
            console.log('Date à envoyer:', submissionData.date);
            console.log('Données complètes à envoyer:', submissionData);
            
            const result = await createEvent(submissionData);
            
            console.log('=== RÉPONSE SERVEUR ===');
            console.log('Succès:', result.success);
            console.log('Message:', result.message);
            console.log('ID:', result.id);
            console.log('Données complètes:', result);
            
            if (result.success) {
                onSave();
            }
        } catch (error) {
            console.error('=== ERREUR SOUMISSION ===');
            console.error('Message:', error.message);
            console.error('Erreur complète:', error);
            setError(error.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        console.log(`Champ modifié: ${field} = ${value}`);
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const loadEquipments = async () => {
        try {
            const response = await fetchEquipment();
            console.log('Réponse équipements:', response);
            if (response && response.success && Array.isArray(response.data)) {
                setEquipment(response.data);
            } else {
                console.error('Format de données invalide:', response);
                setEquipment([]);
            }
        } catch (error) {
            console.error('Erreur chargement équipements:', error);
            setEquipment([]);
        }
    };

    const handleEquipmentUpdate = async () => {
        try {
            const equipData = await fetchEquipment();
            if (equipData && equipData.success) {
                setEquipment(equipData.data || []);
            }
        } catch (error) {
            console.error('Erreur lors du rafraîchissement des équipements:', error);
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

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter un événement</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pb-0">
                    <Form>
                        {error && <Alert variant="danger">{error}</Alert>}
                        
                        <Form.Group className="mb-2">
                            <Form.Select value={formData.type} onChange={(e) => handleChange('type', e.target.value)}>
                                <option value="installation">Installation</option>
                                <option value="conge">Congé</option>
                                <option value="maladie">Maladie</option>
                                <option value="formation">Formation</option>
                                <option value="vacances">Vacances</option>
                            </Form.Select>
                        </Form.Group>

                        <div className="row mb-2">
                            <div className="col-2">
                                <Form.Group>
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={(e) => handleChange('date', e.target.value)} 
                                        required 
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
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-5">
                                <Form.Group>
                                    <Form.Label>Équipement</Form.Label>
                                    <Form.Select 
                                        value={formData.equipment} 
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
                                    <Form.Select 
                                        value={formData.status} 
                                        onChange={(e) => handleChange('status', e.target.value)}
                                    >
                                        <option value="En approbation">En approbation</option>
                                        <option value="Approuvé">Approuvé</option>
                                        <option value="Complété">Complété</option>
                                    </Form.Select>
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
                                        onClick={handleFetchInstallation} 
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
                                        readOnly 
                                    />
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-9">
                                    <Form.Group>
                                        <Form.Label>Nom complet <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="text" value={formData.full_name} onChange={(e) => handleChange('full_name', e.target.value)} required />
                                    </Form.Group>
                                </div>
                                <div className="col-3">
                                    <Form.Group>
                                        <Form.Label>Téléphone</Form.Label>
                                        <Form.Control type="text" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                                    </Form.Group>
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-8">
                                    <Form.Group>
                                        <Form.Label>Adresse</Form.Label>
                                        <Form.Control type="text" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
                                    </Form.Group>
                                </div>
                                <div className="col-4">
                                    <Form.Group>
                                        <Form.Label>Ville</Form.Label>
                                        <Form.Control type="text" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} />
                                    </Form.Group>
                                </div>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Sommaire</Form.Label>
                                <Form.Control type="text" value={formData.Sommaire} onChange={(e) => handleChange('Sommaire', e.target.value)} />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={4} className="description-scroll" value={formData.Description} onChange={(e) => handleChange('Description', e.target.value)} />
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
                                        <Form.Control type="text" value={formData.amount} onChange={(e) => handleChange('amount', e.target.value)} />
                                    </Form.Group>
                                </div>
                            </div>
                        </div>

                        <div className="row mb-2">
                            <div className="col-6">
                                <Form.Select value={formData.technician1_id} onChange={(e) => handleChange('technician1_id', e.target.value)}>
                                    <option value="">Technicien 1</option>
                                    {technicians.map(tech => (
                                        <option key={tech.id} value={tech.id}>
                                            {tech.name.includes(' ') ? tech.name.split(' ').slice(1).join(' ') : tech.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-6">
                                <Form.Select value={formData.technician2_id} onChange={(e) => handleChange('technician2_id', e.target.value)}>
                                    <option value="">Technicien 2</option>
                                    {technicians.map(tech => (
                                        <option key={tech.id} value={tech.id}>
                                            {tech.name.includes(' ') ? tech.name.split(' ').slice(1).join(' ') : tech.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                        </div>

                        <div className="row mb-2">
                            <div className="col-6">
                                <Form.Select value={formData.technician3_id} onChange={(e) => handleChange('technician3_id', e.target.value)}>
                                    <option value="">Technicien 3</option>
                                    {technicians.map(tech => (
                                        <option key={tech.id} value={tech.id}>
                                            {tech.name.includes(' ') ? tech.name.split(' ').slice(1).join(' ') : tech.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-6">
                                <Form.Select value={formData.technician4_id} onChange={(e) => handleChange('technician4_id', e.target.value)}>
                                    <option value="">Technicien 4</option>
                                    {technicians.map(tech => (
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
                    <Button variant="secondary" onClick={onHide}>Annuler</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ManageEquipmentModal 
                show={showEquipmentModal}
                onHide={handleEquipmentModalClose}
                onEquipmentChange={handleEquipmentUpdate}
            />
        </>
    );
};

export default AddEventModal;