// Supabase Edge Function: promote-user
// POST /admin/promote - Promote a user's role (admin only)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PromoteRequest {
  userId: string;
  role: "user" | "tester" | "admin";
}

serve(async (req) => {
  // Handle CORS preflight
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
    // Check authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No auth token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is an admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: adminProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: PromoteRequest = await req.json();
    const { userId, role } = body;

    // Validate input
    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["user", "tester", "admin"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be 'user', 'tester', or 'admin'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if target user exists
    const { data: targetProfile, error: targetError } = await supabaseClient
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", userId)
      .single();

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent demoting yourself
    if (userId === user.id && role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Cannot demote yourself from admin role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user role
    const { data: updatedProfile, error: updateError } = await supabaseClient
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select("id, role, full_name, email")
      .single();

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update user role", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update priority for existing recordings if promoting to/from tester
    if (role === "tester" || targetProfile.role === "tester") {
      const newPriority = role === "tester" ? "high" : "low";
      
      const { error: recordingsError } = await supabaseClient
        .from("recordings")
        .update({ priority: newPriority })
        .eq("user_id", userId)
        .eq("status", "pending"); // Only update pending recordings

      if (recordingsError) {
        console.error("Warning: Could not update recordings priority:", recordingsError);
        // Don't fail the request, just log the warning
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User role updated from '${targetProfile.role}' to '${role}'`,
        user: {
          id: updatedProfile.id,
          name: updatedProfile.full_name,
          email: updatedProfile.email,
          previousRole: targetProfile.role,
          newRole: updatedProfile.role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
