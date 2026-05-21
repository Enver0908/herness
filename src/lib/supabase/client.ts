"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";

export function createClient() {
  const { anonKey, url } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
