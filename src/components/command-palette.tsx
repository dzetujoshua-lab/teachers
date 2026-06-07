"use client";

import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  ClipboardCheck,
  UtensilsCrossed,
  ShieldCheck,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { ALL_ROLES, ROLES } from "@/lib/roles";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onCustomEvent = () => setOpen((o) => !o);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("smartcampus:open-palette", onCustomEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("smartcampus:open-palette", onCustomEvent);
    };
  }, []);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-charcoal-950/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        loop
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <CommandInput
            autoFocus
            placeholder="Search dashboards, actions, students..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <CommandList className="max-h-80 overflow-y-auto p-2">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>

          <CommandGroup
            heading="Dashboards"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
          >
            {ALL_ROLES.map((role) => (
              <CommandItem
                key={role}
                value={`dashboard ${ROLES[role].label}`}
                onSelect={() => go(`/dashboard/${role}`)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground data-[selected=true]:bg-accent aria-selected:bg-accent"
              >
                <LayoutDashboard className="size-4 text-muted-foreground" />
                {ROLES[role].label} Dashboard
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup
            heading="Quick actions"
            className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
          >
            <CommandItem
              value="take attendance session start"
              onSelect={() => go("/dashboard/facilitator/session")}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent aria-selected:bg-accent"
            >
              <ClipboardCheck className="size-4 text-muted-foreground" />
              Start attendance session
            </CommandItem>
            <CommandItem
              value="kitchen menu meals manage"
              onSelect={() => go("/dashboard/kitchen_manager/menu")}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent aria-selected:bg-accent"
            >
              <UtensilsCrossed className="size-4 text-muted-foreground" />
              Manage daily menu
            </CommandItem>
            <CommandItem
              value="fraud detection security review"
              onSelect={() => go("/dashboard/security_officer/fraud")}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent aria-selected:bg-accent"
            >
              <ShieldCheck className="size-4 text-muted-foreground" />
              Review fraud reports
            </CommandItem>
            <CommandItem
              value="toggle theme dark light mode"
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm data-[selected=true]:bg-accent aria-selected:bg-accent"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-4 text-muted-foreground" />
              ) : (
                <Moon className="size-4 text-muted-foreground" />
              )}
              Toggle theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
