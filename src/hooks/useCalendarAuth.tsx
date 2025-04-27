
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CalendarAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUserId: string | null;
  userEmail: string | null;
}

export const useCalendarAuth = (): CalendarAuthResult => {
  const { userId, isLoading: isUserLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

    const fetchCurrentUser = async () => {
      try {
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
        } else {
          console.log('[useCalendarAuth] No authenticated user found');
          setCurrentUserId(null);
          setUserEmail(null);
          navigate('/login');
        }
      } catch (error) {
        console.error('[useCalendarAuth] Exception in user verification:', error);
        toast({
          title: "Error",
          description: "Unable to verify your user information. Please try again.",
          variant: "destructive"
        });
      }
    };

    if (userId) {
      fetchCurrentUser();
    }
  }, [isUserLoading, userId, navigate, toast]);

  return { 
    isAuthenticated: !!userId,
    isLoading: isUserLoading,
    currentUserId,
    userEmail
  };
};
