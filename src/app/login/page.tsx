import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { isAppConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isAppConfigured()) {
    return <SetupScreen />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-blue)]">
            <ShieldCheck aria-hidden="true" className="text-white" size={18} />
          </div>
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            HostOps CZ
          </span>
        </div>

        {/* Card */}
        <section className="panel p-6">
          <h1 className="text-center text-base font-semibold text-[var(--text-primary)]">
            Sign in to operations
          </h1>
          <p className="mt-1 text-center text-xs text-[var(--text-tertiary)]">
            Manage guests, compliance, and AI drafts
          </p>

          <form action="/api/auth/sign-in" className="mt-6 grid gap-4" method="post">
            <label className="field-label">
              Email
              <input
                className="field-input"
                inputMode="email"
                name="email"
                placeholder="you@company.com"
                required
                type="text"
              />
            </label>
            <label className="field-label">
              Password
              <input
                className="field-input"
                name="password"
                placeholder="••••••••"
                required
                type="password"
              />
            </label>
            {error ? (
              <p className="rounded-md bg-[var(--accent-red-soft)] px-3 py-2 text-xs font-medium text-[var(--accent-red)]">
                {error}
              </p>
            ) : null}
            <button className="btn-primary mt-1 justify-center py-2.5 text-sm" type="submit">
              <LockKeyhole aria-hidden="true" size={14} />
              Sign in
            </button>
          </form>
        </section>

        {/* Trust signal */}
        <p className="mt-4 text-center text-[0.6875rem] text-[var(--text-muted)]">
          Secured by Supabase Auth · Data encrypted at rest
        </p>
      </div>
    </main>
  );
}

function SetupScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4">
      <section className="panel max-w-lg p-6">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-amber-soft)]">
          <ShieldCheck aria-hidden="true" className="text-[var(--accent-amber)]" size={18} />
        </div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Setup required
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Add <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs font-mono">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,{" "}
          <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs font-mono">SUPABASE_SERVICE_ROLE_KEY</code>, and{" "}
          <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs font-mono">PII_ENCRYPTION_KEY</code> to{" "}
          <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs font-mono">.env.local</code>, then run the migration in{" "}
          <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs font-mono">supabase/migrations</code>.
        </p>
      </section>
    </main>
  );
}
