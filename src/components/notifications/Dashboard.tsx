"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatWindow } from "@/components/notifications/ChatWindow";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { NotificationItem } from "@/lib/firebase/data";
import { MessageSquare, Bell, User } from "lucide-react";

export function NotificationDashboard() {
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [selectedNotification, setSelectedNotification] = React.useState<NotificationItem | null>(null);
  const [localNotifications, setLocalNotifications] = React.useState<NotificationItem[]>([]);

  const unreadCount = localNotifications.filter((n) => !n.read).length;

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/admin/firestore?collection=notifications");
        const data = await res.json();
        const rows = data?.rows ?? [];
        setLocalNotifications(rows);
      } catch {
        // Keep existing notifications on error
      }
    };

    fetchNotifications();

    const hourlyRefresh = setInterval(fetchNotifications, 60 * 60 * 1000);
    return () => clearInterval(hourlyRefresh);
  }, []);

  const handleTogglePanel = React.useCallback(() => {
    setIsPanelOpen((prev) => !prev);
  }, []);

  const handleClosePanel = React.useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const handleSelectNotification = React.useCallback((notification: NotificationItem) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === notification.id && !n.read ? { ...n, read: true } : n))
    );

    // Requirement: only "message" notifications open the chat UI.
    if (notification.type === "message" && notification.conversation) {
      setSelectedNotification(notification);
    } else {
      setSelectedNotification(null);
    }

    setIsPanelOpen(false);
  }, []);


  const handleBackToNotifications = React.useCallback(() => {
    setSelectedNotification(null);
    setIsPanelOpen(true);
  }, []);

  const selectedConversation =
    selectedNotification?.type === "message" ? selectedNotification?.conversation : undefined;
  const selectedMessages = selectedConversation ? (selectedNotification?.chatHistory ?? []) : [];


  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-wine-700 p-2.5 shadow-lg shadow-amber-500/20">
              <Bell className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Notifications</h1>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "All caught up"}
              </p>
            </div>
          </div>

          <NotificationBell unreadCount={unreadCount} onClick={handleTogglePanel} />
        </div>
      </div>

      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end px-4 pt-20 sm:px-6 lg:px-8">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" onClick={handleClosePanel} />
          <div className="relative w-full max-w-sm">
            <NotificationPanel
              notifications={localNotifications}
              onClose={handleClosePanel}
              onSelectNotification={handleSelectNotification}
            />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {selectedConversation ? (
          <div className="space-y-4">
            <button
              onClick={handleBackToNotifications}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to notifications
            </button>

            <Card className="overflow-hidden p-0">
              <div className="border-b border-border bg-gradient-to-r from-amber-500/10 to-wine-700/10 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-amber-500 to-wine-700 p-2 shadow-lg shadow-amber-500/10">
                      <MessageSquare className="size-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Chat Session</h2>
                      <p className="text-xs text-muted-foreground">
                        {selectedNotification?.title ?? "Unknown"}
                      </p>
                    </div>
                  </div>
                  {selectedNotification && !selectedNotification.read && (
                    <Badge variant="warning" className="h-5 px-2 text-[10px]">
                      New
                    </Badge>
                  )}
                </div>
              </div>

              <div className="h-[32rem] p-0">
                <ChatWindow
                  conversation={selectedConversation}
                  initialMessages={selectedMessages}
                  onClose={handleBackToNotifications}
                  className="h-full rounded-none border-0"
                />
              </div>
            </Card>

            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="size-3.5" />
                <span>
                  Chatting with <strong className="font-medium text-foreground">{selectedNotification?.title}</strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-2xl bg-muted/50 p-6">
              <MessageSquare className="size-10 text-muted-foreground/40" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Select a conversation</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Click on the notification bell above to view your messages and start a conversation.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/70">
              <div className="h-2 w-2 rounded-full bg-wine-500" />
              <span>Unread messages have a red indicator</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
