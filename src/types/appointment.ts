export interface Appointment {
  id: string;
  client_id: string;
  clinician_id: string;
  start_at: string; // UTC ISO timestamp string
  end_at: string;   // UTC ISO timestamp string
  type: string;
  status: string;
  video_room_url?: string | null;
  notes?: string | null;
  appointment_recurring?: string | null;
  recurring_group_id?: string | null;

  client?: { // Optional object
    client_first_name: string; // Not null here, handled by || '' in mapping
    client_last_name: string;
    client_preferred_name: string;
  };

  clientName?: string; 
  // REMOVE formattedDate, formattedStartTime, formattedEndTime from this central type
  // These are display concerns and should be added by view-specific logic or helpers if needed,
  // not part of the core Appointment data structure passed around.
  // Keeping them here can lead to confusion about whether they are populated or not.
}