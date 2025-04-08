
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Set up CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client with the service role key (has admin privileges)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all clinicians without temp_password
    const { data: clinicians, error: clinicianError } = await supabaseClient
      .from('clinicians')
      .select('id, clinician_email, clinician_first_name, clinician_last_name');

    if (clinicianError) {
      console.error("Error fetching clinicians:", clinicianError);
      return new Response(
        JSON.stringify({ error: clinicianError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check which clinicians don't have temp_password in profiles
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each clinician
    for (const clinician of clinicians) {
      try {
        // Check if this clinician has a temp_password in profiles
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('temp_password')
          .eq('id', clinician.id)
          .single();

        if (profileError) {
          console.error(`Error fetching profile for ${clinician.id}:`, profileError);
          results.push({
            clinician_id: clinician.id,
            email: clinician.clinician_email,
            success: false,
            error: `Profile fetch error: ${profileError.message}`
          });
          errorCount++;
          continue;
        }

        // If temp_password already exists, skip this clinician
        if (profile?.temp_password) {
          console.log(`Clinician ${clinician.clinician_email} already has a temp_password`);
          results.push({
            clinician_id: clinician.id,
            email: clinician.clinician_email,
            success: true,
            action: "skipped",
            message: "Password already stored"
          });
          continue;
        }

        // Generate a new temporary password
        const newTempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

        // Use admin API to reset the password without sending an email
        const { error: updateAuthError } = await supabaseClient.auth.admin.updateUserById(
          clinician.id,
          {
            password: newTempPassword,
            email_confirm: true // Ensure the user doesn't need to confirm email again
          }
        );

        if (updateAuthError) {
          console.error(`Error updating password for ${clinician.clinician_email}:`, updateAuthError);
          results.push({
            clinician_id: clinician.id,
            email: clinician.clinician_email,
            success: false,
            error: `Auth update error: ${updateAuthError.message}`
          });
          errorCount++;
          continue;
        }

        // Update the profile with the new temp_password
        const { error: updateProfileError } = await supabaseClient
          .from('profiles')
          .update({ temp_password: newTempPassword })
          .eq('id', clinician.id);

        if (updateProfileError) {
          console.error(`Error updating profile for ${clinician.clinician_email}:`, updateProfileError);
          results.push({
            clinician_id: clinician.id,
            email: clinician.clinician_email,
            success: false,
            error: `Profile update error: ${updateProfileError.message}`,
            note: "Password was reset but not stored in profile"
          });
          errorCount++;
          continue;
        }

        // Success!
        console.log(`Successfully updated password for ${clinician.clinician_email}`);
        results.push({
          clinician_id: clinician.id,
          email: clinician.clinician_email,
          name: `${clinician.clinician_first_name} ${clinician.clinician_last_name}`,
          success: true,
          action: "updated",
          temp_password: newTempPassword // Include the password in the results so admin can communicate it
        });
        successCount++;

      } catch (err) {
        console.error(`Unexpected error processing ${clinician.clinician_email}:`, err);
        results.push({
          clinician_id: clinician.id,
          email: clinician.clinician_email,
          success: false,
          error: `Unexpected error: ${err.message}`
        });
        errorCount++;
      }
    }

    // Return the results
    return new Response(
      JSON.stringify({
        message: `Processed ${clinicians.length} clinicians. ${successCount} updated successfully, ${errorCount} errors.`,
        results,
        total: clinicians.length,
        success_count: successCount,
        error_count: errorCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
