import React from 'react';
import { Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const InstallationStatusSelect = ({ value, onChange, readOnly }) => {
  const { user } = useAuth();
  const hasEditRights = user && (user.role === 'admin' || user.role === 'manager');

  const statuses = [
    { value: 'En approbation', label: 'En approbation' },
    { value: 'En installation', label: 'En installation' },
    { value: 'En facturation', label: 'En facturation' },
    { value: 'Paiement reçu', label: 'Paiement reçu' }
  ];

  if (readOnly) {
    return <span>{value || 'En approbation'}</span>;
  }

  return (
    <Form.Select
      value={value || 'En approbation'}
      onChange={onChange}
      disabled={!hasEditRights}
    >
      {statuses.map(status => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </Form.Select>
  );
};

export default InstallationStatusSelect;
