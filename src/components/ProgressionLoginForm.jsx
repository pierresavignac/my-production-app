import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ProgressionLoginForm = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    domain: 'garychartrand'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check for cached credentials on component mount
  useEffect(() => {
    try {
      const cachedUser = localStorage.getItem('progressionUser');
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        // Only pre-fill the domain and username, never the password
        setFormData(prev => ({
          ...prev,
          domain: userData.domain || prev.domain,
          username: userData.username || prev.username
        }));
        
        // Check if credentials are still valid (not expired)
        const timestamp = userData.timestamp || 0;
        const now = new Date().getTime();
        const fourHoursInMs = 4 * 60 * 60 * 1000;
        
        // If credentials are less than 4 hours old, try to use them
        if (now - timestamp < fourHoursInMs) {
          console.log('🔑 [ProgressionLoginForm] Cached credentials found (< 4 hours old)');
        } else {
          console.log('🕒 [ProgressionLoginForm] Cached credentials expired, login required');
        }
      }
    } catch (err) {
      console.error('Error reading cached credentials:', err);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔄 [ProgressionLoginForm] Tentative de connexion à ProgressionLive', {
        username: formData.username,
        domain: formData.domain,
        passwordLength: formData.password?.length || 0
      });

      // Appeler l'API de connexion à ProgressionLive
      const response = await axios.post(`${API_BASE_URL}/progression_login.php`, formData);
      
      // La réponse peut contenir des messages d'erreur HTML avant le JSON
      let jsonData;
      if (typeof response.data === 'string' && response.data.includes('{')) {
        // Extraire seulement la partie JSON de la réponse
        const jsonStartIndex = response.data.indexOf('{');
        const jsonString = response.data.substring(jsonStartIndex);
        try {
          jsonData = JSON.parse(jsonString);
          console.log('✅ [ProgressionLoginForm] JSON extrait de la réponse:', jsonData);
        } catch (jsonError) {
          console.error('❌ [ProgressionLoginForm] Erreur lors du parsing JSON:', jsonError);
          throw new Error('Format de réponse invalide');
        }
      } else {
        jsonData = response.data;
        console.log('✅ [ProgressionLoginForm] Réponse de l\'API ProgressionLive:', jsonData);
      }
      
      if (jsonData.success) {
        console.log('🔑 [ProgressionLoginForm] Connexion réussie, sauvegarde des identifiants');
        
        // Stocker les informations dans localStorage (pas le mot de passe)
        localStorage.setItem('progressionUser', JSON.stringify({
          username: jsonData.username,
          domain: jsonData.domain,
          timestamp: new Date().getTime()
        }));
        
        // Informer le composant parent
        if (onLoginSuccess) {
          onLoginSuccess(jsonData);
        }
      } else {
        console.error('❌ [ProgressionLoginForm] Échec de connexion:', jsonData.message);
        setError(jsonData.message || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('❌ [ProgressionLoginForm] Exception lors de la connexion:', err);
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(
        err.response?.data?.message || 
        'Erreur de connexion à ProgressionLive. Vérifiez vos identifiants et votre connexion internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Connexion à ProgressionLive</h4>
                <span className="badge bg-light text-primary">v1.0</span>
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom de domaine ProgressionLive</Form.Label>
                  <Form.Control
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    placeholder="ex: votreentreprise"
                    required
                  />
                  <Form.Text className="text-muted">
                    Nom de domaine de votre compte ProgressionLive (sans .progressionlive.com)
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Adresse email</Form.Label>
                  <Form.Control
                    type="email"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="exemple@entreprise.com"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Votre mot de passe ProgressionLive"
                      required
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </Button>
                  </div>
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'Connexion en cours...' : 'Se connecter'}
                  </Button>
                </div>
              </Form>
              
              <div className="mt-3 text-center">
                <small className="text-muted">
                  Ces informations d'identification sont utilisées uniquement pour communiquer avec ProgressionLive.
                  Elles seront stockées sur le serveur mais ne seront jamais partagées.
                </small>
              </div>
              
              <hr className="my-3" />
              
              <div className="text-muted small">
                <p className="mb-1"><strong>Guide d'utilisation :</strong></p>
                <ol className="text-start ps-3">
                  <li>Entrez votre nom de domaine ProgressionLive (ex: garychartrand)</li>
                  <li>Utilisez votre adresse email comme identifiant</li>
                  <li>Entrez votre mot de passe ProgressionLive</li>
                  <li>Une fois connecté, vous pourrez accéder aux fichiers associés aux installations</li>
                </ol>
                <p className="mb-0">Vos identifiants seront mémorisés pendant 4 heures pour éviter des reconnexions fréquentes.</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProgressionLoginForm;