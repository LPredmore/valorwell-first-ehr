
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

    console.log("Finding profiles without temp_password...");
    
    // Get all profiles without a temp_password
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, email")
      .is("temp_password", null);
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: profilesError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Found ${profiles?.length || 0} profiles without temp_password`);
    
    // If no profiles need updating, return early
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No profiles need password updates", 
          updatedProfiles: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Process each profile and update passwords
    const results = [];
    let successCount = 0;
    
    for (const profile of profiles) {
      try {
        console.log(`Processing profile with id: ${profile.id}, email: ${profile.email}`);
        
        // Generate a random password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        console.log(`Generated new temporary password`);
        
        // Update the auth user's password
        const { error: updateAuthError } = await supabaseClient.auth.admin.updateUserById(
          profile.id,
          { password: tempPassword }
        );
        
        if (updateAuthError) {
          console.error(`Error updating auth password for ${profile.id}:`, updateAuthError);
          results.push({
            id: profile.id,
            email: profile.email,
            success: false,
            error: updateAuthError.message
          });
          continue;
        }
        
        console.log(`Updated auth password for ${profile.id}`);
        
        // Update the profile's temp_password
        const { error: updateProfileError } = await supabaseClient
          .from("profiles")
          .update({ temp_password: tempPassword })
          .eq("id", profile.id);
          
        if (updateProfileError) {
          console.error(`Error updating profile temp_password for ${profile.id}:`, updateProfileError);
          results.push({
            id: profile.id,
            email: profile.email,
            success: false,
            error: updateProfileError.message
          });
          continue;
        }
        
        console.log(`Successfully updated profile temp_password for ${profile.id}`);
        
        results.push({
          id: profile.id,
          email: profile.email,
          success: true
        });
        
        successCount++;
      } catch (error) {
        console.error(`Unexpected error processing profile ${profile.id}:`, error);
        results.push({
          id: profile.id,
          email: profile.email,
          success: false,
          error: error.message || "Unknown error"
        });
      }
    }
    
    // Return success response with results
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Updated ${successCount} out of ${profiles.length} profiles`,
        results
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
