import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { ALL_ROLES, ROLES } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { getProfileBySession } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export const metadata = { title: "Choose your workspace" };
export default async function DashboardPicker() {
  const profile = await getProfileBySession(await cookies());
  if (!profile) {
    redirect("/login?session_expired=1");
  }
  if (profile?.role) {
    if (profile.role === "facilitator") {
      redirect(`/dashboard/facilitator/${profile.uid}`);
    } else {
      redirect(`/dashboard/${profile.role}`);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Logo />
        <ThemeToggle />
      </header>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-medium text-amber-500">Production workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Choose your workspace role
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          SmartCampus Attend is multi-tenant and role-aware. Each role has a tailored
          dashboard, permissions, and workflows. Select the role you want to access.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_ROLES.length === 0 ? (
            <div className="rounded-lg border border-border bg-card/50 p-6 text-sm text-muted-foreground">
              No roles are configured.
            </div>
          ) : (
            <ul className="contents">
              {ALL_ROLES.map((role) => {
                const c = ROLES[role];
                return (
                  <li key={role}>
                    <Link href={`/login/${role}`} aria-label={`Open ${c.label} login portal`}>
                      <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "rounded-lg px-2 py-1 text-xs font-medium",
                              c.accent === "amber"
                                ? "bg-amber-500/15 text-amber-500"
                                : "bg-wine-500/15 text-wine-400"
                            )}
                          >
                            {c.label}
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">{c.tagline}</p>
                        <p className="mt-3 text-xs text-muted-foreground/70">{c.nav.length} modules</p>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
