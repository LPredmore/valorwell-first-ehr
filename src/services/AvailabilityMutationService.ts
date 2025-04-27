
// Let's update the createAvailabilitySlot method to better handle permissions
static async createAvailabilitySlot(
  clinicianId: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
  isRecurring: boolean = true,
  recurrenceRule?: string,
  timeZone: string = 'America/Chicago',
  specificDate?: string | Date | DateTime
) {
  try {
    // Improved input validation with detailed error messages
    if (!clinicianId) throw new Error('Clinician ID is required');
    if (!startTime) throw new Error('Start time is required');
    if (!endTime) throw new Error('End time is required');
    if (!dayOfWeek) throw new Error('Day of week is required');
    
    // Ensure clinicianId is a valid UUID
    const validClinicianId = this.ensureUUID(clinicianId);
    console.log(`[AvailabilityMutationService] Validated clinician ID: ${validClinicianId} (original: ${clinicianId})`);
    
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    console.log(`[AvailabilityMutationService] Creating availability slot:`, {
      dayOfWeek,
      startTime,
      endTime,
      timeZone: validTimeZone,
      clinicianId: validClinicianId,
      specificDate: specificDate ? 
        (specificDate instanceof DateTime ? 
          specificDate.toISO() : 
          String(specificDate)
        ) : 'none'
    });
    
    // Get the base date for this availability slot
    const baseDate = this.getBaseDate(dayOfWeek, specificDate);
    console.log(`[AvailabilityMutationService] Using base date: ${baseDate} for day ${dayOfWeek}`);
    
    // Create proper DateTime objects with timezone
    const start = TimeZoneService.parseWithZone(`${baseDate}T${startTime}`, validTimeZone);
    const end = TimeZoneService.parseWithZone(`${baseDate}T${endTime}`, validTimeZone);
    
    console.log('[AvailabilityMutationService] Created DateTimes:', {
      start: start.toISO(),
      end: end.toISO(),
      startValid: start.isValid,
      endValid: end.isValid
    });

    if (!start.isValid || !end.isValid) {
      throw new Error(`Invalid date/time: ${start.invalidReason || end.invalidReason}`);
    }
    
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }
    
    // Get the authenticated user ID for debugging
    const { data: { user } } = await supabase.auth.getUser();
    const authUserId = user?.id;
    console.log(`[AvailabilityMutationService] Current auth user ID: ${authUserId}, using clinician ID: ${validClinicianId}`);
    
    // Add safety check for auth
    if (!authUserId) {
      throw new Error('You must be logged in to create availability slots');
    }
    
    // Check if user is trying to create a slot for another clinician
    if (authUserId !== validClinicianId) {
      console.warn('[AvailabilityMutationService] Warning: User is creating availability for a different clinician', {
        authUserId,
        targetClinicianId: validClinicianId
      });
      
      try {
        // Check if they have admin role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUserId)
          .single();
          
        if (!profileData || profileData.role !== 'admin') {
          console.warn('[AvailabilityMutationService] Non-admin user attempting to create availability for another clinician');
          // We don't throw here - let RLS handle it
        }
      } catch (e) {
        console.error('[AvailabilityMutationService] Error checking user role:', e);
        // We don't throw here - let RLS handle it
      }
    }
    
    // Verify database access before insert
    const { data: testAccess, error: accessError } = await supabase
      .from('calendar_events')
      .select('id')
      .limit(1);
      
    if (accessError) {
      console.error('[AvailabilityMutationService] Database access check failed:', accessError);
      throw new Error(`Database access error: ${accessError.message}`);
    }
    
    console.log('[AvailabilityMutationService] Database access verified, proceeding with insert');
    
    // Insert into database with explicit UUID conversion
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        title: 'Available',
        event_type: 'availability',
        start_time: start.toISO(),
        end_time: end.toISO(),
        clinician_id: validClinicianId,
        availability_type: isRecurring ? 'recurring' : 'single',
        is_active: true,
        time_zone: validTimeZone
      })
      .select()
      .single();
    
    if (error) {
      console.error('[AvailabilityMutationService] Error creating availability slot:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      if (error.message.includes('violates row level security policy')) {
        throw new Error('Permission denied: You do not have access to create availability for this clinician. Check your login permissions.');
      }
      
      throw error;
    }
    
    // If recurring, create a recurrence rule
    if (isRecurring && data.id) {
      const rrule = recurrenceRule || `FREQ=WEEKLY;BYDAY=${this.getDayCode(dayOfWeek)}`;
      
      const { error: ruleError } = await supabase
        .from('recurrence_rules')
        .insert({
          event_id: data.id,
          rrule: rrule
        });
      
      if (ruleError) {
        console.error('[AvailabilityMutationService] Error creating recurrence rule:', ruleError);
        throw ruleError;
      }
    }
    
    return data;
    
  } catch (error) {
    console.error('[AvailabilityMutationService] Error creating availability slot:', error);
    throw error;
  }
}
