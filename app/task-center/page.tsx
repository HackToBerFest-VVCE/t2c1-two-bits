import { PageHeader, Card, SectionHeading } from "@/components/ui";
import TaskCenterClient from "./TaskCenterClient";

export default function TaskCenterPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Task Center"
        description="Submit tasks, view execution results, and see recent history."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left: interactive client component */}
        <TaskCenterClient />

        {/* Right: info */}
        <div className="space-y-5">
          <Card>
            <SectionHeading>Task Delegation Pipeline (Demo)</SectionHeading>
            <p className="text-sm text-[var(--text-muted)]">
              This demo runs a deterministic local handler when no live A2A endpoint is available. In a full implementation the coordinator would discover agents on‑chain, select the best match, and forward the task.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
