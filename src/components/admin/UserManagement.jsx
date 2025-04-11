import React, { useState, useEffect } from 'react';
import { Table, Button, Alert, Modal } from 'react-bootstrap';
import EditUserModal from './modals/EditUserModal';
import AddUserModal from './modals/AddUserModal';
import { deleteUser as apiDeleteUser } from '../../utils/apiUtils';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchUsers = async () => {
        try {
            console.log('[UserManagement] Tentative de fetch vers /api/admin/users.php...');
            const response = await fetch('/api/admin/users.php', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('Réponse API:', data);

            if (data.success) {
                setUsers(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditClick = (user) => {
        console.log('Ouverture modale édition pour:', user);
        setEditingUser(user);
        setShowEditModal(true);
    };

    const handleEditSave = () => {
        console.log('Fermeture modale et rechargement utilisateurs...');
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
    };

    const handleEditClose = () => {
        setShowEditModal(false);
        setEditingUser(null);
    };

    const handleAddClick = () => {
        setShowAddModal(true);
    };

    const handleAddSave = () => {
        setShowAddModal(false);
        fetchUsers();
    };

    const handleAddClose = () => {
        setShowAddModal(false);
    };

    const handleDeleteClick = async (userToDelete) => {
        if (!userToDelete || !userToDelete.id) {
            console.error('handleDeleteClick: ID utilisateur manquant');
            return;
        }

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userToDelete.email} (ID: ${userToDelete.id}) ? Cette action est irréversible.`)) {
            console.log(`Tentative de suppression de l'utilisateur ID: ${userToDelete.id}`);
            try {
                const result = await apiDeleteUser(userToDelete.id);
                console.log('Résultat apiDeleteUser:', result);
                
                if (result.success) {
                    alert('Utilisateur supprimé avec succès.');
                    fetchUsers();
                } else {
                    throw new Error(result.message || 'La suppression a échoué côté API.');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                setError(error.message || 'Une erreur technique est survenue lors de la suppression.');
            }
        }
    };

    return (
        <div className="container mt-4">
            <h2>Gestion des utilisateurs</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Button variant="success" className="mb-3" onClick={handleAddClick}>
                Ajouter un utilisateur
            </Button>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Date de création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.status}</td>
                            <td>{new Date(user.created_at).toLocaleString()}</td>
                            <td>
                                <Button variant="primary" size="sm" className="me-2" onClick={() => handleEditClick(user)}>
                                    Modifier
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteClick(user)}>
                                    Supprimer
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {editingUser && (
                <EditUserModal 
                    show={showEditModal} 
                    user={editingUser} 
                    onHide={handleEditClose} 
                    onSave={handleEditSave}
                />
            )}

            <AddUserModal 
                show={showAddModal}
                onHide={handleAddClose}
                onSave={handleAddSave}
            />
        </div>
    );
};

export default UserManagement;
