"use client";

/**
 * app/task-center/page.tsx
 * Task Center — Phase 3 shell.
 */

import {
  Badge,
  Card,
  SectionHeading,
  EmptyState,
  ComingSoonBanner,
  PageHeader,
} from "@/components/ui";

const WORKFLOW_STEPS = [
  {
    num: "1",
    label: "Describe Task",
    detail: "User provides a natural-language task description.",
    phase: 3,
  },
  {
    num: "2",
    label: "Discover Agents",
    detail: "Orchestrator reads on-chain identities and reputation via 8004-solana SDK.",
    phase: 3,
  },
  {
    num: "3",
    label: "Select Best Match",
    detail: "Application-level ranking by ATOM score, skill match, and liveness.",
    phase: 3,
  },
  {
    num: "4",
    label: "Delegate",
    detail: "Task sent to agent's A2A or MCP endpoint. Result collected.",
    phase: 3,
  },
  {
    num: "5",
    label: "Validate & Feedback",
    detail: "Result validated. giveFeedback() or openProofPass() writes score on-chain.",
    phase: 4,
  },
];

function WorkflowReference() {
  return (
    <Card>
      <SectionHeading>Delegation Pipeline</SectionHeading>
      <div className="space-y-3">
        {WORKFLOW_STEPS.map((step) => (
          <div
            key={step.num}
            className="flex items-start gap-4 p-3 rounded-md"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              {step.num}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {step.label}
                </span>
                <Badge variant={step.phase === 3 ? "blue" : "violet"}>
                  Phase {step.phase}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TaskFormShell() {
  return (
    <Card>
      <SectionHeading>Submit a Task</SectionHeading>
      <ComingSoonBanner
        phase={3}
        label="Task submission and agent delegation will be wired up in Phase 3."
      />
      <div className="space-y-3" style={{ opacity: 0.45, pointerEvents: "none" }}>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Task Type</label>
          <div className="flex flex-wrap gap-2">
            {["Summarization", "Code Review", "Data Analysis", "Translation"].map((t) => (
              <button key={t} className="badge badge-outline" style={{ padding: "5px 12px" }}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Task Description</label>
          <textarea
            className="task-textarea"
            rows={4}
            placeholder="Describe the task…"
            readOnly
          />
        </div>
        <button className="btn btn-primary btn-md w-full" disabled>
          Find &amp; Delegate to Best Agent
        </button>
      </div>
    </Card>
  );
}

function ResultPanel() {
  return (
    <Card>
      <SectionHeading>Task Result</SectionHeading>
      <EmptyState
        icon={
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <path d="M5 8h6M5 5.5h4" strokeLinecap="round" />
          </svg>
        }
        title="No task submitted yet"
        subtitle="Once a task is delegated in Phase 3, the selected agent, reasoning trace, result, and on-chain feedback transaction will appear here."
      />
    </Card>
  );
}

export default function TaskCenterPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Task Center"
        description="Submit tasks, review agent selection reasoning, inspect delegation results, and track on-chain validation records."
        actions={<Badge variant="blue">Phase 3</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <TaskFormShell />
          <ResultPanel />
        </div>
        <WorkflowReference />
      </div>
    </div>
  );
}
