import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Alert, Spinner, Badge, Form } from 'react-bootstrap';
import { fetchEvents } from '../../utils/apiUtils';
import EditEventModal from '../modals/EditEventModal';
import AddEventModal from '../modals/AddEventModal';
import EventDetailsModal from '../modals/EventDetailsModal';

// Style pour les entêtes de colonnes triables
const sortableHeaderStyle = {
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
};

const NoAppointmentView = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // État pour le tri
    const [sortField, setSortField] = useState('installation_number');
    const [sortDirection, setSortDirection] = useState('asc');
    
    // État pour la recherche/filtrage
    const [searchTerm, setSearchTerm] = useState('');

    // Fonction pour rafraîchir les données
    const refreshData = () => {
        setRefreshKey(prevKey => prevKey + 1);
    };

    useEffect(() => {
        const loadEvents = async () => {
            try {
                setLoading(true);
                setError('');
                // Récupérer tous les événements et filtrer ceux sans rendez-vous
                const response = await fetchEvents();
                console.log("Réponse reçue de fetchEvents dans NoAppointmentView:", response);
                
                if (response && response.success && Array.isArray(response.data)) {
                    const noAppointmentEvents = response.data.filter(event => event.no_appointment === true);
                    console.log(`${noAppointmentEvents.length} événements "Sans rendez-vous" trouvés parmi ${response.data.length} événements.`);
                    setEvents(noAppointmentEvents);
                } else {
                    console.error('Format de réponse inattendu de fetchEvents:', response);
                    setEvents([]);
                    setError('Format de données invalide');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des événements:', error);
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, [refreshKey]);

    const handleAddEvent = () => {
        setShowAddModal(true);
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setShowEditModal(true);
    };

    const handleViewDetails = (event) => {
        setSelectedEvent(event);
        setShowDetailsModal(true);
    };

    const handleEventSaved = () => {
        refreshData();
        setShowAddModal(false);
        setShowEditModal(false);
    };

    const handleEventDeleted = () => {
        refreshData();
        setShowEditModal(false);
    };

    // Fonction pour gérer le tri
    const handleSort = (field) => {
        if (sortField === field) {
            // Si on clique sur le même champ, inverser la direction
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Sinon, trier par le nouveau champ en ordre ascendant
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Fonction pour trier les événements
    const sortEvents = (eventsToSort) => {
        if (!eventsToSort || !Array.isArray(eventsToSort)) return [];
        
        return [...eventsToSort].sort((a, b) => {
            let valueA, valueB;
            
            // Extraire les valeurs à comparer selon le champ de tri
            switch (sortField) {
                case 'installation_number':
                    valueA = a.installation_number || '';
                    valueB = b.installation_number || '';
                    break;
                case 'full_name':
                    valueA = a.full_name || '';
                    valueB = b.full_name || '';
                    break;
                case 'representative':
                    valueA = a.representative || '';
                    valueB = b.representative || '';
                    break;
                case 'status':
                    valueA = a.status || '';
                    valueB = b.status || '';
                    break;
                default:
                    valueA = a[sortField] || '';
                    valueB = b[sortField] || '';
            }
            
            // Comparer en tenant compte de la direction
            if (sortDirection === 'asc') {
                return valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: 'base' });
            } else {
                return valueB.localeCompare(valueA, undefined, { numeric: true, sensitivity: 'base' });
            }
        });
    };
    
    // Fonction pour filtrer les événements selon le terme de recherche
    const filterEvents = (eventsToFilter) => {
        if (!searchTerm.trim()) return eventsToFilter;
        
        const term = searchTerm.toLowerCase().trim();
        
        return eventsToFilter.filter(event => 
            (event.installation_number && event.installation_number.toLowerCase().includes(term)) ||
            (event.full_name && event.full_name.toLowerCase().includes(term)) ||
            (event.representative && event.representative.toLowerCase().includes(term)) ||
            (event.equipment && event.equipment.toLowerCase().includes(term)) ||
            (event.status && event.status.toLowerCase().includes(term)) ||
            (event.address && event.address.toLowerCase().includes(term))
        );
    };

    // Obtenir les événements triés et filtrés
    const getSortedAndFilteredEvents = () => {
        return filterEvents(sortEvents(events));
    };

    // Couleurs selon le statut
    const getStatusColor = (status) => {
        switch (status) {
            case 'En approbation':
                return 'warning';
            case 'Approuvé':
                return 'success';
            case 'Réalisé':
                return 'info';
            case 'Annulé':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="p-4">
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4>Tâches Sans Rendez-vous</h4>
                    <Button variant="primary" onClick={handleAddEvent}>
                        Ajouter une tâche
                    </Button>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    {/* Barre de recherche */}
                    <div className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    {loading ? (
                        <div className="text-center my-4">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Chargement...</span>
                            </Spinner>
                        </div>
                    ) : (
                        <Table striped hover responsive>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('installation_number')}>
                                        <div style={sortableHeaderStyle}>
                                            <span>INS</span>
                                            <span>{sortField === 'installation_number' && (sortDirection === 'asc' ? '▲' : '▼')}</span>
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('full_name')}>
                                        <div style={sortableHeaderStyle}>
                                            <span>Nom du client</span>
                                            <span>{sortField === 'full_name' && (sortDirection === 'asc' ? '▲' : '▼')}</span>
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('representative')}>
                                        <div style={sortableHeaderStyle}>
                                            <span>Représentant</span>
                                            <span>{sortField === 'representative' && (sortDirection === 'asc' ? '▲' : '▼')}</span>
                                        </div>
                                    </th>
                                    <th>Équipement</th>
                                    <th>Adresse</th>
                                    <th onClick={() => handleSort('status')}>
                                        <div style={sortableHeaderStyle}>
                                            <span>Statut</span>
                                            <span>{sortField === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}</span>
                                        </div>
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getSortedAndFilteredEvents().length > 0 ? (
                                    getSortedAndFilteredEvents().map(event => (
                                        <tr key={event.id} onClick={() => handleViewDetails(event)}>
                                            <td>{event.installation_number || '-'}</td>
                                            <td>{event.full_name || '-'}</td>
                                            <td>{event.representative || '-'}</td>
                                            <td>{event.equipment || '-'}</td>
                                            <td>{event.address || '-'}</td>
                                            <td>
                                                <Badge bg={getStatusColor(event.status)}>
                                                    {event.status || 'Non défini'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm" 
                                                    className="me-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditEvent(event);
                                                    }}
                                                >
                                                    Modifier
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center">
                                            {searchTerm ? 'Aucun résultat pour cette recherche' : 'Aucune tâche sans rendez-vous disponible'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Modales */}
            <AddEventModal
                show={showAddModal}
                onHide={() => setShowAddModal(false)}
                onSave={handleEventSaved}
                selectedDate=""
                initialNoAppointment={true} // Pré-cocher la case "Sans rendez-vous"
            />
            
            {selectedEvent && (
                <>
                    <EditEventModal
                        show={showEditModal}
                        onHide={() => setShowEditModal(false)}
                        onSave={handleEventSaved}
                        onDelete={handleEventDeleted}
                        event={{...selectedEvent, no_appointment: true}} // Force la valeur no_appointment à true
                    />
                    
                    <EventDetailsModal
                        show={showDetailsModal}
                        onHide={() => setShowDetailsModal(false)}
                        event={selectedEvent}
                        onEdit={() => {
                            setShowDetailsModal(false);
                            setShowEditModal(true);
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default NoAppointmentView;