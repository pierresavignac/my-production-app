import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, Form, Table, Badge, Spinner } from 'react-bootstrap';
import AddEventModal from './modals/AddEventModal';
import EditEventModal from './modals/EditEventModal';
import { fetchEvents, deleteEvent, updateEvent } from '../utils/apiUtils';
import { formatInTimeZone } from 'date-fns-tz';
import '../styles/ListViewPage.css';

const ListViewPage = () => {
    const [events, setEvents] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weeksToShow, setWeeksToShow] = useState(4);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Charger les événements
    const loadEvents = async () => {
        if (isLoading) return;
        setIsLoading(true);
        
        try {
            const response = await fetchEvents();
            if (response && response.success && Array.isArray(response.data)) {
                // Filtrer pour exclure les tâches "Sans rendez-vous"
                const eventsWithAppointment = response.data.filter(event => !event.no_appointment);
                setEvents(eventsWithAppointment);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des événements:', error);
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    // Générer les jours à afficher
    const generateDays = () => {
        const days = [];
        const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        
        for (let i = 0; i < weeksToShow; i++) {
            const weekStart = addWeeks(startDate, i);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
            
            weekDays.forEach(day => {
                days.push({
                    date: day,
                    weekStart: weekStart,
                    isFirstDayOfWeek: day.getDay() === 1
                });
            });
        }
        
        return days;
    };

    // Obtenir les événements pour un jour donné
    const getEventsForDay = (date) => {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return isSameDay(eventDate, date);
        }).sort((a, b) => {
            if (a.installation_time && b.installation_time) {
                return a.installation_time.localeCompare(b.installation_time);
            }
            return 0;
        });
    };

    // Filtrer les événements selon la recherche
    const filterEvents = (dayEvents) => {
        if (!searchTerm.trim()) return dayEvents;
        
        const term = searchTerm.toLowerCase().trim();
        
        return dayEvents.filter(event => 
            (event.installation_number && event.installation_number.toLowerCase().includes(term)) ||
            (event.full_name && event.full_name.toLowerCase().includes(term)) ||
            (event.address && event.address.toLowerCase().includes(term)) ||
            (event.city && event.city.toLowerCase().includes(term)) ||
            (event.equipment && event.equipment.toLowerCase().includes(term)) ||
            (event.employee_name && event.employee_name.toLowerCase().includes(term))
        );
    };

    // Vérifier si c'est le jour courant
    const isCurrentDay = (date) => {
        return isSameDay(date, new Date());
    };

    // Gérer le clic sur une date
    const handleDateClick = () => {
        const formattedDate = formatInTimeZone(new Date(), 'America/Montreal', 'yyyy-MM-dd');
        setSelectedDate(formattedDate);
        setShowAddModal(true);
    };

    // Gérer le clic sur un événement
    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setShowEditModal(true);
    };

    // Gérer l'ajout d'événement
    const handleEventAdded = async () => {
        setShowAddModal(false);
        setSelectedDate(null);
        await loadEvents();
    };

    // Gérer la modification d'événement
    const handleEventSave = async (updatedEvent) => {
        try {
            const response = await updateEvent(updatedEvent);
            if (response && response.success) {
                // Recharger les événements - les tâches "Sans rendez-vous" seront automatiquement filtrées
                await loadEvents();
                setShowEditModal(false);
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    };

    // Gérer la suppression d'événement
    const handleEventDelete = async (eventToDelete) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
            try {
                const response = await deleteEvent(eventToDelete.id);
                if (response && response.success) {
                    await loadEvents();
                    setShowEditModal(false);
                    setSelectedEvent(null);
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
            }
        }
    };

    // Obtenir le badge de type d'événement
    const getEventTypeBadge = (type) => {
        const types = {
            'installation': { label: 'Installation', color: 'success' },
            'conge': { label: 'Congé', color: 'warning' },
            'maladie': { label: 'Maladie', color: 'danger' },
            'formation': { label: 'Formation', color: 'info' },
            'vacances': { label: 'Vacances', color: 'primary' }
        };
        
        const typeInfo = types[type] || { label: type, color: 'secondary' };
        return <Badge bg={typeInfo.color}>{typeInfo.label}</Badge>;
    };

    // Navigation entre les semaines
    const handlePreviousWeek = () => {
        setCurrentDate(prev => subWeeks(prev, weeksToShow));
    };

    const handleNextWeek = () => {
        setCurrentDate(prev => addWeeks(prev, weeksToShow));
    };

    const handleCurrentWeek = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="p-4">
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4>Vue Liste - Calendrier de production</h4>
                    <div className="d-flex gap-2 align-items-center">
                        <select 
                            value={weeksToShow} 
                            onChange={(e) => setWeeksToShow(Number(e.target.value))}
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                        >
                            <option value={1}>1 semaine</option>
                            <option value={2}>2 semaines</option>
                            <option value={4}>4 semaines</option>
                            <option value={8}>8 semaines</option>
                        </select>
                        <Button variant="primary" size="sm" onClick={handleDateClick}>
                            Ajouter une tâche
                        </Button>
                    </div>
                </Card.Header>
                
                <Card.Body>
                    {/* Barre de recherche */}
                    <div className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Rechercher par nom, adresse, équipement, numéro d'installation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    {/* Navigation */}
                    <div className="d-flex justify-content-center gap-2 mb-3">
                        <Button 
                            variant="outline-secondary"
                            size="sm"
                            onClick={handlePreviousWeek}
                        >
                            ← Semaines précédentes
                        </Button>
                        <Button 
                            variant="success"
                            size="sm"
                            onClick={handleCurrentWeek}
                        >
                            Semaine actuelle
                        </Button>
                        <Button 
                            variant="outline-secondary"
                            size="sm"
                            onClick={handleNextWeek}
                        >
                            Semaines suivantes →
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="text-center my-4">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Chargement...</span>
                            </Spinner>
                        </div>
                    ) : (
                        <div className="list-view-content">
                            {generateDays().map((dayInfo, index) => {
                                const dayEvents = filterEvents(getEventsForDay(dayInfo.date));
                                const showDay = dayEvents.length > 0 || !searchTerm;
                                
                                if (!showDay) return null;
                                
                                return (
                                    <div key={index}>
                                        {/* Titre de semaine si c'est le premier jour */}
                                        {dayInfo.isFirstDayOfWeek && (
                                            <h5 className="week-title">
                                                Semaine du {format(dayInfo.weekStart, 'dd MMMM', { locale: fr })} au{' '}
                                                {format(endOfWeek(dayInfo.weekStart, { weekStartsOn: 1 }), 'dd MMMM yyyy', { locale: fr })}
                                            </h5>
                                        )}
                                        
                                        {/* Jour avec événements ou sans événements si pas de recherche */}
                                        {(dayEvents.length > 0 || !searchTerm) && (
                                            <div className={`day-section ${isCurrentDay(dayInfo.date) ? 'current-day' : ''}`}>
                                                <h6 className="day-title">
                                                    {format(dayInfo.date, 'EEEE dd MMMM', { locale: fr })}
                                                </h6>
                                                
                                                {dayEvents.length > 0 ? (
                                                    <Table hover size="sm" className="mb-0">
                                                        <thead>
                                                            <tr>
                                                                <th style={{ width: '80px' }}>Heure</th>
                                                                <th style={{ width: '120px' }}>Type</th>
                                                                <th>Détails</th>
                                                                <th style={{ width: '150px' }}>Technicien/Employé</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {dayEvents.map((event, eventIndex) => (
                                                                <tr 
                                                                    key={eventIndex}
                                                                    onClick={() => handleEventClick(event)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <td>{event.installation_time || '-'}</td>
                                                                    <td>{getEventTypeBadge(event.type)}</td>
                                                                    <td>
                                                                        {event.type === 'installation' ? (
                                                                            <div>
                                                                                <strong>{event.full_name}</strong>
                                                                                <br />
                                                                                <small className="text-muted">
                                                                                    {event.address}, {event.city}
                                                                                </small>
                                                                                <br />
                                                                                <small className="text-primary">{event.equipment}</small>
                                                                            </div>
                                                                        ) : (
                                                                            <div>
                                                                                <strong>{event.employee_name}</strong>
                                                                                {event.type === 'vacances' && event.vacation_group_id && (
                                                                                    <>
                                                                                        <br />
                                                                                        <small className="text-muted">
                                                                                            Période: {format(new Date(event.vacation_group_start_date), 'dd/MM')} - 
                                                                                            {format(new Date(event.vacation_group_end_date), 'dd/MM')}
                                                                                        </small>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {event.type === 'installation' 
                                                                            ? event.technician1_name || '-'
                                                                            : event.employee_name || '-'
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                ) : (
                                                    <p className="text-muted mb-0 ps-3">Aucun événement</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modals */}
            {showAddModal && (
                <AddEventModal
                    show={showAddModal}
                    onHide={() => {
                        setShowAddModal(false);
                        setSelectedDate(null);
                    }}
                    onEventAdded={handleEventAdded}
                    selectedDate={selectedDate}
                />
            )}

            {showEditModal && selectedEvent && (
                <EditEventModal
                    show={showEditModal}
                    onHide={() => {
                        setShowEditModal(false);
                        setSelectedEvent(null);
                    }}
                    event={selectedEvent}
                    onSave={handleEventSave}
                    onDelete={handleEventDelete}
                />
            )}
        </div>
    );
};

export default ListViewPage;
