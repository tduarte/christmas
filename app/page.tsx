'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, User } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import Image from 'next/image';

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

interface User {
  id: number;
  name: string;
  email: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    selectedDate: '2024-12-24',
    startTime: '18:00',
    endTime: '21:00',
    location: '',
    locationUrl: '',
    description: '',
    type: 'dinner' as 'dinner' | 'outing',
    organizerId: '', // Will default to current user
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Poll for image updates every 5 seconds if any event has null imageUrl
  useEffect(() => {
    const hasLoadingImages = events.some(e => e.imageUrl === null);
    if (!hasLoadingImages) return;

    const interval = setInterval(() => {
      fetchData();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [events]);

  const fetchData = async () => {
    try {
      // Fetch current user
      const userRes = await fetch('/api/user');
      let currentUserId = null;
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData);
        currentUserId = userData.id;
        setFormData(prev => ({ ...prev, organizerId: userData.id.toString() }));
      }

      // Fetch events
      const eventsRes = await fetch('/api/events?startDate=2024-12-20&endDate=2024-12-30');
      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
        const res = await fetch('/api/users'); 
        if (res.ok) {
            setUsers(await res.json());
        }
    } catch (e) {
        console.error("Failed to fetch users");
    }
  };

  useEffect(() => {
      if (showAddForm) {
          fetchUsers();
      }
  }, [showAddForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Combine date and time
      const startDateTime = new Date(`${formData.selectedDate}T${formData.startTime}`);
      const endDateTime = formData.endTime ? new Date(`${formData.selectedDate}T${formData.endTime}`) : null;

      const payload = {
        title: formData.title,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime?.toISOString(),
        location: formData.location,
        locationUrl: formData.locationUrl,
        description: formData.description,
        type: formData.type,
        organizerId: formData.organizerId ? parseInt(formData.organizerId) : currentUser?.id,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddForm(false);
        // Reset form
        setFormData(prev => ({
            ...prev,
            title: '',
            location: '',
            locationUrl: '',
            description: '',
        }));
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create event', error);
    }
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = format(parseISO(event.startTime), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Generate dates Dec 20-30
  const dates = [];
  for (let i = 20; i <= 30; i++) {
    dates.push(`2024-12-${i.toString().padStart(2, '0')}`);
  }

  const formatTime = (timeString: string) => {
    return format(parseISO(timeString), 'h:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE, MMMM d');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors duration-300">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Calendar</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Add Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'dinner' | 'outing' })}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                >
                  <option value="dinner">Dinner at Home</option>
                  <option value="outing">Going Out</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                  required
                />
              </div>

              {/* Date Selection Buttons */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {dates.map((date) => {
                      const day = parseInt(date.split('-')[2]);
                      const isSelected = formData.selectedDate === date;
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setFormData({ ...formData, selectedDate: date })}
                          className={`p-2 text-sm rounded-lg border transition-all ${
                            isSelected 
                              ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          Dec {day}
                        </button>
                      );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                    />
                  </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                  required
                />
              </div>

              {/* Organizer Selection */}
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Organizer
                </label>
                <select
                  value={formData.organizerId}
                  onChange={(e) => setFormData({ ...formData, organizerId: e.target.value })}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                >
                  {users.length === 0 && <option value={currentUser?.id}>{currentUser?.name} (You)</option>}
                  {users.map(user => (
                      <option key={user.id} value={user.id}>
                          {user.name} {user.id === currentUser?.id ? '(You)' : ''}
                      </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading events...</div>
        ) : dates.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No events scheduled</div>
        ) : (
          dates.map((date) => {
            const dayEvents = groupedEvents[date] || [];
            return (
              <div key={date} className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white sticky top-[53px] bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm py-2 z-30">
                  {formatDate(date)}
                </h2>
                {dayEvents.length === 0 ? (
                  <div className="text-sm text-slate-400 dark:text-slate-500 py-4">No events</div>
                ) : (
                  <div className="space-y-4">
                    {dayEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="group block bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-800 hover:scale-[1.02] hover:border-red-200 dark:hover:border-red-900/30"
                      >
                        {/* Thumbnail on top */}
                        <div className="w-full h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
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
                          {/* Event type badge overlay */}
                          <div className="absolute top-3 right-3 z-10">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border border-white/10 ${
                              event.type === 'dinner' 
                                ? 'bg-red-500/90 text-white' 
                                : 'bg-blue-500/90 text-white'
                            }`}>
                              {event.type === 'dinner' ? '🍽️ Dinner' : '🎉 Outing'}
                            </span>
                          </div>
                          
                          {/* Gradient overlay for text legibility if we wanted text on image, but we don't right now */}
                        </div>

                        {/* Card content */}
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
                                  {/* Fake avatars for now since we don't have user images */}
                                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-red-700 dark:text-red-300 font-bold">
                                    {event.confirmedCount}
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                  confirmed
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-semibold group-hover:gap-2 transition-all">
                                Details <span className="text-lg leading-none">→</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}