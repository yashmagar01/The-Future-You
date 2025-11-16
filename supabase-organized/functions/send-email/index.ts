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
      <div class="header"><h1>Confirm Your Spot</h1></div>
      <div class="content">
        ${name ? `<p>Hey ${name},</p>` : '<p>Hey there,</p>'}
        <p>Click below to confirm your waitlist spot for Yash — The Future You. After you confirm, you'll be eligible for early access and testing invites.</p>
        <div style="text-align: center;"><a href="${confirmUrl}" class="button">Confirm My Spot</a></div>
        <p>— Yash</p>
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 10px 10px 0 0; }
        .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
        .button { display: inline-block; padding: 16px 40px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-radius: 0 0 10px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
      </style>
    </head>
    <body>
      <div class="header"><h1>You're Invited</h1></div>
      <div class="content">
        ${name ? `<p>Congrats ${name},</p>` : '<p>Congrats,</p>'}
        <p>You've been selected for early access to Yash. Click here to get started:</p>
        <div style="text-align: center;"><a href="${inviteUrl}" class="button">Login</a></div>
        <p>Thanks for helping us build this.</p>
      </div>
      <div class="footer">
        <p style="color: #9ca3af; font-size: 12px;">Questions? Reply to this email</p>
      </div>
    </body>
    </html>
  `;
}

function generateVideoCompletionEmailHTML(
  videoUrl: string, 
  videoTitle: string,
  overallScore: number,
  name?: string
): string {
  const scoreColor = overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0; }
        .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
        .score-badge { display: inline-block; padding: 20px 30px; background: ${scoreColor}; color: white; border-radius: 10px; font-size: 32px; font-weight: bold; margin: 20px 0; }
        .button { display: inline-block; padding: 16px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-radius: 0 0 10px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
        .video-title { font-size: 18px; font-weight: 600; color: #1f2937; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Your Video is Ready!</h1>
      </div>
      <div class="content">
        ${name ? `<p>Hey ${name},</p>` : '<p>Hey there,</p>'}
        <p>Great news! Your video analysis is complete.</p>
        
        <div class="video-title">"${videoTitle}"</div>
        
        <div style="text-align: center;">
          <div class="score-badge">${overallScore}/100</div>
        </div>
        
        <p>We've analyzed your body language, vocal delivery, content structure, and engagement. Click below to see your detailed feedback and insights:</p>
        
        <div style="text-align: center;">
          <a href="${videoUrl}" class="button">View Full Analysis</a>
        </div>
        
        <p style="margin-top: 30px;">Keep practicing and watch your scores improve!</p>
        <p>— The Yash Team</p>
      </div>
      <div class="footer">
        <p style="color: #9ca3af; font-size: 12px;">You're receiving this because you uploaded a video for analysis</p>
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

    const { type, to, name, confirmToken, videoTitle, videoUrl, overallScore } = await req.json();

    let subject = "";
    let html = "";

    if (type === "confirmation") {
      const confirmUrl = `${APP_BASE_URL}/waitlist/confirm?token=${confirmToken}`;
      subject = "Confirm your waitlist spot for Yash — The Future You";
      html = generateConfirmationEmailHTML(confirmUrl, name);
    } else if (type === "promotion") {
      const inviteUrl = `${APP_BASE_URL}/signup?invite=true`;
      subject = "You're invited: Early Tester Access to Yash";
      html = generatePromotionEmailHTML(inviteUrl, name);
    } else if (type === "completion") {
      if (!videoUrl || !videoTitle || overallScore === undefined) {
        throw new Error("Missing required fields for completion email");
      }
      subject = `🎉 Your video "${videoTitle}" is ready! Score: ${overallScore}/100`;
      html = generateVideoCompletionEmailHTML(videoUrl, videoTitle, overallScore, name);
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
        from: { email: FROM_EMAIL, name: "Yash" },
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
