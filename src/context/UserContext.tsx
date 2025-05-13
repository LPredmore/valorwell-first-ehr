
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserContextType = {
  userRole: string | null;
  clientStatus: string | null;
  isLoading: boolean;
  userId: string | null;
  authInitialized: boolean; // Added to track if auth has been initialized
};

const UserContext = createContext<UserContextType>({ 
  userRole: null, 
  clientStatus: null,
  isLoading: true,
  userId: null,
  authInitialized: false
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clientStatus, setClientStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

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
          
          // First, get role from user metadata
          const metadataRole = user.user_metadata?.role;
          console.log("[UserContext] User role from metadata:", metadataRole);
          
          if (metadataRole) {
            // Validate that metadataRole is one of the expected values
            if (metadataRole === 'admin' || metadataRole === 'clinician' || metadataRole === 'client') {
              // If role exists in metadata, use it as the primary source of truth
              console.log("[UserContext] Using role from metadata:", metadataRole);
              
              // Get status from the corresponding table based on metadata role
              if (metadataRole === 'admin') {
                const { data: adminData, error: adminError } = await supabase
                  .from('admins')
                  .select('admin_status')
                  .eq('id', user.id)
                  .single();
                  
                if (adminError || !adminData) {
                  console.error(`[UserContext] Data inconsistency: User ${user.id} has metadataRole 'admin' but not found in 'admins' table.`, adminError);
                  setUserRole(null);
                  setClientStatus(null);
                } else {
                  setUserRole(metadataRole);
                  setClientStatus(adminData.admin_status);
                  console.log("[UserContext] Admin status:", adminData?.admin_status);
                }
              } 
              else if (metadataRole === 'clinician') {
                const { data: clinicianData, error: clinicianError } = await supabase
                  .from('clinicians')
                  .select('clinician_status')
                  .eq('id', user.id)
                  .single();
                  
                if (clinicianError || !clinicianData) {
                  console.error(`[UserContext] Data inconsistency: User ${user.id} has metadataRole 'clinician' but not found in 'clinicians' table.`, clinicianError);
                  setUserRole(null);
                  setClientStatus(null);
                } else {
                  setUserRole(metadataRole);
                  setClientStatus(clinicianData?.clinician_status);
                  console.log("[UserContext] Clinician status:", clinicianData?.clinician_status);
                }
              } 
              else if (metadataRole === 'client') {
                const { data: clientData, error: clientError } = await supabase
                  .from('clients')
                  .select('client_status')
                  .eq('id', user.id)
                  .single();
                  
                if (clientError || !clientData) {
                  console.error(`[UserContext] Data inconsistency: User ${user.id} has metadataRole 'client' but not found in 'clients' table.`, clientError);
                  setUserRole(null);
                  setClientStatus(null);
                } else {
                  setUserRole(metadataRole);
                  setClientStatus(clientData?.client_status);
                  console.log("[UserContext] Client status:", clientData?.client_status);
                }
              }
            } else {
              // Invalid role in metadata
              console.error(`[UserContext] Invalid role '${metadataRole}' found in user metadata for user ${user.id}.`);
              setUserRole(null);
              setClientStatus(null);
            }
          } 
          else {
            // Fallback to checking tables if no role in metadata (backward compatibility)
            console.log("[UserContext] No role in metadata, checking database tables");
            
            // First, check the admins table
            console.log("[UserContext] Checking admins table for user:", user.id);
            const { data: adminData, error: adminError } = await supabase
              .from('admins')
              .select('admin_status')
              .eq('id', user.id)
              .single();
              
            if (!adminError && adminData) {
              // User found in admins table
              console.log("[UserContext] User found in admins table, setting role to 'admin'");
              setUserRole('admin');
              setClientStatus(adminData.admin_status);
            } else {
              // If not in admins table, check the clients table
              console.log("[UserContext] Checking clients table for user:", user.id);
              const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('client_status')
                .eq('id', user.id)
                .single();
                
              if (!clientError && clientData) {
                // User found in clients table
                console.log("[UserContext] User found in clients table, setting role to 'client'");
                setUserRole('client');
                setClientStatus(clientData.client_status);
              } else {
                // If not in clients table, check clinicians table
                console.log("[UserContext] Checking clinicians table for user:", user.id);
                const { data: clinicianData, error: clinicianError } = await supabase
                  .from('clinicians')
                  .select('clinician_status')
                  .eq('id', user.id)
                  .single();
                  
                if (!clinicianError && clinicianData) {
                  // User is a clinician
                  console.log("[UserContext] User found in clinicians table, setting role to 'clinician'");
                  setUserRole('clinician');
                  setClientStatus(clinicianData.clinician_status);
                } else {
                  // If we reach here, user not found in any role table
                  console.log("[UserContext] User not found in admins, clients, or clinicians tables");
                  setUserRole(null);
                  setClientStatus(null);
                }
              }
            }
          }
        } else {
          // No authenticated user
          console.log("[UserContext] No authenticated user found");
          setUserId(null);
          setUserRole(null);
          setClientStatus(null);
        }
      } catch (error) {
        console.error("[UserContext] Error in fetchUserData:", error);
        setUserRole(null);
        setClientStatus(null);
        setUserId(null);
      } finally {
        console.log("[UserContext] Setting isLoading to false");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };

    // First set up the auth state listener
    console.log("[UserContext] Setting up auth state listener");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[UserContext] Auth state changed:", event, session ? "Session exists" : "No session");
      
      // Use setTimeout to prevent potential deadlocks with Supabase auth state handling
      setTimeout(() => {
        // Reset loading state when auth changes to ensure we properly fetch updated data
        setIsLoading(true);
        fetchUserData();
      }, 0);
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
    <UserContext.Provider value={{ userRole, clientStatus, isLoading, userId, authInitialized }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
