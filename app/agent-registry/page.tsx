"use client";

/**
 * app/agent-registry/page.tsx
 * Agent Registry — Phase 2 shell.
 * No fake agents. No invented on-chain data.
 */

import {
  Badge,
  Card,
  SectionHeading,
  EmptyState,
  ComingSoonBanner,
  PageHeader,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Filter bar shell
// ---------------------------------------------------------------------------
function FilterBar() {
  return (
    <div
      className="flex flex-wrap items-center gap-3 p-4 rounded-lg mb-5"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Search */}
      <div className="flex-1 min-w-[180px]">
        <input
          type="text"
          placeholder="Search agents by name or skill…"
          disabled
          className="task-textarea"
          style={{ padding: "7px 12px", cursor: "not-allowed", opacity: 0.5 }}
          aria-label="Agent search (not yet available)"
        />
      </div>

      {/* Capability filter chips */}
      <div className="flex flex-wrap gap-2">
        {["NLP", "Code Review", "Data Analysis", "Translation", "Summarization"].map((cap) => (
          <button
            key={cap}
            disabled
            className="badge badge-outline"
            style={{ cursor: "not-allowed", opacity: 0.45, padding: "4px 10px" }}
          >
            {cap}
          </button>
        ))}
      </div>

      {/* Sort */}
      <button
        disabled
        className="btn btn-secondary btn-sm"
        style={{ cursor: "not-allowed", opacity: 0.45 }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
        </svg>
        Sort by Reputation
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent card skeleton (shows the planned layout)
// ---------------------------------------------------------------------------
function AgentCardSkeleton() {
  return (
    <div
      className="card p-4 flex flex-col gap-3"
      style={{ opacity: 0.35, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
            }}
          />
          <div>
            <div
              style={{
                width: 120,
                height: 13,
                borderRadius: 4,
                background: "var(--bg-elevated)",
              }}
            />
            <div
              style={{
                width: 80,
                height: 10,
                borderRadius: 4,
                background: "var(--bg-elevated)",
                marginTop: 5,
              }}
            />
          </div>
        </div>
        <div style={{ width: 56, height: 20, borderRadius: 4, background: "var(--bg-elevated)" }} />
      </div>
      <div style={{ width: "100%", height: 9, borderRadius: 4, background: "var(--bg-elevated)" }} />
      <div style={{ width: "75%", height: 9, borderRadius: 4, background: "var(--bg-elevated)" }} />
      <div className="flex gap-2">
        {[60, 80, 70].map((w) => (
          <div key={w} style={{ width: w, height: 18, borderRadius: 4, background: "var(--bg-elevated)" }} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// What the agent card will display (documented spec)
// ---------------------------------------------------------------------------
function PlannedAgentSchema() {
  const fields = [
    { field: "nft_name",        type: "string",  source: "Metaplex Core NFT — on-chain" },
    { field: "asset (pubkey)",  type: "PublicKey", source: "Solana devnet — on-chain" },
    { field: "owner",           type: "PublicKey", source: "NFT owner — on-chain" },
    { field: "agent_uri",       type: "string (IPFS)", source: "Registration file pointer — on-chain" },
    { field: "services[]",      type: "A2A / MCP / OASF", source: "IPFS registration file" },
    { field: "skills[]",        type: "OASF taxonomy", source: "IPFS registration file" },
    { field: "domains[]",       type: "OASF taxonomy", source: "IPFS registration file" },
    { field: "averageScore",    type: "number",  source: "ATOM reputation program — on-chain" },
    { field: "totalFeedbacks",  type: "number",  source: "ATOM reputation program — on-chain" },
    { field: "trustTier",       type: "Bronze–Platinum", source: "ATOM program (optional) — on-chain" },
    { field: "liveness",        type: "live | partially | not_live", source: "sdk.isItAlive() — HTTP probe" },
  ];

  return (
    <Card>
      <SectionHeading>Planned Agent Identity Schema (Phase 2)</SectionHeading>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Each field maps to a real{" "}
        <code className="code-tag">8004-solana</code> SDK method or on-chain
        account. No fields are invented — this schema is derived from the{" "}
        <a
          href="https://8004.qnt.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          official documentation
        </a>
        .
      </p>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.field}>
                <td><code className="code-tag">{f.field}</code></td>
                <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>{f.type}</td>
                <td>
                  {f.source.includes("on-chain") ? (
                    <Badge variant="green">{f.source}</Badge>
                  ) : (
                    <Badge variant="muted">{f.source}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AgentRegistryPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Agent Registry"
        description="Discover and inspect agents registered on the Solana Agent Registry. Each agent is a Metaplex Core NFT with on-chain identity, ATOM reputation, and an IPFS registration file."
        actions={<Badge variant="violet">Phase 2</Badge>}
      />

      <ComingSoonBanner
        phase={2}
        label="Agent registration (NFT mint + IPFS upload) and live discovery will be implemented in Phase 2."
      />

      {/* Filter shell */}
      <FilterBar />

      {/* Empty state with skeleton preview */}
      <div className="mb-6">
        <SectionHeading>Registered Agents</SectionHeading>

        {/* Three skeleton cards to show the planned layout */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          <AgentCardSkeleton />
          <AgentCardSkeleton />
          <AgentCardSkeleton />
        </div>

        <EmptyState
          icon={
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="8" cy="5" r="2.5" />
              <path d="M2.5 13.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" strokeLinecap="round" />
            </svg>
          }
          title="No agents registered yet"
          subtitle="Phase 2 will register 3–5 demo agents as Metaplex Core NFTs on devnet and list them here with live on-chain identity and reputation data."
        />
      </div>

      {/* Planned schema documentation */}
      <PlannedAgentSchema />

      {/* Registry program reference */}
      <div className="mt-6">
        <Card>
          <SectionHeading>On-Chain Registry Programs (Devnet)</SectionHeading>
          <div className="space-y-4">
            {[
              {
                name: "Agent Registry (8004)",
                address: "6MuHv4dY4p9E4hSCEPr9dgbCSpMhq8x1vrUexbMVjfw1",
              },
              {
                name: "ATOM Reputation Engine",
                address: "6Mu7qj6tRDrqchxJJPjr9V1H2XQjCerVKixFEEMwC1Tf",
              },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{p.name}</span>
                  <Badge variant="amber">devnet</Badge>
                </div>
                <a
                  href={`https://explorer.solana.com/address/${p.address}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate-addr link block"
                  style={{ maxWidth: "100%" }}
                >
                  {p.address} ↗
                </a>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
