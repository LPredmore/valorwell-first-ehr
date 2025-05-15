import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust path as needed
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

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
  [key: string]: any; 
}

interface UserContextType {
  user: SupabaseUser | null;
  userId: string | null;
  userRole: string | null;
  clientStatus: ClientProfile['client_status'] | null;
  clientProfile: ClientProfile | null;
  isLoading: boolean; // True if initial auth check is pending OR user-specific data is being fetched
  authInitialized: boolean; // True once the initial attempt to get session has completed
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
  
  const [isLoading, setIsLoading] = useState(true); 
  const [authInitialized, setAuthInitialized] = useState(false);

  // This function is responsible for fetching client-specific data if a user is authenticated.
  // It will set isLoading true/false for its own duration.
  const fetchClientSpecificData = useCallback(async (currentAuthUser: SupabaseUser) => {
    console.log("[UserContext] fetchClientSpecificData called for user:", currentAuthUser.id);
    setIsLoading(true); // Loading specifically for client data

    const role = currentAuthUser.user_metadata?.role || 'client';
    setUserRole(role); // Set role based on currentAuthUser
    console.log(`[UserContext] User role set: ${role}`);

    if (role === 'client' || role === 'admin' || role === 'clinician') {
      try {
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', currentAuthUser.id)
          .single();

        if (error) {
          console.error('[UserContext] Error fetching client data:', error);
          if (error.code === 'PGRST116') { // No row found
            setClientStatus('New'); setClientProfile(null);
            console.log('[UserContext] No client record found, status set to New.');
          } else {
            setClientStatus('ErrorFetchingStatus'); setClientProfile(null);
          }
        } else if (clientData) {
          console.log('[UserContext DEBUG] Raw clientData from DB:', JSON.stringify(clientData, null, 2));
          setClientProfile(clientData as ClientProfile);
          setClientStatus(clientData.client_status || 'New');
          console.log('[UserContext] Set clientProfile with age:', clientData.client_age, 'and status:', clientData.client_status);
        } else { // No data but no error (should ideally be caught by .single() as PGRST116)
          console.log('[UserContext DEBUG] No clientData returned (but no error). Setting status to New.');
          setClientStatus('New'); setClientProfile(null);
        }
      } catch (e) {
        console.error('[UserContext] Exception fetching client data:', e);
        setClientStatus('ErrorFetchingStatus'); setClientProfile(null);
      }
    } else {
      // For roles that don't have a 'clients' table record or specific status
      setClientStatus(null); setClientProfile(null);
      console.log(`[UserContext] User role '${role}' does not require client status/profile fetch.`);
    }
    setIsLoading(false); // Done with client-specific data fetching
    console.log("[UserContext] fetchClientSpecificData completed. isLoading set to false.");
  }, []); // Empty dependency array makes it stable

  // This effect handles the initial session check and sets up the auth state listener.
  useEffect(() => {
    console.log("[UserContext] Main effect (mount). Setting up auth listener and initial session check.");
    setIsLoading(true);       // Start in loading state for the entire initialization
    setAuthInitialized(false); // Explicitly false until getSession completes
    let isMounted = true;

    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      console.log("[UserContext] Initial getSession completed. Session user ID:", session?.user?.id || 'null');
      
      setUser(session?.user || null);
      setUserId(session?.user?.id || null);

      if (session?.user) {
        await fetchClientSpecificData(session.user); // This will manage its own isLoading
      } else {
        // No active session, so no client-specific data to fetch.
        // Reset client-specific fields.
        setUserRole(null);
        setClientStatus(null);
        setClientProfile(null);
      }
      
      if (isMounted) {
        setAuthInitialized(true); // Crucial: Mark auth as initialized
        setIsLoading(false);      // Crucial: Mark overall loading as false
        console.log("[UserContext] Initial auth process finished. authInitialized: true, isLoading: false");
      }
    }).catch(async (error) => {
      if (!isMounted) return;
      console.error("[UserContext] Error in initial getSession:", error);
      setUser(null); setUserId(null); setUserRole(null); setClientStatus(null); setClientProfile(null);
      if (isMounted) {
        setAuthInitialized(true); // Still mark as initialized so app doesn't hang
        setIsLoading(false);      // Mark overall loading as false
        console.log("[UserContext] Initial auth process finished (with error). authInitialized: true, isLoading: false");
      }
    });

    // 2. Auth State Change Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        console.log(`[UserContext] onAuthStateChange event: ${event}, User: ${session?.user?.id || 'null'}`);
        
        setUser(session?.user || null);
        setUserId(session?.user?.id || null);

        if (session?.user) {
          await fetchClientSpecificData(session.user); // This will manage its own isLoading
        } else {
          // User signed out or session expired
          setUserRole(null);
          setClientStatus(null);
          setClientProfile(null);
          setIsLoading(false); // No user, so not loading user-specific data
        }
        // Ensure authInitialized is true if an event occurs that implies it should be.
        // This is a safeguard, primary setting is after getSession().
        if (isMounted && !authInitialized) {
            if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT") {
                 setAuthInitialized(true);
                 // If fetchClientSpecificData was not called (e.g. session?.user was null), ensure isLoading is false.
                 if (!session?.user) setIsLoading(false);
                 console.log("[UserContext] Auth initialized via onAuthStateChange (safeguard). authInitialized: true");
            }
        }
      }
    );

    return () => {
      isMounted = false;
      console.log("[UserContext] Cleaning up auth subscription (unmount).");
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchClientSpecificData]); // fetchClientSpecificData is stable

  const refreshUserData = useCallback(async () => {
    console.log("[UserContext] refreshUserData explicitly called.");
    setIsLoading(true); // Indicate loading during refresh
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        await fetchClientSpecificData(session.user); // This will set isLoading false at its end
    } else {
        // No user, reset relevant fields and ensure loading is false
        setUser(null); setUserId(null); setUserRole(null); 
        setClientStatus(null); setClientProfile(null);
        setIsLoading(false);
    }
    // authInitialized should already be true if this function is being called.
  }, [fetchClientSpecificData]);

  const logout = async () => {
    console.log("[UserContext] Logging out user.");
    setIsLoading(true);
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle resetting state and setting isLoading to false.
    // For immediate UI feedback, can also reset here:
    setUser(null); setUserId(null); setUserRole(null); 
    setClientStatus(null); setClientProfile(null);
    // setAuthInitialized(false); // Typically, you keep authInitialized true.
    setIsLoading(false);
    console.log("[UserContext] Supabase signOut completed. Local context likely cleared by listener soon.");
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
