"use client";

import {
  Globe,
  GraduationCap,
  Activity,
  ShieldAlert,
  Server,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Counter } from "@/components/dashboard/counter";
import { DepartmentBarChart } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCampuses, useDepartmentTrend, useInsights } from "@/lib/firebase/data";

export function SuperAdminDashboard() {
  const { rows: campuses = [] } = useCampuses();
  const { rows: departmentTrend = [] } = useDepartmentTrend();
  const { rows: aiInsights = [] } = useInsights();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Global health across all institutions on SmartCampus Attend."
      >
        <Button variant="wine" size="sm">
          <TrendingUp className="size-4" /> Global report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Active institutions" value="48" delta={12} icon={Globe} accent="wine" />
        <StatCard index={1} label="Students managed" value="186k" delta={8} icon={GraduationCap} accent="amber" />
        <StatCard index={2} label="Daily requests" value="4.2M" delta={5} icon={Activity} accent="neutral" />
        <StatCard index={3} label="Platform uptime" value="99.98%" delta={0} icon={Server} accent="amber" hint="30-day rolling" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Institutions"
          action="Manage all"
          actionHref="/dashboard/super_admin/campuses"
          className="lg:col-span-2"
          noPadding
        >
          <div className="divide-y divide-border/60">
            {campuses.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-wine-500/10 text-wine-400">
                  <Globe className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.location}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium tabular-nums">
                    {c.students.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">students</p>
                </div>
                <Badge
                  variant={
                    c.status === "active"
                      ? "success"
                      : c.status === "onboarding"
                        ? "warning"
                        : "danger"
                  }
                >
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="AI insights" action="View all" actionHref="/dashboard/super_admin/analytics">
          <div className="space-y-3">
            {aiInsights.map((i) => (
              <div
                key={i.id}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <Badge variant={i.tone === "amber" ? "warning" : "wine"} className="mb-2">
                  {i.tag}
                </Badge>
                <p className="text-sm leading-snug">{i.text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Attendance by department" className="lg:col-span-2">
          <DepartmentBarChart data={departmentTrend} />
        </SectionCard>

        <SectionCard title="Security posture">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-wine-500/5 p-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-5 text-wine-400" />
                <div>
                  <p className="text-sm font-medium">Open fraud reports</p>
                  <p className="text-xs text-muted-foreground">Across all campuses</p>
                </div>
              </div>
              <span className="text-2xl font-semibold tabular-nums text-wine-400">
                <Counter to={4} format={false} />
              </span>
            </div>
            {[
              { label: "Security events processed", value: 1284000 },
              { label: "GPS spoofs blocked (7d)", value: 312 },
              { label: "Active sessions", value: 1860 },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-medium tabular-nums">
                  <Counter to={r.value} />
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
