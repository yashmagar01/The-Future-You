// Supabase Edge Function: record-prepare
// Supabase Edge Function: record-prepare
// POST /record-prepare - Create recording entry and get upload URL

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

        const { filename, fileType, fileSize, title } = await req.json();

        if (!filename) {
            return new Response(
                JSON.stringify({ error: "Filename is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create recording entry
        const { data: recording, error: dbError } = await supabaseClient
            .from("recordings")
            .insert({
                user_id: user.id,
                title: title || `Recording ${new Date().toLocaleDateString()}`,
                video_url: `pending/${filename}`, // Temporary path
                file_size_bytes: fileSize,
                status: "processing", // Initially processing/uploading
                metadata: { original_filename: filename, file_type: fileType }
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // Generate signed upload URL
        // Note: The path here should match where the client uploads
        const filePath = `${user.id}/${recording.id}/${filename}`;

        // Update the recording with the actual path we expect
        await supabaseClient
            .from("recordings")
            .update({ video_url: filePath })
            .eq("id", recording.id);

        const { data: uploadData, error: storageError } = await supabaseClient
            .storage
            .from("recordings")
            .createSignedUploadUrl(filePath);

        if (storageError) throw storageError;

        return new Response(
            JSON.stringify({
                recordingId: recording.id,
                uploadUrl: uploadData.signedUrl,
                path: uploadData.path,
                token: uploadData.token
            }),
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
