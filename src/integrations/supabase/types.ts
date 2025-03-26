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
      clients: {
        Row: {
          client_age: number | null
          client_assigned_therapist: string | null
          client_date_of_birth: string | null
          client_diagnosis: string[] | null
          client_email: string | null
          client_first_name: string | null
          client_gender: string | null
          client_gender_identity: string | null
          client_group_number_primary: string | null
          client_group_number_secondary: string | null
          client_group_number_tertiary: string | null
          client_insurance_company_primary: string | null
          client_insurance_company_secondary: string | null
          client_insurance_company_tertiary: string | null
          client_insurance_type_primary: string | null
          client_insurance_type_secondary: string | null
          client_insurance_type_tertiary: string | null
          client_is_profile_complete: string | null
          client_last_name: string | null
          client_minor: string | null
          client_phone: string | null
          client_policy_number_primary: string | null
          client_policy_number_secondary: string | null
          client_policy_number_tertiary: string | null
          client_preferred_name: string | null
          client_referral_source: string | null
          client_self_goal: string | null
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
          client_time_zone: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          client_age?: number | null
          client_assigned_therapist?: string | null
          client_date_of_birth?: string | null
          client_diagnosis?: string[] | null
          client_email?: string | null
          client_first_name?: string | null
          client_gender?: string | null
          client_gender_identity?: string | null
          client_group_number_primary?: string | null
          client_group_number_secondary?: string | null
          client_group_number_tertiary?: string | null
          client_insurance_company_primary?: string | null
          client_insurance_company_secondary?: string | null
          client_insurance_company_tertiary?: string | null
          client_insurance_type_primary?: string | null
          client_insurance_type_secondary?: string | null
          client_insurance_type_tertiary?: string | null
          client_is_profile_complete?: string | null
          client_last_name?: string | null
          client_minor?: string | null
          client_phone?: string | null
          client_policy_number_primary?: string | null
          client_policy_number_secondary?: string | null
          client_policy_number_tertiary?: string | null
          client_preferred_name?: string | null
          client_referral_source?: string | null
          client_self_goal?: string | null
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
          client_time_zone?: string | null
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          client_age?: number | null
          client_assigned_therapist?: string | null
          client_date_of_birth?: string | null
          client_diagnosis?: string[] | null
          client_email?: string | null
          client_first_name?: string | null
          client_gender?: string | null
          client_gender_identity?: string | null
          client_group_number_primary?: string | null
          client_group_number_secondary?: string | null
          client_group_number_tertiary?: string | null
          client_insurance_company_primary?: string | null
          client_insurance_company_secondary?: string | null
          client_insurance_company_tertiary?: string | null
          client_insurance_type_primary?: string | null
          client_insurance_type_secondary?: string | null
          client_insurance_type_tertiary?: string | null
          client_is_profile_complete?: string | null
          client_last_name?: string | null
          client_minor?: string | null
          client_phone?: string | null
          client_policy_number_primary?: string | null
          client_policy_number_secondary?: string | null
          client_policy_number_tertiary?: string | null
          client_preferred_name?: string | null
          client_referral_source?: string | null
          client_self_goal?: string | null
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
          client_time_zone?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
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
          clinician_npi_number: string | null
          clinician_phone: string | null
          clinician_professional_name: string | null
          clinician_state: string[] | null
          clinician_status: string | null
          clinician_taxonomy_code: string | null
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
          clinician_npi_number?: string | null
          clinician_phone?: string | null
          clinician_professional_name?: string | null
          clinician_state?: string[] | null
          clinician_status?: string | null
          clinician_taxonomy_code?: string | null
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
          clinician_npi_number?: string | null
          clinician_phone?: string | null
          clinician_professional_name?: string | null
          clinician_state?: string[] | null
          clinician_status?: string | null
          clinician_taxonomy_code?: string | null
          clinician_treatment_approaches?: string[] | null
          clinician_type?: string | null
          created_at?: string
          id?: string
          updated_at?: string
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
          updated_at: string
        }
        Insert: {
          clinical_type?: string | null
          code: string
          created_at?: string
          description?: string | null
          fee: number
          name: string
          updated_at?: string
        }
        Update: {
          clinical_type?: string | null
          code?: string
          created_at?: string
          description?: string | null
          fee?: number
          name?: string
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
      licenses: {
        Row: {
          clinician_id: string
          created_at: string
          id: string
          license_number: string
          state: string
          updated_at: string
        }
        Insert: {
          clinician_id: string
          created_at?: string
          id?: string
          license_number: string
          state: string
          updated_at?: string
        }
        Update: {
          clinician_id?: string
          created_at?: string
          id?: string
          license_number?: string
          state?: string
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
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
