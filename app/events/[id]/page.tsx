'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Clock, MapPin, Users, ArrowLeft, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';

interface EventDetail {
  id: number;
  title: string;
  startTime: string;
  endTime: string | null;
  location: string;
  locationUrl: string | null;
  description: string | null;
  hostId: number;
  type: 'dinner' | 'outing';
  host: {
    id: number;
    name: string;
    email: string;
  };
  attendees: Array<{
    id: number;
    userId: number;
    status: 'confirmed' | 'maybe' | 'no';
    userName: string;
    userEmail: string;
  }>;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState<'confirmed' | 'maybe' | 'no' | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Fetch current user first
      try {
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const user = await userRes.json();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
      }

      // Then fetch event
      const p = await params;
      setEventId(p.id);
      await fetchEvent(p.id);
    };
    
    loadData();
  }, [params]);

  const fetchEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        
        // Find my status using current user ID
        if (currentUser) {
          const myAttendee = data.attendees.find((a: any) => a.userId === currentUser.id);
          if (myAttendee) {
            setMyStatus(myAttendee.status);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch event', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && event) {
      const myAttendee = event.attendees.find((a) => a.userId === currentUser.id);
      if (myAttendee) {
        setMyStatus(myAttendee.status);
      }
    }
  }, [currentUser, event]);

  const updateAttendance = async (status: 'confirmed' | 'maybe' | 'no') => {
    if (!eventId) return;
    
    try {
      const res = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: parseInt(eventId),
          status,
        }),
      });

      if (res.ok) {
        setMyStatus(status);
        fetchEvent(eventId);
      }
    } catch (error) {
      console.error('Failed to update attendance', error);
    }
  };

  const formatTime = (timeString: string) => {
    return format(parseISO(timeString), 'h:mm a');
  };

  const formatDateTime = (timeString: string) => {
    return format(parseISO(timeString), 'EEEE, MMMM d, yyyy • h:mm a');
  };

  const getDirectionsUrl = () => {
    if (event?.locationUrl) {
      return event.locationUrl;
    }
    // Fallback to Google Maps search
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.location || '')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="p-4">
          <div className="text-center py-12 text-gray-400">Loading event...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="p-4">
          <div className="text-center py-12 text-gray-400">Event not found</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const confirmedAttendees = event.attendees.filter(a => a.status === 'confirmed');
  const maybeAttendees = event.attendees.filter(a => a.status === 'maybe');
  const noAttendees = event.attendees.filter(a => a.status === 'no');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">Event Details</h1>
        <ThemeToggle />
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              event.type === 'dinner'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
            }`}>
              {event.type === 'dinner' ? 'Dinner' : 'Outing'}
            </div>
          </div>

          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 mt-0.5 text-gray-400" />
              <div>
                <div className="font-medium">{formatDateTime(event.startTime)}</div>
                {event.endTime && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Until {formatTime(event.endTime)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium">{event.location}</div>
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 mt-1"
                >
                  Get Directions <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {event.description && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm">{event.description}</p>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Hosted by </span>
                <span className="font-medium">{event.host.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Attendance
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => updateAttendance('confirmed')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                myStatus === 'confirmed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Going
            </button>
            <button
              onClick={() => updateAttendance('maybe')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                myStatus === 'maybe'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Maybe
            </button>
            <button
              onClick={() => updateAttendance('no')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                myStatus === 'no'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <XCircle className="w-4 h-4 inline mr-1" />
              Can't Go
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Attendees ({confirmedAttendees.length})
          </h3>

          {confirmedAttendees.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                Going ({confirmedAttendees.length})
              </div>
              {confirmedAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-900 dark:text-white">{attendee.userName}</span>
                </div>
              ))}
            </div>
          )}

          {maybeAttendees.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                Maybe ({maybeAttendees.length})
              </div>
              {maybeAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
                >
                  <span className="text-gray-900 dark:text-white">{attendee.userName}</span>
                </div>
              ))}
            </div>
          )}

          {noAttendees.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                Can't Go ({noAttendees.length})
              </div>
              {noAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20"
                >
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-gray-900 dark:text-white">{attendee.userName}</span>
                </div>
              ))}
            </div>
          )}

          {confirmedAttendees.length === 0 && maybeAttendees.length === 0 && noAttendees.length === 0 && (
            <div className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
              No attendees yet
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

