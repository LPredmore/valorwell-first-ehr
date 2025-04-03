
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { clinicianId, startDate, endDate, timezone } = await req.json()

    if (!clinicianId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the clinician's availability settings
    const { data: settings, error: settingsError } = await supabase
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId)
      .maybeSingle()

    if (settingsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch availability settings', details: settingsError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get recurring weekly availability
    const { data: weeklyAvailability, error: weeklyError } = await supabase
      .from('availability')
      .select('*')
      .eq('clinician_id', clinicianId)
      .eq('is_active', true)

    if (weeklyError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weekly availability', details: weeklyError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get availability exceptions
    const { data: exceptions, error: exceptionsError } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('clinician_id', clinicianId)
      .gte('specific_date', startDate)
      .lte('specific_date', endDate)

    if (exceptionsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch availability exceptions', details: exceptionsError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get time-off blocks
    const { data: timeOffBlocks, error: timeOffError } = await supabase
      .from('time_off_blocks')
      .select('*')
      .eq('clinician_id', clinicianId)
      .eq('is_active', true)
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

    if (timeOffError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch time-off blocks', details: timeOffError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get existing appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinician_id', clinicianId)
      .eq('status', 'scheduled')
      .gte('date', startDate)
      .lte('date', endDate)

    if (appointmentsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch appointments', details: appointmentsError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Process and return all available slots based on the data
    // This is a placeholder for the actual availability calculation logic
    const availableSlots = processAvailability(
      weeklyAvailability || [],
      exceptions || [],
      timeOffBlocks || [],
      appointments || [],
      settings,
      startDate,
      endDate,
      timezone
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: availableSlots,
        settings,
        weeklyAvailability,
        exceptions,
        timeOffBlocks,
        appointments
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to process availability and return available time slots
// This is a skeleton - the actual implementation would be more complex
function processAvailability(
  weeklyAvailability: any[],
  exceptions: any[],
  timeOffBlocks: any[],
  appointments: any[],
  settings: any,
  startDate: string,
  endDate: string,
  timezone: string
) {
  // In a real implementation, this would:
  // 1. Generate all possible slots based on weekly availability
  // 2. Apply exceptions (both additions and removals)
  // 3. Remove slots during time-off blocks
  // 4. Remove slots with existing appointments
  // 5. Apply buffer rules from settings
  // 6. Apply min/max days ahead rules

  // For now, return a placeholder
  return {
    weeklyPatterns: weeklyAvailability.map(avail => ({
      id: avail.id,
      dayOfWeek: avail.day_of_week,
      startTime: avail.start_time,
      endTime: avail.end_time
    })),
    exceptions: exceptions.map(exc => ({
      id: exc.id,
      date: exc.specific_date,
      isDeleted: exc.is_deleted,
      startTime: exc.start_time,
      endTime: exc.end_time
    })),
    unavailableDates: timeOffBlocks.map(block => ({
      startDate: block.start_date,
      endDate: block.end_date,
      note: block.note
    })),
    // In a real implementation, this would be a list of available time slots
    availableSlots: []
  }
}
