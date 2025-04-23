
export interface ClinicianProfile {
  id: string;
  clinician_first_name?: string;
  clinician_last_name?: string;
  clinician_email?: string;
  clinician_phone?: string;
  clinician_professional_name?: string;
  clinician_type?: string;
  clinician_npi_number?: string;
  clinician_license_type?: string;
  clinician_licensed_states?: string[];
  clinician_bio?: string;
  clinician_image_url?: string;
  clinician_accepting_new_clients?: string;
  clinician_status?: string;
  clinician_min_client_age?: number;
  clinician_treatment_approaches?: string[];
}

export interface ClinicianLicense {
  id: string;
  clinician_id: string;
  license_type: string;
  license_number: string;
  state: string;
  issue_date?: Date;
  expiration_date?: Date;
  status?: string;
}

// Re-export the Clinician type for backward compatibility
export type { Clinician } from './client/clinician';
