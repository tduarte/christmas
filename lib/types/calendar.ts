export interface CalendarEvent {
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

export interface CalendarUser {
  id: number;
  name: string;
  email: string;
}

export interface AddEventFormData {
  title: string;
  selectedDate: string;
  startTime: string;
  endTime: string;
  location: string;
  locationUrl: string;
  description: string;
  type: 'dinner' | 'outing';
  organizerId: string;
}
