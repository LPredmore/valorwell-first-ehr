
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserContextType {
  user: User | null;
  userRole: string | null;
  userId: string | null;
  clientStatus: string | null;
  isLoading: boolean;
  refreshUser: (() => Promise<void>) | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  userRole: null,
  userId: null,
  clientStatus: null,
  isLoading: true,
  refreshUser: null,
});

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [clientStatus, setClientStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      } else {
        setUserRole(data?.role || null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
    }
  };

  const fetchClientStatus = async (userId: string) => {
    try {
      // Only fetch client status if the user is a client
      if (userRole === 'client') {
        const { data, error } = await supabase
          .from('clients')
          .select('client_status')
          .eq('id', userId)
          .single();

        if (error) {
          console.error("Error fetching client status:", error);
          setClientStatus(null);
        } else {
          setClientStatus(data?.client_status || 'New');
        }
      } else {
        setClientStatus(null);
      }
    } catch (error) {
      console.error("Error fetching client status:", error);
      setClientStatus(null);
    }
  };

  const checkTempPassword = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("temp_password")
        .eq("id", userId)
        .single();
        
      if (error) {
        console.error("[UserContext] Error checking temp password:", error);
        return;
      }
      
      if (data?.temp_password) {
        console.log("[UserContext] User has temporary password, showing change dialog");
        setShowPasswordChange(true);
      }
    } catch (err) {
      console.error("[UserContext] Error in checkTempPassword:", err);
    }
  };

  const refreshUser = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (data?.session?.user) {
        setUser(data.session.user);
        setUserId(data.session.user.id);
        await fetchUserRole(data.session.user.id);
        await fetchClientStatus(data.session.user.id);
      }
    } catch (err) {
      console.error("[UserContext] Error in refreshUser:", err);
    }
  };

  useEffect(() => {
    const fetchInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data?.session?.user) {
          setUser(data.session.user);
          setUserId(data.session.user.id);
          await fetchUserRole(data.session.user.id);
          
          if (userRole === 'client') {
            await fetchClientStatus(data.session.user.id);
          }
          
          await checkTempPassword(data.session.user.id);
        }
      } catch (err) {
        console.error("[UserContext] Error in fetchInitialSession:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[UserContext] Auth state changed:", event);
        
        setUser(session?.user ?? null);
        setUserId(session?.user?.id ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
          
          if (userRole === 'client') {
            await fetchClientStatus(session.user.id);
          }
          
          if (event === "SIGNED_IN") {
            await checkTempPassword(session.user.id);
          }
        } else {
          setUserRole(null);
          setClientStatus(null);
        }
      }
    );
    
    fetchInitialSession();
    
    return () => {
      console.info("[UserContext] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [userRole]);
  
  const ChangePasswordDialog = React.lazy(() => import('../components/auth/ChangePasswordDialog'));
  
  return (
    <UserContext.Provider value={{ user, userRole, userId, clientStatus, isLoading, refreshUser }}>
      {children}
      {showPasswordChange && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <ChangePasswordDialog 
            isOpen={showPasswordChange} 
            onClose={() => setShowPasswordChange(false)} 
          />
        </React.Suspense>
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
