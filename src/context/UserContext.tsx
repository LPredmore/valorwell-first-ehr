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

// Environment-based logging control
const isDev = process.env.NODE_ENV === 'development';
const logInfo = isDev ? console.log : () => {};
const logError = console.error;

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
    logInfo("[UserContext] fetchClientSpecificData called for user:", currentAuthUser.id);
    setIsLoading(true); // Indicate loading for this specific fetch operation
    
    // CRITICAL FIX: Ensure authInitialized is true during data fetching
    setAuthInitialized(true);

    try {
      const role = currentAuthUser.user_metadata?.role || 'client';
      setUserRole(role);
      logInfo(`[UserContext] User role set: ${role}`);

      if (role === 'client' || role === 'admin' || role === 'clinician') {
        try {
          const { data: clientData, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', currentAuthUser.id)
            .single();

          if (error) {
            logError('[UserContext] Error fetching client data:', error);
            if (error.code === 'PGRST116') {
              setClientStatus('New'); setClientProfile(null);
            } else {
              setClientStatus('ErrorFetchingStatus'); setClientProfile(null);
            }
          } else if (clientData) {
            setClientProfile(clientData as ClientProfile);
            setClientStatus(clientData.client_status || 'New');
            logInfo('[UserContext] Set clientProfile with age:', clientData.client_age, 'and status:', clientData.client_status);
          } else {
            setClientStatus('New'); setClientProfile(null);
          }
        } catch (e) {
          logError('[UserContext] Exception fetching client data:', e);
          setClientStatus('ErrorFetchingStatus'); setClientProfile(null);
        }
      } else {
        setClientStatus(null); setClientProfile(null);
      }
    } catch (error) {
      // ENHANCED ERROR HANDLING: Catch any unexpected errors
      logError('[UserContext] Unexpected error in fetchClientSpecificData:', error);
      setClientStatus('ErrorFetchingStatus');
      setClientProfile(null);
    } finally {
      // CRITICAL FIX: Always ensure these flags are set correctly
      setAuthInitialized(true);
      setIsLoading(false);
      logInfo("[UserContext] fetchClientSpecificData completed. authInitialized: true, isLoading: false");
    }
  }, []);

  // Main effect for initialization and auth state changes
  useEffect(() => {
    logInfo("[UserContext] Main useEffect: Setting up initial session check and auth listener.");
    let isMounted = true;
    setIsLoading(true); // Overall loading starts
    
    // CRITICAL FIX: Set authInitialized to true immediately to prevent deadlocks
    // This ensures the flag is set regardless of async operations
    setAuthInitialized(true);

    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      logInfo("[UserContext] Initial getSession completed. Session user ID:", session?.user?.id || 'null');
      
      // CRITICAL FIX: Ensure authInitialized remains true
      if (!authInitialized) setAuthInitialized(true);
      
      try {
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
          setIsLoading(false); // Explicitly set loading to false when no user
        }
        
        if (isMounted) {
          // Ensure authInitialized is still true and isLoading is false
          setAuthInitialized(true);
          setIsLoading(false);
          logInfo("[UserContext] Initial auth process finished. authInitialized: true, isLoading: false");
        }
      } catch (error) {
        logError("[UserContext] Error processing session data:", error);
        if (isMounted) {
          setAuthInitialized(true); // Ensure flag is set even on error
          setIsLoading(false); // Prevent loading state from getting stuck
        }
      }
    }).catch(async (error) => {
      if (!isMounted) return;
      logError("[UserContext] Error in initial getSession:", error);
      
      // Even on error, we need to set authInitialized to true to prevent deadlocks
      setAuthInitialized(true);
      
      setUser(null); setUserId(null); setUserRole(null); setClientStatus(null); setClientProfile(null);
      if (isMounted) {
        setIsLoading(false);
        logInfo("[UserContext] Initial auth process finished (with error). authInitialized: true, isLoading: false");
      }
    });

    // 2. Auth State Change Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        logInfo(`[UserContext] onAuthStateChange event: ${event}, User: ${session?.user?.id || 'null'}`);
        
        // CRITICAL FIX: Always ensure authInitialized is true when auth state changes
        // This prevents deadlocks regardless of the event type
        setAuthInitialized(true);
        
        try {
          setUser(session?.user || null);
          setUserId(session?.user?.id || null);

          if (session?.user) {
            await fetchClientSpecificData(session.user); // This manages its own isLoading
            
            // CRITICAL FIX: Double-check authInitialized is true after fetchClientSpecificData
            setAuthInitialized(true);
            logInfo(`[UserContext] onAuthStateChange: User is signed in, authInitialized is true.`);
          } else {
            // SIGNED_OUT or session became null
            setUserRole(null);
            setClientStatus(null);
            setClientProfile(null);
            setIsLoading(false); // No user, so not loading user-specific data
            logInfo("[UserContext] onAuthStateChange: User signed out or session null. isLoading set to false.");
          }
        } catch (error) {
          // ENHANCED ERROR HANDLING: Handle any errors in the auth state change process
          logError("[UserContext] Error during auth state change processing:", error);
          setAuthInitialized(true); // Ensure flag is set even on error
          setIsLoading(false); // Ensure we're not stuck in loading state
        } finally {
          // CRITICAL FIX: Final safety check to ensure flags are properly set
          if (isMounted) {
            setAuthInitialized(true);
            // Only set isLoading to false if we're not in the middle of fetchClientSpecificData
            if (!session?.user) {
              setIsLoading(false);
            }
          }
        }
      }
    );

    return () => {
      isMounted = false;
      logInfo("[UserContext] Cleaning up auth subscription (unmount).");
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchClientSpecificData, authInitialized]); // Include authInitialized for safety checks but prevent circular updates with early setting

  const refreshUserData = useCallback(async () => {
    logInfo("[UserContext] refreshUserData explicitly called.");
    
    // CRITICAL FIX: Ensure authInitialized is true before any async operations
    setAuthInitialized(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession(); // Get current session
      
      if (session?.user) {
          await fetchClientSpecificData(session.user); // This will set isLoading true/false
          
          // CRITICAL FIX: Double-check authInitialized is true after fetchClientSpecificData
          setAuthInitialized(true);
      } else {
          // No active user to refresh, ensure state is clean and not loading
          setUser(null); setUserId(null); setUserRole(null);
          setClientStatus(null); setClientProfile(null);
          setIsLoading(false); // No data to load
          logInfo("[UserContext] refreshUserData: No active session, context reset.");
      }
    } catch (error) {
      logError("[UserContext] Error in refreshUserData:", error);
      setIsLoading(false); // Ensure we're not stuck in loading state
    } finally {
      // ENHANCED ERROR HANDLING: Final safety check
      setAuthInitialized(true);
      setIsLoading(false); // Ensure we're not stuck in loading state
    }
  }, [fetchClientSpecificData]);

  const logout = async () => {
    logInfo("[UserContext] Logging out user...");
    setIsLoading(true); // Indicate process starting
    
    // CRITICAL FIX: Ensure authInitialized is true before any async operations
    setAuthInitialized(true);
    
    // Reset local state immediately for faster UI feedback
    setUser(null);
    setUserId(null);
    setUserRole(null);
    setClientStatus(null);
    setClientProfile(null);
    
    try {
      await supabase.auth.signOut();
      logInfo("[UserContext] Supabase signOut successful.");
    } catch (error) {
      logError("[UserContext] Error during supabase.auth.signOut():", error);
    } finally {
        // ENHANCED ERROR HANDLING: Always ensure these flags are set correctly
        setAuthInitialized(true);
        setIsLoading(false);
        logInfo("[UserContext] Logout process finished. authInitialized: true, isLoading: false");
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
