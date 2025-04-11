export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_recurring: string | null
          client_id: string
          clinician_id: string
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          recurring_group_id: string | null
          start_time: string
          status: string
          type: string
          updated_at: string
          video_room_url: string | null
        }
        Insert: {
          appointment_recurring?: string | null
          client_id: string
          clinician_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          recurring_group_id?: string | null
          start_time: string
          status?: string
          type: string
          updated_at?: string
          video_room_url?: string | null
        }
        Update: {
          appointment_recurring?: string | null
          client_id?: string
          clinician_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          recurring_group_id?: string | null
          start_time?: string
          status?: string
          type?: string
          updated_at?: string
          video_room_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          clinician_id: string
          created_at: string
          day_of_week: string
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          clinician_id: string
          created_at?: string
          day_of_week: string
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          clinician_id?: string
          created_at?: string
          day_of_week?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      availability_exceptions: {
        Row: {
          clinician_id: string
          created_at: string | null
          end_time: string | null
          id: string
          is_deleted: boolean | null
          original_availability_id: string | null
          specific_date: string
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          clinician_id: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_deleted?: boolean | null
          original_availability_id?: string | null
          specific_date: string
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          clinician_id?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_deleted?: boolean | null
          original_availability_id?: string | null
          specific_date?: string
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_original_availability_id_fkey"
            columns: ["original_availability_id"]
            isOneToOne: false
            referencedRelation: "availability"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_settings: {
        Row: {
          buffer_minutes: number | null
          clinician_id: string
          created_at: string
          custom_minutes: number | null
          default_end_time: string | null
          default_start_time: string | null
          id: string
          max_days_ahead: number
          min_days_ahead: number
          show_availability_to_clients: boolean | null
          time_granularity: string
          updated_at: string
        }
        Insert: {
          buffer_minutes?: number | null
          clinician_id: string
          created_at?: string
          custom_minutes?: number | null
          default_end_time?: string | null
          default_start_time?: string | null
          id?: string
          max_days_ahead?: number
          min_days_ahead?: number
          show_availability_to_clients?: boolean | null
          time_granularity?: string
          updated_at?: string
        }
        Update: {
          buffer_minutes?: number | null
          clinician_id?: string
          created_at?: string
          custom_minutes?: number | null
          default_end_time?: string | null
          default_start_time?: string | null
          id?: string
          max_days_ahead?: number
          min_days_ahead?: number
          show_availability_to_clients?: boolean | null
          time_granularity?: string
          updated_at?: string
        }
        Relationships: []
      }
      availability_single_date: {
        Row: {
          clinician_id: string
          created_at: string | null
          date: string
          end_time: string
          id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          clinician_id: string
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          clinician_id?: string
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_single_date_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      client_history: {
        Row: {
          additional_info: string | null
          additional_info2: string | null
          alcohol_use: string | null
          attempted_suicide: boolean | null
          childhood_elaboration: string | null
          chronic_health_problems: string | null
          client_id: string
          counseling_goals: string | null
          created_at: string
          current_issues: string | null
          drug_use: string | null
          education_level: string | null
          emergency_name: string | null
          emergency_phone: string | null
          emergency_relationship: string | null
          has_past_spouses: boolean | null
          has_received_mental_health_treatment: boolean | null
          hobbies: string | null
          hospitalized_psychiatric: boolean | null
          id: string
          is_family_same_as_household: boolean | null
          is_married: boolean | null
          life_changes: string | null
          occupation_details: string | null
          pdf_path: string | null
          personal_strengths: string | null
          progression_of_issues: string | null
          psych_hold: boolean | null
          relationship_problems: string | null
          selected_childhood_experiences: Json | null
          selected_medical_conditions: Json | null
          selected_symptoms: Json | null
          signature: string | null
          sleep_hours: string | null
          submission_date: string | null
          takes_medications: boolean | null
          tobacco_use: string | null
          updated_at: string
        }
        Insert: {
          additional_info?: string | null
          additional_info2?: string | null
          alcohol_use?: string | null
          attempted_suicide?: boolean | null
          childhood_elaboration?: string | null
          chronic_health_problems?: string | null
          client_id: string
          counseling_goals?: string | null
          created_at?: string
          current_issues?: string | null
          drug_use?: string | null
          education_level?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relationship?: string | null
          has_past_spouses?: boolean | null
          has_received_mental_health_treatment?: boolean | null
          hobbies?: string | null
          hospitalized_psychiatric?: boolean | null
          id?: string
          is_family_same_as_household?: boolean | null
          is_married?: boolean | null
          life_changes?: string | null
          occupation_details?: string | null
          pdf_path?: string | null
          personal_strengths?: string | null
          progression_of_issues?: string | null
          psych_hold?: boolean | null
          relationship_problems?: string | null
          selected_childhood_experiences?: Json | null
          selected_medical_conditions?: Json | null
          selected_symptoms?: Json | null
          signature?: string | null
          sleep_hours?: string | null
          submission_date?: string | null
          takes_medications?: boolean | null
          tobacco_use?: string | null
          updated_at?: string
        }
        Update: {
          additional_info?: string | null
          additional_info2?: string | null
          alcohol_use?: string | null
          attempted_suicide?: boolean | null
          childhood_elaboration?: string | null
          chronic_health_problems?: string | null
          client_id?: string
          counseling_goals?: string | null
          created_at?: string
          current_issues?: string | null
          drug_use?: string | null
          education_level?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relationship?: string | null
          has_past_spouses?: boolean | null
          has_received_mental_health_treatment?: boolean | null
          hobbies?: string | null
          hospitalized_psychiatric?: boolean | null
          id?: string
          is_family_same_as_household?: boolean | null
          is_married?: boolean | null
          life_changes?: string | null
          occupation_details?: string | null
          pdf_path?: string | null
          personal_strengths?: string | null
          progression_of_issues?: string | null
          psych_hold?: boolean | null
          relationship_problems?: string | null
          selected_childhood_experiences?: Json | null
          selected_medical_conditions?: Json | null
          selected_symptoms?: Json | null
          signature?: string | null
          sleep_hours?: string | null
          submission_date?: string | null
          takes_medications?: boolean | null
          tobacco_use?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_history_current_spouse: {
        Row: {
          created_at: string
          history_id: string
          id: string
          name: string | null
          personality: string | null
          relationship: string | null
        }
        Insert: {
          created_at?: string
          history_id: string
          id?: string
          name?: string | null
          personality?: string | null
          relationship?: string | null
        }
        Update: {
          created_at?: string
          history_id?: string
          id?: string
          name?: string | null
          personality?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_current_spouse_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "client_history"
            referencedColumns: ["id"]
          },
        ]
      }
      client_history_family: {
        Row: {
          created_at: string
          history_id: string
          id: string
          name: string | null
          personality: string | null
          relationship_growing: string | null
          relationship_now: string | null
          relationship_type: string | null
        }
        Insert: {
          created_at?: string
          history_id: string
          id?: string
          name?: string | null
          personality?: string | null
          relationship_growing?: string | null
          relationship_now?: string | null
          relationship_type?: string | null
        }
        Update: {
          created_at?: string
          history_id?: string
          id?: string
          name?: string | null
          personality?: string | null
          relationship_growing?: string | null
          relationship_now?: string | null
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_family_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "client_history"
            referencedColumns: ["id"]
          },
        ]
      }
      client_history_household: {
        Row: {
          created_at: string
          history_id: string
          id: string
          name: string | null
          personality: string | null
          relationship_now: string | null
          relationship_type: string | null
        }
        Insert: {
          created_at?: string
          history_id: string
          id?: string
          name?: string | null
          personality?: string | null
          relationship_now?: string | null
          relationship_type?: string | null
        }
        Update: {
          created_at?: string
          history_id?: string
          id?: string
          name?: string | null
          personality?: string | null
          relationship_now?: string | null
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_household_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "client_history"
            referencedColumns: ["id"]
          },
        ]
      }
      client_history_medications: {
        Row: {
          created_at: string
          duration: string | null
          history_id: string
          id: string
          name: string | null
          purpose: string | null
        }
        Insert: {
          created_at?: string
          duration?: string | null
          history_id: string
          id?: string
          name?: string | null
          purpose?: string | null
        }
        Update: {
          created_at?: string
          duration?: string | null
          history_id?: string
          id?: string
          name?: string | null
          purpose?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_medications_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "client_history"
            referencedColumns: ["id"]
          },
        ]
      }
      client_history_spouses: {
        Row: {
          created_at: string
          history_id: string
          id: string
          name: string | null
          personality: string | null
          relationship: string | null
        }
        Insert: {
          created_at?: string
          history_id: string
          id?: string
          name?: string | null
          personality?: string | null
          relationship?: string | null
        }
        Update: {
          created_at?: string
          history_id?: string
          id?: string
          name?: string | null
          personality?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_spouses_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "client_history"
            referencedColumns: ["id"]
          },
        ]
      }
      client_history_treatments: {
        Row: {
          created_at: string
          history_id: string
          id: string
          length: string | null
          provider: string | null
          reason: string | null
          year: string | null
        }
        Insert: {
          created_at?: string
          history_id: string
          id?: string
          length?: string | null
          provider?: string | null
          reason?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string
          history_id?: string
          id?: string
          length?: string | null
          provider?: string | null
          reason?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_treatments_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "client_history"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_affect: string | null
          client_age: number | null
          client_appearance: string | null
          client_assigned_therapist: string | null
          client_attitude: string | null
          client_behavior: string | null
          client_branchOS: string | null
          client_champva: string | null
          client_currentsymptoms: string | null
          client_date_of_birth: string | null
          client_diagnosis: string[] | null
          client_disabilityrating: string | null
          client_email: string | null
          client_first_name: string | null
          client_functioning: string | null
          client_gender: string | null
          client_gender_identity: string | null
          client_group_number_primary: string | null
          client_group_number_secondary: string | null
          client_group_number_tertiary: string | null
          client_homicidalideation: string | null
          client_insightjudgement: string | null
          client_insurance_company_primary: string | null
          client_insurance_company_secondary: string | null
          client_insurance_company_tertiary: string | null
          client_insurance_type_primary: string | null
          client_insurance_type_secondary: string | null
          client_insurance_type_tertiary: string | null
          client_intervention1: string | null
          client_intervention2: string | null
          client_intervention3: string | null
          client_intervention4: string | null
          client_intervention5: string | null
          client_intervention6: string | null
          client_is_profile_complete: string | null
          client_last_name: string | null
          client_medications: string | null
          client_memoryconcentration: string | null
          client_minor: string | null
          client_mood: string | null
          client_nexttreatmentplanupdate: string | null
          client_orientation: string | null
          client_perception: string | null
          client_personsinattendance: string | null
          client_phone: string | null
          client_planlength: string | null
          client_policy_number_primary: string | null
          client_policy_number_secondary: string | null
          client_policy_number_tertiary: string | null
          client_preferred_name: string | null
          client_primaryobjective: string | null
          client_privatenote: string | null
          client_problem: string | null
          client_prognosis: string | null
          client_progress: string | null
          client_recentdischarge: string | null
          client_referral_source: string | null
          client_relationship: string | null
          client_secondaryobjective: string | null
          client_self_goal: string | null
          client_sessionnarrative: string | null
          client_speech: string | null
          client_state: string | null
          client_status: string | null
          client_subscriber_dob_primary: string | null
          client_subscriber_dob_secondary: string | null
          client_subscriber_dob_tertiary: string | null
          client_subscriber_name_primary: string | null
          client_subscriber_name_secondary: string | null
          client_subscriber_name_tertiary: string | null
          client_subscriber_relationship_primary: string | null
          client_subscriber_relationship_secondary: string | null
          client_subscriber_relationship_tertiary: string | null
          client_substanceabuserisk: string | null
          client_suicidalideation: string | null
          client_tertiaryobjective: string | null
          client_thoughtprocess: string | null
          client_time_zone: string | null
          client_treatmentfrequency: string | null
          client_treatmentgoal: string | null
          client_treatmentplan_startdate: string | null
          client_tricare_beneficiary_category: string | null
          client_tricare_has_referral: string | null
          client_tricare_plan: string | null
          client_tricare_policy_id: string | null
          client_tricare_referral_number: string | null
          client_tricare_region: string | null
          client_tricare_sponsor_branch: string | null
          client_tricare_sponsor_id: string | null
          client_tricare_sponsor_name: string | null
          client_vacoverage: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          client_affect?: string | null
          client_age?: number | null
          client_appearance?: string | null
          client_assigned_therapist?: string | null
          client_attitude?: string | null
          client_behavior?: string | null
          client_branchOS?: string | null
          client_champva?: string | null
          client_currentsymptoms?: string | null
          client_date_of_birth?: string | null
          client_diagnosis?: string[] | null
          client_disabilityrating?: string | null
          client_email?: string | null
          client_first_name?: string | null
          client_functioning?: string | null
          client_gender?: string | null
          client_gender_identity?: string | null
          client_group_number_primary?: string | null
          client_group_number_secondary?: string | null
          client_group_number_tertiary?: string | null
          client_homicidalideation?: string | null
          client_insightjudgement?: string | null
          client_insurance_company_primary?: string | null
          client_insurance_company_secondary?: string | null
          client_insurance_company_tertiary?: string | null
          client_insurance_type_primary?: string | null
          client_insurance_type_secondary?: string | null
          client_insurance_type_tertiary?: string | null
          client_intervention1?: string | null
          client_intervention2?: string | null
          client_intervention3?: string | null
          client_intervention4?: string | null
          client_intervention5?: string | null
          client_intervention6?: string | null
          client_is_profile_complete?: string | null
          client_last_name?: string | null
          client_medications?: string | null
          client_memoryconcentration?: string | null
          client_minor?: string | null
          client_mood?: string | null
          client_nexttreatmentplanupdate?: string | null
          client_orientation?: string | null
          client_perception?: string | null
          client_personsinattendance?: string | null
          client_phone?: string | null
          client_planlength?: string | null
          client_policy_number_primary?: string | null
          client_policy_number_secondary?: string | null
          client_policy_number_tertiary?: string | null
          client_preferred_name?: string | null
          client_primaryobjective?: string | null
          client_privatenote?: string | null
          client_problem?: string | null
          client_prognosis?: string | null
          client_progress?: string | null
          client_recentdischarge?: string | null
          client_referral_source?: string | null
          client_relationship?: string | null
          client_secondaryobjective?: string | null
          client_self_goal?: string | null
          client_sessionnarrative?: string | null
          client_speech?: string | null
          client_state?: string | null
          client_status?: string | null
          client_subscriber_dob_primary?: string | null
          client_subscriber_dob_secondary?: string | null
          client_subscriber_dob_tertiary?: string | null
          client_subscriber_name_primary?: string | null
          client_subscriber_name_secondary?: string | null
          client_subscriber_name_tertiary?: string | null
          client_subscriber_relationship_primary?: string | null
          client_subscriber_relationship_secondary?: string | null
          client_subscriber_relationship_tertiary?: string | null
          client_substanceabuserisk?: string | null
          client_suicidalideation?: string | null
          client_tertiaryobjective?: string | null
          client_thoughtprocess?: string | null
          client_time_zone?: string | null
          client_treatmentfrequency?: string | null
          client_treatmentgoal?: string | null
          client_treatmentplan_startdate?: string | null
          client_tricare_beneficiary_category?: string | null
          client_tricare_has_referral?: string | null
          client_tricare_plan?: string | null
          client_tricare_policy_id?: string | null
          client_tricare_referral_number?: string | null
          client_tricare_region?: string | null
          client_tricare_sponsor_branch?: string | null
          client_tricare_sponsor_id?: string | null
          client_tricare_sponsor_name?: string | null
          client_vacoverage?: string | null
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          client_affect?: string | null
          client_age?: number | null
          client_appearance?: string | null
          client_assigned_therapist?: string | null
          client_attitude?: string | null
          client_behavior?: string | null
          client_branchOS?: string | null
          client_champva?: string | null
          client_currentsymptoms?: string | null
          client_date_of_birth?: string | null
          client_diagnosis?: string[] | null
          client_disabilityrating?: string | null
          client_email?: string | null
          client_first_name?: string | null
          client_functioning?: string | null
          client_gender?: string | null
          client_gender_identity?: string | null
          client_group_number_primary?: string | null
          client_group_number_secondary?: string | null
          client_group_number_tertiary?: string | null
          client_homicidalideation?: string | null
          client_insightjudgement?: string | null
          client_insurance_company_primary?: string | null
          client_insurance_company_secondary?: string | null
          client_insurance_company_tertiary?: string | null
          client_insurance_type_primary?: string | null
          client_insurance_type_secondary?: string | null
          client_insurance_type_tertiary?: string | null
          client_intervention1?: string | null
          client_intervention2?: string | null
          client_intervention3?: string | null
          client_intervention4?: string | null
          client_intervention5?: string | null
          client_intervention6?: string | null
          client_is_profile_complete?: string | null
          client_last_name?: string | null
          client_medications?: string | null
          client_memoryconcentration?: string | null
          client_minor?: string | null
          client_mood?: string | null
          client_nexttreatmentplanupdate?: string | null
          client_orientation?: string | null
          client_perception?: string | null
          client_personsinattendance?: string | null
          client_phone?: string | null
          client_planlength?: string | null
          client_policy_number_primary?: string | null
          client_policy_number_secondary?: string | null
          client_policy_number_tertiary?: string | null
          client_preferred_name?: string | null
          client_primaryobjective?: string | null
          client_privatenote?: string | null
          client_problem?: string | null
          client_prognosis?: string | null
          client_progress?: string | null
          client_recentdischarge?: string | null
          client_referral_source?: string | null
          client_relationship?: string | null
          client_secondaryobjective?: string | null
          client_self_goal?: string | null
          client_sessionnarrative?: string | null
          client_speech?: string | null
          client_state?: string | null
          client_status?: string | null
          client_subscriber_dob_primary?: string | null
          client_subscriber_dob_secondary?: string | null
          client_subscriber_dob_tertiary?: string | null
          client_subscriber_name_primary?: string | null
          client_subscriber_name_secondary?: string | null
          client_subscriber_name_tertiary?: string | null
          client_subscriber_relationship_primary?: string | null
          client_subscriber_relationship_secondary?: string | null
          client_subscriber_relationship_tertiary?: string | null
          client_substanceabuserisk?: string | null
          client_suicidalideation?: string | null
          client_tertiaryobjective?: string | null
          client_thoughtprocess?: string | null
          client_time_zone?: string | null
          client_treatmentfrequency?: string | null
          client_treatmentgoal?: string | null
          client_treatmentplan_startdate?: string | null
          client_tricare_beneficiary_category?: string | null
          client_tricare_has_referral?: string | null
          client_tricare_plan?: string | null
          client_tricare_policy_id?: string | null
          client_tricare_referral_number?: string | null
          client_tricare_region?: string | null
          client_tricare_sponsor_branch?: string | null
          client_tricare_sponsor_id?: string | null
          client_tricare_sponsor_name?: string | null
          client_vacoverage?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinical_documents: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          document_date: string
          document_title: string
          document_type: string
          file_path: string
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          document_date: string
          document_title: string
          document_type: string
          file_path: string
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          document_date?: string
          document_title?: string
          document_type?: string
          file_path?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_licenses: {
        Row: {
          clinician_id: string | null
          created_at: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          license_number: string | null
          license_type: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          verification_date: string | null
        }
        Insert: {
          clinician_id?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          license_number?: string | null
          license_type?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          verification_date?: string | null
        }
        Update: {
          clinician_id?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          license_number?: string | null
          license_type?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          verification_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinician_licenses_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicians: {
        Row: {
          clinician_accepting_new_clients: string | null
          clinician_bio: string | null
          clinician_email: string | null
          clinician_first_name: string | null
          clinician_image_url: string | null
          clinician_last_name: string | null
          clinician_license_type: string | null
          clinician_licensed_states: string[] | null
          clinician_min_client_age: number | null
          clinician_nameinsurance: string | null
          clinician_npi_number: string | null
          clinician_phone: string | null
          clinician_professional_name: string | null
          clinician_state: string[] | null
          clinician_status: string | null
          clinician_taxonomy_code: string | null
          clinician_timezone: string | null
          clinician_treatment_approaches: string[] | null
          clinician_type: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          clinician_accepting_new_clients?: string | null
          clinician_bio?: string | null
          clinician_email?: string | null
          clinician_first_name?: string | null
          clinician_image_url?: string | null
          clinician_last_name?: string | null
          clinician_license_type?: string | null
          clinician_licensed_states?: string[] | null
          clinician_min_client_age?: number | null
          clinician_nameinsurance?: string | null
          clinician_npi_number?: string | null
          clinician_phone?: string | null
          clinician_professional_name?: string | null
          clinician_state?: string[] | null
          clinician_status?: string | null
          clinician_taxonomy_code?: string | null
          clinician_timezone?: string | null
          clinician_treatment_approaches?: string[] | null
          clinician_type?: string | null
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          clinician_accepting_new_clients?: string | null
          clinician_bio?: string | null
          clinician_email?: string | null
          clinician_first_name?: string | null
          clinician_image_url?: string | null
          clinician_last_name?: string | null
          clinician_license_type?: string | null
          clinician_licensed_states?: string[] | null
          clinician_min_client_age?: number | null
          clinician_nameinsurance?: string | null
          clinician_npi_number?: string | null
          clinician_phone?: string | null
          clinician_professional_name?: string | null
          clinician_state?: string[] | null
          clinician_status?: string | null
          clinician_taxonomy_code?: string | null
          clinician_timezone?: string | null
          clinician_treatment_approaches?: string[] | null
          clinician_type?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      completed_appointments: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      cpt_codes: {
        Row: {
          clinical_type: string | null
          code: string
          created_at: string
          description: string | null
          fee: number
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          clinical_type?: string | null
          code: string
          created_at?: string
          description?: string | null
          fee: number
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          clinical_type?: string | null
          code?: string
          created_at?: string
          description?: string | null
          fee?: number
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_assignments: {
        Row: {
          assigned_by: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          document_id: string
          due_date: string | null
          id: string
          pdf_url: string | null
          response_data: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          document_id: string
          due_date?: string | null
          id?: string
          pdf_url?: string | null
          response_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          document_id?: string
          due_date?: string | null
          id?: string
          pdf_url?: string | null
          response_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          template: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          template?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          template?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      icd10: {
        Row: {
          diagnosis_name: string
          icd10: string
          id: number
        }
        Insert: {
          diagnosis_name: string
          icd10: string
          id?: number
        }
        Update: {
          diagnosis_name?: string
          icd10?: string
          id?: number
        }
        Relationships: []
      }
      licenses: {
        Row: {
          clinician_id: string
          created_at: string
          expiration_date: string | null
          id: string
          issue_date: string | null
          license_number: string
          license_type: string | null
          state: string
          status: string | null
          updated_at: string
        }
        Insert: {
          clinician_id: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          license_number: string
          license_type?: string | null
          state: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          clinician_id?: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          license_number?: string
          license_type?: string | null
          state?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      licenses_backup: {
        Row: {
          clinician_id: string | null
          created_at: string | null
          expiration_date: string | null
          id: string | null
          issue_date: string | null
          license_number: string | null
          license_type: string | null
          state: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          clinician_id?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string | null
          issue_date?: string | null
          license_number?: string | null
          license_type?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          clinician_id?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string | null
          issue_date?: string | null
          license_number?: string | null
          license_type?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      phq9_assessments: {
        Row: {
          additional_notes: string | null
          appointment_id: string | null
          assessment_date: string
          client_id: string
          created_at: string
          id: string
          phq9_narrative: string | null
          question_1: number
          question_2: number
          question_3: number
          question_4: number
          question_5: number
          question_6: number
          question_7: number
          question_8: number
          question_9: number
          total_score: number
        }
        Insert: {
          additional_notes?: string | null
          appointment_id?: string | null
          assessment_date?: string
          client_id: string
          created_at?: string
          id?: string
          phq9_narrative?: string | null
          question_1: number
          question_2: number
          question_3: number
          question_4: number
          question_5: number
          question_6: number
          question_7: number
          question_8: number
          question_9: number
          total_score: number
        }
        Update: {
          additional_notes?: string | null
          appointment_id?: string | null
          assessment_date?: string
          client_id?: string
          created_at?: string
          id?: string
          phq9_narrative?: string | null
          question_1?: number
          question_2?: number
          question_3?: number
          question_4?: number
          question_5?: number
          question_6?: number
          question_7?: number
          question_8?: number
          question_9?: number
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "phq9_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      practiceinfo: {
        Row: {
          created_at: string
          id: string
          practice_address1: string | null
          practice_address2: string | null
          practice_city: string | null
          practice_name: string | null
          practice_npi: string | null
          practice_state: string | null
          practice_taxid: string | null
          practice_taxonomy: string | null
          practice_zip: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          practice_address1?: string | null
          practice_address2?: string | null
          practice_city?: string | null
          practice_name?: string | null
          practice_npi?: string | null
          practice_state?: string | null
          practice_taxid?: string | null
          practice_taxonomy?: string | null
          practice_zip?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          practice_address1?: string | null
          practice_address2?: string | null
          practice_city?: string | null
          practice_name?: string | null
          practice_npi?: string | null
          practice_state?: string | null
          practice_taxid?: string | null
          practice_taxonomy?: string | null
          practice_zip?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          profile_type: string | null
          role: Database["public"]["Enums"]["app_role"]
          temp_password: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          profile_type?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          temp_password?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          profile_type?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          temp_password?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_notes: {
        Row: {
          affect: string | null
          appearance: string | null
          appointment_id: string | null
          attitude: string | null
          behavior: string | null
          client_dob: string | null
          client_id: string
          client_name: string | null
          clinician_id: string
          clinician_name: string | null
          created_at: string
          current_symptoms: string | null
          diagnosis: string[] | null
          functioning: string | null
          homicidal_ideation: string | null
          id: string
          insight_judgement: string | null
          intervention1: string | null
          intervention2: string | null
          intervention3: string | null
          intervention4: string | null
          intervention5: string | null
          intervention6: string | null
          medications: string | null
          memory_concentration: string | null
          mood: string | null
          next_treatment_plan_update: string | null
          orientation: string | null
          patient_dob: string | null
          patient_name: string | null
          pdf_path: string | null
          perception: string | null
          persons_in_attendance: string | null
          phq9_data: Json | null
          phq9_score: number | null
          plan_type: string | null
          primary_objective: string | null
          private_note: string | null
          problem_narrative: string | null
          prognosis: string | null
          progress: string | null
          secondary_objective: string | null
          session_date: string
          session_narrative: string | null
          session_type: string | null
          signature: string | null
          speech: string | null
          substance_abuse_risk: string | null
          suicidal_ideation: string | null
          tertiary_objective: string | null
          thought_process: string | null
          treatment_frequency: string | null
          treatment_goal_narrative: string | null
          updated_at: string
        }
        Insert: {
          affect?: string | null
          appearance?: string | null
          appointment_id?: string | null
          attitude?: string | null
          behavior?: string | null
          client_dob?: string | null
          client_id: string
          client_name?: string | null
          clinician_id: string
          clinician_name?: string | null
          created_at?: string
          current_symptoms?: string | null
          diagnosis?: string[] | null
          functioning?: string | null
          homicidal_ideation?: string | null
          id?: string
          insight_judgement?: string | null
          intervention1?: string | null
          intervention2?: string | null
          intervention3?: string | null
          intervention4?: string | null
          intervention5?: string | null
          intervention6?: string | null
          medications?: string | null
          memory_concentration?: string | null
          mood?: string | null
          next_treatment_plan_update?: string | null
          orientation?: string | null
          patient_dob?: string | null
          patient_name?: string | null
          pdf_path?: string | null
          perception?: string | null
          persons_in_attendance?: string | null
          phq9_data?: Json | null
          phq9_score?: number | null
          plan_type?: string | null
          primary_objective?: string | null
          private_note?: string | null
          problem_narrative?: string | null
          prognosis?: string | null
          progress?: string | null
          secondary_objective?: string | null
          session_date: string
          session_narrative?: string | null
          session_type?: string | null
          signature?: string | null
          speech?: string | null
          substance_abuse_risk?: string | null
          suicidal_ideation?: string | null
          tertiary_objective?: string | null
          thought_process?: string | null
          treatment_frequency?: string | null
          treatment_goal_narrative?: string | null
          updated_at?: string
        }
        Update: {
          affect?: string | null
          appearance?: string | null
          appointment_id?: string | null
          attitude?: string | null
          behavior?: string | null
          client_dob?: string | null
          client_id?: string
          client_name?: string | null
          clinician_id?: string
          clinician_name?: string | null
          created_at?: string
          current_symptoms?: string | null
          diagnosis?: string[] | null
          functioning?: string | null
          homicidal_ideation?: string | null
          id?: string
          insight_judgement?: string | null
          intervention1?: string | null
          intervention2?: string | null
          intervention3?: string | null
          intervention4?: string | null
          intervention5?: string | null
          intervention6?: string | null
          medications?: string | null
          memory_concentration?: string | null
          mood?: string | null
          next_treatment_plan_update?: string | null
          orientation?: string | null
          patient_dob?: string | null
          patient_name?: string | null
          pdf_path?: string | null
          perception?: string | null
          persons_in_attendance?: string | null
          phq9_data?: Json | null
          phq9_score?: number | null
          plan_type?: string | null
          primary_objective?: string | null
          private_note?: string | null
          problem_narrative?: string | null
          prognosis?: string | null
          progress?: string | null
          secondary_objective?: string | null
          session_date?: string
          session_narrative?: string | null
          session_type?: string | null
          signature?: string | null
          speech?: string | null
          substance_abuse_risk?: string | null
          suicidal_ideation?: string | null
          tertiary_objective?: string | null
          thought_process?: string | null
          treatment_frequency?: string | null
          treatment_goal_narrative?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes_history: {
        Row: {
          appointment_id: string | null
          client_id: string
          clinician_id: string | null
          created_at: string
          id: string
          pdf_path: string | null
          session_data: Json
          session_date: string
          session_type: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          clinician_id?: string | null
          created_at?: string
          id?: string
          pdf_path?: string | null
          session_data: Json
          session_date: string
          session_type?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          clinician_id?: string | null
          created_at?: string
          id?: string
          pdf_path?: string | null
          session_data?: Json
          session_date?: string
          session_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes_history_backup: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          clinician_id: string | null
          created_at: string | null
          id: string | null
          pdf_path: string | null
          session_data: Json | null
          session_date: string | null
          session_type: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_id?: string | null
          clinician_id?: string | null
          created_at?: string | null
          id?: string | null
          pdf_path?: string | null
          session_data?: Json | null
          session_date?: string | null
          session_type?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_id?: string | null
          clinician_id?: string | null
          created_at?: string | null
          id?: string | null
          pdf_path?: string | null
          session_data?: Json | null
          session_date?: string | null
          session_type?: string | null
        }
        Relationships: []
      }
      staff_licenses: {
        Row: {
          created_at: string | null
          id: string
          license_number: string
          license_state: string
          license_type: string
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          license_number: string
          license_state: string
          license_type: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          license_number?: string
          license_state?: string
          license_type?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_licenses_backup: {
        Row: {
          created_at: string | null
          id: string | null
          license_number: string | null
          license_state: string | null
          license_type: string | null
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          license_number?: string | null
          license_state?: string | null
          license_type?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          license_number?: string | null
          license_state?: string | null
          license_type?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      time_off_blocks: {
        Row: {
          clinician_id: string
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          note: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          clinician_id: string
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          note?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          clinician_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          note?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      treatment_plans: {
        Row: {
          client_dob: string | null
          client_id: string
          client_name: string | null
          clinician_id: string
          clinician_name: string | null
          created_at: string
          diagnosis: string[] | null
          id: string
          intervention1: string
          intervention2: string
          intervention3: string | null
          intervention4: string | null
          intervention5: string | null
          intervention6: string | null
          next_update: string
          pdf_path: string | null
          plan_length: string
          primary_objective: string
          private_note: string | null
          problem_narrative: string | null
          secondary_objective: string | null
          start_date: string
          tertiary_objective: string | null
          treatment_frequency: string
          treatment_goal_narrative: string | null
          updated_at: string
        }
        Insert: {
          client_dob?: string | null
          client_id: string
          client_name?: string | null
          clinician_id: string
          clinician_name?: string | null
          created_at?: string
          diagnosis?: string[] | null
          id?: string
          intervention1: string
          intervention2: string
          intervention3?: string | null
          intervention4?: string | null
          intervention5?: string | null
          intervention6?: string | null
          next_update: string
          pdf_path?: string | null
          plan_length: string
          primary_objective: string
          private_note?: string | null
          problem_narrative?: string | null
          secondary_objective?: string | null
          start_date: string
          tertiary_objective?: string | null
          treatment_frequency: string
          treatment_goal_narrative?: string | null
          updated_at?: string
        }
        Update: {
          client_dob?: string | null
          client_id?: string
          client_name?: string | null
          clinician_id?: string
          clinician_name?: string | null
          created_at?: string
          diagnosis?: string[] | null
          id?: string
          intervention1?: string
          intervention2?: string
          intervention3?: string | null
          intervention4?: string | null
          intervention5?: string | null
          intervention6?: string | null
          next_update?: string
          pdf_path?: string | null
          plan_length?: string
          primary_objective?: string
          private_note?: string | null
          problem_narrative?: string | null
          secondary_objective?: string | null
          start_date?: string
          tertiary_objective?: string | null
          treatment_frequency?: string
          treatment_goal_narrative?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_table_exists: {
        Args: { check_table_name: string }
        Returns: boolean
      }
      create_or_replace_check_table_exists_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      debug_rls_check: {
        Args: {
          schema_name: string
          table_name: string
          operation: string
          record_id: string
        }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "clinician"
      document_category:
        | "medical_record"
        | "consent_form"
        | "therapy_note"
        | "questionnaire"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client", "clinician"],
      document_category: [
        "medical_record",
        "consent_form",
        "therapy_note",
        "questionnaire",
      ],
      user_role: ["user", "admin"],
    },
  },
} as const
