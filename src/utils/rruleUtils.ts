
/**
 * Utilities for working with recurring events using the RRule format
 * (iCalendar RFC 5545 recurrence rules)
 */

/**
 * Converts a day number (0-6, Sunday-Saturday) to a day code for RRule
 * @param dayNumber Day number (0 = Sunday, 6 = Saturday)
 * @returns Day code (SU, MO, TU, WE, TH, FR, SA)
 */
export function dayNumberToCode(dayNumber: number): string {
  const dayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  if (dayNumber < 0 || dayNumber > 6) {
    console.error(`Invalid day number: ${dayNumber}, defaulting to Sunday`);
    return 'SU';
  }
  return dayCodes[dayNumber];
}

/**
 * Converts a day code to a day number (0-6, Sunday-Saturday)
 * @param dayCode Day code (SU, MO, TU, WE, TH, FR, SA)
 * @returns Day number (0-6)
 */
export function dayCodeToNumber(dayCode: string): number {
  const dayCodes = {
    'SU': 0,
    'MO': 1,
    'TU': 2,
    'WE': 3,
    'TH': 4,
    'FR': 5,
    'SA': 6
  };
  return dayCodes[dayCode as keyof typeof dayCodes] || 0;
}

/**
 * Creates a weekly recurrence rule for a specific day of week
 * @param dayIndex Day of week (0-6, Sunday-Saturday)
 * @returns RRule string in iCalendar format
 */
export function createWeeklyRule(dayIndex: number): string {
  return `FREQ=WEEKLY;BYDAY=${dayNumberToCode(dayIndex)}`;
}

/**
 * Creates a weekly recurrence rule for multiple days of week
 * @param dayIndices Array of day indices (0-6, Sunday-Saturday)
 * @returns RRule string in iCalendar format
 */
export function createMultiDayWeeklyRule(dayIndices: number[]): string {
  const dayCodes = dayIndices.map(dayNumberToCode).join(',');
  return `FREQ=WEEKLY;BYDAY=${dayCodes}`;
}

/**
 * Extracts the day codes from a WEEKLY rrule
 * @param rrule RRule string in iCalendar format
 * @returns Array of day codes or undefined if not found
 */
export function extractDayCodes(rrule: string): string[] | undefined {
  const match = rrule.match(/BYDAY=([A-Z,]+)/);
  if (match && match[1]) {
    return match[1].split(',');
  }
  return undefined;
}

/**
 * Gets a human-readable description of a recurring rule
 * @param rrule RRule string in iCalendar format
 * @returns Human-readable description
 */
export function getRecurrenceDescription(rrule: string): string {
  if (!rrule) return 'One-time event';
  
  if (rrule.includes('FREQ=WEEKLY')) {
    const dayCodes = extractDayCodes(rrule);
    if (!dayCodes || dayCodes.length === 0) return 'Weekly';
    
    if (dayCodes.length === 1) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIndex = dayCodeToNumber(dayCodes[0]);
      return `Weekly on ${dayNames[dayIndex]}`;
    }
    
    if (dayCodes.length === 5 && 
        dayCodes.includes('MO') && 
        dayCodes.includes('TU') && 
        dayCodes.includes('WE') && 
        dayCodes.includes('TH') && 
        dayCodes.includes('FR')) {
      return 'Weekly on weekdays';
    }
    
    if (dayCodes.length === 2 && dayCodes.includes('SA') && dayCodes.includes('SU')) {
      return 'Weekly on weekends';
    }
    
    return 'Weekly on multiple days';
  }
  
  if (rrule.includes('FREQ=MONTHLY')) {
    return 'Monthly';
  }
  
  if (rrule.includes('FREQ=DAILY')) {
    return 'Daily';
  }
  
  return 'Recurring';
}
