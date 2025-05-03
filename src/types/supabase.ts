
// This file defines types for the Supabase database tables and functions

// Common base types
export type UUID = string;
export type Timestamp = string;

// Define database row types
export interface Profile {
  id: UUID;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'admin' | 'clinician' | 'client';
  time_zone?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  google_calendar_linked?: boolean;
  google_calendar_last_sync?: Timestamp;
}

export interface CalendarEvent {
  id: UUID;
  clinician_id: UUID;
  title: string;
  description?: string;
  start_time: Timestamp;
  end_time: Timestamp;
  time_zone: string;
  all_day: boolean;
  event_type: 'appointment' | 'availability' | 'time_off';
  status?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Mock Supabase client types for local development
export interface MockSupabaseClient {
  from: (table: string) => TableOperations;
  auth: AuthOperations;
}

export interface TableOperations {
  select: (columns?: string) => Query;
  insert: (data: any) => Mutation;
  update: (data: any) => Mutation;
  delete: () => Mutation;
  upsert: (data: any) => Mutation;
}

export interface Query {
  eq: (column: string, value: any) => Query;
  neq: (column: string, value: any) => Query;
  gt: (column: string, value: any) => Query;
  lt: (column: string, value: any) => Query;
  gte: (column: string, value: any) => Query;
  lte: (column: string, value: any) => Query;
  like: (column: string, value: string) => Query;
  in: (column: string, values: any[]) => Query;
  is: (column: string, value: any) => Query;
  order: (column: string, options?: { ascending?: boolean }) => Query;
  limit: (count: number) => Query;
  single: () => Promise<{ data: any; error: any }>;
  maybeSingle: () => Promise<{ data: any; error: any }>;
  execute: () => Promise<{ data: any; error: any }>;
}

export interface Mutation {
  execute: () => Promise<{ data: any; error: any }>;
}

export interface AuthOperations {
  signIn: (credentials: { email: string; password: string }) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  getSession: () => Promise<{ data: { session: any }; error: any }>;
}
