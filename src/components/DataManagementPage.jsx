import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Table, Modal, Spinner, Alert } from 'react-bootstrap';
import { fetchEmployees, fetchTechnicians, fetchEquipment } from '../utils/apiUtils';
import { API_BASE_URL } from '../config/config';
import '../styles/DataManagementPage.css';

const DataManagementPage = () => {
    const [selectedTable, setSelectedTable] = useState('equipment');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    // Charger les données selon la table sélectionnée
    useEffect(() => {
        loadData();
    }, [selectedTable]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        
        try {
            let response;
            switch (selectedTable) {
                case 'equipment':
                    response = await fetchEquipment();
                    break;
                case 'technicians':
                    response = await fetchTechnicians();
                    break;
                case 'employees':
                    response = await fetchEmployees();
                    break;
                default:
                    response = { success: false, data: [] };
            }

            if (response.success) {
                setData(response.data || []);
            } else {
                setData([]);
                setError('Erreur lors du chargement des données');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des données');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (e) => {
        setSelectedTable(e.target.value);
        setError('');
    };

    const handleAdd = () => {
        setModalMode('add');
        setEditingItem(null);
        setFormData({});
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setModalMode('edit');
        setEditingItem(item);
        setFormData({ ...item });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
            return;
        }

        try {
            const endpoint = getEndpoint();
            const response = await fetch(`${API_BASE_URL}/${endpoint}?id=${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                await loadData();
                setError('');
            } else {
                setError(data.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors de la suppression');
        }
    };

    const handleSave = async () => {
        try {
            const endpoint = getEndpoint();
            const method = modalMode === 'add' ? 'POST' : 'PUT';
            const url = modalMode === 'add' 
                ? `${API_BASE_URL}/${endpoint}`
                : `${API_BASE_URL}/${endpoint}?id=${editingItem.id}`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                await loadData();
                setShowModal(false);
                setError('');
            } else {
                setError(data.message || 'Erreur lors de la sauvegarde');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors de la sauvegarde');
        }
    };

    const getEndpoint = () => {
        switch (selectedTable) {
            case 'equipment':
                return 'equipment.php';
            case 'technicians':
                return 'technicians.php';
            case 'employees':
                return 'employees.php';
            default:
                return '';
        }
    };

    const getTableColumns = () => {
        switch (selectedTable) {
            case 'equipment':
                return ['ID', 'Nom', 'Actif'];
            case 'technicians':
                return ['ID', 'Nom', 'Email', 'Téléphone', 'Actif'];
            case 'employees':
                return ['ID', 'Nom', 'Email', 'Téléphone', 'Type', 'Actif'];
            default:
                return [];
        }
    };

    const renderTableRow = (item) => {
        switch (selectedTable) {
            case 'equipment':
                return (
                    <>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.active ? 'Oui' : 'Non'}</td>
                    </>
                );
            case 'technicians':
                return (
                    <>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.email || '-'}</td>
                        <td>{item.phone || '-'}</td>
                        <td>{item.active ? 'Oui' : 'Non'}</td>
                    </>
                );
            case 'employees':
                return (
                    <>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.email || '-'}</td>
                        <td>{item.phone || '-'}</td>
                        <td>{item.type || 'employee'}</td>
                        <td>{item.active ? 'Oui' : 'Non'}</td>
                    </>
                );
            default:
                return null;
        }
    };

    const renderFormFields = () => {
        switch (selectedTable) {
            case 'equipment':
                return (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>Nom</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Form.Group>
                    </>
                );
            case 'technicians':
            case 'employees':
                return (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>Nom</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Téléphone</Form.Label>
                            <Form.Control
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </Form.Group>
                        {selectedTable === 'employees' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Type</Form.Label>
                                <Form.Select
                                    value={formData.type || 'employee'}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="employee">Employé</option>
                                    <option value="technician">Technicien</option>
                                    <option value="admin">Admin</option>
                                </Form.Select>
                            </Form.Group>
                        )}
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Container fluid className="data-management-page">
            <Row className="mb-4">
                <Col>
                    <h1>Gestion des données</h1>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Sélectionner une table</Form.Label>
                        <Form.Select value={selectedTable} onChange={handleTableChange}>
                            <option value="equipment">Équipements</option>
                            <option value="technicians">Techniciens</option>
                            <option value="employees">Employés</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={6} className="text-end">
                    <Button variant="success" onClick={handleAdd}>
                        <i className="fas fa-plus"></i> Ajouter
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                </div>
            ) : (
                <Row>
                    <Col>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    {getTableColumns().map((col, index) => (
                                        <th key={index}>{col}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id}>
                                        {renderTableRow(item)}
                                        <td>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            )}

            {/* Modal pour ajouter/modifier */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === 'add' ? 'Ajouter' : 'Modifier'} - {
                            selectedTable === 'equipment' ? 'Équipement' :
                            selectedTable === 'technicians' ? 'Technicien' : 'Employé'
                        }
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {renderFormFields()}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Sauvegarder
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default DataManagementPage;
