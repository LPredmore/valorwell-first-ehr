
export interface Clinician {
  id: string;
  clinician_first_name: string | null;
  clinician_last_name: string | null;
  clinician_email: string | null;
  clinician_phone: string | null;
  clinician_type: string | null;
  clinician_status: string | null;
  clinician_npi_number: string | null;
  clinician_license_type: string | null;
  clinician_bio: string | null;
  clinician_image_url: string | null;
  clinician_professional_name: string | null;
  clinician_accepting_new_clients: string | null;
  clinician_min_client_age: number | null;
  clinician_licensed_states: string[] | null;
  clinician_treatment_approaches: string[] | null;
}
