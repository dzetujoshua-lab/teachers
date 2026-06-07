"use client";

import * as React from "react";
import {
  Globe,
  GraduationCap,
  Activity,
  ShieldAlert,
  Server,
  TrendingUp,
  UserCheck,
  Download,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Counter } from "@/components/dashboard/counter";
import { DepartmentBarChart } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLiveData } from "@/lib/hooks/use-live-data";

type CampusRow = { id: string; name: string; location: string; students: number; status: string };
type InsightRow = { id: string; tag: string; tone: string; text: string };
type DeptRow = { id: string; name: string; rate: number };

interface SuperAdminUser {
  uid: string;
  email: string;
  role: string;
  department: string;
  avatarColor: string;
  forcePasswordReset: boolean;
  updatedAt: string;
}

interface SuperAdminDashboardProps {
  user?: SuperAdminUser;
}

export function SuperAdminDashboard({ user }: SuperAdminDashboardProps) {
  if (user && user.role !== "super_admin") {
    return <div className="p-6 text-red-500">Access Denied: Unauthorized Role</div>;
  }

  const { data: campusesData, loading, lastUpdated } = useLiveData<{ rows: CampusRow[] }>(
    "/api/admin/firestore?collection=campuses",
    { pollInterval: 5000 }
  );

  const { data: insightsData } = useLiveData<{ rows: InsightRow[] }>(
    "/api/admin/firestore?collection=aiInsights",
    { pollInterval: 10000 }
  );

  const { data: deptTrendData } = useLiveData<{ rows: DeptRow[] }>(
    "/api/admin/firestore?collection=departmentTrend",
    { pollInterval: 15000 }
  );

  const campuses = campusesData?.rows || [];
  const insights = insightsData?.rows || [];
  const departmentTrend = (deptTrendData?.rows || []).map((row: any) => ({ id: row.id, name: row.department ?? row.name ?? "", rate: row.rate }));
  const [toast, setToast] = React.useState<{ title: string; body: string } | null>(null);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/firestore?collection=campuses");
      const data = await res.json();
      const rows = (data.rows || []).map((c: any) => ({ Name: c.name, Location: c.location, Students: c.students, Status: c.status }));
      const csv = "Name,Location,Students,Status\n" + rows.map((r: any) => `${r.Name},${r.Location},${r.Students},${r.Status}`).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "campuses-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      setToast({ title: "Export ready", body: `Downloaded ${rows.length} campus records.` });
    } catch (err) {
      setToast({ title: "Export failed", body: "Could not generate CSV. Try again." });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description={`Global health across all institutions on SmartCampus Attend. Logged in as ${user?.email ?? "Unknown"} (${user?.department ?? "N/A"})`}
        liveData={{ lastUpdated, loading: false }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold"
            style={{ backgroundColor: user?.avatarColor ?? "#6b7280" }}
            title={`User ID: ${user?.uid ?? "unknown"}`}
          >
            SA
          </div>
          <Button variant="wine" size="sm" onClick={handleExport}>
            <TrendingUp className="size-4" /> Global report
          </Button>
        </div>
      </PageHeader>

      {user?.forcePasswordReset && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-4 text-sm text-amber-500 border border-amber-500/20">
          <ShieldAlert className="size-5" />
          <span><strong>Security Notice:</strong> You are scheduled to reset your password. Please update it in your profile settings.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Active institutions" value={loading ? "..." : String(campuses.length)} delta={12} icon={Globe} accent="wine" />
        <StatCard index={1} label="Students managed" value={loading ? "..." : String(campuses.reduce((sum, c) => sum + (typeof c.students === 'number' ? c.students : 0), 0))} delta={8} icon={GraduationCap} accent="amber" />
        <StatCard index={2} label="Daily requests" value="..." delta={5} icon={Activity} accent="neutral" />
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
                    {typeof c.students === 'number' ? c.students.toLocaleString() : c.students}
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
            {campuses.length === 0 && !loading && (
              <div className="px-6 py-4 text-xs text-muted-foreground">No campus records found in Firestore.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="AI insights" action="View all" actionHref="/dashboard/super_admin/analytics">
          <div className="space-y-3">
            {insights.map((i) => (
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
            {insights.length === 0 && !loading && (
              <div className="text-xs text-muted-foreground">No AI insights from Firestore.</div>
            )}
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