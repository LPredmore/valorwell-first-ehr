import { EventInput } from '@fullcalendar/core';
import { AppointmentStatus, AppointmentTypeEnum } from './appointmentEnums';

export interface Client {
  id: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  client_phone_number: string;
  client_address: string;
  client_date_of_birth: string;
  client_gender: string;
  client_preferred_language: string;
  client_notes: string;
  client_status: string;
  client_role: string;
  client_temppassword?: string;
}

export interface Clinician {
  id: string;
  clinician_first_name: string;
  clinician_last_name: string;
  clinician_email: string;
  clinician_phone_number: string;
  clinician_address: string;
  clinician_date_of_birth: string;
  clinician_gender: string;
  clinician_preferred_language: string;
  clinician_notes: string;
  clinician_status: string;
  clinician_role: string;
  clinician_professional_title: string;
  clinician_professional_bio: string;
  clinician_years_experience: number;
  clinician_specializations: string[];
  clinician_licenses: string[];
  clinician_education: string[];
  clinician_awards: string[];
  clinician_publications: string[];
  clinician_affiliations: string[];
  clinician_languages_spoken: string[];
  clinician_accepted_insurance: string[];
  clinician_website_url: string;
  clinician_social_media_links: string[];
  clinician_tempPassword?: string;
}

export interface AppointmentType {
  id: string;
  client_id: string;
  clinician_id: string;
  start_at: string;
  end_at: string;
  type: AppointmentTypeEnum;
  status: AppointmentStatus;
  notes: string;
  video_room_url?: string;
  clients?: {
    client_first_name: string;
    client_last_name: string;
  };
}

export interface AvailabilitySettings {
  timezone: string;
  default_slot_duration: number;
  min_notice_hours: number;
  max_advance_days: number;
}

export interface AvailabilitySlot {
  id?: string;
  start_at: string;
  end_at: string;
  recurring?: boolean;
  recurrenceRule?: string;
  title?: string; // Add title property for UI display purposes
}

export type WeeklyAvailability = Record<string, AvailabilitySlot[]>;
