
/**
 * Represents a clinician in the system
 */
export interface Clinician {
  id: string;
  clinician_first_name?: string;
  clinician_last_name?: string;
  clinician_email?: string;
  clinician_phone?: string;
  clinician_professional_name?: string;
  clinician_type?: string;
  clinician_license_type?: string;
  clinician_npi_number?: string;
  clinician_nameinsurance?: string;
  clinician_bio?: string;
  clinician_image_url?: string;
  clinician_accepting_new_clients?: string;
  clinician_min_client_age?: number;
  clinician_status?: string;
  clinician_taxonomy_code?: string;
  clinician_licensed_states?: string[];
  clinician_treatment_approaches?: string[];
  clinician_state?: string[];
  created_at?: string;
  updated_at?: string;
}
