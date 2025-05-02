
import { supabase } from '@/integrations/supabase/client';
import { CalendarErrorHandler } from './calendar/CalendarErrorHandler';
import { ensureUUID } from '@/utils/validation/uuidUtils';

/**
 * Service for handling permission checks
 */
export class PermissionService {
  /**
   * Check if a user has permission to view a client
   * @param userId The user ID to check
   * @param clientId The client ID to check access for
   * @returns Whether the user has permission to view the client
   */
  static async canViewClient(userId: string, clientId: string): Promise<boolean> {
    if (!userId || !clientId) {
      console.warn('[PermissionService] Missing user ID or client ID for permission check');
      return false;
    }
    
    try {
      // Format IDs as UUIDs
      const formattedUserId = ensureUUID(userId, { 
        strictMode: true,
        logLevel: 'warn'
      });
      
      const formattedClientId = ensureUUID(clientId, {
        strictMode: true,
        logLevel: 'warn'
      });
      
      // Get user's role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', formattedUserId)
        .maybeSingle();
      
      if (userError) {
        console.error('[PermissionService] Error checking user role:', userError);
        return false;
      }
      
      // Admin always has access
      if (userData?.role === 'admin' || userData?.role === 'superadmin') {
        return true;
      }
      
      // Clinicians need to check if assigned to the client
      if (userData?.role === 'clinician') {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('client_assigned_therapist')
          .eq('id', formattedClientId)
          .maybeSingle();
          
        if (clientError) {
          console.error('[PermissionService] Error checking client assignment:', clientError);
          return false;
        }
        
        // Check if clinician is assigned to this client
        return clientData?.client_assigned_therapist === formattedUserId;
      }
      
      // Clients can only view themselves
      if (userData?.role === 'client') {
        return formattedUserId === formattedClientId;
      }
      
      return false;
    } catch (error) {
      console.error('[PermissionService] Error checking client permissions:', error);
      return false;
    }
  }
  
  /**
   * Check if a user has permission to manage a clinician's calendar
   * @param userId The user ID to check
   * @param clinicianId The clinician ID to check access for
   * @returns Whether the user has permission to manage the clinician's calendar
   */
  static async canManageCalendar(userId: string, clinicianId: string): Promise<boolean> {
    if (!userId || !clinicianId) {
      console.warn('[PermissionService] Missing user ID or clinician ID for permission check');
      return false;
    }
    
    try {
      // Format IDs as UUIDs
      const formattedUserId = ensureUUID(userId, { 
        strictMode: true,
        logLevel: 'warn' 
      });
      
      const formattedClinicianId = ensureUUID(clinicianId, {
        strictMode: true,
        logLevel: 'warn'
      });
      
      // Get user's role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', formattedUserId)
        .maybeSingle();
      
      if (userError) {
        console.error('[PermissionService] Error checking user role:', userError);
        return false;
      }
      
      // Admin always has access
      if (userData?.role === 'admin' || userData?.role === 'superadmin') {
        return true;
      }
      
      // Clinicians can only manage their own calendar
      if (userData?.role === 'clinician') {
        return formattedUserId === formattedClinicianId;
      }
      
      return false;
    } catch (error) {
      console.error('[PermissionService] Error checking calendar permissions:', error);
      return false;
    }
  }
  
  /**
   * Check if a user has permission to create an appointment
   * @param userId The user ID to check
   * @param clinicianId The clinician ID for the appointment
   * @param clientId The client ID for the appointment
   * @returns Whether the user has permission to create the appointment
   */
  static async canCreateAppointment(
    userId: string,
    clinicianId: string,
    clientId?: string
  ): Promise<boolean> {
    if (!userId || !clinicianId) {
      console.warn('[PermissionService] Missing user ID or clinician ID for permission check');
      return false;
    }
    
    try {
      // Format IDs as UUIDs
      const formattedUserId = ensureUUID(userId, { 
        strictMode: true, 
        logLevel: 'warn'
      });
      
      const formattedClinicianId = ensureUUID(clinicianId, {
        strictMode: true,
        logLevel: 'warn'
      });
      
      // Get user's role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', formattedUserId)
        .maybeSingle();
      
      if (userError) {
        console.error('[PermissionService] Error checking user role:', userError);
        return false;
      }
      
      // Admin can create appointments for anyone
      if (userData?.role === 'admin' || userData?.role === 'superadmin') {
        return true;
      }
      
      // Clinicians can create their own appointments
      if (userData?.role === 'clinician') {
        return formattedUserId === formattedClinicianId;
      }
      
      // Clients can create appointments with their assigned therapist
      if (userData?.role === 'client' && clientId) {
        const formattedClientId = ensureUUID(clientId, {
          strictMode: true,
          logLevel: 'warn'
        });
        
        // Client can only book for themselves
        if (formattedUserId !== formattedClientId) {
          return false;
        }
        
        // Check if clinician is assigned to this client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('client_assigned_therapist')
          .eq('id', formattedClientId)
          .maybeSingle();
          
        if (clientError) {
          console.error('[PermissionService] Error checking client assignment:', clientError);
          return false;
        }
        
        return clientData?.client_assigned_therapist === formattedClinicianId;
      }
      
      return false;
    } catch (error) {
      console.error('[PermissionService] Error checking appointment permissions:', error);
      return false;
    }
  }
  
  /**
   * Check if a user has permission to edit an appointment
   * @param userId The user ID to check
   * @param appointmentId The appointment ID to check access for
   * @returns Whether the user has permission to edit the appointment
   */
  static async canEditAppointment(userId: string, appointmentId: string): Promise<boolean> {
    if (!userId || !appointmentId) {
      console.warn('[PermissionService] Missing user ID or appointment ID for permission check');
      return false;
    }
    
    try {
      // Format IDs as UUIDs
      const formattedUserId = ensureUUID(userId, { 
        strictMode: true, 
        logLevel: 'warn'
      });
      
      // Get user's role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', formattedUserId)
        .maybeSingle();
      
      if (userError) {
        console.error('[PermissionService] Error checking user role:', userError);
        return false;
      }
      
      // Admin can edit any appointment
      if (userData?.role === 'admin' || userData?.role === 'superadmin') {
        return true;
      }
      
      // Get appointment details
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('clinician_id, client_id')
        .eq('id', appointmentId)
        .maybeSingle();
      
      if (appointmentError) {
        console.error('[PermissionService] Error checking appointment details:', appointmentError);
        return false;
      }
      
      if (!appointmentData) {
        console.warn('[PermissionService] Appointment not found:', appointmentId);
        return false;
      }
      
      // Clinicians can edit their own appointments
      if (userData?.role === 'clinician') {
        return appointmentData.clinician_id === formattedUserId;
      }
      
      // Clients can edit their own appointments
      if (userData?.role === 'client') {
        return appointmentData.client_id === formattedUserId;
      }
      
      return false;
    } catch (error) {
      console.error('[PermissionService] Error checking edit appointment permissions:', error);
      return false;
    }
  }
  
  /**
   * Check if a user has admin permissions
   * @param userId The user ID to check
   * @returns Whether the user has admin permissions
   */
  static async isAdmin(userId: string): Promise<boolean> {
    if (!userId) {
      return false;
    }
    
    try {
      // Format ID as UUID
      const formattedUserId = ensureUUID(userId, { 
        strictMode: true, 
        logLevel: 'warn'
      });
      
      // Get user's role
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', formattedUserId)
        .maybeSingle();
      
      if (error) {
        console.error('[PermissionService] Error checking admin permissions:', error);
        return false;
      }
      
      return data?.role === 'admin' || data?.role === 'superadmin';
    } catch (error) {
      console.error('[PermissionService] Error checking admin status:', error);
      return false;
    }
  }
  
  /**
   * Check if a user is a clinician
   * @param userId The user ID to check
   * @returns Whether the user is a clinician
   */
  static async isClinician(userId: string): Promise<boolean> {
    if (!userId) {
      return false;
    }
    
    try {
      // Format ID as UUID
      const formattedUserId = ensureUUID(userId, { 
        strictMode: true, 
        logLevel: 'warn'
      });
      
      // Get user's role
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', formattedUserId)
        .maybeSingle();
      
      if (error) {
        console.error('[PermissionService] Error checking clinician status:', error);
        return false;
      }
      
      return data?.role === 'clinician';
    } catch (error) {
      console.error('[PermissionService] Error checking clinician status:', error);
      return false;
    }
  }
  
  /**
   * Check if a user is a client
   * @param userId The user ID to check
   * @returns Whether the user is a client
   */
  static async isClient(userId: string): Promise<boolean> {
    if (!userId) {
      return false;
    }
    
    try {
      // Format ID as UUID
      const formattedUserId = ensureUUID(userId, { 
        strictMode: true, 
        logLevel: 'warn'
      });
      
      // Get user's role
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', formattedUserId)
        .maybeSingle();
      
      if (error) {
        console.error('[PermissionService] Error checking client status:', error);
        return false;
      }
      
      return data?.role === 'client';
    } catch (error) {
      console.error('[PermissionService] Error checking client status:', error);
      return false;
    }
  }
}

export default PermissionService;
