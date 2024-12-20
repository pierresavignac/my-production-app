import React, { useState, useEffect, useRef } from 'react';
import { addWeeks, subWeeks, addDays, isWeekend, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchEvents, createEvent, updateEvent, deleteEvent, fetchEmployees } from '../utils/apiUtils';
import { getEventsForDay, sortEventsByTime } from '../utils/eventUtils';
import { calculateWeeks, isCurrentDay, isCurrentWeek, formatDayHeader, formatDateForAPI } from '../utils/dateUtils';
import AddEventModal from './modals/AddEventModal';
import EventDetailsModal from './modals/EventDetailsModal';
import EditEventModal from './modals/EditEventModal';
import BlockView from './views/BlockView';
import ListView from './views/ListView';
import { API_BASE_URL } from '../config/config';
import '../styles/ProductionCalendar.css';

const ProductionCalendar = () => {
  // États
  const [events, setEvents] = useState({});
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  
  // Refs
  const scrollRef = useRef(null);

  // Variables
  const weeks = calculateWeeks(currentDate);

  // Définition des types d'événements
  const eventTypes = [
    { value: 'installation', label: 'Installation' },
    { value: 'conge', label: 'Congé' },
    { value: 'maladie', label: 'Maladie' },
    { value: 'formation', label: 'Formation' },
    { value: 'vacances', label: 'Vacances' }
  ];

  // Navigation des semaines
  const goToPreviousWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  // Chargement initial des données
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const [employeesData, eventsData] = await Promise.all([
          fetchEmployees(),
          fetchEvents()
        ]);

        setEmployees(employeesData);

        // Log les événements reçus
        console.log('Événements reçus de l\'API:', eventsData);

        // Grouper les événements par date
        const groupedEvents = eventsData.reduce((acc, event) => {
          // Log chaque événement
          console.log('Type d\'événement:', event.type, 'Données:', event);

          if (!acc[event.date]) {
            acc[event.date] = [];
          }
          acc[event.date].push(event);
          return acc;
        }, {});

        setEvents(groupedEvents);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setError('Erreur lors du chargement des données. Veuillez rafraîchir la page.');
      }
    };

    initializeApp();
  }, []);

  // Scroll automatique vers la semaine courante
  useEffect(() => {
    const scrollToCurrentWeek = () => {
      const container = viewMode === 'calendar' ? scrollRef.current : document.querySelector('.list-view');
      if (!container) return;

      const weekElements = container.querySelectorAll('.week-section');
      const weekArray = Array.from(weekElements);
      const currentWeekIndex = weekArray.findIndex(el => el.getAttribute('data-is-current') === 'true');
      
      if (currentWeekIndex !== -1) {
        const targetWeek = weekArray[currentWeekIndex];
        const headerHeight = 60;
        const padding = 20;
        const elementTop = targetWeek.offsetTop;
        
        container.scrollTo({
          top: Math.max(0, elementTop - headerHeight - padding),
          behavior: 'smooth'
        });
      }
    };

    requestAnimationFrame(scrollToCurrentWeek);
  }, [currentDate, viewMode]);

  // Gestionnaires d'événements
  const handleDateClick = (date) => {
    // Formater la date en YYYY-MM-DD en utilisant la date exacte cliquée
    const formattedDate = format(date, 'yyyy-MM-dd');
    setSelectedDate(formattedDate);
    setShowAddEventModal(true);
  };

  const handleEventClick = (event) => {
    console.log('Événement cliqué:', event);
    
    // Trouver le type normalisé correspondant
    const eventType = eventTypes.find(type => 
      type.label.toLowerCase() === event.type.toLowerCase()
    )?.value || event.type.toLowerCase();

    console.log('Type d\'événement trouvé:', eventType);

    // S'assurer que la date est au bon format
    const eventDate = new Date(event.date + 'T00:00:00');
    
    // Normaliser l'événement avant de l'ouvrir dans le modal
    const normalizedEvent = {
      ...event,
      type: eventType,
      date: format(eventDate, 'yyyy-MM-dd'),
      technician1_name: event.technician1_name || '',
      technician2_name: event.technician2_name || '',
      technician3_name: event.technician3_name || '',
      technician4_name: event.technician4_name || ''
    };
    
    console.log('Événement normalisé:', normalizedEvent);
    setSelectedEvent(normalizedEvent);
    setShowEventDetailsModal(true);
  };

  const handleAddEventSubmit = async (formData) => {
    try {
        console.log('Type d\'événement reçu:', formData.type);

        // Cas de l'installation ou autre type d'événement (sauf vacances)
        if (formData.type !== 'vacances') {
            const eventData = {
                type: formData.type,
                date: formData.date,
                installation_time: formData.installation_time,
                full_name: formData.full_name,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                Sommaire: formData.Sommaire,
                Description: formData.Description,
                installation_number: formData.installation_number,
                equipment: formData.equipment,
                amount: formData.amount,
                quote_number: formData.quote_number,
                representative: formData.representative,
                technician1_id: formData.technician1_id,
                technician2_id: formData.technician2_id,
                technician3_id: formData.technician3_id,
                technician4_id: formData.technician4_id,
                client_number: formData.client_number
            };

            console.log('Création de l\'événement:', eventData);
            await createEvent(eventData);
            setShowAddEventModal(false);
            setSelectedDate(null);
            // Rafraîchir les événements après la création
            const updatedEvents = await fetchEvents();
            setEvents(updatedEvents);
        } else if (formData.type === 'vacances') {
            // Code existant pour les vacances...
            console.log('Création d\'événements vacances');
            const startDate = parseISO(formData.startDate);
            const endDate = parseISO(formData.endDate);
            let currentDate = startDate;
            
            // Générer un seul vacation_group_id pour tout le groupe
            const groupId = `vac_${Date.now().toString(36)}${Math.random().toString(36).substr(2)}`;
            console.log('GroupId généré:', groupId);
            
            while (currentDate <= endDate) {
                if (!isWeekend(currentDate)) {
                    const eventData = {
                        type: 'vacances',
                        date: format(currentDate, 'yyyy-MM-dd'),
                        employee_id: formData.employee_id,
                        first_name: '',
                        last_name: '',
                        installation_number: '',
                        installation_time: '',
                        city: '',
                        equipment: '',
                        amount: '',
                        technician1_id: null,
                        technician2_id: null,
                        technician3_id: null,
                        technician4_id: null,
                        region_id: null,
                        startDate: format(startDate, 'yyyy-MM-dd'),
                        endDate: format(endDate, 'yyyy-MM-dd'),
                        vacation_group_id: groupId
                    };

                    console.log('Création événement vacances avec groupId:', eventData);
                    await createEvent(eventData);
                }
                currentDate = addDays(currentDate, 1);
            }
            setShowAddEventModal(false);
        } else {
            // Code existant pour la modification
            const eventData = {
                id: formData.id,
                type: formData.type,
                date: formData.date,
                installation_time: formData.installation_time,
                first_name: formData.first_name,
                last_name: formData.last_name,
                installation_number: formData.installation_number,
                city: formData.city,
                equipment: formData.equipment,
                amount: formData.amount,
                technician1: formData.technician1,
                technician2: formData.technician2,
                technician3: formData.technician3,
                technician4: formData.technician4,
                employee_id: formData.employee_id
            };

            console.log('Mise à jour de l\'événement:', eventData);
            await updateEvent(eventData);
            setShowEditEventModal(false);
            setSelectedEvent(null);
        }

        // Recharger les événements
        const eventsData = await fetchEvents();
        console.log('Événements après opération:', eventsData);
        const groupedEvents = eventsData.reduce((acc, event) => {
            if (!acc[event.date]) {
                acc[event.date] = [];
            }
            acc[event.date].push(event);
            return acc;
        }, {});

        setEvents(groupedEvents);
    } catch (error) {
        console.error('Erreur lors de l\'opération:', error);
        setError(error.message);
    }
  };

  const handleEventUpdate = async (updatedEvent) => {
    try {
      console.log('Mise à jour de l\'événement:', updatedEvent);
      const result = await updateEvent(updatedEvent);

      if (result && result.success) {
        // Recharger les événements après la mise à jour
        const updatedEvents = await fetchEvents();
        console.log('Événements reçus après mise à jour:', updatedEvents);
        
        // Grouper les événements par date
        const groupedEvents = updatedEvents.reduce((acc, event) => {
          console.log('Groupement de l\'événement:', event);
          if (!acc[event.date]) {
            acc[event.date] = [];
          }
          acc[event.date].push(event);
          return acc;
        }, {});

        console.log('Événements groupés après mise à jour:', groupedEvents);
        
        // Mettre à jour l'état avec les événements groupés
        setEvents(groupedEvents);
        setSelectedEvent(null);
        setShowEditEventModal(false);
        setShowEventDetailsModal(false);
      } else {
        throw new Error('La mise à jour a échoué');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour de l\'événement');
    }
  };

  const handleDeleteEvent = async (event) => {
    try {
      await deleteEvent(event.id, event.deleteMode);
      setShowEventDetailsModal(false);
      setSelectedEvent(null);
      
      const eventsData = await fetchEvents();
      const groupedEvents = eventsData.reduce((acc, event) => {
        if (!acc[event.date]) {
          acc[event.date] = [];
        }
        acc[event.date].push(event);
        return acc;
      }, {});

      setEvents(groupedEvents);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError(`Erreur lors de la suppression : ${error.message}`);
    }
  };

  // Dans le style des blocs de journée, ajoutez une propriété boxShadow
  const dayBlockStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    minHeight: '100px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' // Ombrage plus prononcé
  };

  // Ajouter la fonction pour charger les employés
  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
      setError('Erreur lors du chargement des employés');
    }
  };

  // Charger les employés au montage du composant
  useEffect(() => {
    loadEmployees();
  }, []);

  const renderEvent = (event) => {
    // Log l'événement avant le rendu
    console.log('Rendu de l\'événement:', event);

    const normalizedType = {
      'conge': 'Congé',
      'congé': 'Congé',
      'maladie': 'Maladie',
      'formation': 'Formation',
      'vacances': 'Vacances',
      'installation': 'Installation'
    }[event.type.toLowerCase()] || event.type;

    // Log le type normalisé
    console.log('Type normalisé:', normalizedType);

    const technicians = [
      event.technician1_name,
      event.technician2_name,
      event.technician3_name,
      event.technician4_name
    ].filter(Boolean);

    return (
      <div className={normalizedType === 'Installation' ? 'installation-details' : 'special-event'}>
        <div className="event-time">{event.installation_time}</div>
        <div className="event-type">{normalizedType}</div>
        {normalizedType === 'Installation' && (
          <div className="event-client">
            <strong>{event.full_name}</strong>
            {event.address && <div>{event.address}</div>}
            {event.city && <div>{event.city}</div>}
          </div>
        )}
        {technicians.length > 0 && (
          <div className="event-technicians">
            {technicians.map((tech, index) => (
              <div key={index}>{tech}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Rendu
  return (
    <div>
      <div className="navigation-bar">
        <h1 className="app-title">
          Calendrier de production {new Date().getFullYear()}
        </h1>
        <div className="navigation-controls">
          <button
            className="view-toggle-button"
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
          >
            {viewMode === 'calendar' ? 'Vue Liste' : 'Vue Bloc'}
          </button>
          <div className="navigation-buttons">
            <button 
              className="navigation-button previous" 
              onClick={goToPreviousWeek}
            >
              Semaine précédente
            </button>
            <button 
              className="navigation-button current" 
              onClick={goToCurrentWeek}
            >
              Semaine courante
            </button>
            <button 
              className="navigation-button next" 
              onClick={goToNextWeek}
            >
              Semaine suivante
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}

      <div className="calendar-container" ref={scrollRef} style={{ 
        backgroundColor: '#ff6b00',
        padding: '1rem',
        minHeight: '100vh'
      }}>
        {viewMode === 'calendar' ? (
          <BlockView
            weeks={weeks}
            events={events}
            handleDateClick={handleDateClick}
            handleEventClick={handleEventClick}
            isCurrentWeek={isCurrentWeek}
            isCurrentDay={isCurrentDay}
            getEventsForDay={getEventsForDay}
            formatDayHeader={formatDayHeader}
            renderEvent={renderEvent}
          />
        ) : (
          <ListView
            weeks={weeks}
            events={events}
            handleDateClick={handleDateClick}
            handleEventClick={handleEventClick}
            isCurrentWeek={isCurrentWeek}
            isCurrentDay={isCurrentDay}
            getEventsForDay={getEventsForDay}
            renderEvent={renderEvent}
          />
        )}
      </div>

      {showEventDetailsModal && selectedEvent && (
        <EventDetailsModal
          show={showEventDetailsModal}
          onHide={() => {
            setShowEventDetailsModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onEdit={(event) => {
            console.log('Événement à éditer:', event);
            // Conserver l'événement tel quel pour l'édition
            setSelectedEvent(event);
            setShowEventDetailsModal(false);
            setShowEditEventModal(true);
          }}
          onDelete={(event) => {
            handleDeleteEvent(event);
            setShowEventDetailsModal(false);
          }}
        />
      )}

      {showEditEventModal && selectedEvent && (
        <EditEventModal
          show={showEditEventModal}
          onHide={() => {
            setShowEditEventModal(false);
            setSelectedEvent(null);
          }}
          onSave={handleEventUpdate}
          event={selectedEvent}
        />
      )}

      {showAddEventModal && (
        <AddEventModal
          show={showAddEventModal}
          onHide={() => {
            setShowAddEventModal(false);
            setSelectedDate(null);
          }}
          onSubmit={handleAddEventSubmit}
          mode="add"
          employees={employees}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default ProductionCalendar; 