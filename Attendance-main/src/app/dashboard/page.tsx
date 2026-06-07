import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { ALL_ROLES, ROLES } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { getProfileBySession } from "@/lib/firebase/admin";
import { USE_MOCK } from "@/lib/firebase/config";
import { cookies } from "next/headers";

export const metadata = { title: "Choose workspace" };

export default async function DashboardPicker() {
  if (!USE_MOCK) {
    const profile = await getProfileBySession(cookies());
    if (profile?.role) redirect(`/dashboard/${profile.role}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Logo />
        <ThemeToggle />
      </header>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-medium text-amber-500">Demo workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Choose a role to explore
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          SmartCampus Attend is multi-tenant and role-aware. Each role has a tailored
          dashboard, permissions, and workflows. Pick one to step inside.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_ROLES.map((role) => {
            const c = ROLES[role];
            return (
              <Link key={role} href={`/dashboard/${role}`}>
                <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
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
                  <p className="mt-3 text-xs text-muted-foreground/70">
                    {c.nav.length} modules
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
