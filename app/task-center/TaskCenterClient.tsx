"use client";

import { Card, SectionHeading, EmptyState, DataRow } from "@/components/ui";
import { useEffect, useState } from "react";

type AgentRecord = {
  agentId: string;
  asset: string;
  // other fields may be present
};

  id: string;
  title: string;
  description: string;
  category: string;
  agentId?: string;
  mode: "demo" | "live";
  status: "submitted" | "executing" | "completed" | "failed";
  result?: string;
  createdAt: string;
};

type AgentRecord = {
  agentId: string;
  asset: string;
  // other fields may be present
};

export default function TaskCenterClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading] = useState(true);

  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agents/registered")
      .then((r) => r.json())
      .then((data) => {
        setAgents(data.records ?? []);
        setAgentsLoading(false);
      })
      .catch(() => setAgentsLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, agentId: selectedAgentId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setTasks((prev) => [data.task, ...prev]);
      setTitle("");
      setDescription("");
      setCategory("general");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading>Submit a Task</SectionHeading>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Title</label>
            <input
              className="task-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summarize a paper"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Description</label>
            <textarea
              className="task-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task in detail…"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Category</label>
            <select
              className="task-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="research">Research / Summarization</option>
              <option value="coding">Code Review / Generation</option>
              <option value="analysis">Data Analysis</option>
              <option value="general">General Assistance</option>
            </select>
          </div>
                      <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Agent</label>
              {agentsLoading ? (
                <p className="text-sm text-[var(--text-muted)]">Loading agents…</p>
              ) : agents.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No registered agents. Register an agent first.</p>
              ) : (
                <select
                  className="task-select"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                >
                  <option value="">-- None (Demo) --</option>
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>
                      {a.asset} ({a.agentId})
                    </option>
                  ))}
                </select>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" className="btn btn-primary btn-md w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Task"}
          </button>
        </form>
      </Card>

      <Card>
        <SectionHeading>Recent Tasks</SectionHeading>
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <path d="M5 8h6M5 5.5h4" strokeLinecap="round" />
              </svg>
            }
            title="No tasks yet"
            subtitle="Submit a task to see it appear here."
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.id} className="border rounded p-3">
                <DataRow label="ID">{t.id}</DataRow>
                <DataRow label="Title">{t.title}</DataRow>
                <DataRow label="Category">{t.category}</DataRow>
                <DataRow label="Mode">{t.mode === "live" ? "Live Agent" : "Simulated Demo"}</DataRow>
                {t.agentId && <DataRow label="Agent">{t.agentId}</DataRow>}
                <DataRow label="Status">{t.status}</DataRow>
                {t.result && <DataRow label="Result">{t.result}</DataRow>}
                <DataRow label="Created">{new Date(t.createdAt).toLocaleString()}</DataRow>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
