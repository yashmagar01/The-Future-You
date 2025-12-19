// Supabase Edge Function: send-email
// Handles all email sending via Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@thefutureyou.app";
const FROM_NAME = Deno.env.get("FROM_NAME") || "The Future You";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://the-future-you.vercel.app";

function generateConfirmationEmailHTML(confirmUrl: string, name?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px; background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 50%, #0284c7 100%); color: white; border-radius: 16px 16px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
        .button { display: inline-block; padding: 16px 40px; background: #0d9488; color: white; text-decoration: none; border-radius: 50px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #0f766e; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-radius: 0 0 16px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
        .urgency { background: #fef3c7; border: 1px solid #fcd34d; padding: 12px 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚀 Confirm Your Spot</h1>
      </div>
      <div class="content">
        ${name ? `<p>Hey ${name},</p>` : '<p>Hey there,</p>'}
        <p>Thanks for joining <strong>The Future You</strong> beta waitlist! You're one step away from becoming an early tester.</p>
        
        <div class="urgency">
          🔥 <strong>Beta signups close Dec 22nd</strong> — Limited spots available!
        </div>
        
        <p>Click below to confirm your email and secure your spot:</p>
        <div style="text-align: center;"><a href="${confirmUrl}" class="button">✅ Confirm My Spot</a></div>
        
        <p style="margin-top: 30px;">Once confirmed, you'll be eligible for early access invites as we roll out to testers in batches.</p>
        <p>— The Future You Team</p>
      </div>
      <div class="footer">
        <p style="color: #9ca3af; font-size: 12px;">This link expires in 7 days</p>
      </div>
    </body>
    </html>
  `;
}

function generatePromotionEmailHTML(inviteUrl: string, name?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 16px 16px 0 0; }
        .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
        .button { display: inline-block; padding: 16px 40px; background: #10b981; color: white; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 18px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-radius: 0 0 16px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
      </style>
    </head>
    <body>
      <div class="header"><h1>🎉 You're Invited!</h1></div>
      <div class="content">
        ${name ? `<p>Congrats ${name},</p>` : '<p>Congrats,</p>'}
        <p>You've been selected for <strong>early beta access</strong> to The Future You — your personal AI Expert Mentor!</p>
        <p>Click here to create your account and start practicing:</p>
        <div style="text-align: center;"><a href="${inviteUrl}" class="button">🚀 Get Started</a></div>
        <p>Thanks for helping us build this.</p>
        <p>— The Future You Team</p>
      </div>
      <div class="footer">
        <p style="color: #9ca3af; font-size: 12px;">Questions? Just reply to this email</p>
      </div>
    </body>
    </html>
  `;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured in Supabase secrets");
      throw new Error("Email service not configured. Please set RESEND_API_KEY in Supabase secrets.");
    }

    const { type, to, name, confirmToken } = await req.json();

    if (!to) {
      throw new Error("Recipient email (to) is required");
    }

    let subject = "";
    let html = "";

    if (type === "confirmation") {
      const confirmUrl = `${APP_BASE_URL}/waitlist/confirm?token=${confirmToken}`;
      subject = "🚀 Confirm your spot on The Future You beta waitlist";
      html = generateConfirmationEmailHTML(confirmUrl, name);
    } else if (type === "promotion") {
      const inviteUrl = `${APP_BASE_URL}/signup?invite=true`;
      subject = "🎉 You're invited: Beta Access to The Future You";
      html = generatePromotionEmailHTML(inviteUrl, name);
    } else {
      throw new Error("Invalid email type. Use 'confirmation' or 'promotion'.");
    }

    console.log(`Sending ${type} email to ${to} via Resend...`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", responseData);
      throw new Error(responseData.message || "Failed to send email via Resend");
    }

    console.log("Email sent successfully:", responseData);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", id: responseData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: (error as any).message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

