
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    const { clinicianId } = await req.json()
    
    if (!clinicianId) {
      throw new Error('Clinician ID is required')
    }
    
    console.log(`Fetching availability settings for clinician ID: ${clinicianId}`)
    
    // Check if clinician ID matches auth user ID format for debugging
    const isClinicianIdInUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clinicianId);
    console.log(`Is clinician ID (${clinicianId}) in UUID format? ${isClinicianIdInUuidFormat}`);
    
    // Fetch the clinician's availability settings
    const { data, error } = await supabaseClient
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId.toString()) 
      .single()
    
    if (error) {
      console.error('Error fetching availability settings:', error)
      console.error(`Clinician ID used in query: ${clinicianId}`)
      
      // Check if this is a unique constraint error - user might have duplicate settings
      if (error.code === '23505') {
        // Try to fetch the settings again after cleaning up duplicates
        const { data: duplicateSettings } = await supabaseClient
          .from('availability_settings')
          .select('id')
          .eq('clinician_id', clinicianId.toString())
        
        if (duplicateSettings && duplicateSettings.length > 1) {
          // Keep the first setting and delete the rest
          const keepSettingId = duplicateSettings[0].id;
          const deleteIds = duplicateSettings.slice(1).map(s => s.id);
          
          if (deleteIds.length > 0) {
            await supabaseClient
              .from('availability_settings')
              .delete()
              .in('id', deleteIds)
            
            // Try fetching again
            const { data: cleanedData, error: cleanedError } = await supabaseClient
              .from('availability_settings')
              .select('*')
              .eq('clinician_id', clinicianId.toString())
              .single()
              
            if (!cleanedError) {
              return new Response(
                JSON.stringify(cleanedData),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          }
        }
      }
      
      // Return default settings if not found - updated defaults
      return new Response(
        JSON.stringify({ 
          time_granularity: 'hour', 
          min_days_ahead: 2, 
          max_days_ahead: 60,
          default_start_time: '09:00:00',
          default_end_time: '17:00:00'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Check if data is available and process it
    if (data) {
      // Ensure min_days_ahead and max_days_ahead are numbers
      // and format default_start_time and default_end_time properly
      data.min_days_ahead = Number(data.min_days_ahead);
      data.max_days_ahead = Number(data.max_days_ahead);
      
      if (!data.default_start_time) {
        data.default_start_time = '09:00:00';
      }
      
      if (!data.default_end_time) {
        data.default_end_time = '17:00:00';
      }
      
      // Check if the single_day_availability table exists
      const { data: singleDayTableExists, error: singleDayTableError } = await supabaseClient
        .rpc('check_table_exists', { check_table_name: 'single_day_availability' });
      
      if (!singleDayTableError) {
        data.supports_single_date_availability = !!singleDayTableExists;
      } else {
        data.supports_single_date_availability = false;
        console.error('Error checking single_day_availability table:', singleDayTableError);
      }
      
      // Also check for the alternate table name
      if (!data.supports_single_date_availability) {
        const { data: altSingleDayTableExists, error: altSingleDayTableError } = await supabaseClient
          .rpc('check_table_exists', { check_table_name: 'availability_single_date' });
        
        if (!altSingleDayTableError) {
          data.supports_single_date_availability = !!altSingleDayTableExists;
        }
      }
      
      // Check if the time_blocks table exists
      const { data: timeBlocksTableExists, error: timeBlocksTableError } = await supabaseClient
        .rpc('check_table_exists', { check_table_name: 'time_blocks' });
      
      if (!timeBlocksTableError) {
        data.supports_time_blocks = !!timeBlocksTableExists;
      } else {
        data.supports_time_blocks = false;
        console.error('Error checking time_blocks table:', timeBlocksTableError);
      }
      
      // Fetch the clinician record to retrieve regular weekly availability
      const { data: clinicianData, error: clinicianError } = await supabaseClient
        .from('clinicians')
        .select(`
          clinician_mondaystart1, clinician_mondayend1,
          clinician_mondaystart2, clinician_mondayend2,
          clinician_mondaystart3, clinician_mondayend3,
          clinician_tuesdaystart1, clinician_tuesdayend1,
          clinician_tuesdaystart2, clinician_tuesdayend2,
          clinician_tuesdaystart3, clinician_tuesdayend3,
          clinician_wednesdaystart1, clinician_wednesdayend1,
          clinician_wednesdaystart2, clinician_wednesdayend2,
          clinician_wednesdaystart3, clinician_wednesdayend3,
          clinician_thursdaystart1, clinician_thursdayend1,
          clinician_thursdaystart2, clinician_thursdayend2,
          clinician_thursdaystart3, clinician_thursdayend3,
          clinician_fridaystart1, clinician_fridayend1,
          clinician_fridaystart2, clinician_fridayend2,
          clinician_fridaystart3, clinician_fridayend3,
          clinician_saturdaystart1, clinician_saturdayend1,
          clinician_saturdaystart2, clinician_saturdayend2,
          clinician_saturdaystart3, clinician_saturdayend3,
          clinician_sundaystart1, clinician_sundayend1,
          clinician_sundaystart2, clinician_sundayend2,
          clinician_sundaystart3, clinician_sundayend3
        `)
        .eq('id', clinicianId)
        .single();
      
      if (!clinicianError && clinicianData) {
        // Add the weekly schedule to the response
        data.weekly_schedule = processWeeklySchedule(clinicianData);
      } else {
        console.error('Error fetching clinician data:', clinicianError);
        data.weekly_schedule = {};
      }
      
      console.log(`Successfully retrieved settings: ${JSON.stringify(data, null, 2)}`)
    }
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper function to process weekly schedule data
function processWeeklySchedule(clinicianData: any): Record<string, any> {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const result: Record<string, any> = {};
  
  days.forEach((day) => {
    const slots = [];
    
    // Check for each possible slot (up to 3 per day)
    for (let i = 1; i <= 3; i++) {
      const startKey = `clinician_${day}start${i}`;
      const endKey = `clinician_${day}end${i}`;
      
      if (clinicianData[startKey] && clinicianData[endKey]) {
        slots.push({
          start_time: clinicianData[startKey],
          end_time: clinicianData[endKey]
        });
      }
    }
    
    result[day] = slots;
  });
  
  return result;
}
