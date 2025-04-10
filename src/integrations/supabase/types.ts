export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ... other tables remain unchanged

      // Renamed from client_history_spouse
      client_history_current_spouse: {
        Row: {
          // Same row definition as before
          id: string
          history_id: string
          name: string | null
          personality: string | null
          relationship: string | null
          created_at: string
        }
        Insert: {
          // Same insert definition as before
          id?: string
          history_id: string
          name?: string | null
          personality?: string | null
          relationship?: string | null
          created_at?: string
        }
        Update: {
          // Same update definition as before
          id?: string
          history_id?: string
          name?: string | null
          personality?: string | null
          relationship?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_history_current_spouse_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "client_history"
            referencedColumns: ["id"]
          }
        ]
      }

      client_history_spouses: {
        // Keep this table unchanged
        // ...
      }

      // New consolidated licenses table
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

      session_notes: {
        // Keep this table unchanged
        // ...
      }

      // Remove these tables:
      // session_notes_history: { ... }
      // licenses: { ... }
      // staff_licenses: { ... }

      // ... other tables remain unchanged
    }
    // ... rest of the interface remains unchanged
  }
}
