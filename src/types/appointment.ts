
/**
 * Unified Appointment interface for all components
 * UTC timestamps are the source of truth
 */
export interface Appointment {
  id: string;
  client_id: string;
  clinician_id: string;
  start_at: string;  // UTC timestamp
  end_at: string;    // UTC timestamp
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
