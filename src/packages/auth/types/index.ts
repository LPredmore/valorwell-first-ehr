
export interface AuthState {
  userRole: string | null;
  isLoading: boolean;
  userId: string | null;
  user: {
    id: string;
    email: string;
    role: AppRole;
  } | null;
  session: any | null;
  isAuthenticated?: boolean;
}

export type AppRole = 'admin' | 'moderator' | 'clinician' | 'client';
