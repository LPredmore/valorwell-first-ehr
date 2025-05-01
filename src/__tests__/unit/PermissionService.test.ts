import { PermissionService } from '../../services/PermissionService';
import { supabase } from '@/integrations/supabase/client';
import { authDebugUtils } from '@/utils/authDebugUtils';
import { calendarPermissionDebug } from '@/utils/calendarPermissionDebug';
import { ensureUUID, formatAsUUID, isValidUUID } from '@/utils/validation/uuidUtils';
import { ensureClinicianID, formatAsClinicianID } from '@/utils/validation/clinicianUtils';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    auth: {
      getUser: jest.fn()
    }
  }
}));

jest.mock('@/utils/authDebugUtils', () => ({
  authDebugUtils: {
    checkPermissions: jest.fn()
  }
}));

jest.mock('@/utils/calendarPermissionDebug', () => ({
  calendarPermissionDebug: {
    runDiagnostic: jest.fn()
  }
}));

jest.mock('@/utils/validation/uuidUtils', () => ({
  ensureUUID: jest.fn(),
  formatAsUUID: jest.fn(),
  isValidUUID: jest.fn()
}));

jest.mock('@/utils/validation/clinicianUtils', () => ({
  ensureClinicianID: jest.fn(),
  formatAsClinicianID: jest.fn()
}));

describe('PermissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    (ensureUUID as jest.Mock).mockImplementation(id => id);
    (formatAsUUID as jest.Mock).mockImplementation(id => id);
    (isValidUUID as jest.Mock).mockReturnValue(true);
    (ensureClinicianID as jest.Mock).mockImplementation(id => id);
    (formatAsClinicianID as jest.Mock).mockImplementation(id => id);
    
    // Mock supabase responses
    const mockSingle = jest.fn().mockResolvedValue({
      data: { role: 'user' },
      error: null
    });
    
    const mockEq = jest.fn(() => ({ single: mockSingle }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect
    });
    
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null
    });
    
    // Mock auth debug utils
    (authDebugUtils.checkPermissions as jest.Mock).mockResolvedValue(true);
    
    // Mock calendar permission debug
    (calendarPermissionDebug.runDiagnostic as jest.Mock).mockResolvedValue({
      success: true,
      tests: {
        calendarPermissions: {
          success: true,
          canInsert: true
        }
      }
    });
  });

  describe('canManageCalendar', () => {
    it('should return true if user is accessing their own calendar', async () => {
      const userId = 'user-id';
      const clinicianId = 'user-id';
      
      const result = await PermissionService.canManageCalendar(userId, clinicianId);
      
      expect(result).toBe(true);
    });

    it('should return true if user has admin role', async () => {
      const userId = 'user-id';
      const clinicianId = 'other-id';
      
      // Mock admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.canManageCalendar(userId, clinicianId);
      
      expect(result).toBe(true);
    });

    it('should return true if user has permission based on diagnostic', async () => {
      const userId = 'user-id';
      const clinicianId = 'other-id';
      
      // Mock non-admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.canManageCalendar(userId, clinicianId);
      
      expect(result).toBe(true);
      expect(calendarPermissionDebug.runDiagnostic).toHaveBeenCalledWith(userId, clinicianId);
    });

    it('should return false if user does not have permission', async () => {
      const userId = 'user-id';
      const clinicianId = 'other-id';
      
      // Mock non-admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      // Mock failed diagnostic
      (calendarPermissionDebug.runDiagnostic as jest.Mock).mockResolvedValue({
        success: false,
        tests: {}
      });
      
      const result = await PermissionService.canManageCalendar(userId, clinicianId);
      
      expect(result).toBe(false);
    });

    it('should return false if missing required parameters', async () => {
      const result = await PermissionService.canManageCalendar('', '');
      
      expect(result).toBe(false);
    });
  });

  describe('canEditAvailability', () => {
    it('should return true if user is editing their own availability', async () => {
      const userId = 'user-id';
      const clinicianId = 'user-id';
      
      const result = await PermissionService.canEditAvailability(userId, clinicianId);
      
      expect(result).toBe(true);
    });

    it('should return true if user has admin role', async () => {
      const userId = 'user-id';
      const clinicianId = 'other-id';
      
      // Mock admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.canEditAvailability(userId, clinicianId);
      
      expect(result).toBe(true);
    });

    it('should return false if user is not admin and not the clinician', async () => {
      const userId = 'user-id';
      const clinicianId = 'other-id';
      
      // Mock non-admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.canEditAvailability(userId, clinicianId);
      
      expect(result).toBe(false);
    });

    it('should return false if missing required parameters', async () => {
      const result = await PermissionService.canEditAvailability('', '');
      
      expect(result).toBe(false);
    });
  });

  describe('hasAdminAccess', () => {
    it('should return true if user has admin role', async () => {
      const userId = 'user-id';
      
      // Mock admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.hasAdminAccess(userId);
      
      expect(result).toBe(true);
    });

    it('should return false if user does not have admin role', async () => {
      const userId = 'user-id';
      
      // Mock non-admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.hasAdminAccess(userId);
      
      expect(result).toBe(false);
    });

    it('should return false if there is an error', async () => {
      const userId = 'user-id';
      
      // Mock error
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.hasAdminAccess(userId);
      
      expect(result).toBe(false);
    });

    it('should return false if missing required parameters', async () => {
      const result = await PermissionService.hasAdminAccess('');
      
      expect(result).toBe(false);
    });
  });

  describe('getPermissionLevel', () => {
    it('should return admin if user is the resource owner', async () => {
      const userId = 'user-id';
      const resourceType = 'availability';
      const resourceOwnerId = 'user-id';
      
      const result = await PermissionService.getPermissionLevel(userId, resourceType, resourceOwnerId);
      
      expect(result).toBe('admin');
    });

    it('should return admin if user has admin role', async () => {
      const userId = 'user-id';
      const resourceType = 'availability';
      const resourceOwnerId = 'other-id';
      
      // Mock admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.getPermissionLevel(userId, resourceType, resourceOwnerId);
      
      expect(result).toBe('admin');
    });

    it('should return read for availability if user is not owner or admin', async () => {
      const userId = 'user-id';
      const resourceType = 'availability';
      const resourceOwnerId = 'other-id';
      
      // Mock non-admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.getPermissionLevel(userId, resourceType, resourceOwnerId);
      
      expect(result).toBe('read');
    });

    it('should return write for appointment if user is involved', async () => {
      const userId = 'user-id';
      const resourceType = 'appointment';
      const resourceOwnerId = 'appointment-id';
      
      // Mock non-admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      // Mock appointment involvement
      const mockAppointmentSingle = jest.fn().mockResolvedValue({
        data: { client_id: userId, clinician_id: 'other-id' },
        error: null
      });
      
      const mockAppointmentEq = jest.fn(() => ({ single: mockAppointmentSingle }));
      const mockAppointmentSelect = jest.fn(() => ({ eq: mockAppointmentEq }));
      
      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect }) // First call for role check
        .mockReturnValueOnce({ select: mockAppointmentSelect }); // Second call for appointment check
      
      const result = await PermissionService.getPermissionLevel(userId, resourceType, resourceOwnerId);
      
      expect(result).toBe('write');
    });

    it('should return read for time off if user is not owner or admin', async () => {
      const userId = 'user-id';
      const resourceType = 'timeOff';
      const resourceOwnerId = 'other-id';
      
      // Mock non-admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.getPermissionLevel(userId, resourceType, resourceOwnerId);
      
      expect(result).toBe('read');
    });

    it('should return none if missing required parameters', async () => {
      const result = await PermissionService.getPermissionLevel('', 'availability', '');
      
      expect(result).toBe('none');
    });
  });

  describe('canPerformAction', () => {
    it('should return true for read action with read permission', async () => {
      // Mock getPermissionLevel to return 'read'
      jest.spyOn(PermissionService, 'getPermissionLevel').mockResolvedValue('read');
      
      const result = await PermissionService.canPerformAction(
        'user-id',
        'availability',
        'other-id',
        'read'
      );
      
      expect(result).toBe(true);
    });

    it('should return false for read action with none permission', async () => {
      // Mock getPermissionLevel to return 'none'
      jest.spyOn(PermissionService, 'getPermissionLevel').mockResolvedValue('none');
      
      const result = await PermissionService.canPerformAction(
        'user-id',
        'availability',
        'other-id',
        'read'
      );
      
      expect(result).toBe(false);
    });

    it('should return true for create action with write permission', async () => {
      // Mock getPermissionLevel to return 'write'
      jest.spyOn(PermissionService, 'getPermissionLevel').mockResolvedValue('write');
      
      const result = await PermissionService.canPerformAction(
        'user-id',
        'availability',
        'other-id',
        'create'
      );
      
      expect(result).toBe(true);
    });

    it('should return false for create action with read permission', async () => {
      // Mock getPermissionLevel to return 'read'
      jest.spyOn(PermissionService, 'getPermissionLevel').mockResolvedValue('read');
      
      const result = await PermissionService.canPerformAction(
        'user-id',
        'availability',
        'other-id',
        'create'
      );
      
      expect(result).toBe(false);
    });

    it('should return true for delete action with admin permission', async () => {
      // Mock getPermissionLevel to return 'admin'
      jest.spyOn(PermissionService, 'getPermissionLevel').mockResolvedValue('admin');
      
      const result = await PermissionService.canPerformAction(
        'user-id',
        'availability',
        'other-id',
        'delete'
      );
      
      expect(result).toBe(true);
    });

    it('should return false for delete action with write permission', async () => {
      // Mock getPermissionLevel to return 'write'
      jest.spyOn(PermissionService, 'getPermissionLevel').mockResolvedValue('write');
      
      const result = await PermissionService.canPerformAction(
        'user-id',
        'availability',
        'other-id',
        'delete'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('verifyCurrentUserPermission', () => {
    it('should return true if current user is the target user', async () => {
      const targetUserId = 'user-id';
      
      // Mock current user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null
      });
      
      const result = await PermissionService.verifyCurrentUserPermission(targetUserId, 'view');
      
      expect(result).toBe(true);
    });

    it('should return true if current user has admin role', async () => {
      const targetUserId = 'other-id';
      
      // Mock current user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null
      });
      
      // Mock admin role
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null
      });
      
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });
      
      const result = await PermissionService.verifyCurrentUserPermission(targetUserId, 'view');
      
      expect(result).toBe(true);
    });

    it('should return false if no authenticated user', async () => {
      const targetUserId = 'other-id';
      
      // Mock no current user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });
      
      const result = await PermissionService.verifyCurrentUserPermission(targetUserId, 'view');
      
      expect(result).toBe(false);
    });
  });
});