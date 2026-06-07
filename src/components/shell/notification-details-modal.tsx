"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function NotificationDetailsModal({
  open,
  onOpenChange,
  loading,
  error,
  notification,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  error: string | null;
  notification: any | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Notification Details</span>
            {notification?.read === false && (
              <Badge variant="wine">Unread</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : !notification ? (
          <div className="text-sm text-muted-foreground">No details.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">
                {notification.title ?? "(no title)"}
              </div>
              {notification.body && (
                <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {notification.body}
                </div>
              )}
            </div>

            <div className="grid gap-2 text-sm">
              {notification?.type && (
                <div>
                  <span className="font-medium">Type:</span> {String(notification.type)}
                </div>
              )}

              {notification?.attendanceDraftId && (
                <div>
                  <span className="font-medium">Attendance Draft:</span>{" "}
                  {String(notification.attendanceDraftId)}
                </div>
              )}

              {notification?.sessionId && (
                <div>
                  <span className="font-medium">Session:</span>{" "}
                  {String(notification.sessionId)}
                </div>
              )}

              {notification?.messageId && (
                <div>
                  <span className="font-medium">Message:</span>{" "}
                  {String(notification.messageId)}
                </div>
              )}

              <div className="pt-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Payload
                </div>
                <pre className="mt-1 max-h-72 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                  {JSON.stringify(notification, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



