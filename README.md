# Autonomous Agent Hiring & Delegation Network

**TWO BITS — Solana Agent Registry Hackathon**

A Next.js application that lets a requesting AI agent discover specialized agents by their on-chain identity, evaluate their reputation scores from the ATOM program, delegate a task to the best candidate, validate the result, and write verifiable feedback back to the Solana registry — closing the trust loop entirely on-chain.

Built for the **"Best Use of the Solana Agent Registry"** challenge.

---

## What Is the Solana Agent Registry?

The [Solana Agent Registry](https://solana.com/agent-registry) is an open on-chain protocol implementing the [ERC-8004 "Trustless Agents"](https://eips.ethereum.org/EIPS/eip-8004) standard. It provides three registries:

| Registry | On-Chain Primitive |
|---|---|
| **Identity** | Each agent is a Metaplex Core NFT. Ownership is transferable; metadata resolves to a JSON registration file on IPFS. |
| **Reputation (ATOM)** | Feedback scores posted on-chain, aggregated into a 5-tier trust system (Bronze → Platinum). |
| **Validation** | Request/response hooks for independent third-party validators (stakers, TEE oracles, zkML verifiers). |

---

## Verified Technology Stack

| Technology | Version | Why |
|---|---|---|
| **Next.js** | 15.5.28 | Full-stack framework — React UI + API routes. API routes run server-side, keeping private keys away from the browser. |
| **React** | 19 | UI library, bundled with Next.js |
| **TypeScript** | 5.x | Type safety across SDK types and API contracts |
| **Tailwind CSS** | 4.x | Utility styling |
| **8004-solana** | 0.8.5 | Official TypeScript SDK for the Solana Agent Registry (Identity, ATOM Reputation, ProofPass feedback) |
| **@solana/web3.js** | 1.99.0 | Solana primitives — keypairs, connections, RPC calls |

**Not used:** Vite, Create React App, or any Vite-based templates.

---

## Project Structure

```
t2c1-two-bits/
├── app/
│   ├── api/
│   │   └── health/
│   │       └── route.ts      # GET /api/health — server-side devnet probe
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Main dashboard (client component)
├── lib/
│   └── registry.ts           # Server-only SDK wrapper (read-only, Phase 1)
├── public/
├── .env.example              # Template — copy to .env.local
├── .gitignore                # .env* entries are already included
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## On-Chain vs Application Logic

This distinction is clearly labeled throughout the project.

| Action | Where | On-Chain? |
|---|---|---|
| Agent registration (NFT mint) | Solana devnet | ✅ |
| Read agent identity | 8004-solana SDK | ✅ |
| Reputation score lookup | ATOM program | ✅ |
| Post feedback after task | ATOM program | ✅ |
| ProofPass verified feedback | 8004 registry | ✅ |
| Agent discovery via indexer | 8004-indexer-dev.qnt.sh | ✅ (indexed on-chain data) |
| Agent selection algorithm | Orchestrator module | ❌ App-level |
| Task delegation | HTTP/A2A | ❌ App-level |
| Mock agent execution | In-process functions | ❌ Simulated |

---

## On-Chain Program IDs (Devnet)

| Program | Address |
|---|---|
| Agent Registry (8004) | `6MuHv4dY4p9E4hSCEPr9dgbCSpMhq8x1vrUexbMVjfw1` |
| ATOM Reputation Engine | `6Mu7qj6tRDrqchxJJPjr9V1H2XQjCerVKixFEEMwC1Tf` |

Source: [8004.qnt.sh](https://8004.qnt.sh)

---

## Prerequisites

- **Node.js >= 20.19.0** (project uses Node 24 during development)
- **npm >= 10**
- A Solana devnet wallet is only needed for Phase 2+ (write operations)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/HackToBerFest-VVCE/t2c1-two-bits.git
cd t2c1-two-bits

# Install dependencies
npm install
```

---

## Environment Configuration

Copy the example file and fill in values as needed for each phase:

```bash
cp .env.example .env.local
```

**Phase 1** requires no environment variables — the default public devnet RPC is used automatically.

**Phase 2+** will require:
- `SOLANA_PRIVATE_KEY` — a devnet-only keypair as a JSON byte array
- `PINATA_JWT` — for IPFS uploads via Pinata

> ⚠️ Never commit `.env.local`. It is already covered by `.gitignore`.

---

## Running the Application

```bash
# Development server (do NOT use --turbopack)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Production build (verification)
npm run build
```

---

## Testing the Devnet Connectivity Check

The single Phase 1 integration point is `GET /api/health`. It runs server-side, calls `Connection.getSlot()` against the Solana devnet RPC, and returns a JSON result.

```bash
# While the dev server is running:
curl http://localhost:3000/api/health
```

Expected successful response:
```json
{
  "ok": true,
  "cluster": "devnet",
  "rpcUrl": "https://api.devnet.solana.com",
  "currentSlot": 123456789,
  "rpcHealth": "ok",
  "checkedAt": "2026-10-24T07:00:00.000Z"
}
```

The dashboard also runs this check automatically on page load and shows the result with a re-check button.

---

## Phase Roadmap

| Phase | Goal | Status |
|---|---|---|
| **1** | Scaffold + devnet connectivity | ✅ Complete |
| **2** | Agent registration & discovery UI | Pending approval |
| **3** | Task delegation & mock agent execution | Pending |
| **4** | Result validation & on-chain feedback | Pending |
| **5** | Polish, demo flow, final README | Pending |

---

## Security Notes

- Private keys live only in `.env.local` (server-side, git-ignored)
- No `NEXT_PUBLIC_` variables carry secrets
- The `8004-solana` SDK is only imported in `lib/registry.ts` and API routes — never in client components
- `next.config.ts` marks `8004-solana` and `@solana/web3.js` as `serverExternalPackages` to prevent accidental client-side bundling

---

## Audit Note

`npm audit` reports 8 advisories after installation:

- **1 high** — `postcss <=8.5.22` (XSS/path-traversal in CSS stringify). This postcss is a transitive dependency of Next.js 15. The fix requires Next.js 16 (beta). Not applicable to our usage as we do not process untrusted CSS input. This will resolve when Next.js 16 reaches stable.
- **7 moderate** — `stream-json`/`uuid` via `jayson` via `@solana/web3.js`. No fix is available upstream. These are in the JSON-RPC transport layer used by the Solana web3 library; not exposed to user input in our server-side read-only API routes.

Neither issue is exploitable in our current architecture. They are documented here for transparency.

---

## Links

- [Solana Agent Registry](https://solana.com/agent-registry)
- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [8004-solana SDK](https://github.com/QuantuLabs/8004-solana-ts)
- [8004 SDK Docs](https://8004.qnt.sh)
- [Solana Explorer (devnet)](https://explorer.solana.com/?cluster=devnet)
- [SATI Dashboard](https://github.com/cascade-protocol/sati)
