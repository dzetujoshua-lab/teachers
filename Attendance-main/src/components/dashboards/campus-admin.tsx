"use client";

import { Users, UserCheck, Clock, Percent, Radio, Building2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { AttendanceAreaChart, OccupancyAreaChart } from "@/components/dashboard/charts";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useWeeklyAttendance,
  useHourlyOccupancy,
  useLiveFeed,
  useSessions,
  useBuildings,
} from "@/lib/firebase/data";
import { relativeTime } from "@/lib/utils";

export function CampusAdminDashboard() {
  const { rows: weeklyAttendance = [] } = useWeeklyAttendance();
  const { rows: hourlyOccupancy = [] } = useHourlyOccupancy();
  const { rows: liveFeed = [] } = useLiveFeed();
  const { rows: liveSessions = [] } = useSessions();
  const { rows: buildings = [] } = useBuildings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nkyemu Main Campus"
        description="Live operational overview · today"
      >
        <Button size="sm">
          <Radio className="size-4" /> Live monitor
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Students present" value="7,742" delta={3} icon={UserCheck} accent="amber" />
        <StatCard index={1} label="Absent today" value="678" delta={-6} icon={Users} accent="neutral" />
        <StatCard index={2} label="Late arrivals" value="410" delta={2} icon={Clock} accent="wine" />
        <StatCard index={3} label="Attendance rate" value="91.4%" delta={1} icon={Percent} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Weekly attendance"
          action="Full analytics"
          actionHref="/dashboard/campus_admin/analytics"
          className="lg:col-span-2"
        >
          <AttendanceAreaChart data={weeklyAttendance} />
        </SectionCard>

        <SectionCard
          title="Live attendance feed"
          action="Open monitor"
          actionHref="/dashboard/campus_admin/live"
          noPadding
        >
          {/* 💡 Suppressed hydration warnings here for any time diff variations within the feed */}
          <div className="max-h-[320px] overflow-y-auto" suppressHydrationWarning>
            <LiveFeed events={liveFeed.slice(0, 6)} />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Active sessions"
          action="View all"
          actionHref="/dashboard/campus_admin/facilitators"
          className="lg:col-span-2"
          noPadding
        >
          <div className="divide-y divide-border/60">
            {liveSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-3.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.course}</p>
                  {/* 💡 Added suppressHydrationWarning here to handle relativeTime() calculations */}
                  <p className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                    {s.facilitator} · {s.room} · {relativeTime(s.startedAt)}
                  </p>
                </div>
                {s.flagged > 0 && <Badge variant="wine">{s.flagged} flagged</Badge>}
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">
                    {s.present}/{s.total}
                  </p>
                  <p className="text-xs text-muted-foreground">present</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Building occupancy">
          <OccupancyAreaChart data={hourlyOccupancy} />
          <div className="mt-4 space-y-2">
            {buildings.slice(0, 3).map((b) => {
              const pct = Math.round((b.occupancy / b.capacity) * 100);
              return (
                <div key={b.id} className="text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="size-3.5" /> {b.name}
                    </span>
                    <span className="font-medium tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full gradient-amber"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}