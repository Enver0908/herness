import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseConfig } from "@/lib/env";

export function createAdminClient() {
  const serviceRoleKey = getServiceRoleKey();

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server writes.");
  }

  const { url } = getSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
