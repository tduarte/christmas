'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import AddEventForm from '@/components/Calendar/AddEventForm';
import EventCard from '@/components/Calendar/EventCard';
import { AddEventFormData, CalendarEvent, CalendarUser } from '@/lib/types/calendar';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<CalendarUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<CalendarUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<AddEventFormData>({
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showAddForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddForm]);

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
      const eventsRes = await fetch('/api/events?startDate=2024-12-20&endDate=2024-12-27');
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
  }, {} as Record<string, CalendarEvent[]>);

  // Generate dates Dec 20-27
  const dates = [];
  for (let i = 20; i <= 27; i++) {
    dates.push(`2024-12-${i.toString().padStart(2, '0')}`);
  }

  const formatTime = (timeString: string) => {
    return format(parseISO(timeString), 'h:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE, MMMM d');
  };

  const openAddForm = (date?: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDate: date ?? prev.selectedDate,
    }));
    setShowAddForm(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)] pb-20 transition-colors duration-300">
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-5 py-3.5 flex items-center justify-between transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white leading-snug">🎄 Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddForm()}
            className="p-2.5 rounded-full bg-[#34C759] text-black hover:bg-[#2EC254] active:scale-95 transition-all shadow-sm dark:bg-[#30D158] dark:hover:bg-[#2BC451]"
            aria-label="Add event"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddEventForm
          formData={formData}
          setFormData={setFormData}
          users={users}
          currentUser={currentUser}
          onClose={() => setShowAddForm(false)}
          onSubmit={handleSubmit}
          dates={dates}
        />
      )}

      <div className="p-5 space-y-8">
        {loading ? (
          <div className="text-center py-12 text-neutral-400">Loading events...</div>
        ) : dates.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">No events scheduled</div>
        ) : (
          dates.map((date) => {
            const dayEvents = groupedEvents[date] || [];
            return (
              <div key={date} className="space-y-2">
                <div className="sticky top-[64px] bg-[var(--background)]/95 dark:bg-[var(--background)]/95 backdrop-blur-sm py-3 -mx-5 px-5 z-30">
                  <p className="text-xs uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                    {format(parseISO(date), 'MMMM d')}
                  </p>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                    {format(parseISO(date), 'EEEE')}
                  </h2>
                </div>
                {dayEvents.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">No events</span>
                    <button
                      onClick={() => openAddForm(date)}
                      className="text-xs font-semibold text-neutral-900 dark:text-white px-3 py-1.5 rounded-full border border-black/10 dark:border-white/20 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Add event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dayEvents.map((event) => (
                      <EventCard key={event.id} event={event} formatTime={formatTime} />
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
