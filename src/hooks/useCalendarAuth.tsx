
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CalendarAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUserId: string | null;
  userEmail: string | null;
  userRole: string | null;
  refreshAuth: () => Promise<void>;
}

export const useCalendarAuth = (): CalendarAuthResult => {
  const { userId, isLoading: isUserLoading, userRole: contextUserRole } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    // Don't fetch if there's no userId from context yet
    if (!userId) {
      console.log('[useCalendarAuth] No userId from context yet, skipping fetch');
      return;
    }
    
    // Prevent duplicate checks
    if (isChecking) {
      console.log('[useCalendarAuth] Already checking, skipping duplicate fetch');
      return;
    }
    
    try {
      setIsChecking(true);
      console.log('[useCalendarAuth] Fetching current user details', {
        contextUserId: userId,
        contextUserRole: contextUserRole
      });
      
      // Get user from supabase auth
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[useCalendarAuth] Error getting current user:', error);
        toast({
          title: "Authentication Error",
          description: "Unable to verify your login status. Please try logging in again.",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }
      
      if (data?.user) {
        console.log('[useCalendarAuth] Current authenticated user:', {
          id: data.user.id,
          email: data.user.email
        });
        
        setCurrentUserId(data.user.id);
        setUserEmail(data.user.email);
        
        // Compare to context userId for consistency check
        if (userId !== data.user.id) {
          console.warn('[useCalendarAuth] Warning: Context userId doesn\'t match authenticated user', {
            contextUserId: userId,
            authUserId: data.user.id
          });
        }
        
        // Get additional profile data
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();
            
          if (profileData?.role) {
            setUserRole(profileData.role);
            
            // Compare to context userRole for consistency check
            if (contextUserRole !== profileData.role) {
              console.warn('[useCalendarAuth] Warning: Context userRole doesn\'t match profile role', {
                contextUserRole,
                profileRole: profileData.role
              });
            }
          } else {
            setUserRole(contextUserRole);
          }
        } catch (profileError) {
          console.error('[useCalendarAuth] Error fetching user profile:', profileError);
          setUserRole(contextUserRole); // Fallback to context
        }
        
      } else {
        console.log('[useCalendarAuth] No authenticated user found');
        setCurrentUserId(null);
        setUserEmail(null);
        setUserRole(null);
        navigate('/login');
      }
    } catch (error) {
      console.error('[useCalendarAuth] Exception in user verification:', error);
      toast({
        title: "Error",
        description: "Unable to verify your user information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  }, [userId, navigate, toast, contextUserRole]);

  // Refresh auth state on demand
  const refreshAuth = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!isUserLoading && !userId) {
      console.log('[useCalendarAuth] User not authenticated, redirecting to login');
      toast({
        title: "Authentication Required",
        description: "Please log in to access the calendar"
      });
      navigate('/login');
      return;
    }

    fetchCurrentUser();
  }, [isUserLoading, userId, navigate, toast, fetchCurrentUser]);

  // Subscribe to auth state changes
  useEffect(() => {
    console.log('[useCalendarAuth] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[useCalendarAuth] Auth state changed: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id
      });
      
      if (event === 'SIGNED_OUT') {
        setCurrentUserId(null);
        setUserEmail(null);
        setUserRole(null);
        navigate('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchCurrentUser();
      }
    });

    return () => {
      console.log('[useCalendarAuth] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [navigate, fetchCurrentUser]);

  return { 
    isAuthenticated: !!userId,
    isLoading: isUserLoading || isChecking,
    currentUserId,
    userEmail,
    userRole,
    refreshAuth
  };
};
