/**
 * app/api/health/route.ts
 *
 * GET /api/health
 *
 * Server-side read-only connectivity probe.
 * Checks that the application can reach Solana devnet.
 * No private keys are read. No transactions are submitted.
 *
 * Returns JSON:
 * {
 *   ok: boolean,
 *   cluster: string,
 *   rpcUrl: string,       // never a secret – devnet public endpoint
 *   currentSlot: number | null,
 *   rpcHealth: string | null,
 *   checkedAt: string,    // ISO 8601
 *   error?: string
 * }
 */

import { NextResponse } from "next/server";
import { checkDevnetConnectivity } from "@/lib/registry";

// Force this route to always run on the server (no static caching).
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const result = await checkDevnetConnectivity();

  // Return 200 even when ok===false so the client can read the error body.
  return NextResponse.json(result, { status: 200 });
}
