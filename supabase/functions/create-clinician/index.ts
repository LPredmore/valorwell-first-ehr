
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { firstName, lastName, email } = await req.json();

    if (!firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({
          error: "First name, last name, and email are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    // Create user metadata
    const userData = {
      first_name: firstName,
      last_name: lastName,
      role: "clinician",
    };

    // Create user in auth system
    const { data, error } = await supabaseClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: userData,
    });

    if (error) {
      console.error("Error creating user:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create clinician entry with temporary password
    const { error: clinicianError } = await supabaseClient
      .from("clinicians")
      .insert([
        {
          id: data.user.id,
          clinician_first_name: firstName,
          clinician_last_name: lastName,
          clinician_email: email,
          clinician_status: "New",
          clinician_temppassword: tempPassword,
        }
      ]);

    if (clinicianError) {
      console.error("Error creating clinician record:", clinicianError);
      return new Response(
        JSON.stringify({ error: clinicianError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return success response with temporary password
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Clinician ${firstName} ${lastName} has been added. They will receive an email with their temporary password: ${tempPassword}`,
        user: data.user
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
