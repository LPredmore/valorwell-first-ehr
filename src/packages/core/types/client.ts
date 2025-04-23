
export interface ClientDetails {
  id: string;
  client_first_name?: string;
  client_last_name?: string;
  client_email?: string;
  client_phone?: string;
  client_date_of_birth?: string;
  client_diagnosis?: string[];
  client_assigned_therapist?: string;
  client_status?: string;
  client_state?: string;
  client_time_zone?: string;
  // Treatment plan related fields
  client_planlength?: string;
  client_treatmentfrequency?: string;
  client_problem?: string;
  client_treatmentgoal?: string;
  client_primaryobjective?: string;
  client_secondaryobjective?: string;
  client_tertiaryobjective?: string;
  client_intervention1?: string;
  client_intervention2?: string;
  client_intervention3?: string;
  client_intervention4?: string;
  client_intervention5?: string;
  client_intervention6?: string;
  client_nexttreatmentplanupdate?: string;
  client_privatenote?: string;
  // Additional fields as needed
}

export interface ClientHistoryFormData {
  // Basic client information
  id?: string;
  client_id: string;
  submission_date?: Date;
  
  // Current situation
  current_issues?: string;
  counseling_goals?: string;
  progression_of_issues?: string;
  
  // Medical and health
  selected_medical_conditions?: string[];
  chronic_health_problems?: string;
  takes_medications?: boolean;
  selected_symptoms?: string[];
  
  // Personal history
  selected_childhood_experiences?: string[];
  childhood_elaboration?: string;
  education_level?: string;
  occupation_details?: string;
  
  // Relationships and family
  is_married?: boolean;
  has_past_spouses?: boolean;
  is_family_same_as_household?: boolean;
  
  // Mental health history
  has_received_mental_health_treatment?: boolean;
  hospitalized_psychiatric?: boolean;
  attempted_suicide?: boolean;
  psych_hold?: boolean;
  
  // Lifestyle
  sleep_hours?: string;
  alcohol_use?: string;
  drug_use?: string;
  tobacco_use?: string;
  hobbies?: string;
  
  // Emergency contact
  emergency_name?: string;
  emergency_phone?: string;
  emergency_relationship?: string;
  
  // Additional information
  personal_strengths?: string;
  life_changes?: string;
  relationship_problems?: string;
  additional_info?: string;
  additional_info2?: string;
  
  // Form completion
  signature?: string;
  pdf_path?: string;
}
