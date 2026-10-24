"use client";

/**
 * app/page.tsx
 *
 * Landing dashboard for the Autonomous Agent Hiring & Delegation Network.
 *
 * Phase 1 scope:
 *  - Project identity and description
 *  - Live devnet connectivity check via GET /api/health (server-side probe)
 *  - Architecture overview (on-chain vs app-level distinction clearly labeled)
 *  - Phase roadmap
 *
 * Nothing here performs write operations or reads private keys.
 * All blockchain interaction happens in /lib/registry.ts (server-only).
 */

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthResponse {
  ok: boolean;
  cluster: string;
  rpcUrl: string;
  currentSlot: number | null;
  rpcHealth: string | null;
  checkedAt: string;
  error?: string;
}

type CheckState = "idle" | "loading" | "success" | "error";

// ---------------------------------------------------------------------------
// Small reusable components
// ---------------------------------------------------------------------------

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "green" | "yellow" | "red" | "blue" | "purple";
}) {
  const colors: Record<string, string> = {
    default: "bg-zinc-800 text-zinc-200",
    green: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50",
    yellow: "bg-yellow-900/60 text-yellow-300 border border-yellow-700/50",
    red: "bg-red-900/60 text-red-300 border border-red-700/50",
    blue: "bg-blue-900/60 text-blue-300 border border-blue-700/50",
    purple: "bg-purple-900/60 text-purple-300 border border-purple-700/50",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[variant]}`}
    >
      {children}
    </span>
  );
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-700/50 bg-zinc-900/60 p-6 ${className}`}
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connectivity panel
// ---------------------------------------------------------------------------

function ConnectivityPanel() {
  const [state, setState] = useState<CheckState>("idle");
  const [data, setData] = useState<HealthResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function runCheck() {
    setState("loading");
    setFetchError(null);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json: HealthResponse = await res.json();
      setData(json);
      setState(json.ok ? "success" : "error");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg);
      setState("error");
    }
  }

  // Run once on mount
  useEffect(() => {
    runCheck();
  }, []); // intentional empty deps — run once on mount

  const statusConfig = {
    idle: {
      dot: "bg-zinc-500",
      label: "Not checked",
      badge: <Badge variant="default">Pending</Badge>,
    },
    loading: {
      dot: "bg-yellow-400 animate-pulse",
      label: "Checking connection…",
      badge: <Badge variant="yellow">Checking…</Badge>,
    },
    success: {
      dot: "bg-emerald-400",
      label: "Connected to Solana devnet",
      badge: <Badge variant="green">Connected</Badge>,
    },
    error: {
      dot: "bg-red-400",
      label: "Connection failed",
      badge: <Badge variant="red">Failed</Badge>,
    },
  };

  const cfg = statusConfig[state];

  return (
    <SectionCard title="Devnet Connectivity">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${cfg.dot}`}
          />
          <div>
            <p className="font-medium text-zinc-100">{cfg.label}</p>
            {state === "loading" && (
              <p className="mt-0.5 text-sm text-zinc-400">
                Calling{" "}
                <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs">
                  /api/health
                </code>{" "}
                → Solana RPC <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs">getSlot()</code>
              </p>
            )}
          </div>
        </div>
        {cfg.badge}
      </div>

      {/* Result details */}
      {data && state !== "loading" && (
        <div className="mt-4 rounded-lg border border-zinc-700/40 bg-zinc-950/50 p-4 font-mono text-xs text-zinc-300 space-y-1">
          <div className="flex gap-2">
            <span className="text-zinc-500 w-24 flex-shrink-0">cluster</span>
            <span>{data.cluster}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500 w-24 flex-shrink-0">rpcUrl</span>
            <span className="truncate">{data.rpcUrl}</span>
          </div>
          {data.currentSlot !== null && (
            <div className="flex gap-2">
              <span className="text-zinc-500 w-24 flex-shrink-0">slot</span>
              <span className="text-emerald-400">
                {data.currentSlot.toLocaleString()}
              </span>
            </div>
          )}
          {data.rpcHealth !== null && (
            <div className="flex gap-2">
              <span className="text-zinc-500 w-24 flex-shrink-0">health</span>
              <span
                className={
                  data.rpcHealth === "ok" ? "text-emerald-400" : "text-yellow-400"
                }
              >
                {data.rpcHealth}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-zinc-500 w-24 flex-shrink-0">checked</span>
            <span>{new Date(data.checkedAt).toLocaleTimeString()}</span>
          </div>
          {data.error && (
            <div className="flex gap-2">
              <span className="text-zinc-500 w-24 flex-shrink-0">error</span>
              <span className="text-red-400">{data.error}</span>
            </div>
          )}
        </div>
      )}

      {fetchError && (
        <p className="mt-3 rounded-lg bg-red-900/30 border border-red-700/40 px-3 py-2 text-sm text-red-300">
          {fetchError}
        </p>
      )}

      <p className="mt-3 text-xs text-zinc-500">
        Check runs server-side via{" "}
        <code className="rounded bg-zinc-800 px-1 py-0.5">
          @solana/web3.js Connection.getSlot()
        </code>
        . No private keys are used. No transactions are submitted.{" "}
        <button
          onClick={runCheck}
          disabled={state === "loading"}
          className="ml-1 underline underline-offset-2 hover:text-zinc-300 disabled:opacity-40 cursor-pointer"
        >
          Re-check
        </button>
      </p>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Architecture overview
// ---------------------------------------------------------------------------

const ARCH_ROWS = [
  {
    action: "Agent registration (NFT mint)",
    location: "Solana devnet",
    onChain: true,
    phase: 2,
  },
  {
    action: "Read agent identity & metadata",
    location: "8004-solana SDK → devnet",
    onChain: true,
    phase: 2,
  },
  {
    action: "Reputation score lookup (ATOM)",
    location: "8004-solana SDK → devnet",
    onChain: true,
    phase: 2,
  },
  {
    action: "Agent discovery via indexer",
    location: "8004-indexer-dev.qnt.sh (GraphQL)",
    onChain: true,
    phase: 2,
  },
  {
    action: "Post feedback after task",
    location: "ATOM program → devnet",
    onChain: true,
    phase: 4,
  },
  {
    action: "ProofPass verified feedback",
    location: "8004 registry program → devnet",
    onChain: true,
    phase: 4,
  },
  {
    action: "Agent selection algorithm",
    location: "Orchestrator (TypeScript, server)",
    onChain: false,
    phase: 3,
  },
  {
    action: "Task delegation (send prompt)",
    location: "HTTP fetch to agent endpoint (A2A)",
    onChain: false,
    phase: 3,
  },
  {
    action: "Result validation heuristics",
    location: "Orchestrator (TypeScript, server)",
    onChain: false,
    phase: 4,
  },
  {
    action: "Mock agent execution",
    location: "In-process demo functions",
    onChain: false,
    phase: 3,
  },
];

function ArchitectureTable() {
  return (
    <SectionCard title="Architecture — On-Chain vs Application Logic">
      <p className="mb-4 text-sm text-zinc-400">
        The Solana Agent Registry provides on-chain identity, reputation, and
        feedback primitives. Everything else is application-level logic built on
        top. The table below makes this distinction explicit throughout the
        project.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700/50 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="pb-2 pr-4">Action</th>
              <th className="pb-2 pr-4">Runs In</th>
              <th className="pb-2 pr-4">On-Chain?</th>
              <th className="pb-2">Phase</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {ARCH_ROWS.map((row) => (
              <tr key={row.action} className="py-1">
                <td className="py-2 pr-4 text-zinc-200">{row.action}</td>
                <td className="py-2 pr-4 font-mono text-xs text-zinc-400">
                  {row.location}
                </td>
                <td className="py-2 pr-4">
                  {row.onChain ? (
                    <Badge variant="green">✓ On-chain</Badge>
                  ) : (
                    <Badge variant="purple">App-level</Badge>
                  )}
                </td>
                <td className="py-2">
                  <Badge variant={row.phase === 1 ? "blue" : "default"}>
                    P{row.phase}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Phase roadmap
// ---------------------------------------------------------------------------

const PHASES = [
  {
    num: 1,
    title: "Scaffold & Registry Connectivity",
    status: "current",
    items: [
      "Next.js 15 application with TypeScript + Tailwind",
      "8004-solana SDK installed (read-only mode)",
      "Server-side devnet connectivity check (/api/health)",
      "Professional landing dashboard",
    ],
  },
  {
    num: 2,
    title: "Agent Registration & Discovery",
    status: "upcoming",
    items: [
      "Register 3–5 demo agents as Metaplex Core NFTs on devnet",
      "IPFS metadata upload via Pinata",
      "Discovery UI listing agents with live on-chain data",
      "ATOM reputation seeding via giveFeedback()",
    ],
  },
  {
    num: 3,
    title: "Task Delegation & Mock Agents",
    status: "upcoming",
    items: [
      "Orchestrator: discoverAgents() + evaluateAgent() + selectBestAgent()",
      "Mock specialized agents (Summarizer, Code Reviewer, Data Analyzer)",
      "Hire panel: submit a task, watch selection reasoning",
      "Task delegation board",
    ],
  },
  {
    num: 4,
    title: "Validation & On-Chain Feedback",
    status: "upcoming",
    items: [
      "Result validation heuristics",
      "giveFeedback() / openProofPass() after each completed task",
      "Solana Explorer links for every feedback transaction",
      "Reputation updates visible in real time",
    ],
  },
  {
    num: 5,
    title: "Polish & Demo Flow",
    status: "upcoming",
    items: [
      "Guided end-to-end demo with on-chain transparency sidebar",
      "Optional Phantom wallet connection",
      "Final README and architecture diagram",
    ],
  },
];

function PhaseRoadmap() {
  return (
    <SectionCard title="Implementation Phases">
      <div className="space-y-4">
        {PHASES.map((phase) => (
          <div
            key={phase.num}
            className={`rounded-lg border p-4 ${
              phase.status === "current"
                ? "border-blue-600/60 bg-blue-950/30"
                : "border-zinc-700/40 bg-zinc-900/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                  phase.status === "current"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-700 text-zinc-300"
                }`}
              >
                {phase.num}
              </span>
              <span
                className={`font-medium ${
                  phase.status === "current" ? "text-blue-200" : "text-zinc-200"
                }`}
              >
                {phase.title}
              </span>
              {phase.status === "current" && (
                <Badge variant="blue">In progress</Badge>
              )}
            </div>
            <ul className="ml-9 space-y-0.5">
              {phase.items.map((item) => (
                <li key={item} className="text-sm text-zinc-400 list-disc ml-4">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Program IDs panel
// ---------------------------------------------------------------------------

function ProgramIds() {
  const programs = [
    {
      name: "Agent Registry (8004)",
      address: "6MuHv4dY4p9E4hSCEPr9dgbCSpMhq8x1vrUexbMVjfw1",
      network: "devnet",
    },
    {
      name: "ATOM Reputation Engine",
      address: "6Mu7qj6tRDrqchxJJPjr9V1H2XQjCerVKixFEEMwC1Tf",
      network: "devnet",
    },
  ];

  return (
    <SectionCard title="On-Chain Program IDs (Devnet)">
      <div className="space-y-3">
        {programs.map((p) => (
          <div key={p.name}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-zinc-200">{p.name}</span>
              <Badge variant="yellow">{p.network}</Badge>
            </div>
            <a
              href={`https://explorer.solana.com/address/${p.address}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-zinc-400 hover:text-blue-400 underline underline-offset-2 break-all"
            >
              {p.address}
            </a>
          </div>
        ))}
        <p className="mt-2 text-xs text-zinc-500">
          Source:{" "}
          <a
            href="https://8004.qnt.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-zinc-300"
          >
            8004.qnt.sh
          </a>
        </p>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-sm font-bold">
              A
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight">
              Agent Hiring Network
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="yellow">Devnet</Badge>
            <Badge variant="default">Phase 1</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-700/40 bg-purple-950/30 px-4 py-1.5 text-sm text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            Solana Agent Registry Hackathon — ERC-8004
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            Autonomous Agent{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Hiring & Delegation
            </span>{" "}
            Network
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            A requesting agent discovers specialized agents by their on-chain
            identity, evaluates reputation scores from the ATOM program, delegates
            a task to the best candidate, validates the result, and writes
            verifiable feedback back to the Solana registry — closing the trust
            loop entirely on-chain.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Badge variant="blue">Next.js 15</Badge>
            <Badge variant="blue">TypeScript</Badge>
            <Badge variant="blue">8004-solana v0.8.5</Badge>
            <Badge variant="green">Solana Devnet</Badge>
            <Badge variant="purple">Metaplex Core NFT</Badge>
            <Badge variant="purple">ATOM Reputation</Badge>
            <Badge variant="purple">ERC-8004</Badge>
          </div>
        </div>

        {/* Connectivity check — primary focus of Phase 1 */}
        <ConnectivityPanel />

        {/* Two-column: program IDs + architecture */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProgramIds />
          <SectionCard title="SDK Information">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Package</span>
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200">
                  8004-solana
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Version</span>
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200">
                  0.8.5
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Node requirement</span>
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200">
                  &gt;=20.19.0
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mode (Phase 1)</span>
                <Badge variant="green">Read-only</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Signer</span>
                <Badge variant="default">None — no key required</Badge>
              </div>
              <hr className="border-zinc-700/50" />
              <div className="flex justify-between">
                <span className="text-zinc-400">Indexer (devnet)</span>
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-200 truncate max-w-[200px]">
                  8004-indexer-dev.qnt.sh
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Standard</span>
                <span className="text-zinc-200">ERC-8004 (Trustless Agents)</span>
              </div>
              <div className="pt-1">
                <a
                  href="https://github.com/QuantuLabs/8004-solana-ts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 underline underline-offset-2 hover:text-blue-300"
                >
                  SDK Documentation →
                </a>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Architecture table */}
        <ArchitectureTable />

        {/* Phase roadmap */}
        <PhaseRoadmap />
      </main>

      <footer className="border-t border-zinc-800 mt-16">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <span>TWO BITS — Solana Agent Registry Hackathon</span>
          <div className="flex items-center gap-4">
            <a
              href="https://solana.com/agent-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 underline underline-offset-2"
            >
              Agent Registry
            </a>
            <a
              href="https://8004.qnt.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 underline underline-offset-2"
            >
              8004 SDK Docs
            </a>
            <a
              href="https://explorer.solana.com/?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 underline underline-offset-2"
            >
              Solana Explorer (devnet)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
