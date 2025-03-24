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
          age: number | null
          assigned_therapist: string | null
          created_at: string
          date_of_birth: string | null
          gender: string | null
          gender_identity: string | null
          id: string
          is_profile_complete: boolean | null
          minor: boolean | null
          phone: string | null
          preferred_name: string | null
          referral_source: string | null
          state: string | null
          status: string | null
          time_zone: string | null
          treatment_goal: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          assigned_therapist?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          gender_identity?: string | null
          id: string
          is_profile_complete?: boolean | null
          minor?: boolean | null
          phone?: string | null
          preferred_name?: string | null
          referral_source?: string | null
          state?: string | null
          status?: string | null
          time_zone?: string | null
          treatment_goal?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          assigned_therapist?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          gender_identity?: string | null
          id?: string
          is_profile_complete?: boolean | null
          minor?: boolean | null
          phone?: string | null
          preferred_name?: string | null
          referral_source?: string | null
          state?: string | null
          status?: string | null
          time_zone?: string | null
          treatment_goal?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_therapist_fkey"
            columns: ["assigned_therapist"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      clinicians: {
        Row: {
          accepting_new_clients: boolean | null
          bio: string | null
          created_at: string
          id: string
          min_client_age: number | null
          phone: string | null
          specialties: string[] | null
          treatment_approaches: string[] | null
          updated_at: string
        }
        Insert: {
          accepting_new_clients?: boolean | null
          bio?: string | null
          created_at?: string
          id: string
          min_client_age?: number | null
          phone?: string | null
          specialties?: string[] | null
          treatment_approaches?: string[] | null
          updated_at?: string
        }
        Update: {
          accepting_new_clients?: boolean | null
          bio?: string | null
          created_at?: string
          id?: string
          min_client_age?: number | null
          phone?: string | null
          specialties?: string[] | null
          treatment_approaches?: string[] | null
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
        Relationships: [
          {
            foreignKeyName: "document_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_assignments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance: {
        Row: {
          client_id: string
          created_at: string
          group_number: string | null
          id: string
          insurance_type: string
          policy_number: string | null
          provider: string
          subscriber_dob: string | null
          subscriber_name: string | null
          subscriber_relationship: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          group_number?: string | null
          id?: string
          insurance_type: string
          policy_number?: string | null
          provider: string
          subscriber_dob?: string | null
          subscriber_name?: string | null
          subscriber_relationship?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          group_number?: string | null
          id?: string
          insurance_type?: string
          policy_number?: string | null
          provider?: string
          subscriber_dob?: string | null
          subscriber_name?: string | null
          subscriber_relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "licenses_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
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
        Relationships: [
          {
            foreignKeyName: "staff_licenses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_clinician: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      document_category:
        | "medical_record"
        | "consent_form"
        | "therapy_note"
        | "questionnaire"
      user_role: "client" | "clinician" | "admin"
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
