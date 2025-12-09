'use client';

import Link from 'next/link';
import { CalendarEvent } from '@/lib/types/calendar';
import { Clock, MapPin, CheckCircle } from 'lucide-react';

interface EventCardProps {
  event: CalendarEvent;
  formatTime: (timeString: string) => string;
}

export default function EventCard({ event, formatTime }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-800 hover:scale-[1.02] hover:border-red-200 dark:hover:border-red-900/30"
    >
      <div className="w-full h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-700">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-50 via-slate-50 to-red-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-red-500 dark:border-red-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-3">Creating magic...</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border border-white/10 ${
              event.type === 'dinner' ? 'bg-red-500/90 text-white' : 'bg-blue-500/90 text-white'
            }`}
          >
            {event.type === 'dinner' ? '🍽️ Dinner' : '🎉 Outing'}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">
              {formatTime(event.startTime)}
              {event.endTime && ` - ${formatTime(event.endTime)}`}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium line-clamp-1">{event.location}</span>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-red-700 dark:text-red-300 font-bold">
                  {event.confirmedCount}
                </div>
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">confirmed</span>
            </div>
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-semibold group-hover:gap-2 transition-all">
              Details <span className="text-lg leading-none">→</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
