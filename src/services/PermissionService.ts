import { supabase } from '@/integrations/supabase/client';
import { authDebugUtils } from '@/utils/authDebugUtils';
import { calendarPermissionDebug } from '@/utils/calendarPermissionDebug';
import { ensureUUID, formatAsUUID, isValidUUID } from '@/utils/validation/uuidUtils';
import { ensureClinicianID, formatAsClinicianID } from '@/utils/validation/clinicianUtils';

/**
 * Centralized service for handling permission checks throughout the application.
 * This service abstracts permission logic that was previously duplicated across
 * components and services.
 */
export class PermissionService {
  /**
   * Checks if a user has permission to manage a clinician's calendar
   * @param userId The ID of the user making the request
   * @param clinicianId The ID of the clinician whose calendar is being accessed
   * @returns Promise resolving to a boolean indicating if the user can manage the calendar
   */
  static async canManageCalendar(userId: string, clinicianId: string): Promise<boolean> {
    try {
      if (!userId || !clinicianId) {
        console.warn('[PermissionService] Missing required parameters for canManageCalendar check', { userId, clinicianId });
        return false;
      }

      // Ensure IDs are valid UUIDs with better error handling
      let validUserId: string;
      let validClinicianId: string;
      
      try {
        validUserId = ensureUUID(userId, 'User');
      } catch (error) {
        console.error('[PermissionService] Invalid user ID format:', error);
        console.log('[PermissionService] Attempting to format user ID:', userId);
        
        // Try to format the ID if possible
        const formattedUserId = formatAsUUID(userId, {
          strictMode: true,
          logLevel: 'info'
        });
        if (formattedUserId !== userId) {
          console.log('[PermissionService] Reformatted user ID:', { original: userId, formatted: formattedUserId });
          validUserId = formattedUserId;
        } else {
          console.error('[PermissionService] Could not format user ID, using original value');
          validUserId = userId;
        }
      }
      
      try {
        validClinicianId = ensureClinicianID(clinicianId);
      } catch (error) {
        console.error('[PermissionService] Invalid clinician ID format:', error);
        console.log('[PermissionService] Attempting to format clinician ID:', clinicianId);
        
        // Try to format the ID if possible
        const formattedClinicianId = formatAsClinicianID(clinicianId);
        if (formattedClinicianId !== clinicianId) {
          console.log('[PermissionService] Reformatted clinician ID:', { original: clinicianId, formatted: formattedClinicianId });
          validClinicianId = formattedClinicianId;
        } else {
          console.error('[PermissionService] Could not format clinician ID, using original value');
          validClinicianId = clinicianId;
        }
      }

      // Log the IDs being compared for debugging purposes
      console.log('[PermissionService] Comparing IDs for calendar access:', {
        userId: validUserId,
        clinicianId: validClinicianId,
        match: validUserId === validClinicianId
      });

      // If user is viewing their own calendar, they have full access
      if (validUserId === validClinicianId) {
        console.log('[PermissionService] User is accessing their own calendar - access granted');
        return true;
      }

      // Check if user has admin role
      const isAdmin = await this.hasAdminAccess(validUserId);
      if (isAdmin) {
        console.log('[PermissionService] User has admin role - access granted');
        return true;
      }

      // Check database-level permissions
      const canAccessCalendar = await authDebugUtils.checkPermissions('calendar_events', 'select');
      if (!canAccessCalendar) {
        console.log('[PermissionService] User cannot access calendar_events table');
        return false;
      }

      // Run full diagnostic to check specific permissions
      const diagnosticResults = await calendarPermissionDebug.runDiagnostic(
        validUserId,
        validClinicianId
      );

      if (diagnosticResults.success && diagnosticResults.tests.calendarPermissions?.success) {
        const canInsert = diagnosticResults.tests.calendarPermissions.canInsert;
        return canInsert;
      }

      return false;
    } catch (error) {
      console.error('[PermissionService] Error in canManageCalendar:', error);
      return false;
    }
  }

  /**
   * Checks if a user has permission to edit a clinician's availability
   * @param userId The ID of the user making the request
   * @param clinicianId The ID of the clinician whose availability is being edited
   * @returns Promise resolving to a boolean indicating if the user can edit availability
   */
  static async canEditAvailability(userId: string, clinicianId: string): Promise<boolean> {
    try {
      if (!userId || !clinicianId) {
        console.warn('[PermissionService] Missing required parameters for canEditAvailability check', { userId, clinicianId });
        return false;
      }

      // Ensure IDs are valid UUIDs with better error handling
      let validUserId: string;
      let validClinicianId: string;
      
      try {
        validUserId = ensureUUID(userId, 'User');
      } catch (error) {
        console.error('[PermissionService] Invalid user ID format in canEditAvailability:', error);
        
        // Try to format the ID if possible
        const formattedUserId = formatAsUUID(userId, {
          strictMode: true,
          logLevel: 'info'
        });
        if (formattedUserId !== userId) {
          console.log('[PermissionService] Reformatted user ID:', { original: userId, formatted: formattedUserId });
          validUserId = formattedUserId;
        } else {
          console.error('[PermissionService] Could not format user ID, using original value');
          validUserId = userId;
        }
      }
      
      try {
        validClinicianId = ensureClinicianID(clinicianId);
      } catch (error) {
        console.error('[PermissionService] Invalid clinician ID format in canEditAvailability:', error);
        
        // Try to format the ID if possible
        const formattedClinicianId = formatAsClinicianID(clinicianId);
        if (formattedClinicianId !== clinicianId) {
          console.log('[PermissionService] Reformatted clinician ID:', { original: clinicianId, formatted: formattedClinicianId });
          validClinicianId = formattedClinicianId;
        } else {
          console.error('[PermissionService] Could not format clinician ID, using original value');
          validClinicianId = clinicianId;
        }
      }

      // Log the IDs being compared for debugging purposes
      console.log('[PermissionService] Comparing IDs for availability editing:', {
        userId: validUserId,
        clinicianId: validClinicianId,
        match: validUserId === validClinicianId
      });

      // If user is editing their own availability, they have full access
      if (validUserId === validClinicianId) {
        console.log('[PermissionService] User is editing their own availability - access granted');
        return true;
      }

      // Check if user has admin role
      const isAdmin = await this.hasAdminAccess(validUserId);
      if (isAdmin) {
        console.log('[PermissionService] User has admin role - access granted for availability editing');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[PermissionService] Error in canEditAvailability:', error);
      return false;
    }
  }

  /**
   * Checks if a user has admin access
   * @param userId The ID of the user to check
   * @returns Promise resolving to a boolean indicating if the user has admin access
   */
  static async hasAdminAccess(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        console.warn('[PermissionService] Missing userId for hasAdminAccess check');
        return false;
      }

      // Ensure userId is a valid UUID with better error handling
      let validUserId: string;
      
      try {
        validUserId = ensureUUID(userId, 'User');
      } catch (error) {
        console.error('[PermissionService] Invalid user ID format in hasAdminAccess:', error);
        
        // Try to format the ID if possible
        const formattedUserId = formatAsUUID(userId, {
          strictMode: true,
          logLevel: 'info'
        });
        if (formattedUserId !== userId) {
          console.log('[PermissionService] Reformatted user ID:', { original: userId, formatted: formattedUserId });
          validUserId = formattedUserId;
        } else {
          console.error('[PermissionService] Could not format user ID, using original value');
          validUserId = userId;
        }
      }

      // Check if user has admin role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', validUserId)
        .single();

      if (profileError) {
        console.error('[PermissionService] Error checking user role:', profileError);
        
        // Try one more time with the original ID if the formatted ID failed
        if (validUserId !== userId) {
          console.log('[PermissionService] Retrying with original user ID:', userId);
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
            
          if (!retryError && retryData) {
            console.log('[PermissionService] Successfully retrieved role with original ID');
            return retryData.role === 'admin';
          }
        }
        
        return false;
      }

      return profileData?.role === 'admin';
    } catch (error) {
      console.error('[PermissionService] Error in hasAdminAccess:', error);
      return false;
    }
  }

  /**
   * Gets the permission level for a user on a specific resource
   * @param userId The ID of the user making the request
   * @param resourceType The type of resource being accessed (e.g., 'calendar', 'availability')
   * @param resourceId The ID of the resource being accessed
   * @returns Promise resolving to the permission level ('full', 'limited', or 'none')
   */
  static async getPermissionLevel(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<'full' | 'limited' | 'none'> {
    try {
      if (!userId || !resourceType || !resourceId) {
        console.warn('[PermissionService] Missing required parameters for getPermissionLevel check', {
          userId, resourceType, resourceId
        });
        return 'none';
      }

      // Ensure IDs are valid UUIDs with better error handling
      let validUserId: string;
      let validResourceId: string;
      
      try {
        validUserId = ensureUUID(userId, 'User');
      } catch (error) {
        console.error('[PermissionService] Invalid user ID format in getPermissionLevel:', error);
        
        // Try to format the ID if possible
        const formattedUserId = formatAsUUID(userId, {
          strictMode: true,
          logLevel: 'info'
        });
        if (formattedUserId !== userId) {
          console.log('[PermissionService] Reformatted user ID:', { original: userId, formatted: formattedUserId });
          validUserId = formattedUserId;
        } else {
          console.error('[PermissionService] Could not format user ID, using original value');
          validUserId = userId;
        }
      }
      
      try {
        validResourceId = ensureUUID(resourceId, 'Resource');
      } catch (error) {
        console.error('[PermissionService] Invalid resource ID format in getPermissionLevel:', error);
        
        // Try to format the ID if possible
        const formattedResourceId = formatAsUUID(resourceId, {
          strictMode: true,
          logLevel: 'info'
        });
        if (formattedResourceId !== resourceId) {
          console.log('[PermissionService] Reformatted resource ID:', { original: resourceId, formatted: formattedResourceId });
          validResourceId = formattedResourceId;
        } else {
          console.error('[PermissionService] Could not format resource ID, using original value');
          validResourceId = resourceId;
        }
      }

      // Log the IDs being compared for debugging purposes
      console.log('[PermissionService] Comparing IDs for permission level check:', {
        userId: validUserId,
        resourceId: validResourceId,
        resourceType,
        match: validUserId === validResourceId
      });

      // If user is accessing their own resource, they have full access
      if (validUserId === validResourceId) {
        console.log('[PermissionService] User is accessing their own resource - full access granted');
        return 'full';
      }

      // Check if user has admin role
      const isAdmin = await this.hasAdminAccess(validUserId);
      if (isAdmin) {
        console.log('[PermissionService] User has admin role - full access granted');
        return 'full';
      }

      // Handle specific resource types
      switch (resourceType) {
        case 'calendar':
          // Check database-level permissions
          const canAccessCalendar = await authDebugUtils.checkPermissions('calendar_events', 'select');
          if (!canAccessCalendar) {
            console.log('[PermissionService] User cannot access calendar_events table');
            return 'none';
          }

          // Run full diagnostic to check specific permissions
          const diagnosticResults = await calendarPermissionDebug.runDiagnostic(
            validUserId,
            validResourceId
          );

          if (diagnosticResults.success) {
            if (diagnosticResults.tests.calendarPermissions?.success) {
              const canInsert = diagnosticResults.tests.calendarPermissions.canInsert;
              return canInsert ? 'full' : 'limited';
            } else {
              return 'none';
            }
          } else {
            // If diagnostic failed but we know they can access the calendar, give limited permissions
            console.warn('[PermissionService] Permission diagnostic failed:', diagnosticResults.summary);
            return 'limited';
          }

        case 'availability':
          // For availability, we only support full or none permissions currently
          const canEdit = await this.canEditAvailability(validUserId, validResourceId);
          return canEdit ? 'full' : 'none';

        default:
          console.warn(`[PermissionService] Unknown resource type: ${resourceType}`);
          return 'none';
      }
    } catch (error) {
      console.error('[PermissionService] Error in getPermissionLevel:', error);
      // Default to limited permissions if there's an error but we're authenticated
      return 'none';
    }
  }

  /**
   * Verifies if the current authenticated user can perform an action
   * @param targetUserId The ID of the user being acted upon
   * @param action The action being performed
   * @returns Promise resolving to a boolean indicating if the action is allowed
   */
  static async verifyCurrentUserPermission(
    targetUserId: string,
    action: 'view' | 'edit' | 'delete'
  ): Promise<boolean> {
    try {
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[PermissionService] No authenticated user found');
        return false;
      }

      // Format IDs for comparison if needed
      let currentUserId = user.id;
      let formattedTargetId = targetUserId;
      
      // Try to format the IDs if they're not in standard format
      if (!isValidUUID(currentUserId)) {
        const formatted = formatAsUUID(currentUserId, {
          strictMode: true,
          logLevel: 'info'
        });
        if (formatted !== currentUserId) {
          console.log('[PermissionService] Reformatted current user ID:', {
            original: currentUserId,
            formatted
          });
          currentUserId = formatted;
        }
      }
      
      if (!isValidUUID(targetUserId)) {
        const formatted = formatAsUUID(targetUserId, {
          strictMode: true,
          logLevel: 'info'
        });
        if (formatted !== targetUserId) {
          console.log('[PermissionService] Reformatted target user ID:', {
            original: targetUserId,
            formatted
          });
          formattedTargetId = formatted;
        }
      }

      // Log the comparison for debugging
      console.log('[PermissionService] Comparing user IDs for permission check:', {
        currentUserId,
        targetUserId: formattedTargetId,
        action,
        match: currentUserId === formattedTargetId
      });

      // If user is acting on their own resources, they have permission
      if (currentUserId === formattedTargetId) {
        return true;
      }

      // Check if user has admin role
      const isAdmin = await this.hasAdminAccess(user.id);
      return isAdmin;
    } catch (error) {
      console.error('[PermissionService] Error in verifyCurrentUserPermission:', error);
      return false;
    }
  }

  /**
   * Throws an error if the user doesn't have permission for the specified action
   * @param userId The ID of the user making the request
   * @param targetId The ID of the resource being accessed
   * @param action The action being performed
   * @throws Error if the user doesn't have permission
   */
  static async enforcePermission(
    userId: string,
    targetId: string,
    action: 'view' | 'edit' | 'delete'
  ): Promise<void> {
    try {
      const hasPermission = await this.verifyCurrentUserPermission(targetId, action);
      
      if (!hasPermission) {
        const actionMap = {
          view: 'view',
          edit: 'edit',
          delete: 'delete'
        };
        
        throw new Error(`Permission denied: You don't have permission to ${actionMap[action]} this resource.`);
      }
    } catch (error) {
      console.error('[PermissionService] Error enforcing permission:', error);
      
      // Add detailed diagnostic information to the error
      const diagnosticInfo = {
        userId,
        targetId,
        action,
        timestamp: new Date().toISOString()
      };
      
      // Run a permission diagnostic if possible
      try {
        const diagnostic = await calendarPermissionDebug.runDiagnostic(userId, targetId);
        throw new Error(`Permission denied: ${(error as Error).message}\nDiagnostic: ${diagnostic.summary}`);
      } catch (diagError) {
        // If diagnostic fails, throw the original error with basic info
        throw new Error(`Permission denied: ${(error as Error).message}\nInfo: ${JSON.stringify(diagnosticInfo)}`);
      }
    }
  }
}