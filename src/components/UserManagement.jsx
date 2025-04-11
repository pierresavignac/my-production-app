import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/UserManagement.css';

const UserManagement = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });
  const { user: currentUser } = useAuth();
  const API_URL = 'https://app.vivreenliberte.org/api';

  // Configuration axios avec le token
  const getAxiosConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users.php`, getAxiosConfig());
      console.log('Réponse users:', response.data); // Debug
      if (response.data.users) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Erreur complète:', error); // Debug
      setError('Erreur lors de la récupération des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/users.php`, {
        action: 'create',
        ...newUser
      }, getAxiosConfig());
      setNewUser({ email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      console.error('Erreur création:', error); // Debug
      setError('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await axios.post(`${API_URL}/users.php`, {
          action: 'delete',
          id: userId
        }, getAxiosConfig());
        fetchUsers();
      } catch (error) {
        console.error('Erreur suppression:', error); // Debug
        setError('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.post(`${API_URL}/users.php`, {
        action: 'update',
        id: userId,
        role: newRole
      }, getAxiosConfig());
      fetchUsers();
    } catch (error) {
      console.error('Erreur mise à jour:', error); // Debug
      setError('Erreur lors de la mise à jour du rôle');
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return <div className="error-message">Accès non autorisé</div>;
  }

  return (
    <div className="user-management-modal">
      <div className="user-management-content">
        <div className="user-management-header">
          <h2>Gestion des utilisateurs</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="add-user-form" onSubmit={handleAddUser}>
          <h3>Ajouter un utilisateur</h3>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
              <option value="manager">Gestionnaire</option>
            </select>
            <button type="submit">Ajouter</button>
          </div>
        </form>

        <div className="users-list">
          <h3>Liste des utilisateurs</h3>
          {loading ? (
            <div className="loading">Chargement...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Date de création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        disabled={user.id === currentUser.id}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                        <option value="manager">Gestionnaire</option>
                      </select>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      {user.id !== currentUser.id && (
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
