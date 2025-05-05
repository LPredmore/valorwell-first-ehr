
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserContextType = {
  userRole: string | null;
  clientStatus: string | null;
  isLoading: boolean;
  userId: string | null;
};

const UserContext = createContext<UserContextType>({ 
  userRole: null, 
  clientStatus: null,
  isLoading: true,
  userId: null
});

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
          
          // First, check the clients table
          console.log("[UserContext] Checking clients table for user:", user.id);
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('role, client_status')
            .eq('id', user.id)
            .single();
            
          if (!clientError && clientData) {
            // User found in clients table
            const role = clientData.role || null;
            console.log("[UserContext] User role from clients table:", role);
            setUserRole(role);
            
            console.log("[UserContext] Client status:", clientData.client_status);
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
              console.log("[UserContext] User not found in clients or clinicians tables");
            }
          }
        } else {
          console.log("[UserContext] No authenticated user found");
        }
      } catch (error) {
        console.error("[UserContext] Error in fetchUserData:", error);
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

export const useUser = () => useContext(UserContext);
