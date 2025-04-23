
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { AuthState } from '../types';

const UserContext = createContext<AuthState>({ 
  userRole: null, 
  isLoading: true,
  userId: null,
  user: null,
  session: null
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<AuthState['user']>(null);
  const [session, setSession] = useState<AuthState['session']>(null);

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
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
            
          if (clientError) {
            console.error("[UserContext] Error fetching client:", clientError.message);
            throw clientError;
          }

          if (clientData) {
            console.log("[UserContext] Client data:", clientData);
            setUserRole(clientData.role);
            setUser({
              id: user.id,
              email: user.email!,
              role: clientData.role
            });
          } else {
            console.log("[UserContext] No client data found");
            setUserRole(null);
          }
        } else {
          console.log("[UserContext] No authenticated user found");
          setUserRole(null);
          setUser(null);
        }
      } catch (error) {
        console.error("[UserContext] Error in fetchUserData:", error);
        setUserRole(null);
        setUser(null);
      } finally {
        console.log("[UserContext] Setting isLoading to false");
        setIsLoading(false);
      }
    };

    // First set up the auth state listener
    console.log("[UserContext] Setting up auth state listener");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[UserContext] Auth state changed:", event, session ? "Session exists" : "No session");
      setSession(session);
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
    <UserContext.Provider value={{ userRole, isLoading, userId, user, session }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
