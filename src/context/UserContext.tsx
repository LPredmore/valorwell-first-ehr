
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
            setIsLoading(false);
            return; // Important: Return here to prevent checking other tables
          } else {
            console.log("[UserContext] Admin check result:", adminError ? `Error: ${adminError.message}` : "No admin record found");
            
            // If not in admins table, check the clients table
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
              setIsLoading(false);
              return; // Important: Return here to prevent checking other tables
            } else {
              console.log("[UserContext] Client check result:", clientError ? `Error: ${clientError.message}` : "No client record found");
              
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
                setIsLoading(false);
                return;
              } else {
                console.log("[UserContext] Clinician check result:", clinicianError ? `Error: ${clinicianError.message}` : "No clinician record found");
                console.log("[UserContext] User not found in any role table");
                setIsLoading(false);
              }
            }
          }
        } else {
          console.log("[UserContext] No authenticated user found");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[UserContext] Error in fetchUserData:", error);
        setIsLoading(false);
      }
    };

    // Initial auth state check and listener setup
    const setupAuth = async () => {
      setIsLoading(true);
      
      // First set up the auth state listener
      console.log("[UserContext] Setting up auth state listener");
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("[UserContext] Auth state changed:", event, session ? "Session exists" : "No session");
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Wait a moment for Supabase to fully process the authentication
          setTimeout(() => {
            fetchUserData();
          }, 300);
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null);
          setClientStatus(null);
          setUserId(null);
          setIsLoading(false);
        }
      });

      // Then check for existing session
      console.log("[UserContext] Checking for existing session");
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log("[UserContext] Existing session found, fetching user data");
        fetchUserData();
      } else {
        console.log("[UserContext] No existing session");
        setIsLoading(false);
      }

      return subscription;
    };
    
    // Setup auth and get unsubscribe function
    const setupPromise = setupAuth();
    
    // Return cleanup function
    return () => {
      setupPromise.then(subscription => {
        console.log("[UserContext] Cleaning up auth subscription");
        subscription.unsubscribe();
      });
    };
  }, []);

  return (
    <UserContext.Provider value={{ userRole, clientStatus, isLoading, userId }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
