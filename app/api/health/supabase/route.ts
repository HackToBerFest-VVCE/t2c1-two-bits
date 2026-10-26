// app/api/health/supabase/route.ts

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { ConfigurationError } from "@/lib/registry";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/supabase
 *
 * Returns a minimal health check for Supabase connectivity.
 * The check performs a lightweight, read‑only request using the public anon key.
 * It does NOT rely on any existing tables – it uses the auth endpoint to fetch
 * the current session (which is always present for an anon key).
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseClient();

    // Perform a harmless request – auth.getSession() simply hits the auth API.
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          connected: false,
          error: error.message,
          code: "SUPABASE_ERROR",
        },
        { status: 500 }
      );
    }

    // A successful response (even if data.session is null) proves connectivity.
    return NextResponse.json(
      {
        ok: true,
        configured: true,
        connected: true,
        // optionally expose a timestamp for debugging
        checkedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof ConfigurationError) {
      // Missing env vars – give clear guidance without leaking values.
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          connected: false,
          error: err.message,
          code: "MISSING_CONFIG",
        },
        { status: 400 }
      );
    }
    console.error("[supabase health] unexpected error:", err);
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        connected: false,
        error: "Supabase health check failed",
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
