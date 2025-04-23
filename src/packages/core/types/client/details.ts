
/**
 * Represents detailed client information
 */
export interface ClientDetails {
  id: string;
  client_first_name?: string;
  client_last_name?: string;
  client_email?: string;
  client_phone?: string;
  client_date_of_birth?: string;
  client_age?: number;
  client_gender?: string;
  client_gender_identity?: string;
  client_state?: string;
  client_assigned_therapist?: string;
  client_minor?: boolean | string;
  client_referral_source?: string;
  client_time_zone?: string;
  client_self_goal?: string;
  client_planlength?: string;
  client_treatmentfrequency?: string;
  client_diagnosis?: string[];
  client_is_profile_complete?: boolean | string;
  client_status?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  client_preferred_name?: string;
  
  // Insurance related fields
  client_insurance_type_primary?: string;
  client_insurance_company_primary?: string;
  client_subscriber_name_primary?: string;
  client_subscriber_relationship_primary?: string;
  client_subscriber_dob_primary?: string;
  client_policy_number_primary?: string;
  client_group_number_primary?: string;
  
  client_insurance_type_secondary?: string;
  client_insurance_company_secondary?: string;
  client_subscriber_name_secondary?: string;
  client_subscriber_relationship_secondary?: string;
  client_subscriber_dob_secondary?: string;
  client_policy_number_secondary?: string;
  client_group_number_secondary?: string;
  
  client_insurance_type_tertiary?: string;
  client_insurance_company_tertiary?: string;
  client_subscriber_name_tertiary?: string;
  client_subscriber_relationship_tertiary?: string;
  client_subscriber_dob_tertiary?: string;
  client_policy_number_tertiary?: string;
  client_group_number_tertiary?: string;
  
  // Tricare related fields
  client_tricare_plan?: string;
  client_tricare_sponsor_name?: string;
  client_tricare_sponsor_id?: string;
  client_tricare_sponsor_branch?: string;
  client_tricare_beneficiary_category?: string;
  client_tricare_has_referral?: string;
  client_tricare_referral_number?: string;
  client_tricare_policy_id?: string;
  client_tricare_region?: string;
  
  // VA related fields
  client_vacoverage?: string;
  client_disabilityrating?: string;
  client_recentdischarge?: string;
  client_branchOS?: string;
  
  // CHAMPVA related fields
  client_champva?: string;
  
  // Session note related fields
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
  client_primaryobjective?: string;
  client_secondaryobjective?: string;
  client_tertiaryobjective?: string;
  client_intervention1?: string;
  client_intervention2?: string;
  client_intervention3?: string;
  client_intervention4?: string;
  client_intervention5?: string;
  client_intervention6?: string;
  client_functioning?: string;
  client_prognosis?: string;
  client_progress?: string;
  client_problem?: string;
  client_treatmentgoal?: string;
  client_sessionnarrative?: string;
  client_nexttreatmentplanupdate?: string;
  client_privatenote?: string;
  client_currentsymptoms?: string;
  client_treatmentplan_startdate?: string;
  client_relationship?: string;

  // Additional fields
  client_address?: string;
  client_city?: string;
  client_zip?: string;
  client_country?: string;
  client_emergency_contact_name?: string;
  client_emergency_contact_relationship?: string;
  client_emergency_contact_phone?: string;
  client_preferred_contact_method?: string;
  client_additional_notes?: string;
}
