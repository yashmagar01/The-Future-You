// Supabase Edge Function: send-notifications
// Fallback worker to send pending email notifications
// Triggered by: Supabase Cron (every 15 minutes) or HTTP POST
// Use case: Sends emails for any completed recordings where notified = false

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") ?? "https://yash.com";
const MAX_NOTIFICATIONS_PER_RUN = 20;

interface Recording {
  id: string;
  user_id: string;
  title: string;
  status: string;
  notified: boolean;
  user_email?: string;
  user_name?: string;
  overall_score?: number;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Fetch completed recordings that haven't been notified
 */
async function fetchUnnotifiedRecordings(): Promise<Recording[]> {
  const { data, error } = await supabase
    .from("recordings")
    .select(`
      id,
      user_id,
      title,
      status,
      notified,
      feedback (
        overall_score
      )
    `)
    .eq("status", "completed")
    .eq("notified", false)
    .order("updated_at", { ascending: true })
    .limit(MAX_NOTIFICATIONS_PER_RUN);

  if (error) {
    console.error("Error fetching unnotified recordings:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Fetch user details for each recording
  const recordingsWithUsers: Recording[] = [];
  
  for (const recording of data) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      recording.user_id
    );

    if (userError || !userData?.user?.email) {
      console.error(`Failed to fetch user ${recording.user_id}:`, userError);
      continue;
    }

    recordingsWithUsers.push({
      id: recording.id,
      user_id: recording.user_id,
      title: recording.title,
      status: recording.status,
      notified: recording.notified,
      user_email: userData.user.email,
      user_name: 
        userData.user.user_metadata?.full_name || 
        userData.user.user_metadata?.name ||
        userData.user.email.split("@")[0],
      overall_score: recording.feedback?.[0]?.overall_score || 0,
    });
  }

  return recordingsWithUsers;
}

/**
 * Send completion email via send-email Edge Function
 */
async function sendCompletionEmail(recording: Recording): Promise<boolean> {
  try {
    const videoUrl = `${APP_BASE_URL}/dashboard/recordings/${recording.id}`;
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "completion",
        to: recording.user_email,
        name: recording.user_name,
        videoTitle: recording.title,
        videoUrl: videoUrl,
        overallScore: recording.overall_score,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send email for ${recording.id}:`, errorText);
      return false;
    }

    console.log(`✓ Email sent for recording ${recording.id} to ${recording.user_email}`);
    return true;
    
  } catch (error) {
    console.error(`Error sending email for ${recording.id}:`, error);
    return false;
  }
}

/**
 * Mark recording as notified
 */
async function markAsNotified(recordingId: string): Promise<void> {
  const { error } = await supabase
    .from("recordings")
    .update({ 
      notified: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", recordingId);

  if (error) {
    console.error(`Error marking ${recordingId} as notified:`, error);
  }
}

/**
 * Main notification worker
 */
async function runNotificationWorker(): Promise<{ sent: number; failed: number }> {
  console.log("\n========================================");
  console.log("Notification Worker Started");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("========================================\n");

  const recordings = await fetchUnnotifiedRecordings();

  if (recordings.length === 0) {
    console.log("No pending notifications to send");
    return { sent: 0, failed: 0 };
  }

  console.log(`Found ${recordings.length} recording(s) to notify`);

  let sent = 0;
  let failed = 0;

  for (const recording of recordings) {
    console.log(`\nProcessing: ${recording.title} (${recording.id})`);
    console.log(`User: ${recording.user_email}`);
    console.log(`Score: ${recording.overall_score}/100`);

    const emailSent = await sendCompletionEmail(recording);

    if (emailSent) {
      await markAsNotified(recording.id);
      sent++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n========================================");
  console.log("Notification Worker Completed");
  console.log(`Sent: ${sent}, Failed: ${failed}`);
  console.log("========================================\n");

  return { sent, failed };
}

/**
 * HTTP Handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authorization (optional: add a secret key check)
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Run the notification worker
    const result = await runNotificationWorker();

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Notification worker error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
