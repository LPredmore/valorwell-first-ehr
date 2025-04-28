
import { supabase } from '@/integrations/supabase/client';
import { authDebugUtils } from './authDebugUtils';
import { isValidUUID, formatAsUUID } from './validation/uuidUtils';
import { formatAsClinicianID, clinicianIDExists } from './validation/clinicianUtils';

/**
 * Specialized utility for debugging calendar permission issues
 */
/**
 * Interface for diagnostic test results
 */
interface DiagnosticTestResult {
  success: boolean;
  message: string;
  error?: string;
  [key: string]: any;
}

/**
 * Interface for the complete diagnostic results
 */
interface DiagnosticResults {
  timestamp: string;
  success: boolean;
  summary: string;
  tests: Record<string, DiagnosticTestResult>;
  idAnalysis?: IdAnalysisResult;
  error?: string;
}

/**
 * Interface for ID analysis results
 */
interface IdAnalysisResult {
  userId: {
    original: string;
    formatted: string;
    isValid: boolean;
    exists: boolean;
  };
  clinicianId: {
    original: string;
    formatted: string;
    isValid: boolean;
    exists: boolean;
  };
  match: boolean;
  issues: string[];
}

/**
 * Specialized utility for debugging calendar permission issues
 */
export const calendarPermissionDebug = {
  /**
   * Run a full diagnostic on calendar permissions
   */
  async runDiagnostic(currentUserId: string | null, selectedClinicianId: string | null): Promise<DiagnosticResults> {
    const results: DiagnosticResults = {
      timestamp: new Date().toISOString(),
      success: false,
      summary: '',
      tests: {}
    };
    
    try {
      console.group('[CalendarPermissionDebug] Running diagnostic tests');
      
      // Test 0: Analyze IDs for format issues
      if (currentUserId && selectedClinicianId) {
        results.idAnalysis = await this.analyzeIds(currentUserId, selectedClinicianId);
      }
      
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
      
      // Test 5: Check database-level ID consistency
      if (currentUserId && selectedClinicianId) {
        results.tests.idConsistency = await this.checkIdConsistency(currentUserId, selectedClinicianId);
      }
      
      // Overall result
      results.success = Object.values(results.tests).every((test) => test.success);
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
        summary: `Error running diagnostics: ${String(error)}`,
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
  },

  /**
   * Analyze user and clinician IDs for format issues
   */
  async analyzeIds(userId: string, clinicianId: string): Promise<IdAnalysisResult> {
    console.log('[CalendarPermissionDebug] Analyzing IDs:', { userId, clinicianId });
    
    const result: IdAnalysisResult = {
      userId: {
        original: userId,
        formatted: userId,
        isValid: isValidUUID(userId),
        exists: false
      },
      clinicianId: {
        original: clinicianId,
        formatted: clinicianId,
        isValid: isValidUUID(clinicianId),
        exists: false
      },
      match: userId === clinicianId,
      issues: []
    };
    
    // Format IDs if needed
    if (!result.userId.isValid) {
      const formatted = formatAsUUID(userId);
      if (formatted !== userId) {
        result.userId.formatted = formatted;
        result.userId.isValid = isValidUUID(formatted);
        result.issues.push('User ID format is non-standard');
      } else {
        result.issues.push('User ID is not a valid UUID and cannot be formatted');
      }
    }
    
    if (!result.clinicianId.isValid) {
      const formatted = formatAsClinicianID(clinicianId);
      if (formatted !== clinicianId) {
        result.clinicianId.formatted = formatted;
        result.clinicianId.isValid = isValidUUID(formatted);
        result.issues.push('Clinician ID format is non-standard');
      } else {
        result.issues.push('Clinician ID is not a valid UUID and cannot be formatted');
      }
    }
    
    // Check if IDs exist in database
    try {
      // Check user ID
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', result.userId.formatted)
        .maybeSingle();
        
      result.userId.exists = !!userData;
      
      if (!result.userId.exists) {
        result.issues.push('User ID does not exist in profiles table');
      }
      
      // Check clinician ID
      result.clinicianId.exists = await clinicianIDExists(result.clinicianId.formatted);
      
      if (!result.clinicianId.exists) {
        result.issues.push('Clinician ID does not exist in profiles table');
      }
    } catch (error) {
      console.error('[CalendarPermissionDebug] Error checking ID existence:', error);
      result.issues.push(`Error checking ID existence: ${String(error)}`);
    }
    
    // Check if formatted IDs match
    if (result.userId.formatted === result.clinicianId.formatted && result.userId.original !== result.clinicianId.original) {
      result.issues.push('IDs match after formatting but not in original form - this indicates a format inconsistency');
    }
    
    return result;
  },
  
  /**
   * Check database-level ID consistency
   */
  async checkIdConsistency(userId: string, clinicianId: string): Promise<DiagnosticTestResult> {
    try {
      console.log('[CalendarPermissionDebug] Checking ID consistency in database');
      
      // Format IDs for comparison
      const formattedUserId = isValidUUID(userId) ? userId : formatAsUUID(userId);
      const formattedClinicianId = isValidUUID(clinicianId) ? clinicianId : formatAsClinicianID(clinicianId);
      
      // Check for inconsistent ID formats in calendar_events table
      const { data: inconsistentEvents, error: eventsError } = await supabase
        .from('calendar_events')
        .select('id, clinician_id')
        .eq('clinician_id', clinicianId)
        .limit(10);
        
      if (eventsError) {
        return {
          success: false,
          message: 'Failed to check calendar events for ID consistency',
          error: eventsError.message
        };
      }
      
      // Check for inconsistent ID formats in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .or(`id.eq.${userId},id.eq.${clinicianId}`)
        .limit(2);
        
      if (profileError) {
        return {
          success: false,
          message: 'Failed to check profiles for ID consistency',
          error: profileError.message
        };
      }
      
      // Analyze results
      const issues: string[] = [];
      
      if (inconsistentEvents && inconsistentEvents.length > 0) {
        const nonStandardIds = inconsistentEvents.filter(event =>
          event.clinician_id && !isValidUUID(event.clinician_id.toString())
        );
        
        if (nonStandardIds.length > 0) {
          issues.push(`Found ${nonStandardIds.length} calendar events with non-standard clinician IDs`);
        }
      }
      
      if (profileData && profileData.length < 2 && userId !== clinicianId) {
        issues.push('One or both IDs not found in profiles table');
      }
      
      return {
        success: issues.length === 0,
        message: issues.length === 0
          ? 'ID formats are consistent in database'
          : 'Found ID inconsistencies in database',
        issues,
        formattedUserId,
        formattedClinicianId
      };
    } catch (error) {
      console.error('[CalendarPermissionDebug] Error checking ID consistency:', error);
      return {
        success: false,
        message: 'Error checking ID consistency',
        error: String(error)
      };
    }
  },
  
  /**
   * Log detailed permission diagnostics
   */
  logPermissionDiagnostics(userId: string, clinicianId: string, context: string = 'general'): void {
    console.group(`[CalendarPermissionDebug] Permission diagnostics (${context})`);
    console.log('User ID:', userId);
    console.log('Clinician ID:', clinicianId);
    console.log('IDs match:', userId === clinicianId);
    
    // Log ID format information
    console.log('User ID format valid:', isValidUUID(userId));
    console.log('Clinician ID format valid:', isValidUUID(clinicianId));
    
    if (!isValidUUID(userId)) {
      const formatted = formatAsUUID(userId);
      console.log('Formatted user ID:', formatted);
      console.log('Formatted user ID valid:', isValidUUID(formatted));
    }
    
    if (!isValidUUID(clinicianId)) {
      const formatted = formatAsClinicianID(clinicianId);
      console.log('Formatted clinician ID:', formatted);
      console.log('Formatted clinician ID valid:', isValidUUID(formatted));
    }
    
    console.groupEnd();
  }
};
