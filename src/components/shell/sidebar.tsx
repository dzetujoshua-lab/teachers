"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LifeBuoy, LogOut } from "lucide-react";
import { Logo } from "@/components/brand";
import { ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const config = ROLES[role];

  // Extract facilitator UID from pathname if applicable
  const facilitatorUidMatch = pathname.match(/^\/dashboard\/facilitator\/([^/]+)/);
  const facilitatorUid = facilitatorUidMatch ? facilitatorUidMatch[1] : null;

  // Build nav hrefs - for facilitators, prefix with their UID
  const getNavHref = (href: string) => {
    if (role === "facilitator" && facilitatorUid) {
      // Replace /dashboard/facilitator with /dashboard/facilitator/{uid}
      return href.replace("/dashboard/facilitator", `/dashboard/facilitator/${facilitatorUid}`);
    }
    return href;
  };

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      <div className="px-3 py-4">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              config.accent === "amber" ? "bg-amber-500" : "bg-wine-500"
            )}
          />
          <div className="leading-tight">
            <p className="text-xs font-semibold">{config.label}</p>
            <p className="text-[10px] text-muted-foreground">{config.tagline}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {config.nav.map((item) => {
            const navHref = getNavHref(item.href);
            const active =
              pathname === navHref ||
              (navHref !== `/dashboard/${role}` && (facilitatorUid
                ? pathname.startsWith(navHref.replace(facilitatorUid, "[uid]"))
                : pathname.startsWith(navHref)));
            const Icon = item.icon;
            return (
              <Link
                key={navHref}
                href={navHref}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active
                      ? config.accent === "amber"
                        ? "text-amber-500"
                        : "text-wine-400"
                      : ""
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant={config.accent === "amber" ? "warning" : "wine"}>
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          <LifeBuoy className="size-4" />
          Help & Support
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
