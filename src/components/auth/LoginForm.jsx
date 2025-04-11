import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f3f4f6;
`;

const FormCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  color: #1f2937;
  margin-bottom: 2rem;
  font-size: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`;

const Button = styled.button`
  padding: 0.75rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }

  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  background-color: #fee2e2;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: #059669;
  background-color: #d1fae5;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0;
  text-decoration: underline;

  &:hover {
    color: #1d4ed8;
  }
`;

const LinksContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        
        if (result.success) {
          navigate('/calendar');
        } else {
          throw new Error(result.error);
        }
      } else if (mode === 'register') {
        const result = await register(email, password);
        
        if (result.success) {
          setSuccess('Compte créé avec succès ! Un administrateur doit approuver votre compte.');
          setTimeout(() => setMode('login'), 3000);
        } else {
          throw new Error(result.error);
        }
      } else if (mode === 'forgot') {
        // Gérer la réinitialisation du mot de passe ici
        setSuccess('Si votre email existe dans notre système, vous recevrez les instructions de réinitialisation.');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <FormCard>
        <Title>
          {mode === 'login' ? 'Connexion' : 
           mode === 'register' ? 'Créer un compte' : 
           'Réinitialiser le mot de passe'}
        </Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {mode !== 'forgot' && (
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="6"
              title="Le mot de passe doit contenir au moins 6 caractères"
              required
            />
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Chargement...' : 
             mode === 'login' ? 'Se connecter' :
             mode === 'register' ? 'Créer le compte' :
             'Envoyer les instructions'}
          </Button>
        </Form>

        <LinksContainer>
          {mode === 'login' ? (
            <>
              <LinkButton onClick={() => setMode('register')}>
                Créer un compte
              </LinkButton>
              <LinkButton onClick={() => setMode('forgot')}>
                Mot de passe oublié ?
              </LinkButton>
            </>
          ) : (
            <LinkButton onClick={() => setMode('login')}>
              Retour à la connexion
            </LinkButton>
          )}
        </LinksContainer>
      </FormCard>
    </Container>
  );
};

export default LoginForm;
