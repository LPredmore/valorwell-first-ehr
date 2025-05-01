import { useState, useCallback, useEffect } from 'react';
import { useCalendar } from '@/context/CalendarContext';
import { useUser } from '@/context/UserContext';
import { PermissionService, PermissionLevel, ResourceType, PermissionAction } from '@/services/PermissionService';

interface PermissionState {
  canManageCalendar: boolean;
  canEditAvailability: boolean;
  canCreateAppointments: boolean;
  canEditAppointments: boolean;
  canDeleteAppointments: boolean;
  canCreateTimeOff: boolean;
  canEditTimeOff: boolean;
  canDeleteTimeOff: boolean;
  permissionLevels: {
    availability: PermissionLevel;
    appointment: PermissionLevel;
    timeOff: PermissionLevel;
  };
  isLoading: boolean;
  error: Error | null;
}

interface UseCalendarPermissionsResult extends PermissionState {
  checkPermissions: () => Promise<void>;
  hasPermission: (action: PermissionAction, resourceType: ResourceType) => boolean;
}

/**
 * Hook for managing calendar permissions
 * Provides methods for checking permissions for various calendar operations
 */
export function useCalendarPermissions(): UseCalendarPermissionsResult {
  const { selectedClinicianId } = useCalendar();
  const { userId, isLoading: isUserLoading } = useUser();
  
  const [state, setState] = useState<PermissionState>({
    canManageCalendar: false,
    canEditAvailability: false,
    canCreateAppointments: false,
    canEditAppointments: false,
    canDeleteAppointments: false,
    canCreateTimeOff: false,
    canEditTimeOff: false,
    canDeleteTimeOff: false,
    permissionLevels: {
      availability: 'none',
      appointment: 'none',
      timeOff: 'none'
    },
    isLoading: true,
    error: null
  });
  
  // Check all permissions for the current user and selected clinician
  const checkPermissions = useCallback(async () => {
    if (!userId || !selectedClinicianId || isUserLoading) {
      setState(prev => ({
        ...prev,
        isLoading: isUserLoading,
        canManageCalendar: false,
        canEditAvailability: false,
        canCreateAppointments: false,
        canEditAppointments: false,
        canDeleteAppointments: false,
        canCreateTimeOff: false,
        canEditTimeOff: false,
        canDeleteTimeOff: false,
        permissionLevels: {
          availability: 'none',
          appointment: 'none',
          timeOff: 'none'
        }
      }));
      return;
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Get permission levels for each resource type
      const [availabilityPermission, appointmentPermission, timeOffPermission] = await Promise.all([
        PermissionService.getPermissionLevel(userId, 'availability', selectedClinicianId),
        PermissionService.getPermissionLevel(userId, 'appointment', selectedClinicianId),
        PermissionService.getPermissionLevel(userId, 'timeOff', selectedClinicianId)
      ]);
      
      // Check specific permissions
      const canManage = await PermissionService.canManageCalendar(userId, selectedClinicianId);
      const canEditAvail = await PermissionService.canEditAvailability(userId, selectedClinicianId);
      
      // Set permissions based on permission levels
      setState({
        canManageCalendar: canManage,
        canEditAvailability: canEditAvail,
        canCreateAppointments: appointmentPermission === 'write' || appointmentPermission === 'admin',
        canEditAppointments: appointmentPermission === 'write' || appointmentPermission === 'admin',
        canDeleteAppointments: appointmentPermission === 'admin',
        canCreateTimeOff: timeOffPermission === 'write' || timeOffPermission === 'admin',
        canEditTimeOff: timeOffPermission === 'write' || timeOffPermission === 'admin',
        canDeleteTimeOff: timeOffPermission === 'admin',
        permissionLevels: {
          availability: availabilityPermission,
          appointment: appointmentPermission,
          timeOff: timeOffPermission
        },
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('[useCalendarPermissions] Error checking permissions:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to check permissions')
      }));
    }
  }, [userId, selectedClinicianId, isUserLoading]);
  
  // Check if the user has permission for a specific action on a resource type
  const hasPermission = useCallback((
    action: PermissionAction,
    resourceType: ResourceType
  ): boolean => {
    // If permissions are still loading, deny by default
    if (state.isLoading) {
      return false;
    }
    
    // Map action to permission level required
    const requiredLevel = (() => {
      switch (action) {
        case 'read':
          return ['read', 'write', 'admin'];
        case 'create':
        case 'update':
          return ['write', 'admin'];
        case 'delete':
          return ['admin'];
        default:
          return [];
      }
    })();
    
    // Check if user has the required permission level
    const userLevel = state.permissionLevels[resourceType];
    return requiredLevel.includes(userLevel);
  }, [state]);
  
  // Check permissions when dependencies change
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);
  
  return {
    ...state,
    checkPermissions,
    hasPermission
  };
}