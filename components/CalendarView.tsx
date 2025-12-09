'use client';

import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useState, useCallback, useEffect } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { MapPin, Users } from 'lucide-react';

// Setup localizer
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface Event {
  id: number;
  title: string;
  startTime: string;
  endTime: string | null;
  location: string;
  locationUrl: string | null;
  description: string | null;
  hostId: number;
  organizerId: number | null;
  imageUrl: string | null;
  type: 'dinner' | 'outing';
  confirmedCount: number;
}

interface CalendarViewProps {
  events: Event[];
  onEventUpdate: (event: Event, start: Date, end: Date) => void;
  onEventClick: (event: Event) => void;
  onSlotSelect: (start: Date, end: Date) => void;
}

export default function CalendarView({ events, onEventUpdate, onEventClick, onSlotSelect }: CalendarViewProps) {
  // Map our Event type to RBC events
  const [myEvents, setMyEvents] = useState<any[]>([]);

  useEffect(() => {
    setMyEvents(events.map(event => ({
      ...event,
      start: parseISO(event.startTime),
      end: event.endTime ? parseISO(event.endTime) : new Date(new Date(event.startTime).getTime() + 60 * 60 * 1000), // Default 1h
      resource: event,
    })));
  }, [events]);

  const moveEvent = useCallback(
    ({ event, start, end, isAllDay: droppedOnAllDaySlot = false }: any) => {
      const { allDay } = event;
      if (!allDay && droppedOnAllDaySlot) {
        event.allDay = true;
      }
      if (allDay && !droppedOnAllDaySlot) {
        event.allDay = false;
      }

      onEventUpdate(event.resource, start, end);
    },
    [onEventUpdate]
  );

  const resizeEvent = useCallback(
    ({ event, start, end }: any) => {
      onEventUpdate(event.resource, start, end);
    },
    [onEventUpdate]
  );

  const handleSelectSlot = useCallback(
    ({ start, end }: any) => {
      onSlotSelect(start, end);
    },
    [onSlotSelect]
  );

  const handleSelectEvent = useCallback(
    (event: any) => {
      onEventClick(event.resource);
    },
    [onEventClick]
  );

  // Custom Event Component
  const EventComponent = ({ event }: any) => {
    const data = event.resource as Event;
    return (
      <div className="h-full w-full relative overflow-hidden rounded-md group">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
           {data.imageUrl ? (
             <img src={data.imageUrl} alt="" className="w-full h-full object-cover" />
           ) : (
             <div className={`w-full h-full ${data.type === 'dinner' ? 'bg-red-500' : 'bg-blue-500'}`} />
           )}
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-1 text-xs">
          <div className="font-bold truncate">{event.title}</div>
          <div className="flex items-center gap-1 mt-1 opacity-80">
             <MapPin className="w-3 h-3" />
             <span className="truncate">{data.location}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-xl shadow-sm p-2">
      <DnDCalendar
        defaultView={Views.DAY}
        views={[Views.DAY, Views.WEEK]}
        step={30}
        defaultDate={new Date(2024, 11, 24)} // Dec 24 2024
        localizer={localizer}
        events={myEvents}
        onEventDrop={moveEvent}
        onEventResize={resizeEvent}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        resizable
        components={{
          event: EventComponent
        }}
        style={{ height: '100%' }}
        className="dark:text-slate-200"
      />
    </div>
  );
}
