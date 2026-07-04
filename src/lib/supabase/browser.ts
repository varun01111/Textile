"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv, hasPublicSupabaseEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!hasPublicSupabaseEnv()) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  if (browserClient) {
    return browserClient;
  }

  const env = getPublicSupabaseEnv();
  browserClient = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return browserClient;
}
