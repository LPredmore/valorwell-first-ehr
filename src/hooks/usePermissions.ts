import * as React from "react";
import { useUser } from '@/context/UserContext';
import { PermissionService } from '@/services/PermissionService';

/**
 * React hook that provides easy access to permission-related functionality
 * for use in React components.
 */
export const usePermissions = () => {
  const { userId, userRole, isLoading: isUserLoading } = useUser();
  const [isCheckingPermission, setIsCheckingPermission] = React.useState(false);
  const [permissionLevel, setPermissionLevel] = React.useState<'full' | 'limited' | 'none'>('none');
  const [permissionError, setPermissionError] = React.useState<string | null>(null);

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
      
      // Quick check for admin or self
      if (userRole === 'admin' || userId === clinicianId) {
        return true;
      }
      
      const result = await PermissionService.canManageCalendar(userId, clinicianId);
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
      
      // Quick check for admin or self
      if (userRole === 'admin' || userId === clinicianId) {
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
      
      // Quick check for admin or self
      if (userRole === 'admin') {
        setPermissionLevel('full');
        return 'full';
      }
      
      if (userId === resourceId) {
        setPermissionLevel('full');
        return 'full';
      }
      
      const level = await PermissionService.getPermissionLevel(userId, resourceType, resourceId);
      setPermissionLevel(level);
      return level;
    } catch (error) {
      console.error('[usePermissions] Error checking permission level:', error);
      setPermissionError(error instanceof Error ? error.message : 'Unknown permission error');
      setPermissionLevel('none');
      return 'none';
    } finally {
      setIsCheckingPermission(false);
    }
  }, [userId, userRole, isUserLoading]);

  return {
    canManageCalendar,
    canEditAvailability,
    hasAdminAccess,
    checkPermissionLevel,
    permissionLevel,
    permissionError,
    isCheckingPermission,
    isUserLoading
  };
};