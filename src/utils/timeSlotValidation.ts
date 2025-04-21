
export class TimeSlotValidation {
  static isValidTimeRange(startTime: string, endTime: string): boolean {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    return start < end;
  }

  static formatTimeString(time: string): string {
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
}
