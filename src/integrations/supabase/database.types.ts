
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          client_first_name: string | null;
          client_last_name: string | null;
          client_preferred_name: string | null;
          client_email: string | null;
          client_phone: string | null;
          client_gender: string | null;
          client_date_of_birth: string | null;
          client_status: string;
          client_assigned_therapist: string | null;
          client_time_zone: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          client_first_name?: string | null;
          client_last_name?: string | null;
          client_preferred_name?: string | null;
          client_email?: string | null;
          client_phone?: string | null;
          client_gender?: string | null;
          client_date_of_birth?: string | null;
          client_status?: string;
          client_assigned_therapist?: string | null;
          client_time_zone?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_first_name?: string | null;
          client_last_name?: string | null;
          client_preferred_name?: string | null;
          client_email?: string | null;
          client_phone?: string | null;
          client_gender?: string | null;
          client_date_of_birth?: string | null;
          client_status?: string;
          client_assigned_therapist?: string | null;
          client_time_zone?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cpt_codes: {
        Row: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          fee: number;
          clinical_type: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          code: string;
          name: string;
          description?: string | null;
          fee: number;
          clinical_type?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          code?: string;
          name?: string;
          description?: string | null;
          fee?: number;
          clinical_type?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      practiceinfo: {
        Row: {
          id: string;
          practice_name: string | null;
          practice_address1: string | null;
          practice_address2: string | null;
          practice_city: string | null;
          practice_state: string | null;
          practice_zip: string | null;
          practice_npi: string | null;
          practice_taxid: string | null;
          practice_taxonomy: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          practice_name?: string | null;
          practice_address1?: string | null;
          practice_address2?: string | null;
          practice_city?: string | null;
          practice_state?: string | null;
          practice_zip?: string | null;
          practice_npi?: string | null;
          practice_taxid?: string | null;
          practice_taxonomy?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          practice_name?: string | null;
          practice_address1?: string | null;
          practice_address2?: string | null;
          practice_city?: string | null;
          practice_state?: string | null;
          practice_zip?: string | null;
          practice_npi?: string | null;
          practice_taxid?: string | null;
          practice_taxonomy?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          role: string;
          time_zone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          role?: string;
          time_zone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          role?: string;
          time_zone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: "client" | "clinician" | "admin" | "superadmin";
    };
  };
};

export type CPTCode = Database['public']['Tables']['cpt_codes']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type PracticeInfo = Database['public']['Tables']['practiceinfo']['Row'];
