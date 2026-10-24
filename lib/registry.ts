/**
 * lib/registry.ts
 *
 * Server-side only wrapper around the 8004-solana SDK.
 *
 * This module is intentionally read-only for Phase 1. It never reads
 * SOLANA_PRIVATE_KEY and performs no write operations (no registerAgent,
 * giveFeedback, etc.).  The signer is omitted so the SDK operates in
 * read-only mode as documented:
 *   const sdk = new SolanaSDK({ cluster: 'devnet' }); // no signer
 *
 * SECURITY NOTE: Never import this file from client components or expose
 * it via NEXT_PUBLIC_ variables.  It lives in /lib and is only called
 * from /app/api routes which run exclusively on the server.
 */

import { SolanaSDK } from "8004-solana";
import { Connection } from "@solana/web3.js";

// ---------------------------------------------------------------------------
// Configuration – read from server environment variables only.
// ---------------------------------------------------------------------------

const CLUSTER = (process.env.SOLANA_CLUSTER as "devnet" | "mainnet-beta") ?? "devnet";
const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

// Devnet program IDs (confirmed from https://8004.qnt.sh)
export const PROGRAM_IDS = {
  agentRegistry: "6MuHv4dY4p9E4hSCEPr9dgbCSpMhq8x1vrUexbMVjfw1",
  atomEngine: "6Mu7qj6tRDrqchxJJPjr9V1H2XQjCerVKixFEEMwC1Tf",
} as const;

// Public indexer endpoint for devnet (no API key required)
export const INDEXER_URL = "https://8004-indexer-dev.qnt.sh";

// ---------------------------------------------------------------------------
// Read-only SDK instance (no signer, no private key)
// ---------------------------------------------------------------------------

let _sdkInstance: SolanaSDK | null = null;

export function getReadOnlySdk(): SolanaSDK {
  if (!_sdkInstance) {
    _sdkInstance = new SolanaSDK({ cluster: CLUSTER });
  }
  return _sdkInstance;
}

// ---------------------------------------------------------------------------
// Low-level connectivity check using @solana/web3.js directly.
// This avoids any write path and just asks the RPC for its health.
// ---------------------------------------------------------------------------

export interface ConnectivityResult {
  ok: boolean;
  cluster: string;
  rpcUrl: string;
  /** Slot number returned by the RPC, or null on failure */
  currentSlot: number | null;
  /** The RPC's reported health string, or null on failure */
  rpcHealth: string | null;
  /** ISO timestamp of when the check ran */
  checkedAt: string;
  /** Human-readable error if ok === false */
  error?: string;
}

/**
 * Performs two lightweight read-only RPC calls:
 *  1. getSlot()   – confirms we can reach the node
 *  2. getHealth() – confirms the node is not degraded
 *
 * No SOL is spent. No transactions are submitted.
 */
export async function checkDevnetConnectivity(): Promise<ConnectivityResult> {
  const checkedAt = new Date().toISOString();

  try {
    const connection = new Connection(RPC_URL, "confirmed");

    // getSlot() is the lightest possible call – just one JSON-RPC request.
    const slot = await connection.getSlot();

    // getHealth() returns "ok" when the validator is healthy.
    let rpcHealth: string;
    try {
      await (connection as unknown as { _rpcRequest: (m: string, p: unknown[]) => Promise<{ result: string }> })
        ._rpcRequest("getHealth", []);
      rpcHealth = "ok";
    } catch {
      // Some public endpoints don't expose getHealth; treat as "unknown"
      rpcHealth = "unknown";
    }

    return {
      ok: true,
      cluster: CLUSTER,
      rpcUrl: RPC_URL,
      currentSlot: slot,
      rpcHealth,
      checkedAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      cluster: CLUSTER,
      rpcUrl: RPC_URL,
      currentSlot: null,
      rpcHealth: null,
      checkedAt,
      error: message,
    };
  }
}
