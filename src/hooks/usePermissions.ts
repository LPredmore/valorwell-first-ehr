
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';

export type ResourceType = 'client' | 'clinician' | 'document' | 'analytics' | 'settings';
export type PermissionLevel = 'none' | 'limited' | 'full' | 'admin';

const usePermissions = (resourceType?: ResourceType, resourceId?: string) => {
  const { user, isAdmin } = useUser();
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const determinePermissions = async () => {
      setIsLoading(true);
      
      try {
        // If the user is an admin, they have full access to everything
        if (isAdmin) {
          setPermissionLevel('admin');
          setIsLoading(false);
          return;
        }
        
        // If the user is not logged in, they have no permissions
        if (!user) {
          setPermissionLevel('none');
          setIsLoading(false);
          return;
        }
        
        // Default permission level for authenticated users
        let calculatedPermissionLevel: PermissionLevel = 'limited';
        
        // Determine permission level based on resourceType and resourceId
        // These rules are simplified since we removed the calendar-related tables
        if (resourceType === 'client') {
          // For client resources, check if the user is this client or a clinician managing this client
          if (user.id === resourceId) {
            calculatedPermissionLevel = 'full';
          } else if (user.role === 'clinician') {
            // Clinicians have limited access to their assigned clients
            calculatedPermissionLevel = 'limited';
          } else {
            calculatedPermissionLevel = 'none';
          }
        } else if (resourceType === 'clinician') {
          // For clinician resources, check if the user is this clinician
          if (user.id === resourceId && user.role === 'clinician') {
            calculatedPermissionLevel = 'full';
          } else {
            calculatedPermissionLevel = 'none';
          }
        } else if (resourceType === 'document') {
          // For documents, clients can only view their own documents
          if (user.role === 'client') {
            calculatedPermissionLevel = 'limited';
          } else if (user.role === 'clinician') {
            calculatedPermissionLevel = 'full';
          } else {
            calculatedPermissionLevel = 'none';
          }
        } else if (resourceType === 'analytics' || resourceType === 'settings') {
          // For analytics and settings, only clinicians and admins have access
          if (user.role === 'clinician') {
            calculatedPermissionLevel = 'limited';
          } else {
            calculatedPermissionLevel = 'none';
          }
        } else {
          // For any other resource type, use role-based default permissions
          switch (user.role) {
            case 'admin':
              calculatedPermissionLevel = 'admin';
              break;
            case 'clinician':
            case 'moderator':
              calculatedPermissionLevel = 'full';
              break;
            case 'client':
              calculatedPermissionLevel = 'limited';
              break;
            default:
              calculatedPermissionLevel = 'none';
          }
        }
        
        setPermissionLevel(calculatedPermissionLevel);
      } catch (error) {
        console.error('Error determining permissions:', error);
        setPermissionLevel('none');
      } finally {
        setIsLoading(false);
      }
    };
    
    determinePermissions();
  }, [user, resourceType, resourceId, isAdmin]);
  
  return {
    permissionLevel,
    isLoading,
    canView: permissionLevel !== 'none',
    canEdit: ['full', 'admin'].includes(permissionLevel),
    canDelete: ['admin'].includes(permissionLevel),
    canManage: ['admin'].includes(permissionLevel),
  };
};

export default usePermissions;
