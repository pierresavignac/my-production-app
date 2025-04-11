import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { startOfWeek, addDays, addWeeks, format, isSameDay, parseISO, isSameWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import '../styles/ProductionCalendar.css';

const SimpleCalendar = forwardRef(({ events, onDateClick, onEventClick, currentDate }, ref) => {
    const weekRefs = useRef(new Map());

    const getWeeks = () => {
        const weeks = [];
        let startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        startDate = addWeeks(startDate, -2);

        for (let i = 0; i < 8; i++) {
            const weekStart = addWeeks(startDate, i);
            weeks.push({
                start: weekStart,
                days: getDaysInWeek(weekStart)
            });
        }
        return weeks;
    };

    const getDaysInWeek = (startDate) => {
        const days = [];
        for (let i = 0; i < 5; i++) {
            days.push(addDays(startDate, i));
        }
        return days;
    };

    const getEventsForDate = (date) => {
        return events.filter(event => {
            const eventDateStr = formatInTimeZone(parseISO(event.date), 'America/Montreal', 'yyyy-MM-dd');
            const calendarDateStr = formatInTimeZone(date, 'America/Montreal', 'yyyy-MM-dd');
            return eventDateStr === calendarDateStr;
        });
    };

    const renderEvent = (event) => {
        const getFirstName = (fullName) => {
            if (!fullName) return '';
            return fullName.includes(' ') ? fullName.split(' ').slice(1).join(' ') : fullName;
        };

        return (
            <div 
                key={event.id}
                className="calendar-event"
                data-type={event.type}
                data-status={event.status}
                onClick={(e) => {
                    e.stopPropagation();
                    onEventClick && onEventClick(event);
                }}
            >
                <div>{event.installation_time}</div>
                <div>{event.type}</div>
                <div>{event.full_name}</div>
                <div>{event.address}</div>
                <div>{event.city}</div>
                <div className="technicians-container">
                    {event.technician1_name && (
                        <div className="technician-name">
                            {getFirstName(event.technician1_name)}
                        </div>
                    )}
                    {event.technician2_name && (
                        <div className="technician-name">
                            {getFirstName(event.technician2_name)}
                        </div>
                    )}
                    {event.technician3_name && (
                        <div className="technician-name">
                            {getFirstName(event.technician3_name)}
                        </div>
                    )}
                    {event.technician4_name && (
                        <div className="technician-name">
                            {getFirstName(event.technician4_name)}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const isCurrentWeek = (weekStart) => {
        const today = new Date();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return today >= weekStart && today <= weekEnd;
    };

    useImperativeHandle(ref, () => ({
        scrollToWeek(targetDate) {
            console.log('[SimpleCalendar] Demande de défilement vers la semaine de:', targetDate);
            const targetWeekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
            const targetWeekKey = format(targetWeekStart, 'yyyy-MM-dd');
            
            const weekElementRef = weekRefs.current.get(targetWeekKey);
            if (weekElementRef && weekElementRef.current) {
                console.log('[SimpleCalendar] Élément semaine trouvé, défilement...');
                weekElementRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                console.warn('[SimpleCalendar] Élément pour la semaine cible non trouvé dans les refs:', targetWeekKey);
            }
        }
    }));

    return (
        <div className="calendar-container">
            {getWeeks().map((week, weekIndex) => {
                const weekKey = format(week.start, 'yyyy-MM-dd');
                
                if (!weekRefs.current.has(weekKey)) {
                    weekRefs.current.set(weekKey, React.createRef());
                }
                const currentWeekRef = weekRefs.current.get(weekKey);
                
                const isActualCurrentWeek = isSameWeek(week.start, new Date(), { weekStartsOn: 1 });

                return (
                    <div 
                        key={weekKey}
                        ref={currentWeekRef}
                        className={`week-section ${isActualCurrentWeek ? 'current-week' : ''}`}
                    >
                        <div className="week-header">
                            <h2>
                                Semaine du {format(week.start, 'PPP', { locale: fr })}
                                {'   '}
                                <button 
                                    className="weekend-button-small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const saturday = addDays(week.start, 5);
                                        onDateClick(saturday);
                                    }}
                                >
                                    S
                                </button>
                                <button 
                                    className="weekend-button-small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const sunday = addDays(week.start, 6);
                                        onDateClick(sunday);
                                    }}
                                >
                                    D
                                </button>
                            </h2>
                        </div>
                        <div className="week-container">
                            {week.days.map((date, dayIndex) => {
                                const isToday = isSameDay(date, new Date());
                                return (
                                    <div 
                                        key={dayIndex} 
                                        className={`day-block ${isToday ? 'current-day' : ''}`}
                                        onClick={() => onDateClick(date)}
                                    >
                                        <h3>
                                            {format(date, 'EEEE d', { locale: fr })}
                                            <Button className="add-inline-button">+</Button>
                                        </h3>
                                        {getEventsForDate(date).map(event => renderEvent(event))}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="weekend-container">
                            {(() => {
                                const saturday = addDays(week.start, 5);
                                const sunday = addDays(week.start, 6);
                                const saturdayEvents = getEventsForDate(saturday);
                                const sundayEvents = getEventsForDate(sunday);

                                return (
                                    <>
                                        {saturdayEvents.length > 0 && (
                                            <div 
                                                className="weekend-day-block"
                                                onClick={() => onDateClick(saturday)}
                                            >
                                                <h3>
                                                    {saturday.toLocaleDateString('fr-FR', { 
                                                        weekday: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                    <Button className="add-inline-button">+</Button>
                                                </h3>
                                                {saturdayEvents.map(event => renderEvent(event))}
                                            </div>
                                        )}
                                        {sundayEvents.length > 0 && (
                                            <div 
                                                className="weekend-day-block"
                                                onClick={() => onDateClick(sunday)}
                                            >
                                                <h3>
                                                    {sunday.toLocaleDateString('fr-FR', { 
                                                        weekday: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                    <Button className="add-inline-button">+</Button>
                                                </h3>
                                                {sundayEvents.map(event => renderEvent(event))}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default SimpleCalendar; 