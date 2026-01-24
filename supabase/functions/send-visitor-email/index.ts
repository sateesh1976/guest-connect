import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Visitor {
  full_name: string;
  email: string;
  company_name: string;
  host_name: string;
  host_email?: string;
  purpose: string;
  badge_id: string;
  check_in_time: string;
}

interface EmailRequest {
  visitor: Visitor;
  eventType: 'checkin' | 'checkout';
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Visitor Management <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-visitor-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { visitor, eventType }: EmailRequest = await req.json();
    console.log(`Processing ${eventType} email for visitor:`, visitor.full_name);

    if (!visitor.email) {
      console.log("No visitor email provided, skipping visitor notification");
    }

    const results: { type: string; success: boolean; error?: string }[] = [];

    // Send confirmation email to visitor
    if (visitor.email && eventType === 'checkin') {
      const checkInDate = new Date(visitor.check_in_time);
      const formattedDate = checkInDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = checkInDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const visitorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #0d9488 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Welcome!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your check-in has been confirmed</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1e40af; margin-top: 0;">Hello, ${visitor.full_name}!</h2>
            <p>Thank you for visiting us. Here are your check-in details:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Badge ID</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right;">${visitor.badge_id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Date</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Check-in Time</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Host</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${visitor.host_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">Purpose</td>
                  <td style="padding: 10px 0; text-align: right;">${visitor.purpose}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Please keep this email for your records. Don't forget to check out when you leave.</p>
          </div>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">Visitor Management System</p>
          </div>
        </body>
        </html>
      `;

      const result = await sendEmail(
        visitor.email,
        `Welcome! Your check-in confirmation - ${visitor.badge_id}`,
        visitorHtml
      );
      results.push({ type: 'visitor_confirmation', ...result });
    }

    // Send notification email to host
    if (visitor.host_email && eventType === 'checkin') {
      const checkInDate = new Date(visitor.check_in_time);
      const formattedTime = checkInDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const hostHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Visitor Arrived</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #059669; margin-top: 0;">Hello, ${visitor.host_name}!</h2>
            <p>Your visitor has checked in and is waiting for you.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Visitor Name</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right;">${visitor.full_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Company</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${visitor.company_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Arrival Time</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">Purpose</td>
                  <td style="padding: 10px 0; text-align: right;">${visitor.purpose}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Please greet your visitor at the reception area.</p>
          </div>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">Visitor Management System</p>
          </div>
        </body>
        </html>
      `;

      const result = await sendEmail(
        visitor.host_email,
        `Your visitor ${visitor.full_name} has arrived`,
        hostHtml
      );
      results.push({ type: 'host_notification', ...result });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in send-visitor-email function:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
