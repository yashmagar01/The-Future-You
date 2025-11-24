// Supabase Edge Function: record-complete
// Supabase Edge Function: record-complete
// POST /record-complete - Mark upload as complete and trigger processing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

declare const Deno: any;

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: { headers: { Authorization: req.headers.get("Authorization")! } },
            }
        );

        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { recordingId } = await req.json();

        if (!recordingId) {
            return new Response(
                JSON.stringify({ error: "Recording ID is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verify recording exists and belongs to user
        const { data: recording, error: fetchError } = await supabaseClient
            .from("recordings")
            .select("*")
            .eq("id", recordingId)
            .eq("user_id", user.id)
            .single();

        if (fetchError || !recording) {
            return new Response(
                JSON.stringify({ error: "Recording not found or access denied" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Update status to uploaded (ready for processing)
        const { error: updateError } = await supabaseClient
            .from("recordings")
            .update({
                status: "uploaded",
                updated_at: new Date().toISOString()
            })
            .eq("id", recordingId);

        if (updateError) throw updateError;

        // Trigger external processing worker (fire and forget)
        // This can be deployed on Cloud Run, ECS, or any container orchestration
        const workerUrl = Deno.env.get("WORKER_URL"); // e.g., https://worker.example.com/process

        if (workerUrl) {
            try {
                fetch(workerUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${Deno.env.get("WORKER_SECRET") || ""}` // Optional auth
                    },
                    body: JSON.stringify({ recordingId }),
                }).catch(err => console.error("Failed to trigger worker:", err));
            } catch (e) {
                // Ignore trigger errors - worker can also be triggered by cron
                console.error("Worker trigger error:", e);
            }
        } else {
            console.log("WORKER_URL not configured - relying on cron job");
        }


        return new Response(
            JSON.stringify({ success: true, message: "Recording marked for processing" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
