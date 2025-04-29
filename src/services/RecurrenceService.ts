import { supabase } from '@/integrations/supabase/client';
import { RecurrenceRule } from '@/types/calendar';

export class RecurrenceService {
  static async getRuleByEventId(eventId: string): Promise<{
    data: RecurrenceRule[];
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .select('*')
        .eq('event_id', eventId);
      
      return { 
        data: result.data as RecurrenceRule[] || [], 
        error: result.error 
      };
    } catch (error) {
      console.error('[RecurrenceService] Error fetching recurrence rule:', error);
      return { data: [], error };
    }
  }

  static async getRecurringRules(): Promise<{
    data: RecurrenceRule[];
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .select('*');
      
      return { 
        data: result.data as RecurrenceRule[] || [], 
        error: result.error 
      };
    } catch (error) {
      console.error('[RecurrenceService] Error fetching recurrence rules:', error);
      return { data: [], error };
    }
  }

  static async createRule(eventId: string, rule: string): Promise<{
    data: RecurrenceRule | null;
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .insert([
          {
            event_id: eventId,
            rule_string: rule,
            is_active: true
          }
        ])
        .select()
        .single();
      
      return {
        data: result.data as RecurrenceRule,
        error: result.error
      };
    } catch (error) {
      console.error('[RecurrenceService] Error creating recurrence rule:', error);
      return { data: null, error };
    }
  }

  static async updateRule(ruleId: string, rule: string): Promise<{
    data: RecurrenceRule | null;
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .update({
          rule_string: rule,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
        .select()
        .single();
      
      return {
        data: result.data as RecurrenceRule,
        error: result.error
      };
    } catch (error) {
      console.error('[RecurrenceService] Error updating recurrence rule:', error);
      return { data: null, error };
    }
  }

  static async deleteRule(ruleId: string): Promise<{
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .delete()
        .eq('id', ruleId);
      
      return { error: result.error };
    } catch (error) {
      console.error('[RecurrenceService] Error deleting recurrence rule:', error);
      return { error };
    }
  }

  static async deleteRuleByEventId(eventId: string): Promise<{
    error: any;
  }> {
    try {
      const result = await supabase
        .from('recurrence_rules')
        .delete()
        .eq('event_id', eventId);
      
      return { error: result.error };
    } catch (error) {
      console.error('[RecurrenceService] Error deleting recurrence rule by event ID:', error);
      return { error };
    }
  }
}
