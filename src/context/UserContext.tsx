
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
          
          // First, get role from user metadata
          const metadataRole = user.user_metadata?.role;
          console.log("[UserContext] User role from metadata:", metadataRole);
          
          if (metadataRole) {
            // If role exists in metadata, use it as the primary source of truth
            setUserRole(metadataRole);
            console.log("[UserContext] Using role from metadata:", metadataRole);
            
            // Get status from the corresponding table based on metadata role
            if (metadataRole === 'admin') {
              const { data: adminData } = await supabase
                .from('admins')
                .select('admin_status')
                .eq('id', user.id)
                .single();
                
              setClientStatus(adminData?.admin_status || 'Active');
              console.log("[UserContext] Admin status:", adminData?.admin_status);
            } 
            else if (metadataRole === 'clinician') {
              const { data: clinicianData } = await supabase
                .from('clinicians')
                .select('clinician_status')
                .eq('id', user.id)
                .single();
                
              setClientStatus(clinicianData?.clinician_status || 'Active');
              console.log("[UserContext] Clinician status:", clinicianData?.clinician_status);
            } 
            else if (metadataRole === 'client') {
              const { data: clientData } = await supabase
                .from('clients')
                .select('client_status')
                .eq('id', user.id)
                .single();
                
              setClientStatus(clientData?.client_status || 'Active');
              console.log("[UserContext] Client status:", clientData?.client_status);
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
                .select('role, client_status')
                .eq('id', user.id)
                .single();
                
              if (!clientError && clientData) {
                // User found in clients table
                const role = clientData.role || 'client';
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
                  console.log("[UserContext] User not found in admins, clients, or clinicians tables");
                }
              }
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
