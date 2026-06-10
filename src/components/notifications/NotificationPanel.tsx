"use client";

import * as React from "react";
import { MessageSquare, AlertTriangle, ClipboardList, Utensils, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { NotificationItem } from "@/lib/mock-data";
import { relativeTime } from "@/lib/utils";

const typeIcons: Record<string, React.ReactNode> = {
  message: <MessageSquare className="size-4 text-indigo-400" />,
  alert: <AlertTriangle className="size-4 text-amber-400" />,
  attendance: <ClipboardList className="size-4 text-emerald-400" />,
  meal: <Utensils className="size-4 text-orange-400" />,
  schedule: <CalendarDays className="size-4 text-blue-400" />,
  system: <Settings className="size-4 text-slate-400" />,
};

interface NotificationPanelProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onSelectNotification: (notification: NotificationItem) => void;
}

export function NotificationPanel({ notifications, onClose, onSelectNotification }: NotificationPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Notifications</p>
          <Badge variant="wine" className="h-5 px-1.5 text-[10px]">
            {notifications.filter((n) => !n.read).length} new
          </Badge>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close notifications"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="max-h-[28rem] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="rounded-full bg-muted/50 p-3">
              <svg className="size-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground/70">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => onSelectNotification(notification)}
                className={cn(
                  "group flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-accent/70",
                  !notification.read ? "bg-accent/40" : "bg-transparent"
                )}
              >
                <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                  <span className="rounded-lg bg-muted/60 p-1.5 ring-1 ring-border/40">
                    {typeIcons[notification.type] ?? typeIcons.system}
                  </span>
                  <div className="relative">
                    <Avatar
                      name={notification.senderName}
                      color={notification.senderAvatarColor}
                      size="sm"
                      className="size-6 text-[9px]"
                    />
                    {notification.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate text-sm font-semibold", !notification.read && "text-foreground")}>
                      {notification.title}
                    </p>
                    {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-wine-500 ring-2 ring-background" />}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground/80">{relativeTime(notification.time)}</p>
                </div>

                <div className="mt-1 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card/60 text-[10px] text-muted-foreground">
                    View
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
