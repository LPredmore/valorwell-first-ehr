
import { CalendarMutationService } from './CalendarMutationService';
import { AppError } from '@/utils/errors/AppError';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  issues_found: boolean;
  timestamp: string;
  details: {
    invalid_clinician_ids?: number;
    events_with_missing_profiles?: number;
    orphaned_exceptions?: number;
    events_with_invalid_times?: number;
  };
}

/**
 * Service for monitoring and diagnosing calendar health issues
 */
export class CalendarHealthService {
  /**
   * Run a comprehensive calendar health check
   */
  static async runHealthCheck(): Promise<HealthCheckResult> {
    try {
      console.log('[CalendarHealthService] Running comprehensive health check');
      const result = await CalendarMutationService.checkCalendarHealth();
      
      console.log('[CalendarHealthService] Health check results:', result);
      
      return {
        status: result.status as 'healthy' | 'unhealthy',
        issues_found: result.issues_found,
        timestamp: new Date().toISOString(),
        details: result.details || {}
      };
    } catch (error) {
      console.error('[CalendarHealthService] Error running health check:', error);
      
      throw new AppError(
        'Failed to run calendar health check', 
        'HEALTH_CHECK_ERROR',
        { 
          context: { originalError: error },
          userVisible: false 
        }
      );
    }
  }
  
  /**
   * Fix common calendar data issues
   */
  static async fixCalendarIssues(): Promise<{
    fixed: boolean;
    fixed_count: number;
    message: string;
  }> {
    try {
      console.log('[CalendarHealthService] Attempting to fix calendar issues');
      
      // Use the fix_calendar_permissions function from our migrations
      const { data, error } = await fetch('/api/fix-calendar-issues').then(res => res.json());
      
      if (error) {
        throw new Error(error.message || 'Unknown error fixing calendar issues');
      }
      
      return {
        fixed: data.success,
        fixed_count: data.fixed_count || 0,
        message: `Fixed ${data.fixed_count || 0} calendar issues`
      };
    } catch (error) {
      console.error('[CalendarHealthService] Error fixing calendar issues:', error);
      
      throw new AppError(
        'Failed to fix calendar issues', 
        'CALENDAR_FIX_ERROR',
        { 
          context: { originalError: error },
          userVisible: false 
        }
      );
    }
  }
  
  /**
   * Check if a clinician ID is valid and exists in the system
   */
  static async validateClinicianId(clinicianId: string): Promise<boolean> {
    try {
      // We'll use a simple profiles check to validate clinician ID
      const { data, error } = await fetch(`/api/validate-clinician-id?id=${clinicianId}`).then(res => res.json());
      
      if (error) {
        console.warn('[CalendarHealthService] Clinician ID validation error:', error);
        return false;
      }
      
      return data.valid;
    } catch (error) {
      console.error('[CalendarHealthService] Error validating clinician ID:', error);
      return false;
    }
  }
}
