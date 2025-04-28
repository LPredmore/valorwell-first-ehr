
/**
 * Utility for debugging calendar permission and timezone issues
 * This can be used both in the browser and in server-side scripts
 */

import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from './timeZoneService';

export const calendarPermissionDebug = {
  /**
   * Run a comprehensive diagnostic on calendar permissions
   */
  async runDiagnostic(userId, clinicianId) {
    try {
      console.log('[CalendarPermissionDebug] Starting diagnostic for:',
        { userId, clinicianId }
      );

      const results = {
        userId,
        clinicianId,
        timestamp: new Date().toISOString(),
        tests: {},
        success: false,
        issues: [],
        recommendations: []
      };

      // Test 1: Check user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.tests.authentication = {
        success: !!user && !authError,
        error: authError?.message,
        details: user ? { id: user.id } : null
      };

      if (!user) {
        results.issues.push('User is not authenticated');
        results.recommendations.push('Please sign in before accessing calendar');
        return results;
      }

      // Test 2: Verify user role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      results.tests.profile = {
        success: !!profile && !profileError,
        error: profileError?.message,
        details: profile || null
      };

      if (profileError || !profile) {
        results.issues.push('Could not retrieve user profile');
        results.recommendations.push('Verify that user profile exists in profiles table');
      }

      // Test 3: Check permission function directly
      let permissionCheck;
      try {
        const { data: permResult, error: permError } = await supabase.rpc(
          'can_manage_clinician_calendar',
          {
            user_id: userId,
            target_clinician_id: clinicianId
          }
        );

        permissionCheck = {
          success: permResult === true && !permError,
          error: permError?.message,
          details: { result: permResult }
        };
      } catch (error) {
        permissionCheck = {
          success: false,
          error: error.message,
          details: { error: 'Function call failed' }
        };
      }

      results.tests.permissionFunction = permissionCheck;

      if (!permissionCheck.success) {
        results.issues.push('Permission function check failed');
        results.recommendations.push('Verify that can_manage_clinician_calendar function exists and works');
      }

      // Test 4: Try to fetch calendar events
      const { data: events, error: eventsError, count } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact' })
        .eq('clinician_id', clinicianId)
        .limit(1);

      results.tests.eventsQuery = {
        success: !eventsError,
        error: eventsError?.message,
        count: count || 0,
        details: events ? { sample: events.length > 0 } : null
      };

      if (eventsError) {
        results.issues.push('Calendar events query failed');
        results.recommendations.push('Check RLS policies and table permissions');
      }

      // Test 5: Check clinician ID formats
      const uuidFormatCheck = this._checkUuidFormat(userId, clinicianId);
      results.tests.uuidFormat = uuidFormatCheck;

      if (!uuidFormatCheck.success) {
        results.issues.push('UUID format issues detected');
        results.recommendations.push('Run ID standardization migration');
      }

      // Test 6: Check timezone configuration
      const { data: timeZoneData, error: timeZoneError } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', userId)
        .single();

      const timeZone = timeZoneData?.time_zone || 'UTC';
      const timeZoneCheck = this._checkTimeZone(timeZone);
      
      results.tests.timeZone = {
        success: !timeZoneError && timeZoneCheck.success,
        error: timeZoneError?.message || timeZoneCheck.error,
        details: {
          configuredZone: timeZone,
          ...timeZoneCheck.details
        }
      };

      if (!results.tests.timeZone.success) {
        results.issues.push('Timezone configuration issue detected');
        results.recommendations.push('Update user profile with valid IANA timezone');
      }

      // Overall result
      results.success = Object.values(results.tests).every(test => test.success);
      
      console.log('[CalendarPermissionDebug] Diagnostic complete:', results);
      return results;
    } catch (error) {
      console.error('[CalendarPermissionDebug] Diagnostic failed:', error);
      return {
        userId,
        clinicianId,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
        issues: ['Diagnostic function threw an exception'],
        recommendations: ['Check browser console for detailed error']
      };
    }
  },

  /**
   * Check if UUIDs are in the correct format
   */
  _checkUuidFormat(userId, clinicianId) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const userIdValid = typeof userId === 'string' && uuidPattern.test(userId);
    const clinicianIdValid = typeof clinicianId === 'string' && uuidPattern.test(clinicianId);
    
    return {
      success: userIdValid && clinicianIdValid,
      details: {
        userIdFormat: userIdValid ? 'valid' : 'invalid',
        clinicianIdFormat: clinicianIdValid ? 'valid' : 'invalid'
      }
    };
  },

  /**
   * Check if timezone is valid and properly configured
   */
  _checkTimeZone(timezone) {
    try {
      const debugInfo = TimeZoneService.debugTimezone(timezone);
      const isValid = debugInfo.isValid !== false;
      
      return {
        success: isValid,
        details: debugInfo,
        error: isValid ? null : 'Invalid timezone'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: { error: 'Timezone validation failed' }
      };
    }
  },

  /**
   * Verify table access permissions
   */
  async testTableAccess(tableName, columnName, value) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .eq(columnName, value)
        .limit(1);
        
      return {
        success: !error,
        count: count || 0,
        error: error?.message,
        message: error ? `Error accessing ${tableName}` : `Successfully accessed ${tableName}`
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error.message,
        message: `Exception accessing ${tableName}`
      };
    }
  }
};

// Export a singleton instance
export default calendarPermissionDebug;
