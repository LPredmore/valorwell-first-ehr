import { supabase } from '@/integrations/supabase/client';
import { RecurrenceRule } from '@/types/recurrence';

export class RecurrenceService {
  static async createRecurrenceRule(recurrenceRule: RecurrenceRule): Promise<{ data: RecurrenceRule | null; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('recurrence_rules')
        .insert([recurrenceRule])
        .select()
        .single();

      if (error) {
        console.error('Error creating recurrence rule:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createRecurrenceRule:', error);
      return { data: null, error };
    }
  }

  static async updateRecurrenceRule(ruleId: string, updates: Partial<RecurrenceRule>): Promise<{ data: RecurrenceRule | null; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('recurrence_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) {
        console.error(`Error updating recurrence rule with ID ${ruleId}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateRecurrenceRule:', error);
      return { data: null, error };
    }
  }

  static async deleteRecurrenceRule(ruleId: string): Promise<{ data: null; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('recurrence_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        console.error(`Error deleting recurrence rule with ID ${ruleId}:`, error);
        return { data: null, error };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Error in deleteRecurrenceRule:', error);
      return { data: null, error };
    }
  }

  static async getRecurrenceRules(clinicianId: string): Promise<{ data: RecurrenceRule[]; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('recurrence_rules')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      if (error) {
        console.error('Error getting recurrence rules:', error);
        return { data: [], error };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getRecurrenceRules:', error);
      return { data: [], error };
    }
  }
  
  static async getRecurrenceRuleById(ruleId: string): Promise<{ data: RecurrenceRule | null; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('recurrence_rules')
        .select('*')
        .eq('id', ruleId)
        .single();
      
      if (error) {
        console.error(`Error getting recurrence rule with ID ${ruleId}:`, error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error in getRecurrenceRuleById:', error);
      return { data: null, error };
    }
  }
}
