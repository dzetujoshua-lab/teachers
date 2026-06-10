"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, QrCode, MapPin, Hash, ScanLine } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AttendanceEvent } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";

const methodIcon = {
  qr: QrCode,
  gps: MapPin,
  pin: Hash,
  id_scan: ScanLine,
} as Record<string, typeof QrCode>;

const statusVariant = {
  present: "success",
  late: "warning",
  excused: "muted",
  absent: "danger",
  suspended: "danger",
} as const;

export function LiveFeed({ events }: { events: AttendanceEvent[] }) {
  return (
    <div className="divide-y divide-border/60">
      <AnimatePresence initial={false}>
        {events.map((e) => {
          const Icon = methodIcon[e.method] ?? QrCode;
          return (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-3 px-5 py-3",
                e.suspicious && "bg-wine-500/5"
              )}
            >
              <Avatar name={e.student} size="sm" color={e.suspicious ? "#c52a58" : undefined} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.student}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="size-3" />
                  {e.course} · {e.building}
                </p>
                {e.suspicious && e.reason && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-wine-400">
                    <AlertTriangle className="size-3" />
                    {e.reason}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={statusVariant[e.status]}>{e.status}</Badge>
                <span className="text-[10px] text-muted-foreground">{relativeTime(e.time)}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
