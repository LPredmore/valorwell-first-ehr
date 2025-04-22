
/**
 * Utility functions for validating and working with time slots
 */
export class TimeSlotValidation {
  /**
   * Generate time options in 30-minute increments for dropdowns
   */
  static getTimeOptions(): string[] {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        options.push(`${hourStr}:${minuteStr}`);
      }
    }
    return options;
  }

  /**
   * Validate that end time is after start time
   */
  static isValidTimeRange(startTime: string, endTime: string): boolean {
    return startTime < endTime;
  }
  
  /**
   * Convert day index to name
   */
  static getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  }
  
  /**
   * Convert day name to index
   */
  static getDayIndex(dayName: string): number {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.findIndex(day => day.toLowerCase() === dayName.toLowerCase());
  }
  
  /**
   * Format a time string to display format (e.g., 09:00 -> 9:00 AM)
   */
  static formatTimeForDisplay(time: string): string {
    if (!time) return '';
    
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error, time);
      return time;
    }
  }
}
