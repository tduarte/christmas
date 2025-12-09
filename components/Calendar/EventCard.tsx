'use client';

import Link from 'next/link';
import { CalendarEvent } from '@/lib/types/calendar';
import { Clock, MapPin, CheckCircle } from 'lucide-react';

interface EventCardProps {
  event: CalendarEvent;
  formatTime: (timeString: string) => string;
}

const initials = (name?: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return (parts[0][0] || '').toUpperCase();
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return (first + last).toUpperCase();
};

export default function EventCard({ event, formatTime }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block bg-white/95 dark:bg-neutral-950 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden border border-black/5 dark:border-white/5 hover:-translate-y-0.5"
    >
      <div className="w-full h-48 relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-neutral-100 via-neutral-50 to-white dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
                <Clock className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Photo coming soon</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-semibold shadow-sm backdrop-blur-md border border-white/20 ${
              event.type === 'dinner'
                ? 'bg-black/80 text-white'
                : 'bg-white/80 text-neutral-900'
            }`}
          >
            {event.type === 'dinner' ? 'Dinner' : 'Outing'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white line-clamp-1">
          {event.title}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-black/5 dark:border-white/5">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {formatTime(event.startTime)}
              {event.endTime && ` - ${formatTime(event.endTime)}`}
            </span>
          </div>

          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-black/5 dark:border-white/5">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">{event.location}</span>
          </div>

          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-black/5 dark:border-white/5">
              <div className="w-4 h-4 flex items-center justify-center text-[10px] font-bold">{initials(event.hostName)}</div>
            </div>
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">
              {event.hostName || 'TBD'}
            </div>
          </div>

          <div className="pt-4 mt-1 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white">{event.confirmedCount}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">confirmed</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-900 dark:text-white text-sm font-semibold group-hover:gap-2 transition-all">
              Details <span className="text-lg leading-none">›</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
