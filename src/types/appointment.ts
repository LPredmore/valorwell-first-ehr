
/**
 * Unified Appointment interface for all components
 * UTC timestamps (start_at, end_at) are the sole source of truth for appointment timing
 */
export interface Appointment {
  id: string;
  client_id: string;
  clinician_id: string;
  start_at: string;  // UTC ISO timestamp
  end_at: string;    // UTC ISO timestamp
  type: string;
  status: string;
  video_room_url?: string | null;
  notes?: string | null;
  appointment_recurring?: string | null;
  recurring_group_id?: string | null;
  
  // Client information if available
  client?: {
    client_first_name: string;
    client_last_name: string;
    client_preferred_name: string;
  };
  
  // Display fields - populated when needed for presentation
  formattedDate?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
  formattedStartDate?: string;
  clientName?: string;
}
