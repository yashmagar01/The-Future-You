// Supabase Edge Function: send-email
// Handles all email sending via SendGrid

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@yash.com";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://yash.com";

function generateConfirmationEmailHTML(confirmUrl: string, name?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0; }
        .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
        .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-radius: 0 0 10px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
      </style>
    </head>
    <body>
      <div class="header"><h1>✨ Confirm Your Spot</h1></div>
      <div class="content">
        ${name ? `<p>Hi ${name},</p>` : '<p>Hi there,</p>'}
        <p>Thanks for joining the <strong>Yash: The Future You</strong> waitlist!</p>
        <p><strong>Please confirm your email address:</strong></p>
        <div style="text-align: center;"><a href="${confirmUrl}" class="button">Confirm My Email</a></div>
        <p>We're launching in April 2025. We'll email you when it's your turn for early access.</p>
        <p>Best regards,<br><strong>The Yash Team</strong></p>
      </div>
      <div class="footer">
        <p>This link expires in 7 days.</p>
        <p style="word-break: break-all; color: #667eea;">${confirmUrl}</p>
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 10px 10px 0 0; }
        .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
        .button { display: inline-block; padding: 16px 40px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-radius: 0 0 10px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
      </style>
    </head>
    <body>
      <div class="header"><h1>🎉 You're In!</h1><p style="font-size: 18px;">Welcome to Yash Early Access</p></div>
      <div class="content">
        ${name ? `<p>Hi ${name},</p>` : '<p>Hi there,</p>'}
        <p><strong>Great news!</strong> You've been selected for Yash early access.</p>
        <div style="text-align: center;"><a href="${inviteUrl}" class="button">Get Started Now →</a></div>
        <p>As an early tester, you get free access during beta, priority support, and special perks!</p>
        <p>Cheers,<br><strong>The Yash Team</strong></p>
      </div>
      <div class="footer">
        <p><strong>Need help?</strong> Email us at support@yash.com</p>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
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
    if (!SENDGRID_API_KEY) {
      throw new Error("SendGrid API key not configured");
    }

    const { type, to, name, confirmToken } = await req.json();

    let subject = "";
    let html = "";

    if (type === "confirmation") {
      const confirmUrl = `${APP_BASE_URL}/waitlist/confirm?token=${confirmToken}`;
      subject = "Confirm your spot on the Yash waitlist";
      html = generateConfirmationEmailHTML(confirmUrl, name);
    } else if (type === "promotion") {
      const inviteUrl = `${APP_BASE_URL}/signup?invite=true`;
      subject = "🎉 You're in! Welcome to Yash Early Access";
      html = generatePromotionEmailHTML(inviteUrl, name);
    } else {
      throw new Error("Invalid email type");
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], subject }],
        from: { email: FROM_EMAIL, name: "Yash - The Future You" },
        content: [{ type: "text/html", value: html }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid error:", errorText);
      throw new Error("Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
