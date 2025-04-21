
/**
 * Utility class for validating and formatting time slots
 */
export class TimeSlotValidation {
  /**
   * Checks if end time is after start time
   */
  static isValidTimeRange(startTime: string, endTime: string): boolean {
    // Convert to 24-hour format for comparison
    const start = this.parseTimeString(startTime);
    const end = this.parseTimeString(endTime);
    
    if (!start || !end) return false;
    
    // Compare hours and minutes
    if (start.hours > end.hours) return false;
    if (start.hours === end.hours && start.minutes >= end.minutes) return false;
    
    return true;
  }
  
  /**
   * Parse a time string into hours and minutes
   */
  static parseTimeString(timeStr: string): { hours: number, minutes: number } | null {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    
    return { hours, minutes };
  }
  
  /**
   * Formats a time string to HH:MM format
   */
  static formatTimeString(timeStr: string): string {
    const parsed = this.parseTimeString(timeStr);
    if (!parsed) return timeStr;
    
    const { hours, minutes } = parsed;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  /**
   * Gets a list of time options for selection
   */
  static getTimeOptions(): string[] {
    const options: string[] = [];
    
    // Generate times from 00:00 to 23:30 in 30 minute increments
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    return options;
  }
  
  /**
   * Get a readable day name from day index
   */
  static getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  }
}
