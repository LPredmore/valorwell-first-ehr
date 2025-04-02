
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type UserContextType = {
  userRole: string | null;
  clientStatus: string | null;
  isLoading: boolean;
  userId: string | null;
  session: Session | null;
  user: User | null;
};

const UserContext = createContext<UserContextType>({ 
  userRole: null, 
  clientStatus: null,
  isLoading: true,
  userId: null,
  session: null,
  user: null
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clientStatus, setClientStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Mark as loading at the start of the effect
    setIsLoading(true);
    
    console.log('Setting up auth state listener');

    // First, set up auth state listener before checking for existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        // Update session and user state
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (newSession?.user) {
          setUserId(newSession.user.id);
          
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', newSession.user.id)
              .single();
              
            if (error) throw error;
            const role = data?.role || null;
            setUserRole(role);
            
            // If user is a client, fetch client status
            if (role === 'client') {
              const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('client_status')
                .eq('id', newSession.user.id)
                .single();
                
              if (!clientError && clientData) {
                setClientStatus(clientData.client_status);
              }
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        } else {
          // Reset user-related states when logged out
          setUserId(null);
          setUserRole(null);
          setClientStatus(null);
        }
        
        // Always mark as not loading when auth state processing is complete
        setIsLoading(false);
      }
    );

    // Then check for existing session
    const checkExistingSession = async () => {
      try {
        console.log('Checking for existing session');
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        // If no session, mark as not loading and return early
        if (!existingSession) {
          console.log('No existing session found');
          setIsLoading(false);
          return;
        }
        
        console.log('Existing session found');
        // If we have a session, don't setIsLoading(false) here
        // The onAuthStateChange handler will do that after processing user data
        
        // We still set the session and user here for immediate access
        setSession(existingSession);
        setUser(existingSession.user);
        
        // The rest of the user data fetching will happen in the auth state change listener
      } catch (error) {
        console.error('Error checking session:', error);
        setIsLoading(false);
      }
    };
    
    checkExistingSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ userRole, clientStatus, isLoading, userId, session, user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
