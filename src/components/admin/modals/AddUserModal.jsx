import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

// Importer la fonction API createUser avec le bon chemin
import { createUser } from '../../../utils/apiUtils';

const AddUserModal = ({ show, onHide, onSave }) => {
    const initialFormData = {
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user', // Rôle par défaut
        status: 'approved' // Statut par défaut ? ou 'pending'?
    };
    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (formData.password.length < 6) { 
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        setLoading(true);
        console.log('Données envoyées pour ajout:', formData);

        try {
            // Exclure confirmPassword avant d'envoyer à l'API
            const { confirmPassword, ...userData } = formData;
            // Appeler la vraie fonction API
            const result = await createUser(userData);
            console.log('Résultat createUser:', result);
            // La fonction createUser lèvera une erreur si (!result.success)
            onSave(); // Ferme modale et recharge liste si succès

        } catch (err) {
            console.error('Erreur handleSubmit AddUserModal:', err);
            // Afficher l'erreur retournée par l'API ou une erreur générique
            setError(err.message || 'Une erreur est survenue lors de l\'ajout.');
        } finally {
            setLoading(false);
        }
    };

    // Réinitialiser le formulaire à la fermeture
    const handleExited = () => {
        setFormData(initialFormData);
        setError('');
        setLoading(false);
    };

    const roles = ['admin', 'manager', 'user'];
    const statuses = ['pending', 'verified', 'approved', 'blocked'];

    return (
        <Modal show={show} onHide={onHide} onExited={handleExited}>
            <Modal.Header closeButton>
                <Modal.Title>Ajouter un utilisateur</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form.Group className="mb-3" controlId="addUserEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="addUserPassword">
                        <Form.Label>Mot de passe</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    
                    <Form.Group className="mb-3" controlId="addUserConfirmPassword">
                        <Form.Label>Confirmer le mot de passe</Form.Label>
                        <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="addUserRole">
                        <Form.Label>Rôle</Form.Label>
                        <Form.Select 
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="addUserStatus">
                        <Form.Label>Statut</Form.Label>
                        <Form.Select 
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                        >
                             {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                    </Form.Group>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>
                        Annuler
                    </Button>
                    <Button variant="success" type="submit" disabled={loading}>
                        {loading ? 'Ajout...' : 'Ajouter'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AddUserModal; 