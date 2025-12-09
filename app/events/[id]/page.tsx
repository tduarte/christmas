'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, format, parseISO } from 'date-fns';
import { Clock, MapPin, Users, ArrowLeft, ExternalLink, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface MinimalUser {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface EventDetail {
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
  host: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  attendees: Array<{
    id: number;
    userId: number;
    status: 'confirmed' | 'maybe' | 'no';
    userName: string;
    userEmail: string;
    userAvatarUrl?: string | null;
  }>;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState<'confirmed' | 'maybe' | 'no' | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string } | null>(null);
  const [allUsers, setAllUsers] = useState<MinimalUser[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    selectedDate: '',
    startTime: '18:00',
    endTime: '',
    location: '',
    locationUrl: '',
    description: '',
    type: 'dinner' as 'dinner' | 'outing',
    regenerateImage: false,
    hostId: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      // Fetch current user first
      try {
        const [userRes, usersRes] = await Promise.all([fetch('/api/user'), fetch('/api/users')]);
        if (userRes.ok) {
          const user = await userRes.json();
          setCurrentUser(user);
        }
        if (usersRes.ok) {
          const all = await usersRes.json();
          setAllUsers(all);
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

  const handleEditClick = () => {
    if (!event) return;
    setEditFormData({
      title: event.title,
      selectedDate: format(parseISO(event.startTime), 'yyyy-MM-dd'),
      startTime: format(parseISO(event.startTime), 'HH:mm'),
      endTime: event.endTime ? format(parseISO(event.endTime), 'HH:mm') : '',
      location: event.location,
      locationUrl: event.locationUrl || '',
      description: event.description || '',
      type: event.type,
      regenerateImage: false,
      hostId: event.hostId,
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    const startDateTime = new Date(`${editFormData.selectedDate || format(parseISO(event!.startTime), 'yyyy-MM-dd')}T${editFormData.startTime}`);
    const endDateTime = editFormData.endTime
      ? new Date(`${editFormData.selectedDate || format(parseISO(event!.startTime), 'yyyy-MM-dd')}T${editFormData.endTime}`)
      : null;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime?.toISOString(),
          hostId: editFormData.hostId || currentUser?.id,
        }),
      });

      if (res.ok) {
        setShowEditForm(false);
        fetchEvent(eventId);
      }
    } catch (error) {
      console.error('Failed to update event', error);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete event', error);
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
      <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)] pb-20">
        <div className="p-5">
          <div className="text-center py-12 text-neutral-400">Loading event...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)] pb-20">
        <div className="p-5">
          <div className="text-center py-12 text-neutral-400">Event not found</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const confirmedAttendees = event.attendees.filter(a => a.status === 'confirmed');
  const maybeAttendees = event.attendees.filter(a => a.status === 'maybe');
  const noAttendees = event.attendees.filter(a => a.status === 'no');
  const attendeeIds = new Set(event.attendees.map(a => a.userId));
  const notResponded = allUsers.filter(u => !attendeeIds.has(u.id));
  const isHost = currentUser && event.hostId === currentUser.id;
  const dateOptions = event
    ? Array.from({ length: 8 }, (_, i) =>
        format(addDays(parseISO(event.startTime), i - 1), 'yyyy-MM-dd'),
      )
    : [];

  const initials = (name?: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return (parts[0][0] || '').toUpperCase();
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)] pb-20">
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-black/85 border-b border-black/5 dark:border-white/10 px-5 py-4 flex items-center gap-3 backdrop-blur-xl">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white leading-snug flex-1 text-center">Event</h1>
          {isHost && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditClick}
                className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center overflow-hidden p-0 sm:p-4">
          <div className="bg-white dark:bg-neutral-950 w-full h-full sm:h-auto sm:max-w-md sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/10 flex flex-col sm:max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Edit Event</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    Type
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as 'dinner' | 'outing' })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-colors"
                  >
                    <option value="dinner">Dinner at Home</option>
                    <option value="outing">Going Out</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    Date
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {dateOptions.map(date => {
                      const day = parseInt(date.split('-')[2], 10);
                      const isSelected = editFormData.selectedDate === date;
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, selectedDate: date })}
                          className={`p-2.5 text-sm rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm dark:bg-white dark:text-black dark:border-white'
                              : 'bg-white dark:bg-neutral-900 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {format(parseISO(date), 'MMM')} {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                      Start Time
                    </label>
                    <select
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none"
                      required
                    >
                      {Array.from({ length: 48 }, (_, i) => {
                        const hour = Math.floor(i / 2);
                        const minute = (i % 2) * 30;
                        const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                        const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minute
                          .toString()
                          .padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
                        return (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                      End Time (optional)
                    </label>
                    <select
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none"
                    >
                      <option value="">—</option>
                      {Array.from({ length: 48 }, (_, i) => {
                        const hour = Math.floor(i / 2);
                        const minute = (i % 2) * 30;
                        const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                        const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minute
                          .toString()
                          .padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
                        return (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    Location URL (Google Maps/Yelp)
                  </label>
                  <input
                    type="url"
                    value={editFormData.locationUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, locationUrl: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    Host
                  </label>
                  <select
                    value={editFormData.hostId?.toString() ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, hostId: parseInt(e.target.value, 10) })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none"
                  >
                    {allUsers.map(user => (
                      <option key={user.id} value={user.id.toString()}>
                        {user.name} {currentUser?.id === user.id ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 p-3 bg-neutral-100/80 dark:bg-neutral-900/60 rounded-xl border border-black/5 dark:border-white/5">
                  <input
                    type="checkbox"
                    id="regenerateImage"
                    checked={editFormData.regenerateImage}
                    onChange={(e) => setEditFormData({ ...editFormData, regenerateImage: e.target.checked })}
                    className="w-4 h-4 text-neutral-900 bg-white border-black/10 rounded focus:ring-neutral-900 dark:focus:ring-white/40 dark:bg-neutral-900 dark:border-white/20 focus:ring-2"
                  />
                  <label htmlFor="regenerateImage" className="text-sm text-neutral-700 dark:text-neutral-200">
                    Regenerate AI image (takes ~10-15 seconds)
                  </label>
                </div>
              </div>

              <div className="p-5 pb-7 border-t border-black/5 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md safe-area-inset-bottom">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#34C759] text-black hover:bg-[#2EC254] dark:bg-[#30D158] dark:hover:bg-[#2BC451] transition-colors font-semibold text-base shadow-lg shadow-black/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-5 space-y-6">
        <div className="bg-white/95 dark:bg-neutral-950 rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{event.title}</h2>
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-black border border-black/5 dark:border-white/10">
              {event.type === 'dinner' ? 'Dinner' : 'Outing'}
            </div>
          </div>

          <div className="space-y-3 text-neutral-700 dark:text-neutral-300">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 mt-0.5 text-neutral-400" />
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white">{formatDateTime(event.startTime)}</div>
                {event.endTime && (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Until {formatTime(event.endTime)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 text-neutral-400" />
              <div className="flex-1">
                <div className="font-semibold text-neutral-900 dark:text-white">{event.location}</div>
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-700 dark:text-neutral-200 hover:underline flex items-center gap-1 mt-1"
                >
                  Get Directions <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {event.description && (
              <div className="pt-2 border-t border-black/5 dark:border-white/10">
                <p className="text-sm text-neutral-700 dark:text-neutral-200">{event.description}</p>
              </div>
            )}

            <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {event.host.avatarUrl ? (
                    <img src={event.host.avatarUrl} alt={event.host.name} className="w-full h-full object-cover" />
                  ) : (
                    event.host.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  )}
                </div>
                <div className="text-sm">
                  <span className="block font-semibold text-neutral-900 dark:text-white">{event.host.name}</span>
                  <span className="text-neutral-500 dark:text-neutral-400">Host</span>
                </div>
              </div>
              <Users className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-neutral-950 rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-[0_8px_25px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Attendance
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'confirmed', label: 'Going', icon: CheckCircle },
              { key: 'maybe', label: 'Maybe', icon: Users },
              { key: 'no', label: 'Nope', icon: XCircle },
            ].map((option) => {
              const Icon = option.icon;
              const active = myStatus === option.key;
              const activeClass =
                option.key === 'confirmed'
                  ? 'bg-[#34C759] dark:bg-[#30D158] text-black'
                  : option.key === 'maybe'
                  ? 'bg-[#FF9500] dark:bg-[#FF9F0A] text-black'
                  : 'bg-[#FF3B30] dark:bg-[#FF453A] text-white';
              return (
                <button
                  key={option.key}
                  onClick={() => updateAttendance(option.key as 'confirmed' | 'maybe' | 'no')}
                  className={`py-3 px-3 rounded-2xl border text-sm font-semibold flex flex-col items-center gap-1 transition-all ${
                    active
                      ? `${activeClass} border-transparent shadow-sm`
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 border-black/5 dark:border-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white/95 dark:bg-neutral-950 rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-[0_8px_25px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Attendees ({confirmedAttendees.length})
          </h3>

          {confirmedAttendees.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Going ({confirmedAttendees.length})
              </div>
              {confirmedAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/70 border border-black/5 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {attendee.userAvatarUrl ? (
                        <img src={attendee.userAvatarUrl} alt={attendee.userName} className="w-full h-full object-cover" />
                      ) : (
                        initials(attendee.userName)
                      )}
                    </div>
                    <span className="text-neutral-900 dark:text-white">{attendee.userName}</span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                </div>
              ))}
            </div>
          )}

          {maybeAttendees.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Maybe ({maybeAttendees.length})
              </div>
              {maybeAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900/70 border border-black/5 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {attendee.userAvatarUrl ? (
                        <img src={attendee.userAvatarUrl} alt={attendee.userName} className="w-full h-full object-cover" />
                      ) : (
                        initials(attendee.userName)
                      )}
                    </div>
                    <span className="text-neutral-900 dark:text-white">{attendee.userName}</span>
                  </div>
                  <Users className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                </div>
              ))}
            </div>
          )}

          {noAttendees.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Can't Go ({noAttendees.length})
              </div>
              {noAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900/70 border border-black/5 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {attendee.userAvatarUrl ? (
                        <img src={attendee.userAvatarUrl} alt={attendee.userName} className="w-full h-full object-cover" />
                      ) : (
                        initials(attendee.userName)
                      )}
                    </div>
                    <span className="text-neutral-900 dark:text-white">{attendee.userName}</span>
                  </div>
                  <XCircle className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                </div>
              ))}
            </div>
          )}

          {confirmedAttendees.length === 0 && maybeAttendees.length === 0 && noAttendees.length === 0 && (
            <div className="text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
              No attendees yet
            </div>
          )}

          {notResponded.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Not answered ({notResponded.length})
              </div>
              {notResponded.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900/70 border border-black/5 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {attendee.avatarUrl ? (
                        <img src={attendee.avatarUrl} alt={attendee.name} className="w-full h-full object-cover" />
                      ) : (
                        initials(attendee.name)
                      )}
                    </div>
                    <span className="text-neutral-900 dark:text-white">{attendee.name}</span>
                  </div>
                  <Users className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
