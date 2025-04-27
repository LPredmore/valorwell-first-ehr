
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
          
        case 'update':
          // Simulate an update
          const { error: updateError } = await supabase.rpc(
            'debug_rls_check',
            { 
              schema_name: 'public', 
              table_name: tableName, 
              operation: 'UPDATE',
              record_id: 'test' 
            }
          );
          result = !updateError;
          break;
          
        case 'delete':
          // Simulate a delete
          const { error: deleteError } = await supabase.rpc(
            'debug_rls_check',
            { 
              schema_name: 'public', 
              table_name: tableName, 
              operation: 'DELETE',
              record_id: 'test' 
            }
          );
          result = !deleteError;
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
      
      // Get profile info
      let profileData = null;
      if (userData.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, time_zone')
            .eq('id', userData.user.id)
            .maybeSingle();
            
          if (!profileError && profile) {
            profileData = profile;
          } else if (profileError) {
            console.error('[authDebugUtils] Error fetching profile:', profileError);
          }
        } catch (e) {
          console.error('[authDebugUtils] Exception fetching profile:', e);
        }
      }
      
      // Get client info
      let clientData = null;
      if (userData.user) {
        try {
          const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('role, client_status')
            .eq('id', userData.user.id)
            .maybeSingle();
            
          if (!clientError && client) {
            clientData = client;
          } else if (clientError) {
            console.error('[authDebugUtils] Error fetching client:', clientError);
          }
        } catch (e) {
          console.error('[authDebugUtils] Exception fetching client:', e);
        }
      }
      
      return {
        authenticated: !!userData.user,
        userId: userData.user?.id,
        email: userData.user?.email,
        sessionExpires: sessionData.session?.expires_at,
        profileData,
        clientData,
      };
    } catch (error) {
      console.error('[authDebugUtils] Error in getAuthState:', error);
      return { authenticated: false, userId: null, error: String(error) };
    }
  },
  
  /**
   * Debug authentication issues with calendar access
   */
  async debugCalendarAccess(clinicianId: string | null, currentUserId: string | null) {
    try {
      console.group('[authDebugUtils] Calendar Access Debug');
      
      console.log('Clinician ID:', clinicianId);
      console.log('Current User ID:', currentUserId);
      
      if (!clinicianId || !currentUserId) {
        console.error('Missing required IDs for debugging');
        console.groupEnd();
        return {
          success: false,
          error: 'Missing required IDs'
        };
      }
      
      const authState = await this.getAuthState();
      console.log('Auth state:', authState);
      
      // Check if user can insert into calendar_events
      const canInsertCalendarEvents = await this.checkPermissions('calendar_events', 'insert');
      console.log('Can insert calendar events:', canInsertCalendarEvents);
      
      // Check if user can select from calendar_events
      const canSelectCalendarEvents = await this.checkPermissions('calendar_events', 'select');
      console.log('Can select calendar events:', canSelectCalendarEvents);
      
      // Get calendars for this clinician
      let calendarCheck = { success: false, data: null, error: null };
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('id, title')
          .eq('clinician_id', clinicianId)
          .limit(1);
          
        calendarCheck = { 
          success: !error, 
          data: data && data.length > 0 ? data[0] : null, 
          error: error ? error.message : null 
        };
        
        console.log('Calendar check result:', calendarCheck);
      } catch (e) {
        console.error('Error in calendar check:', e);
        calendarCheck.error = e instanceof Error ? e.message : String(e);
      }
      
      const result = {
        currentUser: currentUserId,
        targetClinician: clinicianId,
        isSelf: currentUserId === clinicianId,
        authState,
        permissions: {
          canInsertCalendarEvents,
          canSelectCalendarEvents
        },
        calendarCheck
      };
      
      console.log('Debug result:', result);
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('[authDebugUtils] Error in debugCalendarAccess:', error);
      console.groupEnd();
      return {
        success: false,
        error: String(error)
      };
    }
  }
};
