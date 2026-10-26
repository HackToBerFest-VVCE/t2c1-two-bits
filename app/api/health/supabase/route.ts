// app/api/health/supabase/route.ts

import { NextResponse } from "next/server";
import { ConfigurationError } from "@/lib/registry";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/supabase
 *
 * Performs a lightweight connectivity check to Supabase using the publishable
 * anon key. It validates that the required environment variables are present
 * and then issues a GET request to the Supabase Auth health endpoint.
 *
 * The request includes the `apikey` header with the publishable key – this is
 * safe because the key is intended to be public. No secret/service‑role key is
 * used.
 *
 * A timeout (default 5 seconds) aborts the request if Supabase does not respond
 * promptly.
 */
export async function GET(): Promise<NextResponse> {
  // ---------------------------------------------------------------------
  // Validate required configuration (do not expose values).
  // ---------------------------------------------------------------------
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    const missing: string[] = [];
    if (!url) missing.push("SUPABASE_URL");
    if (!anonKey) missing.push("SUPABASE_PUBLISHABLE_KEY");
    throw new ConfigurationError(
      `Missing Supabase configuration: ${missing.join(", ")}. Add the variables to .env.local.`
    );
  }

  // ---------------------------------------------------------------------
  // Perform the health request with a timeout.
  // ---------------------------------------------------------------------
  const controller = new AbortController();
  const timeoutMs = 5000; // 5 seconds – reasonable for a health probe
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: anonKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const checkedAt = new Date().toISOString();

    if (response.ok) {
      return NextResponse.json(
        {
          ok: true,
          configured: true,
          connected: true,
          checkedAt,
        },
        { status: 200 }
      );
    }

    const errorMessage = `Supabase health endpoint returned HTTP ${response.status}`;
    const statusCode = response.status === 401 ? 401 : 500;
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        connected: false,
        error: errorMessage,
        code: "SUPABASE_ERROR",
        checkedAt,
      },
      { status: statusCode }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Supabase health check timed out"
        : "Supabase connectivity check failed";
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        connected: false,
        error: message,
        code: "UNKNOWN_ERROR",
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
