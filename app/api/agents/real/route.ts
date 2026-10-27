import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * Real AI agent endpoint – compatible with lib/agentDelegation contract.
 * Accepts POST JSON { title, description, category }.
 * Returns { result: string } on success.
 */
export const dynamic = "force-dynamic";

// Configuration – read API key only on server side.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-mini"; // cheap, fast model
const TIMEOUT_MS = 8000; // 8 seconds default
const MAX_REQUEST_SIZE = 10 * 1024; // 10 KB
const MAX_RESULT_LENGTH = 2000; // characters

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Enforce content‑type
  if (request.headers.get("content-type")?.includes("application/json") !== true) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }

  // Reject overly large bodies (Next.js streams request body; we use text())
  const raw = await request.text();
  if (raw.length > MAX_REQUEST_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { title, description, category } = payload as {
    title?: unknown;
    description?: unknown;
    category?: unknown;
  };

  // Basic validation & size limits
  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof category !== "string"
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "Title too long" }, { status: 400 });
  }
  if (description.length > 5000) {
    return NextResponse.json({ error: "Description too long" }, { status: 400 });
  }

  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing");
    return NextResponse.json({ error: "Agent configuration missing" }, { status: 500 });
  }

  const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  const prompt = `You are an autonomous assistant. Perform the following request:\n\nTitle: ${title}\nDescription: ${description}\nCategory: ${category}\n\nProvide a concise answer.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    }, { signal: controller.signal });
    clearTimeout(timeout);
    const rawResult = completion.choices?.[0]?.message?.content ?? "";
    const sanitized = rawResult.trim().slice(0, MAX_RESULT_LENGTH);
    return NextResponse.json({ result: sanitized }, { status: 200 });
  } catch (e: unknown) {
    clearTimeout(timeout);
    console.error("Agent error:", e);
    return NextResponse.json({ error: "Agent processing failed" }, { status: 500 });
  }
}
