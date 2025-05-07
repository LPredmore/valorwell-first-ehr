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
    client_first_name: string | null; // Allow nulls from DB
    client_last_name: string | null;
    client_preferred_name: string | null;
  };

  // Optional: for convenience after processing, not part of core DB model
  clientName?: string; 
  formattedDate?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
}
