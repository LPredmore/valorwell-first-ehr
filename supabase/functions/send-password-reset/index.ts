
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@1.0.0";

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

    // Parse request body
    const { email, resetUrl } = await req.json();

    // Validate input
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the user exists
    const { data: userExists, error: userExistsError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (userExistsError || !userExists) {
      // Don't reveal if the user exists or not for security reasons
      return new Response(
        JSON.stringify({ success: true, message: "If your email is registered, you will receive a password reset link" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

    // Generate a secure password reset token using Supabase's built-in functionality
    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: resetUrl,
      }
    });

    if (error) {
      console.error("Error generating reset link:", error);
      throw error;
    }

    const resetLink = data.properties.action_link;

    // Send the reset email
    const emailResponse = await resend.emails.send({
      from: "noreply@valorwell.org", // Update with your verified domain
      to: email,
      subject: "Reset Your Password - ValorWell EHR",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your ValorWell EHR account. To reset your password, please click the link below:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
          </p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The ValorWell Team</p>
        </div>
      `,
    });

    console.log("Password reset email sent:", emailResponse);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "If your email is registered, you will receive a password reset link"
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
