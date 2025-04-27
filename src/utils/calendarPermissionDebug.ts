
import { supabase } from '@/integrations/supabase/client';
import { authDebugUtils } from './authDebugUtils';

/**
 * Specialized utility for debugging calendar permission issues
 */
export const calendarPermissionDebug = {
  /**
   * Run a full diagnostic on calendar permissions
   */
  async runDiagnostic(currentUserId: string | null, selectedClinicianId: string | null) {
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    try {
      console.group('[CalendarPermissionDebug] Running diagnostic tests');
      
      // Test 1: Check authentication
      results.tests.auth = await this.checkAuthentication();
      
      // Test 2: Check if user exists in profiles
      if (currentUserId) {
        results.tests.userProfile = await this.checkUserProfile(currentUserId);
      }
      
      // Test 3: Check if the selected clinician exists
      if (selectedClinicianId) {
        results.tests.clinicianProfile = await this.checkClinicianProfile(selectedClinicianId);
      }
      
      // Test 4: Check calendar_events permissions
      results.tests.calendarPermissions = await this.checkCalendarPermissions(currentUserId, selectedClinicianId);
      
      // Overall result
      results.success = Object.values(results.tests).every((test: any) => test.success);
      results.summary = this.generateSummary(results);
      
      console.log('[CalendarPermissionDebug] Diagnostic results:', results);
      console.groupEnd();
      
      return results;
    } catch (error) {
      console.error('[CalendarPermissionDebug] Error in diagnostic:', error);
      console.groupEnd();
      
      return {
        timestamp: new Date().toISOString(),
        success: false,
        error: String(error),
        tests: results.tests
      };
    }
  },
  
  /**
   * Check if the user is authenticated
   */
  async checkAuthentication() {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        return {
          success: false,
          error: error.message,
          message: 'Authentication check failed'
        };
      }
      
      if (!data.user) {
        return {
          success: false,
          error: 'No authenticated user found',
          message: 'Not logged in'
        };
      }
      
      return {
        success: true,
        userId: data.user.id,
        email: data.user.email,
        message: 'User is authenticated'
      };
    } catch (error) {
      console.error('[CalendarPermissionDebug] Auth check error:', error);
      return {
        success: false,
        error: String(error),
        message: 'Authentication check failed with exception'
      };
    }
  },
  
  /**
   * Check if the user exists in the profiles table
   */
  async checkUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, first_name, last_name')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to fetch user profile'
        };
      }
      
      if (!data) {
        // Try clients table as fallback
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, client_email, role')
          .eq('id', userId)
          .maybeSingle();
          
        if (clientError || !clientData) {
          return {
            success: false,
            error: 'User profile not found in profiles or clients table',
            message: 'User account exists but profile data is missing'
          };
        }
        
        return {
          success: true,
          source: 'clients',
          profile: clientData,
          message: 'User found in clients table'
        };
      }
      
      return {
        success: true,
        source: 'profiles',
        profile: data,
        message: 'User profile found'
      };
    } catch (error) {
      console.error('[CalendarPermissionDebug] Profile check error:', error);
      return {
        success: false,
        error: String(error),
        message: 'User profile check failed with exception'
      };
    }
  },
  
  /**
   * Check if the selected clinician exists
   */
  async checkClinicianProfile(clinicianId: string) {
    try {
      // First check profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', clinicianId)
        .maybeSingle();
      
      if (!profileError && profileData) {
        // Also check if there's a corresponding entry in clinicians table
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select('id, clinician_email, clinician_first_name, clinician_last_name')
          .eq('id', clinicianId)
          .maybeSingle();
          
        return {
          success: true,
          profile: profileData,
          clinicianData: !clinicianError ? clinicianData : null,
          hasBoth: !clinicianError && !!clinicianData,
          message: 'Clinician profile found'
        };
      }
      
      // If not in profiles, check directly in clinicians table
      const { data: clinicianData, error: clinicianError } = await supabase
        .from('clinicians')
        .select('id, clinician_email, clinician_first_name, clinician_last_name')
        .eq('id', clinicianId)
        .maybeSingle();
        
      if (clinicianError || !clinicianData) {
        return {
          success: false,
          profileError: profileError?.message,
          clinicianError: clinicianError?.message,
          message: 'Clinician not found in either profiles or clinicians table'
        };
      }
      
      return {
        success: true,
        clinicianData,
        message: 'Clinician found in clinicians table but not in profiles'
      };
    } catch (error) {
      console.error('[CalendarPermissionDebug] Clinician check error:', error);
      return {
        success: false,
        error: String(error),
        message: 'Clinician check failed with exception'
      };
    }
  },
  
  /**
   * Check calendar permissions
   */
  async checkCalendarPermissions(userId: string | null, clinicianId: string | null) {
    try {
      if (!userId || !clinicianId) {
        return {
          success: false,
          error: 'Missing user ID or clinician ID',
          message: 'Cannot check calendar permissions without user and clinician IDs'
        };
      }
      
      // Check if user can insert calendar events
      const canInsert = await authDebugUtils.checkPermissions('calendar_events', 'insert');
      
      // Test if the user can specifically insert for this clinician
      let specificInsertTest = {
        success: false,
        error: null as string | null
      };
      
      try {
        // Prepare the test event
        const testEvent = {
          title: 'TEST_PERMISSION_CHECK',
          event_type: 'availability',
          start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          end_time: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
          clinician_id: clinicianId,
          availability_type: 'single',
          is_active: true
        };
        
        // Try to insert (but don't actually commit)
        const { error } = await supabase.rpc(
          'debug_rls_check',
          {
            schema_name: 'public',
            table_name: 'calendar_events',
            operation: 'INSERT',
            record_id: clinicianId
          }
        );
        
        specificInsertTest.success = !error;
        if (error) {
          specificInsertTest.error = error.message;
        }
      } catch (e) {
        console.error('[CalendarPermissionDebug] Error in specific insert test:', e);
        specificInsertTest.error = e instanceof Error ? e.message : String(e);
      }
      
      // Check if this is the user's own calendar
      const isSelfCalendar = userId === clinicianId;
      
      // Check if the user is an admin
      let isAdmin = false;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
          
        isAdmin = data?.role === 'admin';
      } catch (e) {
        console.error('[CalendarPermissionDebug] Error checking admin status:', e);
      }
      
      return {
        success: canInsert || specificInsertTest.success,
        canInsert,
        specificInsertTest,
        isSelfCalendar,
        isAdmin,
        message: canInsert 
          ? 'User has general permission to insert calendar events' 
          : specificInsertTest.success
          ? 'User has permission to insert for this specific clinician'
          : 'User lacks permission to insert calendar events'
      };
    } catch (error) {
      console.error('[CalendarPermissionDebug] Calendar permissions check error:', error);
      return {
        success: false,
        error: String(error),
        message: 'Calendar permissions check failed with exception'
      };
    }
  },
  
  /**
   * Generate a summary of the diagnostic results
   */
  generateSummary(results: Record<string, any>) {
    if (!results.tests.auth?.success) {
      return 'Authentication issue: User is not properly logged in. Please try logging out and back in.';
    }
    
    if (results.tests.userProfile && !results.tests.userProfile.success) {
      return 'User profile issue: Your user account exists but profile data is missing or incomplete.';
    }
    
    if (results.tests.clinicianProfile && !results.tests.clinicianProfile.success) {
      return 'Clinician profile issue: The selected clinician does not exist or has incomplete profile data.';
    }
    
    if (results.tests.calendarPermissions && !results.tests.calendarPermissions.success) {
      const cp = results.tests.calendarPermissions;
      
      if (cp.isSelfCalendar) {
        return 'Permission issue: You should have full access to your own calendar but permissions are not working correctly.';
      }
      
      if (cp.isAdmin) {
        return 'Admin permission issue: You have admin role but calendar permissions are not working correctly.';
      }
      
      return 'Permission denied: You do not have permission to modify this clinician\'s calendar.';
    }
    
    return 'All checks passed. Calendar permissions appear to be working correctly.';
  },
  
  /**
   * Generate troubleshooting instructions based on diagnostic results
   */
  getTroubleshootingSteps(results: Record<string, any>) {
    const steps: string[] = [];
    
    if (!results.tests.auth?.success) {
      steps.push('Log out and log back in to refresh your authentication token.');
      steps.push('Clear your browser cache and cookies, then try again.');
    }
    
    if (results.tests.userProfile && !results.tests.userProfile.success) {
      steps.push('Contact an administrator to verify your user profile is set up correctly.');
      steps.push('Check if your account has the correct role assigned (admin, clinician, etc.).');
    }
    
    if (results.tests.calendarPermissions && !results.tests.calendarPermissions.success) {
      const cp = results.tests.calendarPermissions;
      
      if (cp.isSelfCalendar) {
        steps.push('Verify that your user ID matches your clinician ID in the database.');
        steps.push('Check if your account has multiple roles that might be conflicting.');
      } else {
        steps.push('If you need to manage this calendar, ask an administrator to grant you the necessary permissions.');
      }
    }
    
    if (steps.length === 0) {
      steps.push('Try refreshing the page.');
      steps.push('Check browser console for any error messages.');
    }
    
    return steps;
  }
};
