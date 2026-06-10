"use client";

import * as React from "react";
import Link from "next/link";

const OPEN_PALETTE_EVENT = "smartcampus:open-palette";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { ChatWindow } from "@/components/notifications/ChatWindow";
import type { Role, Person } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DisplayUser = Person & {
  platformUserId?: string;
  uid?: string;
};

export function Topbar({ role }: { role: Role }) {
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  const unread = notifications.filter((n) => !n.read).length;

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [notificationDetails, setNotificationDetails] = React.useState<any | null>(null);

  const [currentUser, setCurrentUser] = React.useState<DisplayUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const payload = await response.json();
        setCurrentUser(payload.profile);
      } catch (error) {
        console.error("Error fetching authentic Firebase session:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [role]);

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/admin/firestore?collection=notifications`);
        const data = await res.json();

        const rows = (data?.rows ?? []).filter((n: any) => {
          const audienceRole = String(n?.audienceRole ?? "").trim();
          const audienceId = String(n?.facilitatorId ?? n?.audienceId ?? "").trim();
          return (
            audienceRole === String(role).trim() ||
            (role === "facilitator" && audienceId && audienceId === currentUser?.id)
          );
        });

        rows.sort((a: any, b: any) => {
          const at = String(a?.time ?? a?.createdAt ?? "");
          const bt = String(b?.time ?? b?.createdAt ?? "");
          return bt.localeCompare(at);
        });

        setNotifications(
          rows.map((n: any) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            time: n.time ?? n.createdAt ?? new Date().toISOString(),
            read: Boolean(n.read),
            ...n,
          }))
        );
      } catch {
        setNotifications([]);
      }
    };

    fetchNotifications();
    
    const hourlyRefresh = setInterval(fetchNotifications, 60 * 60 * 1000);
    return () => clearInterval(hourlyRefresh);
  }, [role, currentUser?.id]);

  const userToDisplay =
    currentUser ||
    ({
      id: "authenticated-user",
      uid: "authenticated-user",
      name: "SmartCampus User",
      email: "user@campus.edu",
      role,
      avatarColor: "#7C3AED",
    }) satisfies DisplayUser;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <button
        onClick={() => document.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))}
        className="flex h-9 flex-1 max-w-md items-center gap-2 rounded-lg border border-border bg-card/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/50"
        aria-label="Search"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search or jump to...</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">
          Ctrl K
        </kbd>
      </button>

      <div className="flex flex-1 items-center justify-end gap-1.5">
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-xs font-medium">
            {loading ? "Loading profile..." : userToDisplay.name}
          </p>
          {!loading && (
            <p className="truncate text-[10px] text-muted-foreground">
              {userToDisplay.platformUserId ?? userToDisplay.id}
            </p>
          )}
        </div>

        <div className="relative">
          <NotificationBell unreadCount={unread} onClick={() => setNotifOpen((o) => !o)} />
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <NotificationPanel
                notifications={notifications as any}
                onClose={() => setNotifOpen(false)}
                onSelectNotification={(n: any) => {
                  setNotifOpen(false);
                  if (!n.read) {
                    setNotifications((prev) =>
                      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                    );
                  }
                  setNotificationDetails(n);

                  // For message-type notifications with conversation, open chat; otherwise show details modal
                  if (n.type === "message" && n.conversation) {
                    setChatOpen(true);
                  } else {
                    setDetailsOpen(true);
                  }
                }}
              />
            </>
          )}
        </div>

        <ThemeToggle />

        <Link href="/dashboard" className="ml-1">
          <Avatar name={userToDisplay.name} color={userToDisplay.avatarColor} size="md" />
        </Link>
      </div>

      {detailsOpen && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Notification Details</DialogTitle>
            </DialogHeader>
            {notificationDetails?.body ? (
              <div className="text-sm text-muted-foreground">{notificationDetails.body}</div>
            ) : (
              <div className="text-sm text-muted-foreground">No content available.</div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {chatOpen && (
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="max-w-2xl p-0">
            {notificationDetails?.conversation ? (
              <ChatWindow
                conversation={notificationDetails.conversation}
                initialMessages={notificationDetails.chatHistory ?? []}
                onClose={() => setChatOpen(false)}
              />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">No conversation available.</div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}