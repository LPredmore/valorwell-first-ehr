
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log("Webhook payload:", payload);

    // Only process if it's an insert to profiles table and role is client
    if (payload.table === "profiles" && payload.type === "INSERT" && payload.record.role === "client") {
      const { email, first_name, last_name, temp_password } = payload.record;
      const name = first_name || "";
      
      console.log(`Sending welcome email to ${email}`);
      
      // Frontend URL with login path
      const loginUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173/login";

      // Send the welcome email
      const { data, error } = await resend.emails.send({
        from: "TheraPal <onboarding@resend.dev>",
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
            <p>Please use these credentials to <a href="${loginUrl}" style="color: #4a6cf7; text-decoration: none; font-weight: bold;">log in to your account</a>.</p>
            <p>For security reasons, we recommend changing your password after your first login.</p>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,</p>
            <p>The TheraPal Team</p>
          </div>
        `,
      });

      if (error) {
        console.error("Error sending email:", error);
        throw error;
      }

      console.log("Email sent successfully:", data);
      
      return new Response(
        JSON.stringify({ success: true, message: "Welcome email sent" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // If not a relevant event, just return success
    return new Response(
      JSON.stringify({ success: true, message: "Event ignored" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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
