
/**
 * Creates a weekly recurring rule for the specified day of week
 * @param dayIndex 0 for Sunday, 1 for Monday, etc.
 */
export const createWeeklyRule = (dayIndex: number): string => {
  const dayCode = dayNumberToCode(dayIndex);
  return `FREQ=WEEKLY;BYDAY=${dayCode}`;
};

/**
 * Converts a day of week number to an RFC 5545 day code
 * @param dayIndex 0 for Sunday, 1 for Monday, etc.
 */
export const dayNumberToCode = (dayIndex: number): string => {
  const dayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return dayCodes[dayIndex] || 'MO';
};

/**
 * Converts an RFC 5545 day code to a day of week number
 * @param dayCode SU, MO, TU, WE, TH, FR, SA
 */
export const dayCodeToNumber = (dayCode: string): number | undefined => {
  const dayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return dayCodes.indexOf(dayCode);
};

/**
 * Extracts day codes from an RRULE string
 * @param rrule RRULE string (e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR")
 */
export const extractDayCodes = (rrule: string): string[] | null => {
  const bydayMatch = rrule.match(/BYDAY=([A-Z,]+)/i);
  if (!bydayMatch || !bydayMatch[1]) return null;
  
  return bydayMatch[1].split(',');
};
