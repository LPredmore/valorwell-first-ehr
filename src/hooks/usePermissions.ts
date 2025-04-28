
import * as React from "react";
import { useUser } from '@/context/UserContext';
import { PermissionService } from '@/services/PermissionService';
import { trackCalendarInitialization, compareIds } from '@/utils/calendarDebugUtils';

/**
 * React hook that provides easy access to permission-related functionality
 * for use in React components.
 */
export const usePermissions = () => {
  const { userId, userRole, isLoading: isUserLoading } = useUser();
  const [isCheckingPermission, setIsCheckingPermission] = React.useState(false);
  const [permissionLevel, setPermissionLevel] = React.useState<'full' | 'limited' | 'none'>('none');
  const [permissionError, setPermissionError] = React.useState<string | null>(null);
  const [permissionDetails, setPermissionDetails] = React.useState<Record<string, any> | null>(null);

  /**
   * Checks if the current user can manage a clinician's calendar
   * @param clinicianId The ID of the clinician whose calendar is being accessed
   * @returns Promise resolving to a boolean indicating if the user can manage the calendar
   */
  const canManageCalendar = React.useCallback(async (clinicianId: string): Promise<boolean> => {
    if (!userId || !clinicianId) return false;
    if (isUserLoading) return false;

    try {
      setIsCheckingPermission(true);
      setPermissionError(null);
      
      // Check if IDs match after normalization
      const idsMatch = compareIds(userId, clinicianId, 'userId', 'clinicianId');
      
      // Quick check for admin or self
      if (userRole === 'admin' || idsMatch) {
        console.log('[usePermissions] Quick permission check passed:', {
          reason: userRole === 'admin' ? 'admin role' : 'self access',
          userId,
          clinicianId,
          idsMatch
        });
        return true;
      }
      
      console.log('[usePermissions] Quick permission check failed, checking with service:', {
        userId,
        clinicianId
      });
      
      const result = await PermissionService.canManageCalendar(userId, clinicianId);
      console.log('[usePermissions] Permission service result:', { result });
      return result;
    } catch (error) {
      console.error('[usePermissions] Error checking calendar management permission:', error);
      setPermissionError(error instanceof Error ? error.message : 'Unknown permission error');
      return false;
    } finally {
      setIsCheckingPermission(false);
    }
  }, [userId, userRole, isUserLoading]);

  /**
   * Checks if the current user can edit a clinician's availability
   * @param clinicianId The ID of the clinician whose availability is being edited
   * @returns Promise resolving to a boolean indicating if the user can edit availability
   */
  const canEditAvailability = React.useCallback(async (clinicianId: string): Promise<boolean> => {
    if (!userId || !clinicianId) return false;
    if (isUserLoading) return false;

    try {
      setIsCheckingPermission(true);
      setPermissionError(null);
      
      // Check if IDs match after normalization
      const idsMatch = compareIds(userId, clinicianId, 'userId', 'clinicianId');
      
      // Quick check for admin or self
      if (userRole === 'admin' || idsMatch) {
        return true;
      }
      
      const result = await PermissionService.canEditAvailability(userId, clinicianId);
      return result;
    } catch (error) {
      console.error('[usePermissions] Error checking availability edit permission:', error);
      setPermissionError(error instanceof Error ? error.message : 'Unknown permission error');
      return false;
    } finally {
      setIsCheckingPermission(false);
    }
  }, [userId, userRole, isUserLoading]);

  /**
   * Checks if the current user has admin access
   * @returns Promise resolving to a boolean indicating if the user has admin access
   */
  const hasAdminAccess = React.useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    if (isUserLoading) return false;

    // Quick check based on context
    if (userRole === 'admin') {
      return true;
    }

    try {
      setIsCheckingPermission(true);
      setPermissionError(null);
      
      const result = await PermissionService.hasAdminAccess(userId);
      return result;
    } catch (error) {
      console.error('[usePermissions] Error checking admin access:', error);
      setPermissionError(error instanceof Error ? error.message : 'Unknown permission error');
      return false;
    } finally {
      setIsCheckingPermission(false);
    }
  }, [userId, userRole, isUserLoading]);

  /**
   * Gets the permission level for the current user on a specific resource
   * @param resourceType The type of resource being accessed (e.g., 'calendar', 'availability')
   * @param resourceId The ID of the resource being accessed
   * @returns Promise resolving to the permission level ('full', 'limited', or 'none')
   */
  const checkPermissionLevel = React.useCallback(async (
    resourceType: string,
    resourceId: string
  ): Promise<'full' | 'limited' | 'none'> => {
    if (!userId || !resourceType || !resourceId) return 'none';
    if (isUserLoading) return 'none';

    try {
      setIsCheckingPermission(true);
      setPermissionError(null);
      
      const startTime = performance.now();
      
      // Check if IDs match after normalization
      const idsMatch = compareIds(userId, resourceId, 'userId', 'resourceId');
      
      // Log start of permission check
      trackCalendarInitialization('permission-check', {
        userId,
        resourceId,
        resourceType,
        userRole,
        idsMatch
      });
      
      // Quick check for admin or self
      if (userRole === 'admin') {
        console.log('[usePermissions] Admin role detected - granting full access');
        setPermissionLevel('full');
        setPermissionDetails({
          reason: 'admin_role',
          match_type: 'role_based',
          check_duration_ms: performance.now() - startTime
        });
        return 'full';
      }
      
      if (idsMatch) {
        console.log('[usePermissions] User is accessing their own resource - granting full access');
        setPermissionLevel('full');
        setPermissionDetails({
          reason: 'self_access',
          match_type: 'normalized_id_match',
          direct_match: userId === resourceId,
          normalized_match: idsMatch,
          check_duration_ms: performance.now() - startTime
        });
        return 'full';
      }
      
      const level = await PermissionService.getPermissionLevel(userId, resourceType, resourceId);
      setPermissionLevel(level);
      setPermissionDetails({
        reason: 'permission_service',
        result: level,
        check_duration_ms: performance.now() - startTime
      });
      return level;
    } catch (error) {
      console.error('[usePermissions] Error checking permission level:', error);
      setPermissionError(error instanceof Error ? error.message : 'Unknown permission error');
      setPermissionLevel('none');
      setPermissionDetails({
        reason: 'error',
        error: error instanceof Error ? error.message : 'Unknown permission error'
      });
      
      trackCalendarInitialization('error', {
        type: 'permission_check_failed',
        userId,
        resourceId,
        error: error instanceof Error ? error.message : 'Unknown permission error'
      });
      
      return 'none';
    } finally {
      setIsCheckingPermission(false);
    }
  }, [userId, userRole, isUserLoading]);

  // Provide all permission related functions and state
  return {
    canManageCalendar,
    canEditAvailability,
    hasAdminAccess,
    checkPermissionLevel,
    permissionLevel,
    permissionError,
    permissionDetails,
    isCheckingPermission,
    isUserLoading
  };
};
