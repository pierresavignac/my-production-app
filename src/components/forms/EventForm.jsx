import React, { useState } from 'react';

const EventForm = () => {
    const [formData, setFormData] = useState({
        type: 'installation', // Types possibles : 'installation', 'conge', 'maladie', 'formation', 'vacances'
        date: '',
        installation_time: '',
        full_name: '',
        phone: '',
        address: '',
        city: '',
        equipment: '',
        amount: '',
        technician1_id: '',
        technician2_id: '',
        technician3_id: '',
        technician4_id: '',
        Sommaire: '',
        Description: ''
    });

    const eventTypes = [
        { value: 'installation', label: 'Installation' },
        { value: 'conge', label: 'Congé' },
        { value: 'maladie', label: 'Maladie' },
        { value: 'formation', label: 'Formation' },
        { value: 'vacances', label: 'Vacances' }
    ];

    // ... reste du composant ...
};

export default EventForm; 