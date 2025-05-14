
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust path as needed
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

// Define the shape of your user data from the 'clients' table
// This should match the structure of your 'clients' table plus any derived fields.
export interface ClientProfile {
  id: string;
  client_first_name?: string;
  client_last_name?: string;
  client_preferred_name?: string;
  client_email?: string; // Usually from authUser, but can be in clients table
  client_phone?: string;
  client_status?: 'New' | 'Profile Complete' | 'Active' | 'Inactive' | string; // Add other statuses
  client_is_profile_complete?: boolean;
  client_age?: number | null;
  client_state?: string | null;
  // Add any other fields from your 'clients' table that you need in the context
  [key: string]: any; // Allow other properties
}

interface UserContextType {
  user: SupabaseUser | null;
  userId: string | null;
  userRole: string | null;
  clientStatus: ClientProfile['client_status'] | null;
  clientProfile: ClientProfile | null; // Store the full client profile
  isLoading: boolean; // Overall loading state for user context
  authInitialized: boolean; // Tracks if the initial auth check has completed
  refreshUserData: () => Promise<void>; // Function to manually refresh user data
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clientStatus, setClientStatus] = useState<ClientProfile['client_status'] | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // True until initial auth & data fetch is done
  const [authInitialized, setAuthInitialized] = useState(false); // Tracks initial Supabase auth check

  const fetchUserData = useCallback(async (currentAuthUser: SupabaseUser | null) => {
    console.log("[UserContext] fetchUserData called with authUser:", currentAuthUser ? currentAuthUser.id : 'null');
    if (!currentAuthUser) {
      setUser(null);
      setUserId(null);
      setUserRole(null);
      setClientStatus(null);
      setClientProfile(null);
      setIsLoading(false);
      console.log("[UserContext] No authenticated user found. Context reset.");
      return;
    }

    setIsLoading(true); // Set loading true at the start of data fetching
    setUser(currentAuthUser);
    setUserId(currentAuthUser.id);

    const role = currentAuthUser.user_metadata?.role || 'client'; // Default to 'client' if not set
    setUserRole(role);
    console.log(`[UserContext] User ID set: ${currentAuthUser.id}, Role from metadata: ${role}`);

    if (role === 'client' || role === 'admin' || role === 'clinician') { // Fetch client profile for these roles
      try {
        const { data: clientData, error } = await supabase
          .from('clients') // Assuming your table is named 'clients'
          .select('*')
          .eq('id', currentAuthUser.id)
          .single();

        if (error) {
          console.error('[UserContext] Error fetching client data:', error);
          // If client record not found, they might be 'New' or an error occurred
          // For a new user, clientData might be null and error might be PGRST116 (0 rows)
          if (error.code === 'PGRST116') { // Standard PostgREST code for 0 rows
            console.log('[UserContext] No client record found, user might be new.');
            setClientStatus('New'); // Default status for new clients
            setClientProfile(null); // No profile yet
          } else {
            // For other errors, set a generic error status or handle as needed
            setClientStatus('ErrorFetchingStatus');
            setClientProfile(null);
          }
        } else if (clientData) {
          // Add the requested debug logging
          console.log('[UserContext DEBUG] Raw clientData from DB:', JSON.stringify(clientData, null, 2));
          console.log(`[UserContext DEBUG] client_age from DB: ${clientData.client_age} (Type: ${typeof clientData.client_age})`);
          console.log(`[UserContext DEBUG] client_status from DB: ${clientData.client_status} (Type: ${typeof clientData.client_status})`);
          
          setClientProfile(clientData as ClientProfile);
          setClientStatus(clientData.client_status || 'New'); // Fallback to 'New' if status is null/undefined
          console.log('[UserContext] Set clientProfile with age:', clientData.client_age, 'and status:', clientData.client_status);
        } else {
            console.log('[UserContext DEBUG] No clientData found in DB for this user.');
            setClientStatus('New');
            setClientProfile(null);
        }
      } catch (e) {
        console.error('[UserContext] Exception fetching client data:', e);
        setClientStatus('ErrorFetchingStatus');
        setClientProfile(null);
      }
    } else {
      // For roles that don't have a 'clients' table record or specific status
      setClientStatus(null);
      setClientProfile(null);
      console.log(`[UserContext] User role '${role}' does not require client status check.`);
    }
    setIsLoading(false);
    console.log("[UserContext] fetchUserData completed. isLoading set to false.");
  }, []);

  const refreshUserData = useCallback(async () => {
    console.log("[UserContext] refreshUserData explicitly called.");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        console.error('[UserContext] refreshUserData: Error getting session or no session.', sessionError);
        await fetchUserData(null); // Reset context if no session
        return;
    }
    // Re-fetch user data based on the current session's user
    // This will re-trigger the logic to fetch from the 'clients' table
    await fetchUserData(session.user);
  }, [fetchUserData]);


  useEffect(() => {
    console.log("[UserContext] Initializing UserContext, setting up auth listener.");
    setIsLoading(true); // Start in loading state

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("[UserContext] Initial getSession completed. Session:", session ? session.user.id : 'null');
      await fetchUserData(session?.user || null);
      setAuthInitialized(true); // Mark that initial auth check is done
      console.log("[UserContext] Auth initialized state set to true.");
    }).catch(async (error) => {
      console.error("[UserContext] Error in initial getSession:", error);
      await fetchUserData(null); // Ensure context is reset on error
      setAuthInitialized(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`[UserContext] Auth state changed: ${event}`, session ? `User: ${session.user.id}` : 'No session');
        
        // Add more detailed logging
        if (event === 'SIGNED_IN') {
          console.log('[UserContext] User signed in - setting up user data');
        } else if (event === 'SIGNED_OUT') {
          console.log('[UserContext] User signed out - clearing user data');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[UserContext] Token refreshed - updating session');
        }
        
        // Existing code to fetch user data
        await fetchUserData(session?.user || null);
        
        // Setting auth initialized flag
        if (!authInitialized && (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT")) {
          setAuthInitialized(true);
          console.log("[UserContext] Auth initialized state set to true via listener.");
        }
      }
    );

    return () => {
      console.log("[UserContext] Cleaning up auth subscription.");
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserData, authInitialized]); // authInitialized added to dependencies

  const logout = async () => {
    console.log("[UserContext] Logging out user.");
    await supabase.auth.signOut();
    // State will be cleared by onAuthStateChange listener calling fetchUserData(null)
  };

  return (
    <UserContext.Provider value={{ user, userId, userRole, clientStatus, clientProfile, isLoading, authInitialized, refreshUserData, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
