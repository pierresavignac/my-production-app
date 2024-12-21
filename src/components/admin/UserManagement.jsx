import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/config';

const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const Th = styled.th`
  background: #f5f5f5;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #ddd;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #ddd;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  
  &.edit {
    background: #2196f3;
    color: white;
  }
  
  &.delete {
    background: #f44336;
    color: white;
  }
  
  &.approve {
    background: #4caf50;
    color: white;
  }

  &.add {
    background: #4caf50;
    color: white;
    margin-bottom: 1rem;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const ErrorMessage = styled.div`
  color: #f44336;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #ffebee;
`;

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
    status: 'pending'
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]);
        console.error('Format de données inattendu:', data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Valider le mot de passe pour les nouveaux utilisateurs
    if (!editingUser && !formData.password) {
      setError('Le mot de passe est requis pour les nouveaux utilisateurs');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/users.php`;
      
      // S'assurer que tous les champs nécessaires sont présents
      const requestData = {
        action: editingUser ? 'update' : 'create',
        id: editingUser?.id,
        email: formData.email,
        role: formData.role || 'user',
        status: formData.status || 'pending'
      };

      // Ajouter le mot de passe si fourni ou si c'est un nouvel utilisateur
      if (formData.password || !editingUser) {
        requestData.password = formData.password;
      }

      console.log('Données envoyées:', requestData);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('Status:', response.status);
      const responseText = await response.text();
      console.log('Réponse brute:', responseText);

      if (!response.ok) {
        let errorMessage = 'Erreur lors de l\'opération';
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.log('Erreur lors du parsing de la réponse:', e);
        }
        throw new Error(errorMessage);
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        role: 'user',
        status: 'pending'
      });
      
      // Rafraîchir la liste des utilisateurs
      await fetchUsers();
    } catch (err) {
      setError(err.message);
      console.error('Erreur complète:', err);
    }
  };

  const handleEdit = (user) => {
    console.log("Édition de l'utilisateur:", user);
    setEditingUser(user);
    setFormData({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status || 'pending',
      password: '' // Le mot de passe n'est pas rempli pour des raisons de sécurité
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'delete',
          id: userId
        })
      });

      console.log('Status suppression:', response.status);
      const responseText = await response.text();
      console.log('Réponse suppression:', responseText);

      if (!response.ok) {
        let errorMessage = 'Erreur lors de la suppression';
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.log('Erreur lors du parsing de la réponse:', e);
        }
        throw new Error(errorMessage);
      }

      fetchUsers();
    } catch (err) {
      setError(err.message);
      console.error('Erreur complète:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <Container>
      <Header>
        <ButtonGroup>
          <Button onClick={() => navigate('/calendar')} className="edit">
            ← Retour au calendrier
          </Button>
        </ButtonGroup>
        <Title>Gestion des Utilisateurs</Title>
        <ButtonGroup>
          <Button 
            className="add" 
            onClick={() => {
              setEditingUser(null);
              setFormData({
                email: '',
                password: '',
                role: 'user',
                status: 'pending'
              });
              setShowModal(true);
            }}
          >
            Ajouter un utilisateur
          </Button>
        </ButtonGroup>
      </Header>

      <Table>
        <thead>
          <tr>
            <Th>Email</Th>
            <Th>Rôle</Th>
            <Th>Statut</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(users) && users.map(user => (
            <tr key={user.id}>
              <Td>{user.email}</Td>
              <Td>
                {user.role === 'admin' ? 'Administrateur' : 
                 user.role === 'manager' ? 'Gestionnaire' : 
                 'Utilisateur'}
              </Td>
              <Td>
                {user.status === 'approved' ? 'Approuvé' : 
                 user.status === 'inactive' ? 'Inactif' : 
                 user.status === 'pending' ? 'En attente' : user.status}
              </Td>
              <Td>
                <Button
                  className="edit"
                  onClick={() => handleEdit(user)}
                >
                  Modifier
                </Button>
                <Button
                  className="delete"
                  onClick={() => handleDelete(user.id)}
                >
                  Supprimer
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {showModal && (
        <Modal>
          <ModalContent>
            <h2>{editingUser ? 'Modifier' : 'Ajouter'} un utilisateur</h2>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Form onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                type="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">Utilisateur</option>
                <option value="manager">Gestionnaire</option>
                <option value="admin">Administrateur</option>
              </Select>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="approved">Approuvé</option>
                <option value="pending">En attente</option>
                <option value="inactive">Inactif</option>
              </Select>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button type="button" className="delete" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="approve">
                  {editingUser ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default UserManagement;
