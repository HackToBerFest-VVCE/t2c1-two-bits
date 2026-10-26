// lib/supabase.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ConfigurationError } from "@/lib/registry";

/**
 * Server‑only Supabase client singleton.
 * Reads SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY from the environment.
 * Throws a ConfigurationError if either variable is missing.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new ConfigurationError(
      "SUPABASE_URL is not set. Add it to .env.local (see .env.example)."
    );
  }
  if (!anonKey) {
    throw new ConfigurationError(
      "SUPABASE_PUBLISHABLE_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }

  _client = createClient(url, anonKey);
  return _client;
}
