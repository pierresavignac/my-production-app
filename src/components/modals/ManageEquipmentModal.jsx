import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';

const ManageEquipmentModal = ({ show, onHide, onEquipmentChange }) => {
    const [newEquipment, setNewEquipment] = useState('');
    const [equipment, setEquipment] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            fetchEquipment();
        }
    }, [show]);

    const fetchEquipment = async () => {
        try {
            const response = await fetch('/api/equipment.php');
            const data = await response.json();
            setEquipment(data);
        } catch (error) {
            console.error('Erreur lors de la récupération des équipements:', error);
            setError('Erreur lors de la récupération des équipements');
        }
    };

    const handleAddEquipment = async () => {
        if (!newEquipment.trim()) {
            setError('Veuillez entrer un nom d\'équipement');
            return;
        }

        try {
            const response = await fetch('/api/equipment.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newEquipment }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'ajout de l\'équipement');
            }

            await fetchEquipment();
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
            const response = await fetch(`/api/equipment.php?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de l\'équipement');
            }

            await fetchEquipment();
            if (onEquipmentChange) {
                onEquipmentChange();
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors de la suppression de l\'équipement');
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
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

                <ListGroup>
                    {equipment.map((item) => (
                        <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                            {item.name}
                            <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDeleteEquipment(item.id)}
                            >
                                Supprimer
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Fermer</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ManageEquipmentModal;
