
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserInfo {
  id: string;
  email: string | undefined;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
}

export const useUser = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error || !authUser) {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Get user profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        const userInfo: UserInfo = {
          id: authUser.id,
          email: authUser.email,
          firstName: profileData?.first_name || authUser?.user_metadata?.first_name,
          lastName: profileData?.last_name || authUser?.user_metadata?.last_name,
          phone: profileData?.phone || authUser?.user_metadata?.phone,
          role: profileData?.role || authUser?.user_metadata?.role || 'user'
        };

        setUser(userInfo);
        setIsAdmin(userInfo.role === 'admin');
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        getUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
      }
    });

    getUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    userId: user?.id,
    isUser: !!user,
    isAdmin,
    isLoading,
  };
};

export default useUser;
