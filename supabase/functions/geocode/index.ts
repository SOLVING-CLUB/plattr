/**
 * Supabase Edge Function: Geocoding Proxy
 * Proxies requests to Nominatim OpenStreetMap API to avoid CORS issues
 * 
 * Usage:
 * GET /geocode?type=reverse&lat=12.9716&lon=77.5946
 * GET /geocode?type=search&q=Bangalore
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "PlattrApp/1.0 (contact@plattr.com)"; // Required by Nominatim

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // "reverse" or "search"
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");
    const query = url.searchParams.get("q");

    if (!type || (type !== "reverse" && type !== "search")) {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use 'reverse' or 'search'" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    let nominatimUrl: string;

    if (type === "reverse") {
      if (!lat || !lon) {
        return new Response(
          JSON.stringify({ error: "lat and lon are required for reverse geocoding" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
      nominatimUrl = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    } else {
      // search
      if (!query) {
        return new Response(
          JSON.stringify({ error: "q (query) is required for search" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
      const limit = url.searchParams.get("limit") || "10";
      const countrycodes = url.searchParams.get("countrycodes") || "in";
      nominatimUrl = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=${countrycodes}&limit=${limit}`;
    }

    // Add viewbox and bounded params if provided (for search)
    const viewbox = url.searchParams.get("viewbox");
    const bounded = url.searchParams.get("bounded");
    if (viewbox) {
      nominatimUrl += `&viewbox=${viewbox}`;
      if (bounded) {
        nominatimUrl += `&bounded=${bounded}`;
      }
    }

    // Make request to Nominatim with proper User-Agent header
    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: "Geocoding service unavailable",
          status: response.status 
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const data = await response.json();

    // Return the data with CORS headers
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Geocoding proxy error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
