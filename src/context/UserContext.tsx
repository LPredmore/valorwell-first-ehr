import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust path as needed
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

// Define the shape of your user data from the 'clients' table
export interface ClientProfile {
  id: string;
  client_first_name?: string;
  client_last_name?: string;
  client_preferred_name?: string;
  client_email?: string;
  client_phone?: string;
  client_status?: 'New' | 'Profile Complete' | 'Active' | 'Inactive' | string;
  client_is_profile_complete?: boolean;
  client_age?: number | null;
  client_state?: string | null;
  [key: string]: any; // Allow other properties
}

interface UserContextType {
  user: SupabaseUser | null;
  userId: string | null;
  userRole: string | null;
  clientStatus: ClientProfile['client_status'] | null;
  clientProfile: ClientProfile | null;
  isLoading: boolean; // Overall loading state for user context
  authInitialized: boolean; // Tracks if the initial auth check has completed
  refreshUserData: () => Promise<void>;
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
  const [authInitialized, setAuthInitialized] = useState(false);

  const fetchUserData = useCallback(async (currentAuthUser: SupabaseUser | null) => {
    console.log("[UserContext] fetchUserData called with authUser:", currentAuthUser ? currentAuthUser.id : 'null');
    if (!currentAuthUser) {
      setUser(null);
      setUserId(null);
      setUserRole(null);
      setClientStatus(null);
      setClientProfile(null);
      setIsLoading(false); // Ensure loading is false when no user
      console.log("[UserContext] No authenticated user found. Context reset.");
      return;
    }

    setIsLoading(true);
    setUser(currentAuthUser);
    setUserId(currentAuthUser.id);

    const role = currentAuthUser.user_metadata?.role || 'client';
    setUserRole(role);
    console.log(`[UserContext] User ID set: ${currentAuthUser.id}, Role from metadata: ${role}`);

    if (role === 'client' || role === 'admin' || role === 'clinician') {
      try {
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', currentAuthUser.id)
          .single();

        if (error) {
          console.error('[UserContext] Error fetching client data:', error);
          if (error.code === 'PGRST116') {
            console.log('[UserContext] No client record found, user might be new.');
            setClientStatus('New');
            setClientProfile(null);
          } else {
            setClientStatus('ErrorFetchingStatus');
            setClientProfile(null);
          }
        } else if (clientData) {
          console.log('[UserContext DEBUG] Raw clientData from DB:', JSON.stringify(clientData, null, 2));
          console.log(`[UserContext DEBUG] client_age from DB: ${clientData.client_age} (Type: ${typeof clientData.client_age})`);
          console.log(`[UserContext DEBUG] client_status from DB: ${clientData.client_status} (Type: ${typeof clientData.client_status})`);
          
          setClientProfile(clientData as ClientProfile);
          setClientStatus(clientData.client_status || 'New');
          console.log('[UserContext] Set clientProfile with age:', clientData.client_age, 'and status:', clientData.client_status);
        } else {
          console.log('[UserContext DEBUG] No clientData found in DB for this user (but no error).');
          setClientStatus('New');
          setClientProfile(null);
        }
      } catch (e) {
        console.error('[UserContext] Exception fetching client data:', e);
        setClientStatus('ErrorFetchingStatus');
        setClientProfile(null);
      }
    } else {
      setClientStatus(null);
      setClientProfile(null);
      console.log(`[UserContext] User role '${role}' does not require client status check.`);
    }
    setIsLoading(false);
    console.log("[UserContext] fetchUserData completed. isLoading set to false.");
  }, []); // Empty dependency array makes fetchUserData stable

  const refreshUserData = useCallback(async () => {
    console.log("[UserContext] refreshUserData explicitly called.");
    setIsLoading(true); // Indicate loading during refresh
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('[UserContext] refreshUserData: Error getting session or no session.', sessionError);
      await fetchUserData(null);
      // setAuthInitialized(true); // Ensure auth is considered initialized even if session fails
      return;
    }
    await fetchUserData(session.user);
    // setIsLoading(false) is handled by fetchUserData
  }, [fetchUserData]);

  useEffect(() => {
    console.log("[UserContext] Initializing UserContext (mount). Setting up auth listener and initial session check.");
    setIsLoading(true); // Start in loading state for the initial check
    let isMounted = true; // To prevent state updates if component unmounts during async ops

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      console.log("[UserContext] Initial getSession completed. Session:", session ? session.user.id : 'null');
      await fetchUserData(session?.user || null);
      if (isMounted) {
        setAuthInitialized(true);
        console.log("[UserContext] Auth initialized state set to true after getSession.");
      }
    }).catch(async (error) => {
      if (!isMounted) return;
      console.error("[UserContext] Error in initial getSession:", error);
      await fetchUserData(null);
      if (isMounted) {
        setAuthInitialized(true); // Crucial: ensure authInitialized is set even on error
        console.log("[UserContext] Auth initialized state set to true after getSession error.");
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`[UserContext] Auth state changed event: ${event}`, session ? `User: ${session.user.id}` : 'No session');
        await fetchUserData(session?.user || null);
        
        // If authInitialized is still false after an event that implies initialization
        // (like INITIAL_SESSION or SIGNED_IN from a cold start), set it.
        // This ensures that even if getSession somehow didn't set it, the listener will.
        if (isMounted && !authInitialized) { 
            // Check for specific events that confirm initialization
            if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
                 setAuthInitialized(true);
                 console.log("[UserContext] Auth initialized state set to true via onAuthStateChange listener.");
            }
        }
      }
    );

    return () => {
      isMounted = false;
      console.log("[UserContext] Cleaning up auth subscription (unmount).");
      authListener?.subscription?.unsubscribe();
    };
  // fetchUserData is stable due to useCallback([]).
  // authInitialized should NOT be a dependency here to prevent loops.
  }, [fetchUserData]); // Removed authInitialized from dependencies

  const logout = async () => {
    console.log("[UserContext] Logging out user.");
    // Reset local state immediately for faster UI update, then call Supabase
    setUser(null);
    setUserId(null);
    setUserRole(null);
    setClientStatus(null);
    setClientProfile(null);
    // setAuthInitialized(false); // Or keep true, depending on desired behavior post-logout
    setIsLoading(false); // No longer loading user data
    await supabase.auth.signOut();
    console.log("[UserContext] Supabase signOut completed.");
    // The onAuthStateChange listener will also call fetchUserData(null)
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
