
/**
 * Core client details interface - Complete definition of client fields
 */
export interface ClientDetails {
  id: string;
  created_at: string;
  updated_at: string;
  client_first_name: string | null;
  client_last_name: string | null;
  client_preferred_name: string | null;
  client_date_of_birth: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_gender: string | null;
  client_gender_identity: string | null;
  client_address: string | null;
  client_city: string | null;
  client_state: string | null;
  client_zip: string | null;
  client_country: string | null;
  client_status: string | null;
  client_assigned_therapist: string | null;
  client_time_zone: string | null;
  client_minor: boolean | null;
  client_age: number | null;
  client_is_profile_complete: boolean;
  client_relationship: string | null;
  
  // Emergency contact fields
  client_emergency_contact_name: string | null;
  client_emergency_contact_relationship: string | null;
  client_emergency_contact_phone: string | null;
  client_preferred_contact_method: string | null;
  client_additional_notes: string | null;
  
  // Treatment related fields
  client_diagnosis: string[] | null;
  client_planlength: string | null;
  client_treatmentfrequency: string | null;
  client_medications: string | null;
  client_personsinattendance: string | null;
  client_referral_source: string | null;
  client_self_goal: string | null;
  client_disabilityrating: string | null;
  client_recentdischarge: string | null;
  client_branchOS: string | null;
  client_treatmentplan_startdate: string | null;
  client_nexttreatmentplanupdate: string | null;
  
  // Mental status fields
  client_appearance: string | null;
  client_attitude: string | null;
  client_behavior: string | null;
  client_speech: string | null;
  client_affect: string | null;
  client_thoughtprocess: string | null;
  client_perception: string | null;
  client_orientation: string | null;
  client_memoryconcentration: string | null;
  client_insightjudgement: string | null;
  client_mood: string | null;
  client_substanceabuserisk: string | null;
  client_suicidalideation: string | null;
  client_homicidalideation: string | null;
  client_functioning: string | null;
  client_prognosis: string | null;
  client_progress: string | null;
  client_currentsymptoms: string | null;
  client_sessionnarrative: string | null;
  
  // Treatment goals and objectives
  client_problem: string | null;
  client_treatmentgoal: string | null;
  client_primaryobjective: string | null;
  client_secondaryobjective: string | null;
  client_tertiaryobjective: string | null;
  client_intervention1: string | null;
  client_intervention2: string | null;
  client_intervention3: string | null;
  client_intervention4: string | null;
  client_intervention5: string | null;
  client_intervention6: string | null;
  
  // Additional notes
  client_privatenote: string | null;
  client_temppassword: string | null;
}
