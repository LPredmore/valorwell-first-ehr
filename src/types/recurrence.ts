
import { DateTime } from 'luxon';

/**
 * Options for creating recurrence rules
 */
export interface RecurrenceOptions {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  byDay?: string[];
  count?: number;
  until?: string | Date;
  startDate: Date;
  timezone: string;
}

/**
 * Type for recurrence rule data returned from the database
 */
export interface RecurrenceRuleData {
  id: string;
  event_id: string;
  rrule: string;
  created_at: string;
  updated_at: string;
}

/**
 * Type for expanded recurrence event
 */
export interface ExpandedRecurrenceEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  recurrence_id: string;
  event_type: string;
  is_active: boolean;
  clinician_id: string;
  time_zone?: string;
}
