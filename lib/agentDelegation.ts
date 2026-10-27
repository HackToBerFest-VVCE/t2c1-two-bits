import { getReadOnlySdk } from "./registry";
import { PublicKey } from "@solana/web3.js";
import type { SolanaSDK } from "8004-solana";

/**
 * Resolve a live endpoint URL for a given agentId.
 * Uses the read‑only SDK to load the on‑chain agent record and extracts `agent_uri`.
 * Returns the URL string if it looks like a http(s) endpoint, otherwise null.
 */
async function resolveAgentEndpoint(sdk: SolanaSDK, agentId: string): Promise<string | null> {
  // Load registration records from the data file (same logic as /api/agents/registered)
  // Re‑use the read‑only SDK to fetch on‑chain data for each registered asset.
  // For simplicity we read the JSON file directly – this file lives in data/registered-agents.json.
  const fs = await import("fs");
  const path = await import("path");
  const REGISTRY_FILE = path.join(process.cwd(), "data", "registered-agents.json");
  const FALLBACK = path.join(__dirname, "../../data", "registered-agents.json");
  let raw: string;
  try {
    raw = await fs.promises.readFile(REGISTRY_FILE, "utf-8");
  } catch {
    raw = await fs.promises.readFile(FALLBACK, "utf-8");
  }
  const records: { agentId: string; asset: string }[] = JSON.parse(raw);
  const rec = records.find((r) => r.agentId === agentId);
  if (!rec) return null;
  try {
    const agent = await sdk.loadAgent(new PublicKey(rec.asset));
    const uri = agent?.agent_uri;
    if (typeof uri === "string" && /^https?:\/\//i.test(uri)) {
      // Basic URL validation – reject unsafe schemes, embedded credentials, and special IP ranges
      try {
        const u = new URL(uri);
        // Reject embedded credentials
        if (u.username || u.password) return null;
        const h = u.hostname.toLowerCase();
        // Reject localhost and loopback
        if (h === "localhost" || h === "127.0.0.1" || h === "::1") return null;
        // Reject private IPv4 ranges
        if (/^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return null;
        // Reject link‑local and multicast IPv4 ranges
        if (/^169\.254\./.test(h) || /^224\./.test(h)) return null;
        // Reject IPv6 link‑local and multicast (basic prefix checks)
        if (/^fe80:/i.test(h) || /^ff00:/i.test(h)) return null;
      } catch {
        return null;
      }
      return uri;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Send the task to a real A2A endpoint.
 * The endpoint is expected to accept a POST with JSON {title, description, category}
 * and respond with {result: string} on success.
 */
export async function delegateTask(params: {
  title: string;
  description: string;
  category: string;
  agentId?: string;
}): Promise<{ mode: "live"; status: "completed" | "failed"; result?: string; error?: string }> {
  const { title, description, category, agentId } = params;
  if (!agentId) {
    return { mode: "live", status: "failed", error: "No agentId supplied" };
  }
  const sdk = getReadOnlySdk();
  // Prefer an explicitly configured coordinator endpoint via env var.
  const envEndpoint = process.env.COORDINATOR_AGENT_ENDPOINT;
  let endpoint: string | null = null;
  if (typeof envEndpoint === "string" && envEndpoint) {
    endpoint = envEndpoint;
  } else {
    endpoint = await resolveAgentEndpoint(sdk, agentId);
  }
  // Validate endpoint – must be http(s) and pass basic safety checks.
  if (endpoint) {
    if (!/^https?:\/\//i.test(endpoint)) {
      endpoint = null;
    } else {
      try {
        const u = new URL(endpoint);
        if (u.username || u.password) endpoint = null;
        const h = u.hostname.toLowerCase();
        if (h === "localhost" || h === "127.0.0.1" || h === "::1") endpoint = null;
        if (/^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) endpoint = null;
        if (/^169\.254\./.test(h) || /^224\./.test(h)) endpoint = null;
        if (/^fe80:/i.test(h) || /^ff00:/i.test(h)) endpoint = null;
      } catch {
        endpoint = null;
      }
    }
  }
  if (!endpoint) {
    return { mode: "live", status: "failed", error: "No live agent endpoint configured. Deploy a compatible agent and set COORDINATOR_AGENT_ENDPOINT." };
  }
  // Simple timeout handling
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s
  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category }),
      signal: controller.signal,
      redirect: "error", // do not follow redirects (prevents SSRF via redirect)
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      // Do not expose raw body, just status
      return { mode: "live", status: "failed", error: `Endpoint returned ${resp.status}` };
    }
    const data = await resp.json();
    if (typeof data.result !== "string") {
      return { mode: "live", status: "failed", error: "Malformed response: missing result string" };
    }
    return { mode: "live", status: "completed", result: data.result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { mode: "live", status: "failed", error: `Network or timeout error: ${msg}` };
  } finally {
    clearTimeout(timeout);
  }
}
