import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleCalendar from './SimpleCalendar';
import AddEventModal from './modals/AddEventModal';
import EditEventModal from './modals/EditEventModal';
import '../styles/ProductionCalendar.css';
import { jwtDecode } from 'jwt-decode';
import { format, addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { fetchEvents, deleteEvent } from '../utils/apiUtils';

const ProductionCalendar = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const calendarRef = useRef(null);

    const loadEvents = async () => {
        if (isLoading) return;
        setIsLoading(true);
        console.log("Tentative de chargement des événements via apiUtils...");
        try {
            const response = await fetchEvents(); 
            console.log("Réponse reçue de fetchEvents:", response);

            if (response && response.success && Array.isArray(response.data)) {
                console.log(`${response.data.length} événements chargés avec succès.`);
                setEvents(response.data);
            } else {
                console.error('Format de réponse inattendu de fetchEvents:', response);
                setEvents([]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des événements via apiUtils:', error);
            setEvents([]);
        } finally {
            setIsLoading(false);
            console.log("Fin du chargement des événements.");
        }
    };

    useEffect(() => {
        const email = localStorage.getItem('userEmail');
        setUserEmail(email);
        
        // Charger les événements et ensuite défiler vers la semaine actuelle
        const initialLoad = async () => {
            await loadEvents();
            // Petit délai pour s'assurer que la ref est prête après le rendu
            setTimeout(() => {
                 if (calendarRef.current && typeof calendarRef.current.scrollToWeek === 'function') {
                    console.log('[ProductionCalendar] Défilement initial vers la semaine actuelle...');
                    calendarRef.current.scrollToWeek(new Date());
                } else {
                    console.error('[ProductionCalendar] Impossible de défiler initialement, ref non prête?');
                }
            }, 100); // Léger délai (100ms)
        };

        initialLoad();

    }, []); // Tableau de dépendances vide pour exécution unique au montage

    const handleDateClick = (date) => {
        const formattedDate = formatInTimeZone(date, 'America/Montreal', 'yyyy-MM-dd');
        
        console.log('Date sélectionnée:', date);
        console.log('Date formatée:', formattedDate);
        
        setSelectedDate(formattedDate);
        setShowAddModal(true);
    };

    const handleEventClick = (event) => {
        console.log('Event clicked:', event);
        setSelectedEvent(event);
        setShowEditModal(true);
    };

    const handleEventAdded = async () => {
        setShowAddModal(false);
        setSelectedDate(null);
        await loadEvents();
    };

    const handleEventSave = async (updatedEvent) => {
        try {
            console.log('Event avant sauvegarde:', updatedEvent);
            const response = await fetch(`/api/events.php?id=${updatedEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedEvent),
            });

            if (response.ok) {
                await loadEvents();
                setShowEditModal(false);
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
        }
    };

    const handleEventDelete = async (eventToDelete) => {
        if (!eventToDelete || !eventToDelete.id) {
            console.error('handleEventDelete: ID d\'événement manquant', eventToDelete);
            return;
        }
        const eventId = eventToDelete.id;

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l\'événement ID ${eventId} ?`)) {
            console.log(`Tentative de suppression de l\'événement ID ${eventId}...`);
            try {
                const result = await deleteEvent(eventId);
                console.log('Résultat de deleteEvent:', result);

                if (result && result.success) {
                    console.log('Suppression réussie côté API, rechargement des événements...');
                    await loadEvents();
                    setShowEditModal(false);
                    setSelectedEvent(null);
                } else {
                    console.error('La suppression a échoué côté API:', result?.message || 'Message d\'erreur non fourni.');
                    alert(`Erreur lors de la suppression : ${result?.message || 'Erreur inconnue'}`);
                }
            } catch (error) {
                console.error('Erreur lors de l\'appel à deleteEvent:', error);
                alert(`Erreur technique lors de la suppression : ${error.message}`);
            }
        } else {
            console.log('Suppression annulée par l\'utilisateur.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const handlePreviousWeek = () => {
        const previousWeekDate = subWeeks(currentDate, 1);
        setCurrentDate(previousWeekDate);
        if (calendarRef.current && typeof calendarRef.current.scrollToWeek === 'function') {
            calendarRef.current.scrollToWeek(previousWeekDate);
        } else {
            console.error('calendarRef.current.scrollToWeek n\'est pas une fonction');
        }
    };

    const handleNextWeek = () => {
        const nextWeekDate = addWeeks(currentDate, 1);
        setCurrentDate(nextWeekDate);
        if (calendarRef.current && typeof calendarRef.current.scrollToWeek === 'function') {
            calendarRef.current.scrollToWeek(nextWeekDate);
        } else {
            console.error('calendarRef.current.scrollToWeek n\'est pas une fonction');
        }
    };

    const handleCurrentWeek = () => {
        const today = new Date();
        setCurrentDate(today);
        if (calendarRef.current && typeof calendarRef.current.scrollToWeek === 'function') {
            calendarRef.current.scrollToWeek(today);
        } else {
            console.error('calendarRef.current.scrollToWeek n\'est pas une fonction');
        }
    };

    const isCurrentWeek = () => {
        return isSameWeek(currentDate, new Date(), { weekStartsOn: 1 });
    };

    const handleUsersClick = (e) => {
        e.preventDefault();
        console.log('Clic sur le bouton Usagers');
        
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.role === 'admin') {
                    console.log('Navigation vers /admin');
                    navigate('/admin', { replace: true });
                } else {
                    console.log('Accès refusé - Rôle admin requis');
                    alert('Accès refusé - Rôle admin requis');
                }
            } catch (error) {
                console.error('Erreur de décodage du token:', error);
            }
        }
    };

    return (
        <div className="production-calendar">
            <div className="calendar-header">
                <div className="header-left">
                    <h1 className="calendar-title">Calendrier de production {format(currentDate, 'yyyy')}</h1>
                </div>
                <div className="header-right">
                    <span className="user-email">{userEmail}</span>
                    <button 
                        className="view-button"
                        onClick={handlePreviousWeek}
                    >
                        Semaine précédente
                    </button>
                    <button 
                        className={`view-button ${isCurrentWeek() ? 'active' : ''}`}
                        onClick={handleCurrentWeek}
                    >
                        Semaine courante
                    </button>
                    <button 
                        className="view-button"
                        onClick={handleNextWeek}
                    >
                        Semaine suivante
                    </button>
                </div>
            </div>

            <SimpleCalendar 
                ref={calendarRef}
                events={events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                currentDate={currentDate}
            />
            
            <AddEventModal 
                show={showAddModal}
                onHide={() => {
                    setShowAddModal(false);
                    setSelectedEvent(null);
                }}
                selectedDate={selectedDate}
                onSave={handleEventAdded}
            />

            {selectedEvent && (
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

export default ProductionCalendar; 