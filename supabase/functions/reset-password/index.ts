
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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Processing password reset request for: ${email}`);
    
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

    // Check if the user exists
    const { data: user, error: userError } = await supabaseClient.auth.admin.listUsers({
      filter: { email },
    });

    if (userError) {
      console.error("Error checking user:", userError);
      throw userError;
    }

    if (!user || user.users.length === 0) {
      console.log("No user found with the provided email");
      // For security reasons, we'll return a success message even if the user doesn't exist
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "If a user with this email exists, a temporary password has been sent." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate a temporary password - combination of words and numbers for easier typing
    const tempPassword = `VW${Math.random().toString(36).slice(2, 7)}${Math.floor(Math.random() * 1000)}`;
    
    console.log("Generated temporary password for user");

    // Update user's password in Supabase Auth
    const userId = user.users[0].id;
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw updateError;
    }

    // Save the temporary password in the profiles table for reference
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({ temp_password: tempPassword })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile with temp password:", profileError);
      // This is not critical, we can proceed
    }

    console.log("Password updated successfully, sending email...");

    // Send email with temporary password 
    // (Currently using Supabase's built-in email, but can be replaced with Resend)
    const { error: emailError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      data: {
        temporary_password: tempPassword,
        message: "You requested a password reset. Here is your temporary password. Please log in and change it immediately."
      },
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Temporary password sent to your email. Please check your inbox and spam folder." 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process password reset" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
