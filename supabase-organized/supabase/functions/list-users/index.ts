// Supabase Edge Function: list-users
// GET /functions/v1/list-users - Get all users with emails (admin only)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
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

    // Verify admin
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

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      throw profilesError;
    }

    // Fetch auth users and merge with profiles
    const usersWithEmails = await Promise.all(
      (profiles || []).map(async (profile) => {
        try {
          const { data: authUser } = await supabaseClient.auth.admin.getUserById(profile.id);
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: authUser?.user?.email || null,
            role: profile.role || "user",
            created_at: profile.created_at,
          };
        } catch (error) {
          console.error(`Error fetching auth user ${profile.id}:`, error);
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: null,
            role: profile.role || "user",
            created_at: profile.created_at,
          };
        }
      })
    );

    return new Response(
      JSON.stringify({
        users: usersWithEmails,
        count: usersWithEmails.length,
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
