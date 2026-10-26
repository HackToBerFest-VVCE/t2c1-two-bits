/**
 * app/api/agents/registered/route.ts
 *
 * GET /api/agents/registered
 *
 * Returns registration records from data/registered-agents.json
 * plus a configuration readiness status.
 *
 * Also accepts GET /api/agents/registered?load=true to attempt live on-chain
 * reads via sdk.loadAgent() for each recorded asset.
 *
 * SECURITY: Never returns signer pubkey, raw key bytes, or PINATA_JWT.
 * The only credentials-related information returned is the boolean
 * { signerConfigured, ipfsConfigured } — no values, only presence flags.
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { PublicKey } from "@solana/web3.js";
import { SolanaSDK } from "8004-solana";
import { isSignerConfigured, isIpfsConfigured, PROGRAM_IDS, INDEXER_URL } from "@/lib/registry";

export const dynamic = "force-dynamic";

const REGISTRY_FILE = path.join(process.cwd(), "data", "registered-agents.json");
// In some environments (e.g., when running from a compiled .next directory),
// process.cwd() may point to the build folder. Fallback to the project root
// relative to this file if the primary path does not exist.
const FALLBACK_REGISTRY_FILE = path.join(__dirname, "../../../data/registered-agents.json");

type RegistrationRecord = {
  agentId: string;
  asset: string;
  signature: string;
  registeredAt: string;
  cluster: string;
};

async function loadRecords(): Promise<RegistrationRecord[]> {
  try {
    const raw = await fs.readFile(REGISTRY_FILE, "utf-8");
    return JSON.parse(raw) as RegistrationRecord[];
  } catch {
    // Try fallback location
    try {
      const raw = await fs.readFile(FALLBACK_REGISTRY_FILE, "utf-8");
      return JSON.parse(raw) as RegistrationRecord[];
    } catch {
      return [];
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const loadLive = request.nextUrl.searchParams.get("load") === "true";

  const records = await loadRecords();

  const config = {
    signerConfigured: isSignerConfigured(),
    ipfsConfigured: isIpfsConfigured(),
    cluster: process.env.SOLANA_CLUSTER ?? "devnet",
    programIds: PROGRAM_IDS,
    indexerUrl: INDEXER_URL,
  };

  if (!loadLive || records.length === 0) {
    return NextResponse.json({ ok: true, config, records, liveData: null });
  }

  // Attempt live on-chain reads — read-only SDK (no signer)
  const readSdk = new SolanaSDK({
    cluster: (process.env.SOLANA_CLUSTER as "devnet" | "mainnet-beta") ?? "devnet",
  });

  const liveData: Record<string, unknown> = {};
  for (const rec of records) {
    try {
      const agent = await readSdk.loadAgent(new PublicKey(rec.asset));
      if (agent) {
        liveData[rec.asset] = {
          nft_name: agent.nft_name,
          owner: agent.getOwnerPublicKey().toBase58(),
          agent_uri: agent.agent_uri,
          atom_enabled: agent.isAtomEnabled(),
          collection: agent.getCollectionPublicKey().toBase58(),
        };
      } else {
        liveData[rec.asset] = { error: "Agent not found on-chain" };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      liveData[rec.asset] = { error: msg };
    }
  }

  return NextResponse.json({ ok: true, config, records, liveData });
}
