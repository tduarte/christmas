'use client';

import { Dispatch, FormEvent, SetStateAction } from 'react';
import { AddEventFormData, CalendarUser } from '@/lib/types/calendar';
import { X } from 'lucide-react';

interface AddEventFormProps {
  formData: AddEventFormData;
  setFormData: Dispatch<SetStateAction<AddEventFormData>>;
  users: CalendarUser[];
  currentUser: CalendarUser | null;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  dates: string[];
}

export default function AddEventForm({
  formData,
  setFormData,
  users,
  currentUser,
  onClose,
  onSubmit,
  dates,
}: AddEventFormProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center overflow-hidden"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-neutral-950 w-full h-full sm:h-auto sm:max-w-md sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/10 flex flex-col sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Add Event</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable form content */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'dinner' | 'outing' | 'activity' | 'breakfast' | 'lunch' })}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-colors"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="activity">Activity</option>
              <option value="outing">Going Out</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
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
                    className={`p-2.5 text-sm rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm dark:bg-white dark:text-black dark:border-white'
                        : 'bg-white dark:bg-neutral-900 border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    Dec {day}
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
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-colors"
                required
              >
                {Array.from({ length: 48 }, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const minute = (i % 2) * 30;
                  const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
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
                End Time
              </label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-colors"
              >
                {Array.from({ length: 48 }, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const minute = (i % 2) * 30;
                  const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
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
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Organizer
            </label>
            <select
              value={formData.organizerId}
              onChange={(e) => setFormData({ ...formData, organizerId: e.target.value })}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-colors"
            >
              {users.length === 0 && (
                <option value={currentUser?.id?.toString() ?? ''}>
                  {currentUser?.name} (You)
                </option>
              )}
              {users.map((user) => (
                <option key={user.id} value={user.id.toString()}>
                  {user.name} {user.id === currentUser?.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-colors"
              rows={3}
            />
          </div>
        </div>

        {/* Fixed bottom button */}
        <div className="p-5 border-t border-black/5 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md">
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#34C759] text-black hover:bg-[#2EC254] dark:bg-[#30D158] dark:hover:bg-[#2BC451] transition-all font-semibold text-base shadow-lg shadow-black/10"
          >
            Save Event
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
