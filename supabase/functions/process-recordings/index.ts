// Supabase Edge Function: process-recordings
// Background worker that processes video recordings in priority order
// Triggered by: Supabase Cron (every 5 minutes) or HTTP POST

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const MAX_CONCURRENT_JOBS = 3; // Process up to 3 videos per run
const PROCESSING_TIMEOUT_MINUTES = 30; // Reset stuck jobs after 30 min

interface Recording {
  id: string;
  user_id: string;
  video_url: string;
  title: string;
  priority: "high" | "low";
  status: "pending" | "processing" | "completed" | "failed";
}

interface AnalysisResult {
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  specific_feedback: {
    body_language: { score: number; notes: string };
    vocal_delivery: { score: number; notes: string };
    content_structure: { score: number; notes: string };
    engagement: { score: number; notes: string };
  };
  transcript?: string;
  duration_seconds?: number;
}

// Initialize Supabase client with service role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Fetch pending recordings ordered by priority
 */
async function fetchPendingRecordings(limit: number): Promise<Recording[]> {
  const { data, error } = await supabase
    .from("recordings")
    .select("id, user_id, video_url, title, priority, status")
    .in("status", ["pending", "processing"])
    .order("priority", { ascending: false }) // high priority first
    .order("created_at", { ascending: true }) // oldest first
    .limit(limit);

  if (error) {
    console.error("Error fetching recordings:", error);
    return [];
  }

  return data || [];
}

/**
 * Reset stuck processing jobs (processing for > 30 minutes)
 */
async function resetStuckJobs(): Promise<void> {
  const timeoutDate = new Date();
  timeoutDate.setMinutes(timeoutDate.getMinutes() - PROCESSING_TIMEOUT_MINUTES);

  const { error } = await supabase
    .from("recordings")
    .update({ 
      status: "pending",
      updated_at: new Date().toISOString()
    })
    .eq("status", "processing")
    .lt("updated_at", timeoutDate.toISOString());

  if (error) {
    console.error("Error resetting stuck jobs:", error);
  } else {
    console.log("Reset stuck processing jobs");
  }
}

/**
 * Mark recording as processing
 */
async function markAsProcessing(recordingId: string): Promise<boolean> {
  const { error } = await supabase
    .from("recordings")
    .update({ 
      status: "processing",
      updated_at: new Date().toISOString()
    })
    .eq("id", recordingId)
    .eq("status", "pending"); // Only update if still pending (avoid race conditions)

  return !error;
}

/**
 * Download video from storage
 */
async function downloadVideo(videoUrl: string): Promise<Blob> {
  console.log(`Downloading video from: ${videoUrl}`);
  
  // Extract storage path from URL
  const urlObj = new URL(videoUrl);
  const pathMatch = videoUrl.match(/\/storage\/v1\/object\/public\/(.+)/);
  
  if (!pathMatch) {
    throw new Error("Invalid video URL format");
  }
  
  const storagePath = pathMatch[1];
  const [bucket, ...pathParts] = storagePath.split("/");
  const filePath = pathParts.join("/");

  // Download from Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (error || !data) {
    throw new Error(`Failed to download video: ${error?.message}`);
  }

  return data;
}

/**
 * Run AI analysis on video
 * This is a placeholder - integrate with your actual AI pipeline
 */
async function analyzeVideo(videoBlob: Blob, recordingId: string): Promise<AnalysisResult> {
  console.log(`Analyzing video (${videoBlob.size} bytes)`);

  // TODO: Replace with actual AI analysis pipeline
  // Options:
  // 1. OpenAI GPT-4 Vision API
  // 2. Azure Video Indexer
  // 3. Google Cloud Video Intelligence
  // 4. Custom ML model endpoint

  // Example: Call OpenAI API for analysis
  // For now, return mock data
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock analysis result
  const mockResult: AnalysisResult = {
    overall_score: Math.floor(Math.random() * 30) + 70, // 70-100
    strengths: [
      "Clear articulation and confident voice projection",
      "Good eye contact and engaging body language",
      "Well-structured content with logical flow"
    ],
    areas_for_improvement: [
      "Reduce filler words ('um', 'uh') for smoother delivery",
      "Vary vocal tone to emphasize key points",
      "Add more pauses for audience comprehension"
    ],
    specific_feedback: {
      body_language: {
        score: 85,
        notes: "Excellent posture and hand gestures. Consider moving more naturally to appear less rigid."
      },
      vocal_delivery: {
        score: 78,
        notes: "Clear pronunciation with good pace. Work on varying pitch for more engaging delivery."
      },
      content_structure: {
        score: 90,
        notes: "Well-organized with clear introduction, body, and conclusion. Strong opening hook."
      },
      engagement: {
        score: 82,
        notes: "Good audience connection through eye contact. Add more interactive elements or questions."
      }
    },
    transcript: "This is a mock transcript of the video content...",
    duration_seconds: 120
  };

  return mockResult;
}

/**
 * Save analysis results to database
 */
async function saveResults(
  recordingId: string, 
  userId: string,
  analysis: AnalysisResult
): Promise<void> {
  // 1. Insert feedback record
  const { data: feedback, error: feedbackError } = await supabase
    .from("feedback")
    .insert({
      recording_id: recordingId,
      overall_score: analysis.overall_score,
      strengths: analysis.strengths,
      areas_for_improvement: analysis.areas_for_improvement,
      specific_feedback: analysis.specific_feedback
    })
    .select()
    .single();

  if (feedbackError) {
    throw new Error(`Failed to save feedback: ${feedbackError.message}`);
  }

  // 2. Update recording with completion status
  const { error: updateError } = await supabase
    .from("recordings")
    .update({
      status: "completed",
      result_url: feedback?.id || null,
      notified: false, // Ready for notification
      updated_at: new Date().toISOString(),
      duration_seconds: analysis.duration_seconds || null
    })
    .eq("id", recordingId);

  if (updateError) {
    throw new Error(`Failed to update recording: ${updateError.message}`);
  }

  console.log(`✓ Saved results for recording ${recordingId}`);
}

/**
 * Mark recording as failed
 */
async function markAsFailed(recordingId: string, errorMessage: string): Promise<void> {
  await supabase
    .from("recordings")
    .update({
      status: "failed",
      updated_at: new Date().toISOString()
    })
    .eq("id", recordingId);

  console.error(`✗ Recording ${recordingId} failed: ${errorMessage}`);
}

/**
 * Process a single recording
 */
async function processRecording(recording: Recording): Promise<void> {
  console.log(`\n[${recording.priority.toUpperCase()}] Processing: ${recording.title} (${recording.id})`);

  try {
    // 1. Mark as processing
    const marked = await markAsProcessing(recording.id);
    if (!marked) {
      console.log("Recording already being processed by another worker");
      return;
    }

    // 2. Download video
    const videoBlob = await downloadVideo(recording.video_url);

    // 3. Run AI analysis
    const analysis = await analyzeVideo(videoBlob, recording.id);

    // 4. Save results
    await saveResults(recording.id, recording.user_id, analysis);

    console.log(`✓ Successfully processed recording ${recording.id}`);
  } catch (error) {
    console.error(`Error processing recording ${recording.id}:`, error);
    await markAsFailed(recording.id, error.message);
  }
}

/**
 * Main worker function
 */
async function runWorker(): Promise<{ processed: number; failed: number }> {
  console.log("\n========================================");
  console.log("Recording Processing Worker Started");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("========================================\n");

  // Reset any stuck jobs first
  await resetStuckJobs();

  // Fetch pending recordings
  const recordings = await fetchPendingRecordings(MAX_CONCURRENT_JOBS);
  
  if (recordings.length === 0) {
    console.log("No pending recordings to process");
    return { processed: 0, failed: 0 };
  }

  console.log(`Found ${recordings.length} recording(s) to process`);
  console.log(`Priority breakdown: ${recordings.filter(r => r.priority === "high").length} high, ${recordings.filter(r => r.priority === "low").length} low`);

  // Process recordings sequentially (to avoid overwhelming the system)
  // For parallel processing, use Promise.all() instead
  let processed = 0;
  let failed = 0;

  for (const recording of recordings) {
    await processRecording(recording);
    const status = recording.status === "completed" ? "processed" : "failed";
    if (status === "processed") processed++;
    else failed++;
  }

  console.log("\n========================================");
  console.log("Worker Completed");
  console.log(`Processed: ${processed}, Failed: ${failed}`);
  console.log("========================================\n");

  return { processed, failed };
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

    // Run the worker
    const result = await runWorker();

    return new Response(
      JSON.stringify({ 
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Worker error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
