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

  // Fetches client-specific data if a user is authenticated.
  // This function now expects that isLoading related to initial auth check is handled by its caller.
  const fetchClientSpecificData = useCallback(async (currentAuthUser: SupabaseUser) => {
    console.log("[UserContext] fetchClientSpecificData called for user:", currentAuthUser.id);
    setIsLoading(true); // Indicate loading for this specific fetch operation

    const role = currentAuthUser.user_metadata?.role || 'client';
    setUserRole(role);
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
          if (error.code === 'PGRST116') {
            setClientStatus('New'); setClientProfile(null);
          } else {
            setClientStatus('ErrorFetchingStatus'); setClientProfile(null);
          }
        } else if (clientData) {
          console.log('[UserContext DEBUG] Raw clientData from DB:', JSON.stringify(clientData, null, 2));
          setClientProfile(clientData as ClientProfile);
          setClientStatus(clientData.client_status || 'New');
          console.log('[UserContext] Set clientProfile with age:', clientData.client_age, 'and status:', clientData.client_status);
        } else {
          setClientStatus('New'); setClientProfile(null);
        }
      } catch (e) {
        console.error('[UserContext] Exception fetching client data:', e);
        setClientStatus('ErrorFetchingStatus'); setClientProfile(null);
      }
    } else {
      setClientStatus(null); setClientProfile(null);
    }
    setIsLoading(false); // Done with this specific fetch
    console.log("[UserContext] fetchClientSpecificData completed. isLoading set to false.");
  }, []);

  // Main effect for initialization and auth state changes
  useEffect(() => {
    console.log("[UserContext] Main useEffect: Setting up initial session check and auth listener.");
    let isMounted = true;
    setIsLoading(true); // Overall loading starts
    setAuthInitialized(false); // Not initialized yet

    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      console.log("[UserContext] Initial getSession completed. Session user ID:", session?.user?.id || 'null');
      
      setUser(session?.user || null);
      setUserId(session?.user?.id || null);

      if (session?.user) {
        // fetchClientSpecificData will set isLoading true then false for its own operation
        await fetchClientSpecificData(session.user);
      } else {
        // No initial session, reset client specific data
        setUserRole(null);
        setClientStatus(null);
        setClientProfile(null);
      }
      
      if (isMounted) {
        setAuthInitialized(true); // CRITICAL: Auth has been checked
        setIsLoading(false);      // CRITICAL: Initial loading sequence is complete
        console.log("[UserContext] Initial auth process finished. authInitialized: true, isLoading: false");
      }
    }).catch(async (error) => {
      if (!isMounted) return;
      console.error("[UserContext] Error in initial getSession:", error);
      setUser(null); setUserId(null); setUserRole(null); setClientStatus(null); setClientProfile(null);
      if (isMounted) {
        setAuthInitialized(true); // Still mark as initialized so app doesn't hang
        setIsLoading(false);      // Initial loading sequence is complete (even with error)
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
          await fetchClientSpecificData(session.user); // This manages its own isLoading
        } else {
          // SIGNED_OUT or session became null
          setUserRole(null);
          setClientStatus(null);
          setClientProfile(null);
          setIsLoading(false); // No user, so not loading user-specific data
          console.log("[UserContext] onAuthStateChange: User signed out or session null. isLoading set to false.");
        }
        
        // Ensure authInitialized is set if it somehow wasn't by getSession (safeguard)
        // This is particularly for cases where onAuthStateChange might fire with INITIAL_SESSION
        // before getSession() promise resolves.
        if (isMounted && !authInitialized) {
            console.log(`[UserContext] onAuthStateChange: authInitialized was false, event: ${event}. Setting authInitialized=true.`);
            setAuthInitialized(true);
            // If there's no session user, isLoading should be false.
            // If there is a session user, fetchClientSpecificData would have set isLoading.
            if (!session?.user) {
                setIsLoading(false);
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
    const { data: { session } } = await supabase.auth.getSession(); // Get current session
    if (session?.user) {
        await fetchClientSpecificData(session.user); // This will set isLoading true/false
    } else {
        // No active user to refresh, ensure state is clean and not loading
        setUser(null); setUserId(null); setUserRole(null);
        setClientStatus(null); setClientProfile(null);
        setIsLoading(false); // No data to load
        console.log("[UserContext] refreshUserData: No active session, context reset.");
    }
  }, [fetchClientSpecificData]);

  const logout = async () => {
    console.log("[UserContext] Logging out user...");
    setIsLoading(true); // Indicate process starting
    
    // Reset local state immediately for faster UI feedback
    setUser(null);
    setUserId(null);
    setUserRole(null);
    setClientStatus(null);
    setClientProfile(null);
    // authInitialized should remain true as the app's auth system has been initialized.
    // What changes is the user's authentication status.
    
    try {
      await supabase.auth.signOut();
      console.log("[UserContext] Supabase signOut successful.");
    } catch (error) {
      console.error("[UserContext] Error during supabase.auth.signOut():", error);
    } finally {
        // The onAuthStateChange listener will fire with SIGNED_OUT,
        // which will call fetchClientSpecificData(null), ultimately setting isLoading to false.
        // However, to be certain isLoading is false after logout attempt:
        setIsLoading(false);
        console.log("[UserContext] Logout process finished. isLoading set to false.");
    }
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
