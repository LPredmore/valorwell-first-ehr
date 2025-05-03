
import { supabase } from '@/integrations/supabase/client';
import { CalendarErrorHandler } from './calendar/CalendarErrorHandler';

/**
 * Service for managing appointments
 */
class AppointmentService {
  /**
   * Mark a session as no-show with reason
   */
  async markSessionNoShow(appointmentId: string, reason: string): Promise<{success: boolean, error?: string}> {
    try {
      // Update the appointment status
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          status: 'no_show',
          notes: reason
        })
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error marking session as no-show:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }
  
  // Add other appointment-related methods here
}

export const appointmentService = new AppointmentService();
