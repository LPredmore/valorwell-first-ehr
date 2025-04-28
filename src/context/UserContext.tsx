
/**
 * @context UserContext
 * @description Context for managing user authentication state and profile information.
 * Provides user role, client status, loading state, and user ID throughout the application.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
};

/**
 * Context for providing user authentication and profile information
 */
const UserContext = createContext<UserContextType>({
  userRole: null,
  clientStatus: null,
  isLoading: true,
  userId: null
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

  useEffect(() => {
    console.log("[UserContext] Initializing user context");
    
    const fetchUserData = async () => {
      try {
        console.log("[UserContext] Fetching user data");
        const { data: { user } } = await supabase.auth.getUser();
        console.log("[UserContext] Auth user data:", user ? "User found" : "No user found");
        
        if (user) {
          console.log("[UserContext] Setting userId:", user.id);
          setUserId(user.id);
          
          console.log("[UserContext] Fetching client data for user:", user.id);
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('role, client_status')
            .eq('id', user.id)
            .maybeSingle();
            
          if (clientError) {
            console.error("[UserContext] Error fetching client:", clientError.message);
            throw clientError;
          }

          if (clientData) {
            console.log("[UserContext] Client data:", clientData);
            setUserRole(clientData.role);
            setClientStatus(clientData.client_status);
          } else {
            console.log("[UserContext] No client data found");
            setUserRole(null);
            setClientStatus(null);
          }
        } else {
          console.log("[UserContext] No authenticated user found");
          setUserRole(null);
          setClientStatus(null);
        }
      } catch (error) {
        console.error("[UserContext] Error in fetchUserData:", error);
        setUserRole(null);
        setClientStatus(null);
      } finally {
        console.log("[UserContext] Setting isLoading to false");
        setIsLoading(false);
      }
    };

    // First set up the auth state listener
    console.log("[UserContext] Setting up auth state listener");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[UserContext] Auth state changed:", event, session ? "Session exists" : "No session");
      fetchUserData();
    });

    // Then check for existing session
    console.log("[UserContext] Checking for existing session");
    fetchUserData();

    return () => {
      console.log("[UserContext] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ userRole, clientStatus, isLoading, userId }}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * @hook useUser
 * @description Hook for accessing the user context values.
 *
 * @returns {UserContextType} The user context value containing userRole, clientStatus, isLoading, and userId
 *
 * @example
 * // Using the hook in a component
 * const { userRole, clientStatus, isLoading, userId } = useUser();
 *
 * if (isLoading) {
 *   return <LoadingSpinner />;
 * }
 *
 * if (!userId) {
 *   return <Redirect to="/login" />;
 * }
 *
 * return userRole === 'clinician' ? <ClinicianDashboard /> : <ClientDashboard />;
 */
export const useUser = () => useContext(UserContext);
