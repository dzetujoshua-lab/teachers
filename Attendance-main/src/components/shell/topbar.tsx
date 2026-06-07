"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Custom event so the search button and Ctrl K shortcut share one code path.
const OPEN_PALETTE_EVENT = "smartcampus:open-palette";
import { Bell, Search, ChevronDown, Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ALL_ROLES, ROLES } from "@/lib/roles";
import { useNotifications } from "@/lib/firebase/data";
import type { Role, Person } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";

export function Topbar({ role }: { role: Role }) {
  const router = useRouter();
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const { rows: notifications = [] } = useNotifications();
  const unread = (notifications || []).filter((n) => !n.read).length;

  const [currentUser, setCurrentUser] = React.useState<Person | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data?.profile) setCurrentUser(data.profile as Person);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCurrentUser();
    return () => {
      mounted = false;
    };
  }, [role]);

  const userToDisplay = currentUser || {
    id: "demo",
    name: "Campus User",
    email: "noreply@campus.edu",
    role,
    avatarColor: "#c52a58",
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <button
        onClick={() => document.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))}
        className="flex h-9 flex-1 max-w-md items-center gap-2 rounded-lg border border-border bg-card/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/50"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search or jump to...</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">
          Ctrl K
        </kbd>
      </button>

      <div className="flex flex-1 items-center justify-end gap-1.5">
        {/* Role switcher (demo) */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleOpen((o) => !o);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 text-xs font-medium transition-colors hover:bg-accent/50"
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                ROLES[role].accent === "amber" ? "bg-amber-500" : "bg-wine-500"
              )}
            />
            <span className="hidden sm:inline">{ROLES[role].label}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          {roleOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRoleOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl">
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Switch role
                </p>
                {ALL_ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      router.push(`/dashboard/${r}`);
                      setRoleOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent"
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        ROLES[r].accent === "amber" ? "bg-amber-500" : "bg-wine-500"
                      )}
                    />
                    <span className="flex-1 text-left">{ROLES[r].label}</span>
                    {r === role && <Check className="size-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              setRoleOpen(false);
            }}
            className="relative grid h-10 w-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
            {unread > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-wine-500 ring-2 ring-background" />
            )}
          </button>
{notifOpen && (
           <>
             <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
             <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
               <div className="flex items-center justify-between border-b border-border px-4 py-3">
                 <p className="text-sm font-semibold">Messages</p>
                 {unread > 0 && <Badge variant="wine">{unread} unread</Badge>}
               </div>
               <div className="max-h-80 overflow-y-auto p-3">
                 {notifications.length === 0 ? (
                   <div className="px-2 py-4 text-center text-sm text-muted-foreground">No messages yet</div>
                 ) : (
                   notifications.map((n) => (
                     <div
                       key={n.id}
                       className={cn(
                         "mb-2 rounded-lg border border-border bg-card p-3 text-sm",
                         n.type === "system" && "border-l-2 border-l-amber-500",
                         n.type === "security" && "border-l-2 border-l-wine-500"
                       )}
                     >
                       <p className="font-medium">{n.title}</p>
                       <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                       <p className="mt-2 text-[10px] text-muted-foreground">{relativeTime(n.time)}</p>
                     </div>
                   ))
                 )}
               </div>
             </div>
           </>
         )}
        </div>

        <ThemeToggle />

        <Link href="/dashboard" className="ml-1">
          <Avatar name={userToDisplay.name} color={userToDisplay.avatarColor} size="md" />
        </Link>
      </div>
    </header>
  );
}
