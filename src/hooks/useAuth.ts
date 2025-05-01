import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthState {
  user: User | null;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseAuthResult extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Hook for authentication state and operations
 * Provides authentication state and methods for sign in, sign out, and refreshing auth state
 */
export function useAuth(): UseAuthResult {
  const [state, setState] = useState<AuthState>({
    user: null,
    userId: null,
    userEmail: null,
    userRole: null,
    isLoading: true,
    error: null
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch user profile data
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('[useAuth] Error fetching user profile:', error);
        return null;
      }
      
      return data?.role || null;
    } catch (error) {
      console.error('[useAuth] Exception in fetchUserProfile:', error);
      return null;
    }
  }, []);
  
  // Get initial session and set up auth state
  const getInitialSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      const user = data.session?.user || null;
      
      if (user) {
        const userRole = await fetchUserProfile(user.id);
        
        setState({
          user,
          userId: user.id,
          userEmail: user.email || null,
          userRole,
          isLoading: false,
          error: null
        });
      } else {
        setState({
          user: null,
          userId: null,
          userEmail: null,
          userRole: null,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('[useAuth] Error in getInitialSession:', error);
      
      setState({
        user: null,
        userId: null,
        userEmail: null,
        userRole: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to get session')
      });
    }
  }, [fetchUserProfile]);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      const user = data.user;
      
      if (user) {
        const userRole = await fetchUserProfile(user.id);
        
        setState({
          user,
          userId: user.id,
          userEmail: user.email || null,
          userRole,
          isLoading: false,
          error: null
        });
        
        toast({
          title: "Signed in successfully",
          description: `Welcome back, ${user.email}`,
          variant: "default"
        });
        
        navigate('/calendar');
      }
    } catch (error) {
      console.error('[useAuth] Error in signIn:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to sign in')
      }));
      
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : 'Failed to sign in',
        variant: "destructive"
      });
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setState({
        user: null,
        userId: null,
        userEmail: null,
        userRole: null,
        isLoading: false,
        error: null
      });
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out",
        variant: "default"
      });
      
      navigate('/login');
    } catch (error) {
      console.error('[useAuth] Error in signOut:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to sign out')
      }));
      
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : 'Failed to sign out',
        variant: "destructive"
      });
    }
  };
  
  // Refresh auth state
  const refreshAuth = async () => {
    await getInitialSession();
  };
  
  // Initialize auth state
  useEffect(() => {
    getInitialSession();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[useAuth] Auth state changed: ${event}`, {
          hasSession: !!session,
          userId: session?.user?.id
        });
        
        if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            userId: null,
            userEmail: null,
            userRole: null,
            isLoading: false,
            error: null
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const user = session?.user || null;
          
          if (user) {
            const userRole = await fetchUserProfile(user.id);
            
            setState({
              user,
              userId: user.id,
              userEmail: user.email || null,
              userRole,
              isLoading: false,
              error: null
            });
          }
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [getInitialSession, fetchUserProfile]);
  
  return {
    ...state,
    signIn,
    signOut,
    refreshAuth,
    isAuthenticated: !!state.user
  };
}