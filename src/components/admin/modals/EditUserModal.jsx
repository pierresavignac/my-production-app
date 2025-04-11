import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

// Importer la fonction API updateUser avec le chemin corrigé
import { updateUser } from '../../../utils/apiUtils'; // Chemin corrigé (3 niveaux)

const EditUserModal = ({ show, onHide, onSave, user }) => {
    const [formData, setFormData] = useState({ email: '', role: 'user', status: 'pending' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Pré-remplir le formulaire quand l'utilisateur change
    useEffect(() => {
        if (user) {
            setFormData({
                id: user.id,
                email: user.email || '',
                role: user.role || 'user',
                status: user.status || 'pending'
                // Ne pas inclure le mot de passe ici
            });
            setError(''); // Réinitialiser l'erreur
        } else {
            // Réinitialiser si pas d'utilisateur (sécurité)
            setFormData({ email: '', role: 'user', status: 'pending' });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.log('Données envoyées pour mise à jour:', formData);

        try {
            // Remplacer la simulation par l'appel API réel
            const result = await updateUser(formData);
            console.log('Résultat updateUser:', result);
            // La fonction updateUser lèvera une erreur si (!result.success)
            onSave(); // Appelle handleEditSave dans UserManagement si succès
            
            // Retrait de la simulation 
            // await new Promise(resolve => setTimeout(resolve, 500)); 
            // console.warn('API updateUser non implémentée - Sauvegarde simulée');
            // onSave(); 

        } catch (err) {
            // Afficher l'erreur retournée par l'API ou l'erreur de fetch
            console.error('Erreur handleSubmit EditUserModal:', err);
            setError(err.message || 'Une erreur est survenue lors de la sauvegarde.');
        } finally {
            // Assurer que le loading est désactivé même en cas d'erreur
            setLoading(false);
        }
        // setLoading(false); // Déplacé dans finally
    };

    // Options pour les selects
    const roles = ['admin', 'manager', 'user'];
    const statuses = ['pending', 'verified', 'approved', 'blocked'];

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Modifier Utilisateur (ID: {user?.id})</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form.Group className="mb-3" controlId="editUserEmail">
                        <Form.Label>Email</Form.Label>
                        {/* Email non modifiable pour l'instant ? Ou modifiable ? */}
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            readOnly // Rendre modifiable si nécessaire
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="editUserRole">
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

                    <Form.Group className="mb-3" controlId="editUserStatus">
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
                    
                    {/* Ajouter un champ pour réinitialiser le mot de passe si nécessaire */}

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>
                        Annuler
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default EditUserModal; 