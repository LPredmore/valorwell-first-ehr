
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
            // Check if user is a clinician
            const { data: clinicianData, error: clinicianError } = await supabase
              .from('clinicians')
              .select('id')
              .eq('id', user.id)
              .maybeSingle();
              
            if (!clinicianError && clinicianData) {
              console.log("[UserContext] User is a clinician");
              setUserRole('clinician');
              setClientStatus('Active');
            } else {
              // Check if user is an admin
              const { data: adminData, error: adminError } = await supabase
                .from('admins')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();
                
              if (!adminError && adminData) {
                console.log("[UserContext] User is an admin");
                setUserRole('admin');
                setClientStatus('Active');
              } else {
                console.log("[UserContext] No role found for user");
                setUserRole(null);
                setClientStatus(null);
              }
            }
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

export const useUser = () => useContext(UserContext);
