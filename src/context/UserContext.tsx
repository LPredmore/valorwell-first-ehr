
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
          
          console.log("[UserContext] Fetching profile data for user:", user.id);
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("[UserContext] Error fetching profile:", error.message);
            throw error;
          }
          
          const role = data?.role || null;
          console.log("[UserContext] User role from profile:", role);
          setUserRole(role);
          
          // If user is a client, fetch client status from clients table
          if (role === 'client') {
            console.log("[UserContext] User is a client, fetching client status");
            const { data: clientData, error: clientError } = await supabase
              .from('clients')
              .select('client_status')
              .eq('id', user.id)
              .single();
              
            if (clientError) {
              console.error("[UserContext] Error fetching client status:", clientError.message);
            }
            
            if (!clientError && clientData) {
              console.log("[UserContext] Client status:", clientData.client_status);
              setClientStatus(clientData.client_status);
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
