import React, { useState, useEffect, useRef } from 'react';
import { addWeeks, subWeeks, addDays, isWeekend, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchEvents, createEvent, updateEvent, deleteEvent, fetchEmployees } from '../utils/apiUtils';
import { getEventsForDay, sortEventsByTime } from '../utils/eventUtils';
import { calculateWeeks, isCurrentDay, isCurrentWeek, formatDayHeader, formatDateForAPI } from '../utils/dateUtils';
import AddEventModal from './modals/AddEventModal';
import EventDetailsModal from './modals/EventDetailsModal';
import EditEventModal from './modals/EditEventModal';
import ErrorModal from './modals/ErrorModal';
import BlockView from './views/BlockView';
import ListView from './views/ListView';
import { API_BASE_URL } from '../config/config';
import '../styles/ProductionCalendar.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProductionCalendar = () => {
  // États
  const [events, setEvents] = useState({});
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  
  // Refs
  const scrollRef = useRef(null);
  const { logout } = useAuth();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur a les droits d'édition
  const hasEditRights = user && (user.role === 'admin' || user.role === 'manager');

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
        setErrorMessage('Erreur lors du chargement des données. Veuillez rafraîchir la page.');
        setShowErrorModal(true);
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
    if (!hasEditRights) {
      setErrorMessage("Vous n'avez pas les droits pour créer un événement.");
      setShowErrorModal(true);
      return;
    }
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
        setErrorMessage(error.message);
        setShowErrorModal(true);
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
      setErrorMessage('Erreur lors de la mise à jour de l\'événement');
      setShowErrorModal(true);
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
      setErrorMessage(`Erreur lors de la suppression : ${error.message}`);
      setShowErrorModal(true);
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
      setErrorMessage('Erreur lors du chargement des employés');
      setShowErrorModal(true);
    }
  };

  // Charger les employés au montage du composant
  useEffect(() => {
    loadEmployees();
  }, []);

  const getEventStyle = (event) => {
    let style = {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '4px',
      overflow: 'hidden',
      color: 'white',
      borderRadius: '4px',
      cursor: 'pointer'
    };

    // Gérer d'abord les autres types d'événements
    switch (event.type.toLowerCase()) {
      case 'conge':
      case 'congé':
        style.backgroundColor = '#87CEEB';
        break;
      case 'maladie':
        style.backgroundColor = '#FFB6C1';
        break;
      case 'formation':
        style.backgroundColor = '#DDA0DD';
        break;
      case 'vacances':
        style.backgroundColor = '#98FB98';
        break;
      case 'installation':
        // Pour les installations, utiliser le statut
        switch (event.status || event.installation_status) {
          case 'En approbation':
            style.backgroundColor = '#ffb6c150'; // Rose clair à 50%
            style.color = 'black';
            break;
          case 'En installation':
            style.backgroundColor = '#28a74550'; // Vert clair à 50%
            style.color = 'black';
            break;
          case 'En facturation':
            style.backgroundColor = '#ffc10750'; // Jaune clair à 50%
            style.color = 'black';
            break;
          case 'Paiement reçu':
            style.backgroundColor = '#3174ad50'; // Bleu à 50%
            style.color = 'black';
            break;
          default:
            style.backgroundColor = '#ffb6c150'; // Rose clair à 50% par défaut
            style.color = 'black';
        }
        break;
      default:
        style.backgroundColor = '#3174ad';
    }

    return style;
  };

  const renderEvent = (event) => {
    const style = getEventStyle(event);
    const technicians = [
      event.technician1_name,
      event.technician2_name,
      event.technician3_name,
      event.technician4_name
    ].filter(Boolean);

    return (
      <div
        className="calendar-event"
        style={style}
        onClick={() => handleEventClick(event)}
      >
        <div className="event-time">{event.installation_time}</div>
        <div className="event-type">{event.type}</div>
        {event.type === 'Installation' && (
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setErrorMessage('Erreur lors de la déconnexion');
      setShowErrorModal(true);
    }
  };

  // Rendu
  return (
    <div>
      <div className="navigation-bar">
        <h1 className="app-title">
          Calendrier de production {new Date().getFullYear()}
        </h1>
        <div style={{ flex: 1, textAlign: 'center', marginLeft: '20px', marginRight: '20px' }}>
          <span style={{ fontSize: '0.8em', color: 'white' }}>{user?.email}</span>
        </div>
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
            {user?.role === 'admin' && (
              <button 
                className="navigation-button"
                onClick={() => navigate('/admin')}
              >
                Usagers
              </button>
            )}
            <button 
              className="navigation-button"
              onClick={handleLogout}
              style={{ backgroundColor: '#ef4444' }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <ErrorModal 
        show={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />

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
          onEdit={() => {
            if (!hasEditRights) {
              setErrorMessage("Vous n'avez pas les droits pour modifier un événement.");
              setShowErrorModal(true);
              return;
            }
            console.log('Événement à éditer:', selectedEvent);
            setSelectedEvent(selectedEvent);
            setShowEventDetailsModal(false);
            setShowEditEventModal(true);
          }}
          onDelete={() => {
            if (!hasEditRights) {
              setErrorMessage("Vous n'avez pas les droits pour supprimer un événement.");
              setShowErrorModal(true);
              return;
            }
            handleDeleteEvent(selectedEvent);
            setShowEventDetailsModal(false);
          }}
          canEdit={hasEditRights}
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
          user={user}
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