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

      // Fetch all users for organizer dropdown
      // We don't have a dedicated "list users" endpoint yet, but we can assume we might need one.
      // Or we can just fetch gifts endpoint which returns users info? No, that's hacky.
      // Let's assume we need to create one or just use what we have.
      // Actually, we don't have a public endpoint to list all users. 
      // I'll create a simple fetch for the form logic or assume I can get it.
      // Let's skip fetching all users for now and just handle the current user, 
      // BUT the requirement says "Organizer in case is not yourself".
      // I'll assume we can create an endpoint or reuse logic.
      // For now, I'll fetch events and current user.
      
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

  // We need to fetch all users for the organizer dropdown
  // Since we don't have a direct endpoint, I'll add a quick fetch here assuming we'll add the endpoint later or modify an existing one.
  // Actually, I should probably add the endpoint. But for now, let's proceed.
  // Wait, I can't select other users if I don't have them. 
  // I will assume I need to fetch them. I'll add a call to /api/users (plural) if it existed.
  // Since it doesn't, I'll add a TODO or just fetch from /api/attendees if possible? No.
  // Let's implement a quick user list fetch inside the component if the user opens the form?
  // I'll fetch users when the form opens.

  const fetchUsers = async () => {
    // This endpoint doesn't exist yet, I'll need to create it or similar.
    // For this plan, I'll create a minimal route in `app/api/users/route.ts` later or now.
    // I'll just use a placeholder for now and implement the endpoint in the next step or same step.
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
    <div className="min-h-screen pb-20">
      <div className="header-bg sticky top-0 z-10 border-b border-gray-700/50 px-4 py-4 flex items-center justify-between shadow-lg">
        <h1 className="text-2xl font-bold text-white">🎄 Calendar</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg hover:shadow-red-600/50 hover:scale-105"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-bg rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">✨ Add Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'dinner' | 'outing' })}
                  className="w-full rounded-xl border p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  <option value="dinner">Dinner at Home</option>
                  <option value="outing">Going Out</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Date Selection Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                          className={`p-2.5 text-sm font-medium rounded-xl border transition-all ${
                            isSelected 
                              ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/30 scale-105' 
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-red-400'
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full rounded-xl border p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full rounded-xl border p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-xl border p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Organizer Selection */}
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organizer
                </label>
                <select
                  value={formData.organizerId}
                  onChange={(e) => setFormData({ ...formData, organizerId: e.target.value })}
                  className="w-full rounded-xl border p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all font-semibold shadow-lg hover:shadow-red-600/50 hover:scale-[1.02]"
                >
                  ✨ Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-4 space-y-8 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading events...</p>
          </div>
        ) : dates.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No events scheduled</div>
        ) : (
          dates.map((date) => {
            const dayEvents = groupedEvents[date] || [];
            return (
              <div key={date} className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white sticky top-[72px] py-3 z-[5]" style={{ background: 'var(--background)' }}>
                  {formatDate(date)}
                </h2>
                {dayEvents.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-4 pl-2">No events</div>
                ) : (
                  <div className="space-y-4">
                    {dayEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="group card-bg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border hover:scale-[1.02] hover:border-red-400 dark:hover:border-red-600"
                      >
                        {/* Thumbnail on top */}
                        <div className="w-full h-48 relative overflow-hidden bg-gradient-to-br from-red-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
                          {event.imageUrl ? (
                            <img 
                              src={event.imageUrl} 
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-100 via-green-100 to-red-100 dark:from-red-900/20 dark:via-green-900/20 dark:to-red-900/20 animate-pulse flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-12 h-12 border-4 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-3">Generating image...</p>
                                <p className="text-xs text-red-600/60 dark:text-red-400/60 mt-1">~10-15 seconds</p>
                              </div>
                            </div>
                          )}
                          {/* Event type badge overlay */}
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                              event.type === 'dinner' 
                                ? 'bg-red-500/90 text-white' 
                                : 'bg-blue-500/90 text-white'
                            }`}>
                              {event.type === 'dinner' ? '🍽️ Dinner' : '🎉 Outing'}
                            </span>
                          </div>
                        </div>

                        {/* Card content */}
                        <div className="p-5">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">
                            {event.title}
                          </h3>
                          
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                              <Clock className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {formatTime(event.startTime)}
                                {event.endTime && ` - ${formatTime(event.endTime)}`}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                              <MapPin className="w-5 h-5" />
                              <span className="text-sm font-medium line-clamp-1">{event.location}</span>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {event.confirmedCount} confirmed
                                </span>
                              </div>
                              <div className="text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform">
                                <span className="text-sm font-medium">View →</span>
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
