
export interface ClientDetails {
  // Base fields
  id: string;
  created_at?: string;
  updated_at?: string;
  
  // Personal Information
  client_first_name?: string;
  client_last_name?: string;
  client_email?: string;
  client_phone?: string;
  client_date_of_birth?: string;
  client_age?: number;
  client_gender?: string;
  client_gender_identity?: string;
  client_preferred_name?: string;
  client_status?: string;
  client_state?: string;
  client_time_zone?: string;
  client_address?: string;
  client_city?: string;
  client_zip?: string;
  client_country?: string;
  client_minor?: boolean;
  client_is_profile_complete?: boolean;
  
  // Emergency Contact Information
  client_emergency_contact_name?: string;
  client_emergency_contact_phone?: string;
  client_emergency_contact_relationship?: string;
  client_preferred_contact_method?: string;
  
  // Clinical Information
  client_diagnosis?: string[];
  client_planlength?: string;
  client_treatmentfrequency?: string;
  client_medications?: string;
  client_personsinattendance?: string;
  client_appearance?: string;
  client_attitude?: string;
  client_behavior?: string;
  client_speech?: string;
  client_affect?: string;
  client_thoughtprocess?: string;
  client_perception?: string;
  client_orientation?: string;
  client_memoryconcentration?: string;
  client_insightjudgement?: string;
  client_mood?: string;
  client_substanceabuserisk?: string;
  client_suicidalideation?: string;
  client_homicidalideation?: string;
  client_functioning?: string;
  client_prognosis?: string;
  client_progress?: string;
  client_sessionnarrative?: string;
  client_privatenote?: string;
  client_additional_notes?: string;
  
  // Clinician Information
  client_clinician_professional_name?: string;
  client_assigned_therapist?: string;
}
