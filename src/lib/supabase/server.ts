import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";

export async function createClient() {
  const { anonKey, url } = getSupabaseConfig();
  const cookieStore = await cookies();
  const secureCookies = false;

  return createServerClient(url, anonKey, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: secureCookies,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: secureCookies,
            });
          });
        } catch {
          // Server Components cannot set cookies. Auth mutations use route
          // handlers/actions where cookie writes are allowed.
        }
      },
    },
  });
}
