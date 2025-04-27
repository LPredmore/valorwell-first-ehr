
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for debugging authentication and permissions issues
 */
export const authDebugUtils = {
  /**
   * Check permissions for a given table and operation
   */
  async checkPermissions(tableName: string, operation: 'select' | 'insert' | 'update' | 'delete'): Promise<boolean> {
    try {
      // Verify we're authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[authDebugUtils] Not authenticated');
        return false;
      }
      
      let result = false;
      
      switch (operation) {
        case 'select':
          // Try to select a single row
          const { error: selectError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          result = !selectError;
          break;
          
        case 'insert':
          // Simulate an insert
          const { error: insertError } = await supabase.rpc(
            'debug_rls_check',
            { 
              schema_name: 'public', 
              table_name: tableName, 
              operation: 'INSERT',
              record_id: 'test' 
            }
          );
          result = !insertError;
          break;
          
        default:
          console.warn(`[authDebugUtils] Unsupported operation: ${operation}`);
          return false;
      }
      
      console.log(`[authDebugUtils] Permission check for ${tableName}/${operation}: ${result ? 'GRANTED' : 'DENIED'}`);
      return result;
      
    } catch (error) {
      console.error(`[authDebugUtils] Error checking permissions for ${tableName}/${operation}:`, error);
      return false;
    }
  },
  
  /**
   * Get the current auth state
   */
  async getAuthState() {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[authDebugUtils] Error getting session:', sessionError);
        return { authenticated: false, userId: null, error: sessionError.message };
      }
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('[authDebugUtils] Error getting user:', userError);
        return { 
          authenticated: !!sessionData.session, 
          userId: sessionData.session?.user.id,
          error: userError.message
        };
      }
      
      return {
        authenticated: !!userData.user,
        userId: userData.user?.id,
        email: userData.user?.email,
        sessionExpires: sessionData.session?.expires_at,
      };
    } catch (error) {
      console.error('[authDebugUtils] Error in getAuthState:', error);
      return { authenticated: false, userId: null, error: String(error) };
    }
  }
};
