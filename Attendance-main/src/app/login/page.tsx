import Link from "next/link";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/roles";

import { cn } from "@/lib/utils";

export const metadata = { title: "Choose your login page" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-medium text-amber-500">Role-based login</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose your login page</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Every campus role has a dedicated login flow backed by Firebase Auth, Firestore profiles, and a demo registry for local exploration.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_ROLES.map((role) => (
            <Link key={role} href={`/login/${role}`}>
              <div
                className={cn(
                  "group rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg",
                  "flex flex-col justify-between gap-4"
                )}
              >
                <div>
                  <p className="text-sm font-semibold">{ROLE_LABELS[role]}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{role.replace("_", " ")}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-500">Open login</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-border bg-card p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Sign in</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Use the role-specific login pages to sign in with your institution credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Need help?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If you already have credentials but forgot your password, use the password reset flow.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/reset-password" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
              Reset password
            </Link>
            <Link href="/change-password" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-amber-500 hover:text-amber-500">
              Change password
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
