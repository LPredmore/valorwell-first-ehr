
/**
 * Unified Appointment interface for all components.
 * UTC timestamps (start_at, end_at) are the sole source of truth for appointment timing.
 * This interface represents a processed appointment object ready for use in the application.
 */
export interface Appointment {
  id: string;
  client_id: string;      // Foreign key
  clinician_id: string;   // Foreign key
  start_at: string;       // UTC ISO timestamp string (e.g., "2025-05-07T14:00:00.000Z")
  end_at: string;         // UTC ISO timestamp string (e.g., "2025-05-07T15:00:00.000Z")
  type: string;
  status: string;
  video_room_url?: string | null;
  notes?: string | null;
  appointment_recurring?: string | null;
  recurring_group_id?: string | null;
  
  // Client information, structured as an object.
  // This is populated by useAppointments.tsx from the Supabase 'clients' join.
  client?: {
    client_first_name: string; // Should not be null after processing in useAppointments (uses || '')
    client_last_name: string;  // Should not be null after processing
    client_preferred_name: string; // Should not be null after processing
  };
  
  // Convenience field, populated by useAppointments.tsx
  // CONSISTENT FORMAT: Always uses "client_preferred_name client_last_name" when both exist
  // Falls back to "client_first_name client_last_name"
  clientName?: string;
}
