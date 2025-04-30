
/**
 * @context UserContext
 * @description Context for managing user authentication state and profile information.
 * Provides user role, client status, loading state, and user ID throughout the application.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatAsUUID } from '@/utils/validation/uuidUtils';

/**
 * @interface UserContextType
 * @description Type definition for the user context value
 */
type UserContextType = {
  /**
   * The role of the authenticated user (e.g., 'client', 'clinician', 'admin')
   */
  userRole: string | null;
  
  /**
   * The status of the client (e.g., 'active', 'inactive', 'pending')
   */
  clientStatus: string | null;
  
  /**
   * Whether the user data is currently being loaded
   */
  isLoading: boolean;
  
  /**
   * The ID of the authenticated user
   */
  userId: string | null;
  
  /**
   * Whether the user is a clinician
   */
  isClinician: boolean;

  /**
   * Manually refresh the user context
   */
  refreshUserContext: () => Promise<void>;
};

/**
 * Context for providing user authentication and profile information
 */
const UserContext = createContext<UserContextType>({
  userRole: null,
  clientStatus: null,
  isLoading: true,
  userId: null,
  isClinician: false,
  refreshUserContext: async () => {}
});

/**
 * @component UserProvider
 * @description Provider component for the UserContext.
 * Manages user authentication state and fetches user profile information.
 *
 * @example
 * // Wrap your application with the UserProvider
 * <UserProvider>
 *   <App />
 * </UserProvider>
 */
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clientStatus, setClientStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isClinician, setIsClinician] = useState(false);

  // Fetch user data and set appropriate states
  const fetchUserData = async () => {
    try {
      console.log("[UserContext] Fetching user data");
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[UserContext] Auth user data:", user ? "User found" : "No user found");
      
      if (user) {
        // Format the user ID to ensure consistent UUID format
        const formattedUserId = formatAsUUID(user.id);
        console.log("[UserContext] Setting userId:", formattedUserId, "(original:", user.id, ")");
        setUserId(formattedUserId);
        
        // First check profiles table for role information (single source of truth)
        console.log("[UserContext] Fetching profile data for user:", formattedUserId);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', formattedUserId)
          .maybeSingle();
          
        if (profileError) {
          console.error("[UserContext] Error fetching profile:", profileError.message);
        }

        if (profileData) {
          console.log("[UserContext] Profile data:", profileData);
          setUserRole(profileData.role);
          
          // If role is clinician, set the flag
          if (profileData.role === 'clinician') {
            setIsClinician(true);
            console.log("[UserContext] User is a clinician");
            // Clinicians don't have a client status
            setClientStatus(null);
          } else {
            setIsClinician(false);
            
            // If not clinician, check client status from clients table
            console.log("[UserContext] Fetching client data for user:", formattedUserId);
            const { data: clientData, error: clientError } = await supabase
              .from('clients')
              .select('client_status')
              .eq('id', formattedUserId)
              .maybeSingle();
              
            if (clientError) {
              console.error("[UserContext] Error fetching client:", clientError.message);
            }

            if (clientData) {
              console.log("[UserContext] Client data:", clientData);
              setClientStatus(clientData.client_status);
            } else {
              console.log("[UserContext] No client data found");
              setClientStatus(null);
            }
          }
        } else {
          console.log("[UserContext] No profile data found, checking clinicians table");
          
          // Check clinicians table as fallback
          const { data: clinicianData, error: clinicianError } = await supabase
            .from('clinicians')
            .select('id, clinician_status')
            .eq('id', formattedUserId)
            .maybeSingle();
            
          if (clinicianData) {
            console.log("[UserContext] Clinician data found:", clinicianData);
            setUserRole('clinician');
            setIsClinician(true);
            setClientStatus(null);
          } else {
            console.log("[UserContext] No clinician data found, checking clients table");
            
            // Check clients table as final fallback
            const { data: clientData, error: clientError } = await supabase
              .from('clients')
              .select('role, client_status')
              .eq('id', formattedUserId)
              .maybeSingle();
              
            if (clientData) {
              console.log("[UserContext] Client data found:", clientData);
              setUserRole(clientData.role);
              setClientStatus(clientData.client_status);
              setIsClinician(false);
            } else {
              console.log("[UserContext] No user data found in any table");
              setUserRole(null);
              setClientStatus(null);
              setIsClinician(false);
            }
          }
        }
      } else {
        console.log("[UserContext] No authenticated user found");
        setUserRole(null);
        setClientStatus(null);
        setUserId(null);
        setIsClinician(false);
      }
    } catch (error) {
      console.error("[UserContext] Error in fetchUserData:", error);
      setUserRole(null);
      setClientStatus(null);
      setIsClinician(false);
    } finally {
      console.log("[UserContext] Setting isLoading to false");
      setIsLoading(false);
    }
  };

  // Make fetchUserData available through the context
  const refreshUserContext = async () => {
    setIsLoading(true);
    await fetchUserData();
  };

  // First set up the auth state listener
  useEffect(() => {
    console.log("[UserContext] Initializing user context and setting up auth state listener");
    
    // Subscribe to auth changes - set up before checking existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[UserContext] Auth state changed:", event, session ? "Session exists" : "No session");
      // Use setTimeout to prevent potential auth callback deadlocks
      setTimeout(() => {
        fetchUserData();
      }, 0);
    });

    // Then check for existing session
    fetchUserData();

    return () => {
      console.log("[UserContext] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  // Create enhanced context value with refresh function
  const contextValue: UserContextType = {
    userRole,
    clientStatus,
    isLoading,
    userId,
    isClinician,
    refreshUserContext
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * @hook useUser
 * @description Hook for accessing the user context values.
 *
 * @returns {UserContextType} The user context value containing userRole, clientStatus, isLoading, userId, and isClinician
 *
 * @example
 * // Using the hook in a component
 * const { userRole, clientStatus, isLoading, userId, isClinician } = useUser();
 *
 * if (isLoading) {
 *   return <LoadingSpinner />;
 * }
 *
 * if (!userId) {
 *   return <Redirect to="/login" />;
 * }
 *
 * return isClinician ? <ClinicianDashboard /> : <ClientDashboard />;
 */
export const useUser = () => useContext(UserContext);
