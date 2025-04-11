import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const BlockView = ({ 
  weeks, 
  events, 
  handleDateClick, 
  handleEventClick, 
  isCurrentWeek, 
  isCurrentDay,
  getEventsForDay,
  formatDayHeader,
  user 
}) => {
  const hasEditRights = true; // À ajuster selon vos besoins

  if (!Array.isArray(weeks)) {
    console.error('weeks doit être un tableau');
    return null;
  }

  return (
    <div className="block-view">
      {weeks.map((week, weekIndex) => {
        if (!Array.isArray(week)) {
          console.error('Chaque semaine doit être un tableau de dates');
          return null;
        }

        // S'assurer que nous avons des dates valides pour le début et la fin de la semaine
        const start = week[0];
        const end = week[week.length - 1];

        if (!start || !end || !(start instanceof Date) || !(end instanceof Date)) {
          console.error('Dates de semaine invalides:', { start, end });
          return null;
        }

        // Calculer samedi et dimanche
        const saturday = new Date(end);
        saturday.setDate(saturday.getDate() + 1);
        const sunday = new Date(saturday);
        sunday.setDate(sunday.getDate() + 1);

        return (
          <div 
            className={`week-section ${isCurrentWeek(start) ? 'current-week' : ''}`}
            key={start.getTime()}
          >
            <div className="week-header">
              <h2>
                Semaine du {format(start, 'dd MMMM', { locale: fr })} au {format(end, 'dd MMMM yyyy', { locale: fr })}
                <div className="weekend-controls">
                  <button 
                    className="weekend-button-small"
                    onClick={() => handleDateClick(saturday)}
                  >
                    S
                  </button>
                  <button 
                    className="weekend-button-small"
                    onClick={() => handleDateClick(sunday)}
                  >
                    D
                  </button>
                </div>
              </h2>
            </div>

            <div className="week-container">
              {week.map((day, dayIndex) => {
                if (!day || !(day instanceof Date)) {
                  console.error('Date invalide dans la semaine:', day);
                  return null;
                }

                const dayEvents = getEventsForDay(day) || [];
                
                return (
                  <div 
                    className={`day-block ${isCurrentDay(day) ? 'current-day' : ''}`}
                    key={`${start.getTime()}-${dayIndex}`}
                    onClick={() => handleDateClick(day)}
                  >
                    <h3>
                      <span className="day-header">
                        {formatDayHeader(day)}
                        <button 
                          className="add-inline-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateClick(day);
                          }}
                        >
                          +
                        </button>
                      </span>
                    </h3>
                    <div className="events-container">
                      {Array.isArray(dayEvents) && dayEvents.map((event, eventIndex) => {
                        // Logs détaillés pour déboguer
                        console.log('=== Détails de l\'événement ===');
                        console.log('ID:', event.id);
                        console.log('Type:', event.type);
                        console.log('Technicien 1:', event.technician1_name);
                        console.log('Technicien 2:', event.technician2_name);
                        console.log('Technicien 3:', event.technician3_name);
                        console.log('Technicien 4:', event.technician4_name);
                        
                        return (
                          <div
                            key={`${event.id || eventIndex}`}
                            className="calendar-event"
                            data-type={event.type}
                            data-status={event.installation_status}
                            data-has-edit-rights={hasEditRights}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            <div>{event.installation_time}</div>
                            <div>{event.type}</div>
                            <div>{event.full_name}</div>
                            <div>{event.address}</div>
                            <div>{event.city}</div>
                            <div className="technicians-container" style={{border: '1px solid red'}}>
                              {event.technician1_name && (
                                <div className="technician-name" style={{border: '1px solid blue'}}>
                                  {event.technician1_name}
                                </div>
                              )}
                              {event.technician2_name && (
                                <div className="technician-name" style={{border: '1px solid blue'}}>
                                  {event.technician2_name}
                                </div>
                              )}
                              {event.technician3_name && (
                                <div className="technician-name" style={{border: '1px solid blue'}}>
                                  {event.technician3_name}
                                </div>
                              )}
                              {event.technician4_name && (
                                <div className="technician-name" style={{border: '1px solid blue'}}>
                                  {event.technician4_name}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BlockView;