import React, { useState } from 'react';
import { fetchInstallationData } from '../utils/progressionApi';
import './ProgressionTask.css';

const ProgressionTask = () => {
  const [taskCode, setTaskCode] = useState('');
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchTask = async () => {
    if (!taskCode) {
      setError('Veuillez entrer un code de tâche');
      return;
    }

    setLoading(true);
    setError(null);
    setTask(null);

    try {
      const response = await fetchInstallationData(taskCode);
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la recherche');
      }

      setTask(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleString('fr-CA');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(price);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchTask();
    }
  };

  return (
    <div className="progression-task">
      <div className="search-section">
        <input 
          value={taskCode}
          onChange={(e) => setTaskCode(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Entrez le code de la tâche"
        />
        <button onClick={searchTask} disabled={loading}>
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {task && (
        <div className="task-details">
          <h2>Détails de la tâche</h2>
          <div className="task-header">
            <div className="task-code">Code: {task.task_code}</div>
            <div className="task-summary">{task.summary}</div>
          </div>

          <div className="task-description">
            {task.description}
          </div>

          <div className="task-info">
            <div className="info-item">
              <strong>Client:</strong> {task.client_name}
            </div>
            <div className="info-item">
              <strong>Téléphone:</strong> {task.phone || 'Non spécifié'}
            </div>
            <div className="info-item">
              <strong>Adresse:</strong> {task.address}
            </div>
            <div className="info-item">
              <strong>Ville:</strong> {task.city}
            </div>
            <div className="info-item">
              <strong>Montant:</strong> {formatPrice(task.amount)}
            </div>
            <div className="info-item">
              <strong>Numéro de soumission:</strong> {task.quote_number}
            </div>
            <div className="info-item">
              <strong>Représentant:</strong> {task.representative}
            </div>
            <div className="info-item">
              <strong>Statut:</strong> {task.status}
            </div>
          </div>

          {task.items && task.items.length > 0 && (
            <div className="task-items">
              <h3>Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantité</th>
                    <th>Prix</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {task.items.map((item) => (
                    <tr key={item.label}>
                      <td>{item.label}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3"><strong>Total</strong></td>
                    <td><strong>{formatPrice(task.total)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressionTask; 