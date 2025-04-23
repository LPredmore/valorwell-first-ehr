
export type AppRole = 'admin' | 'clinician' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: AppRole;
  time_zone?: string;
  phone?: string;
  google_calendar_linked?: boolean;
  temp_password?: string | null;
  profile_type?: string;
}

export interface AuthState {
  isLoading: boolean;
  session: any | null;
  user: UserProfile | null;
  userId: string | null;
  userRole: AppRole | null;
}
