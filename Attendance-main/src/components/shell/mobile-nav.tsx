"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname() ?? "";
  const items = ROLES[role].nav.slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
              active ? "text-amber-500" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            <span className="max-w-[64px] truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
