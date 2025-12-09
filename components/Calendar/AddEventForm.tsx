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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-xl border-slate-200 dark:border-slate-800 sm:border border-t flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Event</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable form content */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Organizer
            </label>
            <select
              value={formData.organizerId}
              onChange={(e) => setFormData({ ...formData, organizerId: e.target.value })}
              className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
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
        </div>

        {/* Fixed bottom button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold text-base shadow-lg"
          >
            Add Event
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
