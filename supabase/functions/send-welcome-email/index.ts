
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

// Add more detailed debugging
console.log("Loading send-welcome-email function");

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    temp_password: string;
    role: string;
  };
  schema: string;
  old_record: null | any;
}

serve(async (req) => {
  // Log request information
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    console.log(`Method not allowed: ${req.method}`);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check for test mode
  const url = new URL(req.url);
  const isTestMode = url.searchParams.get("test") === "true";
  
  if (isTestMode) {
    console.log("Running in test mode");
    try {
      // Get the Resend API key
      const apiKey = Deno.env.get("RESEND_API_KEY");
      if (!apiKey) {
        console.error("ERROR: RESEND_API_KEY is not set in environment variables");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "RESEND_API_KEY is not set. Please configure this secret in the Supabase dashboard." 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      console.log("Resend API key is configured for test");
      
      // Initialize Resend
      const resend = new Resend(apiKey);
      
      // Send a test email
      const testEmail = url.searchParams.get("email") || "test@example.com";
      console.log(`Sending test email to ${testEmail}`);
      
      const { data, error } = await resend.emails.send({
        from: "TheraPal <noreply@updates.valorwell.org>",
        to: testEmail,
        subject: "TheraPal Email Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #4a6cf7;">TheraPal Email Test</h2>
            <p>This is a test email from TheraPal to verify the email system is working correctly.</p>
            <p>If you received this email, the system is configured properly.</p>
            <p>Test time: ${new Date().toISOString()}</p>
          </div>
        `,
      });
      
      if (error) {
        console.error("Error from Resend API during test:", error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error.message || "Failed to send test email" 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
      
      console.log("Test email sent successfully:", data);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Test email sent successfully", 
          data 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (testError) {
      console.error("Error in test mode:", testError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: testError.message || "An error occurred during testing" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  }

  try {
    console.log("Processing webhook request");
    
    // Validate Resend API key before doing anything else
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("ERROR: RESEND_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RESEND_API_KEY is not set. Please configure this secret in the Supabase dashboard." 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    console.log("Resend API key is configured");
    
    // Parse payload
    let payload: WebhookPayload;
    try {
      payload = await req.json();
      console.log("Webhook payload received:", JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error("Failed to parse request JSON:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON payload" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate payload structure
    if (!payload.record || !payload.table || !payload.type) {
      console.error("Invalid webhook payload structure:", payload);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid webhook payload structure" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Process any profile insert regardless of role (removing role=client check)
    if (payload.table === "profiles" && payload.type === "INSERT") {
      const { email, first_name, last_name, temp_password } = payload.record;
      const name = first_name || "";
      
      console.log(`Preparing to send welcome email to ${email} with role ${payload.record.role}`);
      
      // Initialize Resend with API key
      const resend = new Resend(apiKey);
      
      // Frontend URL with login path
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://valorwell.org/login";
      console.log(`Using login URL: ${frontendUrl}`);

      // Send the welcome email
      console.log("Sending welcome email...");
      try {
        const { data, error } = await resend.emails.send({
          from: "TheraPal <noreply@updates.valorwell.org>",
          to: email,
          subject: "Welcome to TheraPal - Your Account Information",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #4a6cf7;">Welcome to TheraPal!</h2>
              <p>Dear ${first_name} ${last_name},</p>
              <p>Thank you for choosing TheraPal for your therapy journey. We're excited to have you join our community!</p>
              <p>Your account has been successfully created. Here are your login details:</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${temp_password}</p>
              </div>
              <p>Please use these credentials to <a href="${frontendUrl}" style="color: #4a6cf7; text-decoration: none; font-weight: bold;">log in to your account</a>.</p>
              <p>For security reasons, we recommend changing your password after your first login.</p>
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              <p>Best regards,</p>
              <p>The TheraPal Team</p>
            </div>
          `,
        });

        if (error) {
          console.error("Error from Resend API:", error);
          throw error;
        }

        console.log("Email sent successfully:", data);
        
        return new Response(
          JSON.stringify({ success: true, message: "Welcome email sent", data }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (emailError) {
        console.error("Error sending email with Resend:", emailError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Failed to send welcome email", 
            error: emailError.message || "Unknown error with email service" 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    } else {
      console.log("Event ignored: Not a client insert to profiles table");
      // If not a relevant event, just return success
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Error in webhook handler:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
