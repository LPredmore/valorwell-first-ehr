
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
    // Make sure to select ALL columns that we need
    const { data, error } = await supabaseClient
      .from('availability_settings')
      .select('*')  // Select all columns instead of listing them individually
      .eq('clinician_id', clinicianId.toString()) // Convert to string explicitly
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
    
    // Check if single-date availability table exists
    // Only do this if we successfully retrieved the base settings
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
      const { data: tableCheckResult, error: tableCheckError } = await supabaseClient
        .rpc('check_table_exists', { check_table_name: 'availability_single_date' });
      
      if (!tableCheckError && tableCheckResult === true) {
        // Set a flag to indicate that single date availability is supported
        data.supports_single_date_availability = true;
      } else {
        data.supports_single_date_availability = false;
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
