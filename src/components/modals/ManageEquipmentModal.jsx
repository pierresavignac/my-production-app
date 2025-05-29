import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';
import { fetchEquipment as apiFetchEquipment } from '../../utils/apiUtils';
import { API_BASE_URL } from '../../config/config';

const ManageEquipmentModal = ({ show, onHide, onEquipmentChange }) => {
    const [newEquipment, setNewEquipment] = useState('');
    const [equipment, setEquipment] = useState([]);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (show) {
            loadEquipment();
        }
    }, [show]);

    const loadEquipment = async () => {
        try {
            const response = await apiFetchEquipment();
            console.log('Réponse équipements:', response);
            if (response.success && Array.isArray(response.data)) {
                setEquipment(response.data);
            } else {
                setEquipment([]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des équipements:', error);
            setError('Erreur lors de la récupération des équipements');
            setEquipment([]);
        }
    };

    const handleAddEquipment = async () => {
        if (!newEquipment.trim()) {
            setError('Veuillez entrer un nom d\'équipement');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/equipment.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newEquipment }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Erreur lors de l\'ajout de l\'équipement');
            }

            await loadEquipment();
            setNewEquipment('');
            setError('');
            if (onEquipmentChange) {
                onEquipmentChange();
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors de l\'ajout de l\'équipement');
        }
    };

    const handleDeleteEquipment = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/equipment.php?id=${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de l\'équipement');
            }

            await loadEquipment();
            if (onEquipmentChange) {
                onEquipmentChange();
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors de la suppression de l\'équipement');
        }
    };

    const handleStartEdit = (item) => {
        setEditingId(item.id);
        setEditingName(item.name);
    };

    const handleSaveEdit = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/equipment.php?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: editingName }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la modification de l\'équipement');
            }

            await loadEquipment();
            setEditingId(null);
            setEditingName('');
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors de la modification de l\'équipement');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide}
            size="lg"
            dialogClassName="equipment-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>Gérer les équipements</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger">{error}</div>}
                
                <Form className="mb-3">
                    <Form.Group className="d-flex">
                        <Form.Control
                            type="text"
                            value={newEquipment}
                            onChange={(e) => setNewEquipment(e.target.value)}
                            placeholder="Nouvel équipement"
                            className="me-2"
                        />
                        <Button onClick={handleAddEquipment}>Ajouter</Button>
                    </Form.Group>
                </Form>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <ListGroup>
                        {Array.isArray(equipment) && equipment.map((item) => (
                            <ListGroup.Item key={item.id} className="py-1 d-flex justify-content-between align-items-center">
                                {editingId === item.id ? (
                                    <Form.Control
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        size="sm"
                                        className="me-2"
                                        style={{ width: '200px' }}
                                    />
                                ) : (
                                    <span>{item.name}</span>
                                )}
                                <div>
                                    {editingId === item.id ? (
                                        <>
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleSaveEdit(item.id)}
                                                className="me-1"
                                            >
                                                ✓
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleCancelEdit}
                                            >
                                                ✕
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleStartEdit(item)}
                                                className="me-1"
                                            >
                                                ✎
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteEquipment(item.id)}
                                            >
                                                🗑
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Fermer</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ManageEquipmentModal;
