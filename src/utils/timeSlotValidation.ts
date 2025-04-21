
export class TimeSlotValidation {
  static isValidTimeRange(startTime: string, endTime: string): boolean {
    try {
      const start = new Date(`1970-01-01T${startTime}`);
      const end = new Date(`1970-01-01T${endTime}`);
      return start < end;
    } catch (error) {
      console.error('Error validating time range:', error);
      return false;
    }
  }

  static formatTimeString(time: string): string {
    if (!time) return '00:00';
    return time.length === 5 ? time : `${time}:00`;
  }

  static getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  }

  static getTimeOptions(): string[] {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourStr = hour.toString().padStart(2, '0');
        const minStr = minute.toString().padStart(2, '0');
        options.push(`${hourStr}:${minStr}`);
      }
    }
    return options;
  }

  static parseTimeString(time: string): { hours: number; minutes: number } {
    const [hours, minutes] = time.split(':').map(Number);
    return { hours: hours || 0, minutes: minutes || 0 };
  }
}
