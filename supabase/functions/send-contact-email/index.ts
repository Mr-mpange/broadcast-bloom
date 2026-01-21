import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-contact-email function invoked");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactRequest = await req.json();
    
    console.log("Received contact form submission:", { name, email, subject });

    // Check if RESEND_API_KEY is configured
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping email sending");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured",
          error: "RESEND_API_KEY not set"
        }),
        {
          status: 200, // Return 200 so the frontend doesn't treat it as a failure
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailPromises = [];

    // Send notification email to station
    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Radio Station <onboarding@resend.dev>",
          to: ["hello@radiostation.fm"],
          subject: `New Contact Form: ${subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br />")}</p>
          `,
        }),
      })
    );

    // Send confirmation email to sender
    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Radio Station <onboarding@resend.dev>",
          to: [email],
          subject: "We received your message!",
          html: `
            <h1>Thank you for contacting us, ${name}!</h1>
            <p>We have received your message regarding: <strong>${subject}</strong></p>
            <p>Our team will review your inquiry and get back to you as soon as possible.</p>
            <hr />
            <p><strong>Your message:</strong></p>
            <p>${message.replace(/\n/g, "<br />")}</p>
            <hr />
            <p>Best regards,<br />The Radio Station Team</p>
          `,
        }),
      })
    );

    // Wait for both emails to complete
    const results = await Promise.allSettled(emailPromises);
    
    let successCount = 0;
    const errors = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        const response = result.value;
        if (response.ok) {
          successCount++;
          console.log(`Email ${i + 1} sent successfully:`, response.status);
        } else {
          const errorText = await response.text();
          console.error(`Email ${i + 1} failed:`, response.status, errorText);
          errors.push(`Email ${i + 1}: ${response.status} ${errorText}`);
        }
      } else {
        console.error(`Email ${i + 1} promise rejected:`, result.reason);
        errors.push(`Email ${i + 1}: ${result.reason}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: successCount > 0, 
        message: `${successCount} of ${emailPromises.length} emails sent successfully`,
        successCount,
        totalEmails: emailPromises.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: "Failed to send emails"
      }),
      {
        status: 200, // Return 200 so frontend doesn't treat as failure
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
