import { NextRequest, NextResponse } from "next/server";


import { promises as fs } from "fs";
import path from "path";

// Types (mirroring client)
type Task = {
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

const DATA_DIR = path.join(process.cwd(), "data");
const REGISTRY_FILE = path.join(DATA_DIR, "tasks.json");
const FALLBACK_REGISTRY_FILE = path.join(__dirname, "../../../data/tasks.json");

async function loadTasks(): Promise<Task[]> {
  try {
    const raw = await fs.readFile(REGISTRY_FILE, "utf-8");
    return JSON.parse(raw) as Task[];
  } catch {
    try {
      const raw = await fs.readFile(FALLBACK_REGISTRY_FILE, "utf-8");
      return JSON.parse(raw) as Task[];
    } catch {
      return [];
    }
  }
}

async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(tasks, null, 2), "utf-8");
  } catch {
    // fallback location (for when cwd is .next)
    const fallbackDir = path.join(__dirname, "../../../data");
    await fs.mkdir(fallbackDir, { recursive: true });
    await fs.writeFile(path.join(fallbackDir, "tasks.json"), JSON.stringify(tasks, null, 2), "utf-8");
  }
}

function deterministicDemo(task: Omit<Task, "id" | "mode" | "status" | "result" | "createdAt">): { result: string; mode: "demo" } {
  const base = `Demo execution for "${task.title}" (${task.category})`;
  const detail = `Processed ${task.description.length} characters.`;
  return { result: `${base}: ${detail}`, mode: "demo" };
}

export const dynamic = "force-dynamic";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function GET(_: NextRequest): Promise<NextResponse> {
  const tasks = await loadTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }
  const { title, description, category } = body as { title?: unknown; description?: unknown; category?: unknown };
  if (typeof title !== "string" || typeof description !== "string" || typeof category !== "string") {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const agentIdValue = (body as { agentId?: unknown }).agentId;
  if (agentIdValue !== undefined && typeof agentIdValue !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid agentId" }, { status: 400 });
  }
     const agentId = agentIdValue;
   // Create task record (no live agent selection for now)
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const demo = deterministicDemo({ title, description, category });
  const task: Task = {
    id,
    title,
    description,
    category,
    agentId,
    mode: demo.mode,
  status: "completed",
    result: demo.result,
    createdAt,
  };

  const existing = await loadTasks();
  existing.unshift(task);
  await saveTasks(existing);

  return NextResponse.json({ ok: true, task });
}
