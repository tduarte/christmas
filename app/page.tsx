'use client';

import CalendarView from '@/components/CalendarView';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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

  const handleEventUpdate = async (event: Event, start: Date, end: Date) => {
    try {
      // Optimistic update
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, startTime: start.toISOString(), endTime: end.toISOString() } : e));

      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: event.title,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          location: event.location,
          type: event.type,
          regenerateImage: false // Don't regenerate on simple move
        }),
      });

      if (!res.ok) {
        // Revert on failure
        fetchData(); 
        console.error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event', error);
      fetchData();
    }
  };

  const handleSlotSelect = (start: Date, end: Date) => {
    setFormData({
      ...formData,
      selectedDate: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
    });
    setShowAddForm(true);
  };

  const handleEventClick = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  // Generate dates Dec 20-27 for tabs? No, CalendarView handles navigation better.
  // But user might want quick jumps.
  // I'll keep the date tabs? The CalendarView is a full replacement.
  // I'll remove the list view logic.

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300 flex flex-col h-screen overflow-hidden">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
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

              {/* Date Selection - simplified for modal since we have calendar now */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.selectedDate}
                  onChange={(e) => setFormData({ ...formData, selectedDate: e.target.value })}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                  required
                />
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

      <div className="flex-1 p-2 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading calendar...</div>
        ) : (
          <CalendarView 
            events={events} 
            onEventUpdate={handleEventUpdate}
            onEventClick={handleEventClick}
            onSlotSelect={handleSlotSelect}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}