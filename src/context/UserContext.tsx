import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserContextType {
  user: User | null;
  userRole: string | null;
  isLoading: boolean;
  refreshUser: (() => Promise<void>) | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  refreshUser: null,
});

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
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
        await fetchUserRole(data.session.user.id);
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
          await fetchUserRole(data.session.user.id);
          
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
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
          
          if (event === "SIGNED_IN") {
            await checkTempPassword(session.user.id);
          }
        } else {
          setUserRole(null);
        }
      }
    );
    
    fetchInitialSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const ChangePasswordDialog = React.lazy(() => import('../components/auth/ChangePasswordDialog'));
  
  return (
    <UserContext.Provider value={{ user, userRole, isLoading, refreshUser }}>
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
