"use client";

import { ShieldCheck, ShieldAlert, MapPin, Fingerprint, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuditLogs, useBuildings } from "@/lib/firebase/data";
import { cn, relativeTime } from "@/lib/utils";

export function SecurityDashboard() {
  const { rows: auditLogs = [] } = useAuditLogs();
  const { rows: buildings = [] } = useBuildings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Integrity"
        description="Nkyemu Main Campus · real-time monitoring"
      >
        <Button variant="wine" size="sm">
          <ShieldAlert className="size-4" /> Review fraud
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Threats blocked (24h)" value="27" delta={-12} icon={ShieldCheck} accent="amber" />
        <StatCard index={1} label="GPS spoofs" value="3" delta={2} icon={MapPin} accent="wine" />
        <StatCard index={2} label="Duplicate devices" value="5" icon={Fingerprint} accent="wine" />
        <StatCard index={3} label="Events processed" value="184k" delta={6} icon={ScrollText} accent="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Audit log"
          action="Full log"
          actionHref="/dashboard/security_officer/audit"
          className="lg:col-span-2"
          noPadding
        >
          <div className="divide-y divide-border/60">
            {auditLogs.map((l) => (
              <div key={l.id} className="flex items-center gap-4 px-6 py-3.5">
                <div
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg",
                    l.severity === "critical"
                      ? "bg-red-500/10 text-red-400"
                      : l.severity === "warning"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {l.severity === "info" ? (
                    <ScrollText className="size-4" />
                  ) : (
                    <ShieldAlert className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.action}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {l.actor} → {l.target} · {l.ip} · {l.device}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={
                      l.severity === "critical"
                        ? "danger"
                        : l.severity === "warning"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {l.severity}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(l.time)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Campus heatmap" action="Open map" actionHref="/dashboard/security_officer/heatmap">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border grid-bg">
            {buildings.map((b, i) => {
              const load = b.occupancy / b.capacity;
              return (
                <div
                  key={b.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${15 + (i % 3) * 35}%`,
                    top: `${20 + Math.floor(i / 3) * 38}%`,
                  }}
                >
                  <span
                    className={cn(
                      "block rounded-full",
                      load > 0.85
                        ? "bg-wine-500/40"
                        : load > 0.6
                          ? "bg-amber-500/40"
                          : "bg-emerald-500/30"
                    )}
                    style={{ width: 28 + load * 36, height: 28 + load * 36 }}
                  />
                  <span
                    className={cn(
                      "absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      load > 0.85
                        ? "bg-wine-500"
                        : load > 0.6
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Normal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Busy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-wine-500" /> High
            </span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
