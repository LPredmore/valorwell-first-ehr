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
          duration: string | null
          history_id: string
          id: string
          name: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string
          duration?: string | null
          history_id: string
          id?: string
          name?: string | null
          reason?: string | null
        }
        Update: {
          created_at?: string
          duration?: string | null
          history_id?: string
          id?: string
          name?: string | null
          reason?: string | null
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
          client_address: string | null
          client_age: number | null
          client_assigned_therapist: string | null
          client_city: string | null
          client_diagnosis: string | null
          client_dob: string | null
          client_email: string
          client_first_name: string | null
          client_gender: string | null
          client_insurance: string | null
          client_insurance_id: string | null
          client_last_name: string | null
          client_phone: string | null
          client_state: string | null
          client_status: string | null
          client_zip: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_age?: number | null
          client_assigned_therapist?: string | null
          client_city?: string | null
          client_diagnosis?: string | null
          client_dob?: string | null
          client_email: string
          client_first_name?: string | null
          client_gender?: string | null
          client_insurance?: string | null
          client_insurance_id?: string | null
          client_last_name?: string | null
          client_phone?: string | null
          client_state?: string | null
          client_status?: string | null
          client_zip?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_age?: number | null
          client_assigned_therapist?: string | null
          client_city?: string | null
          client_diagnosis?: string | null
          client_dob?: string | null
          client_email?: string
          client_first_name?: string | null
          client_gender?: string | null
          client_insurance?: string | null
          client_insurance_id?: string | null
          client_last_name?: string | null
          client_phone?: string | null
          client_state?: string | null
          client_status?: string | null
          client_zip?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_client_assigned_therapist_fkey"
            columns: ["client_assigned_therapist"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_documents: {
        Row: {
          created_at: string
          document_name: string | null
          document_path: string | null
          document_type: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string
          document_name?: string | null
          document_path?: string | null
          document_type?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      clinicians: {
        Row: {
          clinician_about: string | null
          clinician_accepting_new_clients: boolean | null
          clinician_address: string | null
          clinician_city: string | null
          clinician_credentials: string | null
          clinician_email: string | null
          clinician_first_name: string | null
          clinician_gender: string | null
          clinician_image_url: string | null
          clinician_insurance_accepted: string[] | null
          clinician_last_name: string | null
          clinician_license_state: string | null
          clinician_license_type: string | null
          clinician_npi: string | null
          clinician_phone: string | null
          clinician_professional_name: string | null
          clinician_specialties: string[] | null
          clinician_state: string | null
          clinician_status: string | null
          clinician_treatment_approaches: string[] | null
          clinician_zip: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          clinician_about?: string | null
          clinician_accepting_new_clients?: boolean | null
          clinician_address?: string | null
          clinician_city?: string | null
          clinician_credentials?: string | null
          clinician_email?: string | null
          clinician_first_name?: string | null
          clinician_gender?: string | null
          clinician_image_url?: string | null
          clinician_insurance_accepted?: string[] | null
          clinician_last_name?: string | null
          clinician_license_state?: string | null
          clinician_license_type?: string | null
          clinician_npi?: string | null
          clinician_phone?: string | null
          clinician_professional_name?: string | null
          clinician_specialties?: string[] | null
          clinician_state?: string | null
          clinician_status?: string | null
          clinician_treatment_approaches?: string[] | null
          clinician_zip?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          clinician_about?: string | null
          clinician_accepting_new_clients?: boolean | null
          clinician_address?: string | null
          clinician_city?: string | null
          clinician_credentials?: string | null
          clinician_email?: string | null
          clinician_first_name?: string | null
          clinician_gender?: string | null
          clinician_image_url?: string | null
          clinician_insurance_accepted?: string[] | null
          clinician_last_name?: string | null
          clinician_license_state?: string | null
          clinician_license_type?: string | null
          clinician_npi?: string | null
          clinician_phone?: string | null
          clinician_professional_name?: string | null
          clinician_specialties?: string[] | null
          clinician_state?: string | null
          clinician_status?: string | null
          clinician_treatment_approaches?: string[] | null
          clinician_zip?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinicians_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_licenses: {
        Row: {
          id: string
          clinician_id: string
          license_type: string | null
          license_number: string | null
          state: string | null
          issue_date: string | null
          expiration_date: string | null
          status: string | null
          verification_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinician_id: string
          license_type?: string | null
          license_number?: string | null
          state?: string | null
          issue_date?: string | null
          expiration_date?: string | null
          status?: string | null
          verification_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinician_id?: string
          license_type?: string | null
          license_number?: string | null
          state?: string | null
          issue_date?: string | null
          expiration_date?: string | null
          status?: string | null
          verification_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_licenses_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          }
        ]
      }
      completed_appointments: {
        Row: {
          appointment_id: string
          client_id: string
          clinician_id: string
          created_at: string
          id: string
          notes: string | null
          session_date: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          client_id: string
          clinician_id: string
          created_at?: string
          id?: string
          notes?: string | null
          session_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          client_id?: string
          clinician_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_appointments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_appointments_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      cpt_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      document_assignments: {
        Row: {
          client_id: string
          clinician_id: string
          created_at: string
          document_id: string
          due_date: string | null
          id: string
          is_completed: boolean
          status: string | null
        }
        Insert: {
          client_id: string
          clinician_id: string
          created_at?: string
          document_id: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          status?: string | null
        }
        Update: {
          client_id?: string
          clinician_id?: string
          created_at?: string
          document_id?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_assignments_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_assignments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string
          created_at: string
          document_path: string | null
          document_type: string | null
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          document_path?: string | null
          document_type?: string | null
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          document_path?: string | null
          document_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      icd10: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      phq9_assessments: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          q1: number | null
          q2: number | null
          q3: number | null
          q4: number | null
          q5: number | null
          q6: number | null
          q7: number | null
          q8: number | null
          q9: number | null
          total_score: number | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          q1?: number | null
          q2?: number | null
          q3?: number | null
          q4?: number | null
          q5?: number | null
          q6?: number | null
          q7?: number | null
          q8?: number | null
          q9?: number | null
          total_score?: number | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          q1?: number | null
          q2?: number | null
          q3?: number | null
          q4?: number | null
          q5?: number | null
          q6?: number | null
          q7?: number | null
          q8?: number | null
          q9?: number | null
          total_score?: number | null
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
          practice_address: string | null
          practice_city: string | null
          practice_email: string | null
          practice_logo_url: string | null
          practice_name: string | null
          practice_phone: string | null
          practice_state: string | null
          practice_website: string | null
          practice_zip: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          practice_address?: string | null
          practice_city?: string | null
          practice_email?: string | null
          practice_logo_url?: string | null
          practice_name?: string | null
          practice_phone?: string | null
          practice_state?: string | null
          practice_website?: string | null
          practice_zip?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          practice_address?: string | null
          practice_city?: string | null
          practice_email?: string | null
          practice_logo_url?: string | null
          practice_name?: string | null
          practice_phone?: string | null
          practice_state?: string | null
          practice_website?: string | null
          practice_zip?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes: {
        Row: {
          appointment_id: string | null
          client_id: string
          clinician_id: string
          clinician_name: string | null
          created_at: string
          diagnosis: string | null
          id: string
          patient_dob: string | null
          patient_name: string | null
          pdf_path: string | null
          plan_type: string | null
          session_date: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          clinician_id: string
          clinician_name?: string | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          patient_dob?: string | null
          patient_name?: string | null
          pdf_path?: string | null
          plan_type?: string | null
          session_date?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          clinician_id?: string
          clinician_name?: string | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          patient_dob?: string | null
          patient_name?: string | null
          pdf_path?: string | null
          plan_type?: string | null
          session_date?: string | null
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
      treatment_plans: {
        Row: {
          client_id: string
          clinician_id: string
          created_at: string
          diagnosis: string | null
          end_date: string | null
          id: string
          pdf_path: string | null
          start_date: string | null
          treatment_goals: Json | null
          updated_at: string
        }
        Insert: {
          client_id: string
          clinician_id: string
          created_at?: string
          diagnosis?: string | null
          end_date?: string | null
          id?: string
          pdf_path?: string | null
          start_date?: string | null
          treatment_goals?: Json | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          clinician_id?: string
          created_at?: string
          diagnosis?: string | null
          end_date?: string | null
          id?: string
          pdf_path?: string | null
          start_date?: string | null
          treatment_goals?: Json | null
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
