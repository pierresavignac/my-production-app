import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
    fetchTechnicians, 
    fetchEquipment,
    fetchInstallationData,
    updateEvent,
    deleteEvent
} from '../../utils/apiUtils';
import InstallationStatusSelect from '../InstallationStatusSelect';
import ManageEquipmentModal from './ManageEquipmentModal';
import WorksheetModal from './WorksheetModal';
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
        equipment: event ? event.equipment : []
    }), [event]);

    const [formData, setFormData] = useState(initialFormData);
    const [availableTechnicians, setAvailableTechnicians] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);
    const [showWorksheetModal, setShowWorksheetModal] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString;
    };

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
        }
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

    // --- Fonction pour gérer la sauvegarde depuis WorksheetModal ---
    const handleWorksheetSave = (worksheetData) => {
        console.log('WorksheetModal a sauvegardé:', worksheetData);
        // Fusionner les données de la worksheet avec le formData actuel de EditEventModal
        setFormData(prevFormData => ({
            ...prevFormData,
            ...worksheetData // Les champs de worksheetData écraseront ceux de prevFormData s'ils existent
        }));
        setShowWorksheetModal(false); // Fermer la modale Worksheet
    };
    // --- Fin de la fonction --- 

    const handleOpenWorksheetModal = () => {
        setShowWorksheetModal(true);
    };

    const handleCloseWorksheetModal = () => {
        setShowWorksheetModal(false);
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
            setLoading(true);
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
            setLoading(false);
        }
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

    return (
        <>
            <Modal 
                show={show} 
                onHide={onHide}
                size="xl"
                centered
                dialogClassName="custom-modal-wide"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Modifier l'événement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {error && <Alert variant="danger">{error}</Alert>}
                        
                        <Form.Group className="mb-2">
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
                                        value={formData.equipment || ''} 
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
                                        disabled={!formData.installation_number || loading}
                                    >
                                        {loading ? 'Chargement...' : 'Fetch'}
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
                        </div>

                        <div className="row mb-2">
                            <div className="col-6">
                                <Form.Select 
                                    value={formData.technician1_id} 
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
                                    value={formData.technician2_id} 
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
                                    value={formData.technician3_id} 
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
                                    value={formData.technician4_id} 
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
                    <Button 
                        variant="info" 
                        onClick={handleOpenWorksheetModal}
                        className="me-auto"
                    >
                        Feuille de travail
                    </Button>
                    
                    <Button variant="secondary" onClick={onHide}>Fermer</Button>
                    <Button variant="danger" onClick={() => onDelete(event)}>Supprimer</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modale pour la feuille de travail */} 
            {showWorksheetModal && (
                <WorksheetModal
                    show={showWorksheetModal}
                    onHide={handleCloseWorksheetModal}
                    eventData={formData}
                    employees={employees}
                    mode="edit"
                    handleSave={handleWorksheetSave}
                />
            )}

            <ManageEquipmentModal 
                show={showEquipmentModal}
                onHide={handleEquipmentModalClose}
                onEquipmentChange={handleEquipmentModalClose}
            />
        </>
    );
};

export default EditEventModal;