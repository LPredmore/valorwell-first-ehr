import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment';
import { DebugUtils } from './debugUtils';

/**
 * Utility for debugging appointment data and timezone conversions
 */
export class AppointmentDebugUtils {
  private static readonly CONTEXT = 'AppointmentDebug';

  /**
   * Analyze an appointment's timezone conversions and log detailed information
   */
  public static analyzeAppointment(appointment: Appointment, userTimeZone: string): void {
    if (!appointment) {
      DebugUtils.error(this.CONTEXT, 'Cannot analyze null appointment');
      return;
    }

    try {
      // Parse UTC timestamps
      const utcStart = DateTime.fromISO(appointment.start_at, { zone: 'UTC' });
      const utcEnd = DateTime.fromISO(appointment.end_at, { zone: 'UTC' });

      // Convert to user's timezone
      const localStart = utcStart.setZone(userTimeZone);
      const localEnd = utcEnd.setZone(userTimeZone);

      // Check for DST transitions
      const isDSTTransition = this.checkForDSTTransition(utcStart, utcEnd, userTimeZone);

      // Log detailed analysis
      console.log(`
🔍 APPOINTMENT ANALYSIS: ${appointment.id}
┌─────────────────────────────────────────────────────────────────┐
│ Client: ${appointment.clientName || appointment.client_id}
│ Type: ${appointment.type}
│ Status: ${appointment.status}
├─────────────────────────────────────────────────────────────────┤
│ UTC Start: ${appointment.start_at}
│   → Parsed: ${utcStart.toISO()} (Valid: ${utcStart.isValid})
│   → Weekday: ${utcStart.weekdayLong}
│
│ UTC End: ${appointment.end_at}
│   → Parsed: ${utcEnd.toISO()} (Valid: ${utcEnd.isValid})
│   → Duration: ${utcEnd.diff(utcStart).as('minutes')} minutes
├─────────────────────────────────────────────────────────────────┤
│ Local Start (${userTimeZone}): ${localStart.toISO()}
│   → Formatted: ${localStart.toFormat('yyyy-MM-dd HH:mm:ss')}
│   → Weekday: ${localStart.weekdayLong}
│   → Offset: UTC${localStart.toFormat('Z')} (${localStart.offsetNameShort})
│
│ Local End (${userTimeZone}): ${localEnd.toISO()}
│   → Formatted: ${localEnd.toFormat('yyyy-MM-dd HH:mm:ss')}
│   → Offset: UTC${localEnd.toFormat('Z')} (${localEnd.offsetNameShort})
│   → Duration: ${localEnd.diff(localStart).as('minutes')} minutes
├─────────────────────────────────────────────────────────────────┤
│ DST Transition: ${isDSTTransition ? '⚠️ YES - POTENTIAL ISSUE' : 'No'}
│ Day Boundary Cross: ${utcStart.day !== localStart.day ? '⚠️ YES - POTENTIAL ISSUE' : 'No'}
│ Duration Mismatch: ${
        Math.abs(utcEnd.diff(utcStart).as('minutes') - localEnd.diff(localStart).as('minutes')) > 1
          ? '⚠️ YES - POTENTIAL ISSUE'
          : 'No'
      }
└─────────────────────────────────────────────────────────────────┘
      `);
    } catch (error) {
      DebugUtils.error(this.CONTEXT, 'Error analyzing appointment', {
        appointmentId: appointment.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check if a time range crosses a DST transition
   */
  private static checkForDSTTransition(
    utcStart: DateTime,
    utcEnd: DateTime,
    timezone: string
  ): boolean {
    try {
      // Check hourly intervals between start and end for offset changes
      const hours = Math.ceil(utcEnd.diff(utcStart).as('hours'));
      let previousOffset = utcStart.setZone(timezone).offset;
      
      for (let i = 1; i <= hours; i++) {
        const checkTime = utcStart.plus({ hours: i }).setZone(timezone);
        if (checkTime.offset !== previousOffset) {
          return true;
        }
        previousOffset = checkTime.offset;
      }
      
      return false;
    } catch (error) {
      DebugUtils.error(this.CONTEXT, 'Error checking DST transition', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Compare appointment data between database and UI representation
   */
  public static compareAppointmentRepresentations(
    dbAppointment: Appointment,
    uiAppointment: any,
    userTimeZone: string
  ): void {
    if (!dbAppointment || !uiAppointment) {
      DebugUtils.error(this.CONTEXT, 'Cannot compare null appointments');
      return;
    }

    try {
      // Parse times from both representations
      const dbStartUTC = DateTime.fromISO(dbAppointment.start_at, { zone: 'UTC' });
      const dbEndUTC = DateTime.fromISO(dbAppointment.end_at, { zone: 'UTC' });
      const dbStartLocal = dbStartUTC.setZone(userTimeZone);
      const dbEndLocal = dbEndUTC.setZone(userTimeZone);

      // Extract UI times (format depends on implementation)
      const uiStartLocal = uiAppointment.start instanceof DateTime 
        ? uiAppointment.start 
        : DateTime.fromISO(uiAppointment.start, { zone: userTimeZone });
      
      const uiEndLocal = uiAppointment.end instanceof DateTime 
        ? uiAppointment.end 
        : DateTime.fromISO(uiAppointment.end, { zone: userTimeZone });

      // Compare and log differences
      const startTimeDiff = Math.abs(dbStartLocal.diff(uiStartLocal).as('minutes'));
      const endTimeDiff = Math.abs(dbEndLocal.diff(uiEndLocal).as('minutes'));
      const durationDiff = Math.abs(
        (dbEndLocal.diff(dbStartLocal).as('minutes')) - 
        (uiEndLocal.diff(uiStartLocal).as('minutes'))
      );

      console.log(`
🔍 APPOINTMENT REPRESENTATION COMPARISON: ${dbAppointment.id}
┌─────────────────────────────────────────────────────────────────┐
│ Database Representation (converted to ${userTimeZone}):
│   Start: ${dbStartLocal.toFormat('yyyy-MM-dd HH:mm:ss')}
│   End: ${dbEndLocal.toFormat('yyyy-MM-dd HH:mm:ss')}
│   Duration: ${dbEndLocal.diff(dbStartLocal).as('minutes')} minutes
│   Day: ${dbStartLocal.toFormat('yyyy-MM-dd')}
├─────────────────────────────────────────────────────────────────┤
│ UI Representation:
│   Start: ${uiStartLocal.toFormat('yyyy-MM-dd HH:mm:ss')}
│   End: ${uiEndLocal.toFormat('yyyy-MM-dd HH:mm:ss')}
│   Duration: ${uiEndLocal.diff(uiStartLocal).as('minutes')} minutes
│   Day: ${uiStartLocal.toFormat('yyyy-MM-dd')}
├─────────────────────────────────────────────────────────────────┤
│ Differences:
│   Start Time: ${startTimeDiff > 0 ? `⚠️ ${startTimeDiff} minutes` : 'None'}
│   End Time: ${endTimeDiff > 0 ? `⚠️ ${endTimeDiff} minutes` : 'None'}
│   Duration: ${durationDiff > 0 ? `⚠️ ${durationDiff} minutes` : 'None'}
│   Day Mismatch: ${dbStartLocal.day !== uiStartLocal.day ? '⚠️ YES' : 'No'}
└─────────────────────────────────────────────────────────────────┘
      `);
    } catch (error) {
      DebugUtils.error(this.CONTEXT, 'Error comparing appointment representations', {
        appointmentId: dbAppointment.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Test timezone conversion for a specific date and time
   */
  public static testTimezoneConversion(
    dateStr: string,
    timeStr: string,
    fromTimezone: string,
    toTimezone: string
  ): void {
    try {
      // Create DateTime in source timezone
      const sourceDateTime = DateTime.fromFormat(
        `${dateStr} ${timeStr}`,
        'yyyy-MM-dd HH:mm',
        { zone: fromTimezone }
      );

      if (!sourceDateTime.isValid) {
        DebugUtils.error(this.CONTEXT, 'Invalid source date/time', {
          dateStr,
          timeStr,
          timezone: fromTimezone,
          error: sourceDateTime.invalidReason
        });
        return;
      }

      // Convert to target timezone
      const targetDateTime = sourceDateTime.setZone(toTimezone);

      // Convert to UTC
      const utcDateTime = sourceDateTime.toUTC();

      console.log(`
🌐 TIMEZONE CONVERSION TEST
┌─────────────────────────────────────────────────────────────────┐
│ Source (${fromTimezone}): ${sourceDateTime.toFormat('yyyy-MM-dd HH:mm:ss')}
│   ISO: ${sourceDateTime.toISO()}
│   Offset: UTC${sourceDateTime.toFormat('Z')} (${sourceDateTime.offsetNameShort})
│   Unix Timestamp: ${sourceDateTime.toMillis()}
├─────────────────────────────────────────────────────────────────┤
│ Target (${toTimezone}): ${targetDateTime.toFormat('yyyy-MM-dd HH:mm:ss')}
│   ISO: ${targetDateTime.toISO()}
│   Offset: UTC${targetDateTime.toFormat('Z')} (${targetDateTime.offsetNameShort})
│   Unix Timestamp: ${targetDateTime.toMillis()}
├─────────────────────────────────────────────────────────────────┤
│ UTC: ${utcDateTime.toFormat('yyyy-MM-dd HH:mm:ss')}
│   ISO: ${utcDateTime.toISO()}
│   Unix Timestamp: ${utcDateTime.toMillis()}
├─────────────────────────────────────────────────────────────────┤
│ Day Change: ${sourceDateTime.day !== targetDateTime.day ? 'Yes' : 'No'}
│ Hour Change: ${sourceDateTime.hour !== targetDateTime.hour ? 'Yes' : 'No'}
│ Minute Change: ${sourceDateTime.minute !== targetDateTime.minute ? 'Yes' : 'No'}
│ Time Difference: ${Math.abs(targetDateTime.offset - sourceDateTime.offset) / 60} hours
└─────────────────────────────────────────────────────────────────┘
      `);
    } catch (error) {
      DebugUtils.error(this.CONTEXT, 'Error testing timezone conversion', {
        dateStr,
        timeStr,
        fromTimezone,
        toTimezone,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Generate a test appointment at a specific date and time
   */
  public static generateTestAppointment(
    dateStr: string,
    timeStr: string,
    durationMinutes: number,
    timezone: string
  ): Appointment {
    try {
      // Create local DateTime
      const localStart = DateTime.fromFormat(
        `${dateStr} ${timeStr}`,
        'yyyy-MM-dd HH:mm',
        { zone: timezone }
      );

      if (!localStart.isValid) {
        throw new Error(`Invalid date/time: ${localStart.invalidReason}`);
      }

      // Calculate end time
      const localEnd = localStart.plus({ minutes: durationMinutes });

      // Convert to UTC for storage
      const utcStart = localStart.toUTC();
      const utcEnd = localEnd.toUTC();

      // Create test appointment
      const appointment: Appointment = {
        id: `test-${Date.now()}`,
        client_id: 'test-client',
        clinician_id: 'test-clinician',
        start_at: utcStart.toISO(),
        end_at: utcEnd.toISO(),
        type: 'Test Appointment',
        status: 'scheduled',
        clientName: 'Test Client'
      };

      // Log the generated appointment
      console.log(`
✅ GENERATED TEST APPOINTMENT
┌─────────────────────────────────────────────────────────────────┐
│ Local (${timezone}):
│   Start: ${localStart.toFormat('yyyy-MM-dd HH:mm:ss')}
│   End: ${localEnd.toFormat('yyyy-MM-dd HH:mm:ss')}
│   Duration: ${durationMinutes} minutes
├─────────────────────────────────────────────────────────────────┤
│ UTC:
│   Start: ${utcStart.toFormat('yyyy-MM-dd HH:mm:ss')}
│   End: ${utcEnd.toFormat('yyyy-MM-dd HH:mm:ss')}
├─────────────────────────────────────────────────────────────────┤
│ Appointment Object:
${JSON.stringify(appointment, null, 2).split('\n').map(line => `│   ${line}`).join('\n')}
└─────────────────────────────────────────────────────────────────┘
      `);

      return appointment;
    } catch (error) {
      DebugUtils.error(this.CONTEXT, 'Error generating test appointment', {
        dateStr,
        timeStr,
        durationMinutes,
        timezone,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return a minimal valid appointment
      return {
        id: `error-${Date.now()}`,
        client_id: 'error',
        clinician_id: 'error',
        start_at: new Date().toISOString(),
        end_at: new Date().toISOString(),
        type: 'Error',
        status: 'error'
      };
    }
  }
}