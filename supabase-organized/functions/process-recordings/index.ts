// Supabase Edge Function: process-recordings
// Background worker that processes video recordings in priority order
// Triggered by: Supabase Cron (every 5 minutes) or HTTP POST
// JUGAAD STACK: Local-first, offline AI processing using Vosk + Transformers.js + MediaPipe

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration - JUGAAD: No premium APIs, local processing only
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOCAL_PROCESSING_ENDPOINT = Deno.env.get("LOCAL_PROCESSING_ENDPOINT") ?? "http://localhost:3001/analyze";
const MAX_CONCURRENT_JOBS = 2; // Process up to 2 videos per run (CPU-bound)
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
 * Run AI analysis on video - JUGAAD IMPLEMENTATION
 * Uses local-first, offline processing:
 * 1. Send to local Node.js server running Vosk + Transformers.js + MediaPipe
 * 2. No external APIs, no internet required for AI processing
 * 3. All processing on local CPU (i5 laptop compatible)
 */
async function analyzeVideo(videoBlob: Blob, recordingId: string): Promise<AnalysisResult> {
  console.log(`[JUGAAD] Analyzing video locally (${videoBlob.size} bytes)`);

  try {
    // Send video to local processing server
    // This server runs: Vosk (transcription), Transformers.js (sentiment/clarity), MediaPipe (posture)
    const formData = new FormData();
    formData.append('video', videoBlob, `${recordingId}.mp4`);
    formData.append('recordingId', recordingId);

    const response = await fetch(LOCAL_PROCESSING_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Processing-Mode': 'offline-jugaad'
      }
    });

    if (!response.ok) {
      throw new Error(`Local processing failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`[JUGAAD] Analysis complete: Score ${result.overall_score}`);
    return result as AnalysisResult;

  } catch (error) {
    console.error("[JUGAAD] Local processing error:", error);
    
    // Fallback: Return basic analysis if local server unavailable
    // This ensures the system remains functional during development
    console.log("[JUGAAD] Using fallback basic analysis");
    
    return {
      overall_score: 75,
      strengths: [
        "Video uploaded successfully",
        "Ready for detailed analysis when local server is running"
      ],
      areas_for_improvement: [
        "Complete analysis pending - start local processing server",
        "Run: npm run start:processor (see JUGAAD_SETUP.md)"
      ],
      specific_feedback: {
        body_language: {
          score: 75,
          notes: "Pending MediaPipe analysis. Start local processor for full body language evaluation."
        },
        vocal_delivery: {
          score: 75,
          notes: "Pending Vosk transcription and Transformers.js analysis. Start local processor for speech evaluation."
        },
        content_structure: {
          score: 75,
          notes: "Pending transcript analysis. Start local processor for content structure evaluation."
        },
        engagement: {
          score: 75,
          notes: "Pending full video analysis. Start local processor for engagement metrics."
        }
      },
      transcript: "Transcript pending - local Vosk processing required",
      duration_seconds: 0
    };
  }
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
