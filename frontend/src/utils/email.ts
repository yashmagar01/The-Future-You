/**
 * Email Utility Functions
 * Handles sending emails via SendGrid or SMTP
 */

import { logEvent } from "./analytics";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || "noreply@yash.com";
const APP_NAME = "Yash - The Future You";

/**
 * Send an email using SendGrid API
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.error("SendGrid API key not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject,
          },
        ],
        from: {
          email: FROM_EMAIL,
          name: APP_NAME,
        },
        content: [
          {
            type: "text/html",
            value: options.html,
          },
          ...(options.text
            ? [{ type: "text/plain", value: options.text }]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid API error:", errorText);
      return false;
    }

    logEvent("email_sent", {
      to: options.to,
      subject: options.subject,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
};

/**
 * Generate confirmation email HTML
 */
export const generateConfirmationEmail = (confirmUrl: string, name?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 30px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px 10px 0 0;
        }
        .content {
          padding: 40px 30px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 14px;
          border-radius: 0 0 10px 10px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .highlight {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✨ Confirm Your Spot on the Waitlist</h1>
      </div>
      <div class="content">
        ${name ? `<p>Hi ${name},</p>` : '<p>Hi there,</p>'}
        
        <p>Thanks for joining the <strong>Yash: The Future You</strong> waitlist! You're one step away from getting early access to our AI-powered communication coach.</p>
        
        <p><strong>Please confirm your email address by clicking the button below:</strong></p>
        
        <div style="text-align: center;">
          <a href="${confirmUrl}" class="button">Confirm My Email</a>
        </div>
        
        <div class="highlight">
          <p style="margin: 0;"><strong>What happens next?</strong></p>
          <ol style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Click the confirmation button above</li>
            <li>You'll be added to our priority list</li>
            <li>We'll email you when it's your turn for early access</li>
          </ol>
        </div>
        
        <p>We're launching in small batches starting early 2025, with the public MVP launch on <strong>April 19, 2025</strong>.</p>
        
        <p>If you didn't sign up for the Yash waitlist, you can safely ignore this email.</p>
        
        <p>Excited to have you on board! 🚀</p>
        
        <p>
          Best regards,<br>
          <strong>The Yash Team</strong>
        </p>
      </div>
      <div class="footer">
        <p>This link will expire in 7 days.</p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea;">${confirmUrl}</p>
        <p style="margin-top: 20px;">
          <a href="https://thefutureyou.app" style="color: #667eea; text-decoration: none;">Visit Website</a> |
          <a href="https://thefutureyou.app/privacy-policy" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate promotion email HTML
 */
export const generatePromotionEmail = (inviteUrl: string, name?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 10px 10px 0 0;
        }
        .content {
          padding: 40px 30px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .button {
          display: inline-block;
          padding: 16px 40px;
          background: #10b981;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 18px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 14px;
          border-radius: 0 0 10px 10px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin: 10px 0;
        }
        .features {
          background: #f0fdf4;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 You're In!</h1>
        <p style="font-size: 18px; margin: 10px 0 0 0;">Welcome to Yash Early Access</p>
      </div>
      <div class="content">
        ${name ? `<p>Hi ${name},</p>` : '<p>Hi there,</p>'}
        
        <p><strong>Great news!</strong> You've been selected from the waitlist to join Yash as an early tester.</p>
        
        <div style="text-align: center;">
          <span class="badge">🌟 EARLY ACCESS TESTER</span>
        </div>
        
        <p>You now have full access to Yash — the AI-powered communication coach that helps you master public speaking, interviews, and everyday conversations through daily video practice.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" class="button">Get Started Now →</a>
        </div>
        
        <div class="features">
          <p style="margin: 0 0 10px 0; font-weight: 600;">As an early tester, you get:</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Free access</strong> during the beta period</li>
            <li><strong>Priority support</strong> from our team</li>
            <li><strong>Direct influence</strong> on product development</li>
            <li><strong>Special perks</strong> when we launch publicly</li>
            <li><strong>Early access</strong> to new features</li>
          </ul>
        </div>
        
        <p><strong>Next steps:</strong></p>
        <ol>
          <li>Click the "Get Started" button above</li>
          <li>Complete your profile setup</li>
          <li>Record your first practice video</li>
          <li>Get instant AI feedback and insights</li>
        </ol>
        
        <p>We'd love to hear your feedback as you use Yash. Reply to this email anytime with questions, suggestions, or just to say hi!</p>
        
        <p>Looking forward to seeing your progress! 💪</p>
        
        <p>
          Cheers,<br>
          <strong>The Yash Team</strong>
        </p>
      </div>
      <div class="footer">
        <p><strong>Need help?</strong> Email us at support@yash.com</p>
        <p style="margin-top: 20px;">
          <a href="https://thefutureyou.app/dashboard" style="color: #10b981; text-decoration: none;">Go to Dashboard</a> |
          <a href="https://thefutureyou.app/privacy-policy" style="color: #10b981; text-decoration: none;">Privacy Policy</a>
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send waitlist confirmation email
 */
export const sendConfirmationEmail = async (
  email: string,
  confirmToken: string,
  name?: string
): Promise<boolean> => {
  const confirmUrl = `${import.meta.env.VITE_APP_BASE_URL || window.location.origin}/waitlist/confirm?token=${confirmToken}`;
  
  return sendEmail({
    to: email,
    subject: "Confirm your spot on the Yash waitlist",
    html: generateConfirmationEmail(confirmUrl, name),
    text: `Hi ${name || 'there'},\n\nThanks for joining the Yash waitlist! Please confirm your email by visiting:\n\n${confirmUrl}\n\nThis link will expire in 7 days.\n\nBest regards,\nThe Yash Team`,
  });
};

/**
 * Send promotion/invite email
 */
export const sendPromotionEmail = async (
  email: string,
  name?: string
): Promise<boolean> => {
  const inviteUrl = `${import.meta.env.VITE_APP_BASE_URL || window.location.origin}/signup?invite=true`;
  
  return sendEmail({
    to: email,
    subject: "🎉 You're in! Welcome to Yash Early Access",
    html: generatePromotionEmail(inviteUrl, name),
    text: `Hi ${name || 'there'},\n\nGreat news! You've been selected for Yash early access.\n\nGet started here: ${inviteUrl}\n\nAs an early tester, you get free access during beta, priority support, and special perks!\n\nCheers,\nThe Yash Team`,
  });
};
