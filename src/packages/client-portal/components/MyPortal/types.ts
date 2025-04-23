
import { ClientDetails } from '@/packages/core/types/client';

export interface Appointment {
  id: number;
  date: string;
  time: string;
  type: string;
  therapist: string;
  rawDate?: string;
  rawTime?: string;
}

export interface TodayAppointmentsProps {
  appointments: Appointment[];
  timeZoneDisplay: string;
  showBookingButtons: boolean;
  hasAssignedDocuments: boolean;
  isLoadingVideoSession: boolean;
  onStartSession: (appointmentId: number) => void;
  onBookAppointment: () => void;
}

export interface TherapistCardProps {
  clinicianData: {
    clinician_image_url?: string;
    clinician_first_name?: string;
    clinician_last_name?: string;
    clinician_bio?: string;
  } | null;
  clinicianName: string | null;
  showBookingButtons: boolean;
  onBookAppointment: () => void;
}

export interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  timeZoneDisplay: string;
  showBookingButtons: boolean;
  onBookAppointment: () => void;
}

export interface MyPortalProps {
  upcomingAppointments: Appointment[];
  clientData: ClientDetails | null;
  clinicianName: string | null;
  loading: boolean;
}
