import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// This pulls your secret token from the Deno Project Settings
const DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  const url = new URL(req.url);

  // 1. Handle CORS Pre-flight (Required for WebSim/Next.js)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // 2. GET Status Endpoint
  if (url.pathname === "/status" && req.method === "GET") {
    try {
      const res = await fetch("https://discord.com/api/v9/users/@me/settings", {
        headers: { "Authorization": DISCORD_TOKEN || "" }
      });
      
      if (!res.ok) throw new Error("Discord API error");
      
      const data = await res.json();
      return new Response(JSON.stringify({ 
        status: data.custom_status?.text || "" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("GET Error:", err);
      return new Response(JSON.stringify({ error: "Failed to fetch status" }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }

  // 3. POST Update Endpoint
  if (url.pathname === "/update" && req.method === "POST") {
    try {
      const { new_status } = await req.json();
      
      const res = await fetch("https://discord.com/api/v9/users/@me/settings", {
        method: "PATCH",
        headers: {
          "Authorization": DISCORD_TOKEN || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          custom_status: { text: new_status, expires_at: null }
        }),
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        console.error("Discord Patch Fail:", errorMsg);
        return new Response(JSON.stringify({ success: false }), { status: res.status, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("POST Error:", err);
      return new Response(JSON.stringify({ success: false }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }

  return new Response("Not Found", { status: 404, headers: corsHeaders });
});
