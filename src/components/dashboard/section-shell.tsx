"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  Check,
  ChefHat,
  ClipboardCheck,
  CreditCard,
  Download,
  FileText,
  Filter,
  Globe,
  GraduationCap,
  MapPin,
  Plus,
  Radio,
  Save,
  Search,
  Send,
  ShieldCheck,
  Soup,
  UtensilsCrossed,
  X,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { AttendanceAreaChart, DepartmentBarChart, MealDonutChart, OccupancyAreaChart } from "@/components/dashboard/charts";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLES } from "@/lib/roles";
import { AdminClassesDashboard } from "@/components/dashboards/admin-classes";
import { AdminDraftsDashboard } from "@/components/dashboards/admin-drafts";
import { FacilitatorDraftsDashboard } from "@/components/dashboards/facilitator-drafts";
import { AttendanceStatisticsDashboard } from "@/components/dashboards/attendance-statistics";
import { useCampuses as useCampusesData, useInsights as useInsightsData, useMeals as useMealsData, useBuildings as useBuildingsData, useWeeklyAttendance as useWeeklyAttendanceData, useHourlyOccupancy as useHourlyOccupancyData, useSessions as useSessionsData, useAuditLogs as useAuditLogsData, useStudents as useStudentsData, useNotifications as useNotificationsData, useMealSplit as useMealSplitData, useDepartments as useDepartmentsData, useLiveFeed as useLiveFeedData } from "@/lib/firebase/data";
import type { Role } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import { WeeklyPublishedMenuCard } from "@/components/dashboards/weekly-published-menu-card";


type Toast = { title: string; body: string };

const moduleCopy: Record<string, string> = {
  campuses: "Create campuses, review onboarding status, and inspect institution capacity.",
  subscriptions: "Track billing health, renewals, invoices, and plan usage across institutions.",
  analytics: "Analyze attendance, occupancy, and meal behavior with exportable insights.",
  fraud: "Investigate flagged attempts, device conflicts, and GPS anomalies.",
  audit: "Search immutable operational events across users, devices, and network sources.",
  live: "Monitor active sessions, campus movement, and real-time attendance events.",
  departments: "Compare departmental attendance, enrollment, and intervention priority.",
  facilitators: "Coordinate teaching staff, active classes, and session completion.",
  students: "Manage student records, attendance health, and meal preferences.",
  reports: "Generate production-ready operational, compliance, and meal reports.",
  drafts: "Create attendance drafts, assign them to facilitators, and track submission status.",
  classes: "Manage today's classes and launch attendance sessions.",
  menu: "Publish menus, adjust batch counts, and forecast meal demand.",
  demand: "Review requested meals, dietary needs, and service progress.",
  heatmap: "See building-level occupancy and incident density.",
  alerts: "Triage alerts, send broadcasts, and confirm resolution.",
  attendance: "Review attendance history and request corrections.",
  achievements: "Track milestones, streaks, and attendance achievements.",
  "attendance-stats": "View attendance trends and department comparison statistics.",
};

const classes = [
  { code: "CS301", title: "Algorithms & Complexity", time: "09:00", room: "EA-204", students: 160, rate: 94, status: "Ready" },
  { code: "CS210", title: "Data Structures", time: "11:30", room: "EA-110", students: 142, rate: 89, status: "Scheduled" },
  { code: "CS415", title: "Distributed Systems", time: "14:00", room: "Sci-Lab2", students: 78, rate: 96, status: "Draft" },
];

const reportTemplates = [
  { name: "Daily attendance summary", scope: "Campus admins", type: "CSV + PDF" },
  { name: "Meal demand reconciliation", scope: "Kitchen", type: "CSV" },
  { name: "Fraud incident dossier", scope: "Security", type: "PDF" },
  { name: "Executive platform report", scope: "Super admins", type: "PDF" },
];

const attendanceHistory = [
  { course: "CS301 - Algorithms", date: "Today 09:00", status: "present", method: "QR" },
  { course: "CS210 - Data Structures", date: "Today 11:30", status: "present", method: "GPS" },
  { course: "MATH204 - Linear Algebra", date: "Yesterday", status: "late", method: "PIN" },
  { course: "ENG101 - Technical Writing", date: "Monday", status: "present", method: "ID scan" },
  { course: "CS415 - Distributed Systems", date: "Monday", status: "excused", method: "Manual" },
];

function ActionToast({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  React.useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-4 shadow-2xl">
      <div className="flex gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <Check className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{toast.body}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Toolbar({
  query,
  onQuery,
  filter,
  onFilter,
  onExport,
}: {
  query: string;
  onQuery: (value: string) => void;
  filter: string;
  onFilter: (value: string) => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search records..." className="pl-9" />
      </div>
      <div className="flex gap-2">
        <select
          value={filter}
          onChange={(e) => onFilter(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="warning">Needs review</option>
          <option value="critical">Critical</option>
        </select>
        <Button variant="outline" onClick={onExport}>
          <Download className="size-4" /> Export
        </Button>
      </div>
    </div>
  );
}

function DataTable({
  rows,
  onAction,
}: {
  rows: Array<Record<string, string | number>>;
  onAction: (name: string) => void;
}) {
  const keys = Object.keys(rows[0] ?? {});
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              {keys.map((key) => (
                <th key={key} className="px-4 py-3 font-medium">{key.replace(/_/g, " ")}</th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row, index) => (
              <tr key={index} className="bg-card/40">
                {keys.map((key) => (
                  <td key={key} className="px-4 py-3">
                    {key === "status" ? (
                      <Badge variant={String(row[key]).match(/critical|due|suspended/i) ? "danger" : String(row[key]).match(/trial|warning|onboarding|late/i) ? "warning" : "success"}>
                        {row[key]}
                      </Badge>
                    ) : (
                      <span className="tabular-nums">{row[key]}</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => onAction(String(row[keys[0]] ?? "record"))}>
                    Open
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CampusForm({ pushToast }: { pushToast: (toast: Toast) => void }) {
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("");
  return (
    <div className="space-y-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campus name" />
      <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
      <Button className="w-full" onClick={() => pushToast({ title: "Campus draft saved", body: `${name || "New campus"} is ready for onboarding review.` })}>
        <Plus className="size-4" /> Save campus
      </Button>
    </div>
  );
}

function ActionPanel({ actions, pushToast }: { actions: string[]; pushToast: (toast: Toast) => void }) {
  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <Button key={action} variant="outline" className="w-full justify-start" onClick={() => pushToast({ title: "Action completed", body: `${action} finished.` })}>
          <Check className="size-4" /> {action}
        </Button>
      ))}
    </div>
  );
}

function InsightList({ insights, pushToast }: { insights: any[]; pushToast: (toast: Toast) => void }) {
  return (
    <div className="space-y-3">
      {(insights || []).map((insight: any) => (
        <button key={insight.id} onClick={() => pushToast({ title: "Insight promoted", body: "The recommendation was added to the weekly action plan." })} className="w-full rounded-lg border border-border bg-background/40 p-3 text-left hover:bg-accent">
          <Badge variant={insight.tone === "amber" ? "warning" : "wine"}>{insight.tag}</Badge>
          <p className="mt-2 text-sm">{insight.text}</p>
        </button>
      ))}
      {(insights || []).length === 0 && (
        <div className="text-xs text-muted-foreground">No AI insights from Firestore.</div>
      )}
    </div>
  );
}

function ReportsPanel({ pushToast }: { pushToast: (toast: Toast) => void }) {
  return (
    <SectionCard title="Report queue">
      <div className="space-y-2">
        {reportTemplates.map((report) => (
          <button key={report.name} onClick={() => pushToast({ title: "Report generated", body: `${report.name} is ready as ${report.type}.` })} className="flex w-full items-center gap-3 rounded-lg border border-border bg-background/40 p-3 text-left hover:bg-accent">
            <FileText className="size-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{report.name}</p>
              <p className="text-xs text-muted-foreground">{report.scope} - {report.type}</p>
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

function ReportBuilder({ pushToast, facilitator, kitchen }: { pushToast: (toast: Toast) => void; facilitator?: boolean; kitchen?: boolean }) {
  const templates = reportTemplates.filter((report) => kitchen ? report.scope === "Kitchen" : facilitator ? report.name.includes("attendance") : true);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <DataTable rows={templates.map((report) => ({ report: report.name, scope: report.scope, format: report.type, status: "active" }))} onAction={(name) => pushToast({ title: "Report generated", body: `${name} is ready for download.` })} />
      </div>
      <SectionCard title="Schedule report">
        <div className="space-y-3">
          <Input placeholder="Recipient email" defaultValue="ops@campus.edu" />
          <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            <option>Every weekday at 17:00</option>
            <option>Weekly on Friday</option>
            <option>Monthly compliance packet</option>
          </select>
          <Button className="w-full" onClick={() => pushToast({ title: "Report scheduled", body: "Recipients will receive the next generated report automatically." })}>
            <CalendarClock className="size-4" /> Save schedule
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function StudentTable({ query, compact, pushToast }: { query: string; compact?: boolean; pushToast: (toast: Toast) => void }) {
  const students = useStudentsData();
  const rows = (students.rows || [])
    .filter((student: any) => [student.name, student.email, student.department, student.studentId].join(" ").toLowerCase().includes(query.toLowerCase()))
    .map((student: any) => ({
      student: student.name,
      id: student.studentId,
      department: student.department ?? "Unassigned",
      attendance: `${student.attendanceRate ?? 0}%`,
      streak: `${student.streak ?? 0}d`,
      status: (student.attendanceRate ?? 0) < 85 ? "warning" : "active",
    }));
  return (
    <div className={cn("grid gap-6", !compact && "lg:grid-cols-3")}>
      <div className={cn(!compact && "lg:col-span-2")}>
        <DataTable rows={rows} onAction={(name) => pushToast({ title: "Student profile opened", body: `${name} has attendance and meal controls ready.` })} />
      </div>
      {!compact && (
        <SectionCard title="Bulk student actions">
          <ActionPanel pushToast={pushToast} actions={["Send attendance nudge", "Export student roster", "Update meal preferences"]} />
        </SectionCard>
      )}
    </div>
  );
}

function MenuEditor({
  pushToast,
  onPublished,
}: {
  pushToast: (toast: Toast) => void;
  onPublished: () => void;
}) {
  type TableMealSlot = {
    breakfast: string;
    lunch: string;
    supper: string;
  };

  type TableRow = {
    id: string;
    day: string;
    food: string;
    breakfast: string;
    lunch: string;
    supper: string;
  };

  const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const [weekLabel, setWeekLabel] = React.useState("");
  const [tableRows, setTableRows] = React.useState<TableRow[]>(() =>
    DEFAULT_DAYS.map((d) => ({
      id: `day-${d.toLowerCase()}-${Math.random().toString(16).slice(2)}`,
      day: d,
      food: "",
      breakfast: "",
      lunch: "",
      supper: "",
    }))
  );

  const [uploadedMenus, setUploadedMenus] = React.useState<any[]>([]);
  const [selectedMenuId, setSelectedMenuId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [initializing, setInitializing] = React.useState(false);

  const loadUploaded = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kitchen/weekly-menus");
      const data = await res.json();
      const rows = data.rows || data || [];
      setUploadedMenus(Array.isArray(rows) ? rows : []);
    } catch {
      setUploadedMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const mealToMealKey = (meal: "breakfast" | "lunch" | "supper") => {
    // backend expects meal field as a string; we keep it stable.
    return meal;
  };

  // Map spreadsheet cells (text) into backend weeklyMenus.items
  const buildItemsFromTable = (rows: TableRow[]) => {
    const normalized = rows
      .map((r) => {
        const day = String(r.day || "").trim();
        const food = String(r.food || "").trim();

        const mk = (meal: "breakfast" | "lunch" | "supper", cell: string) => {
          const cellValue = String(cell || "").trim();
          if (!cellValue) return null;

          return {
            id: `cell-${r.id}-${meal}`,
            meal: mealToMealKey(meal),
            // store day in preference so readers can reconstruct table.
            preference: day,
            // store food name in "name" and meal cell in "estimated" is not ideal since it's number.
            // We'll store cell text in `estimated`? can't. So instead: store food/cell in `name`.
            // Backend has only name:string; keep it as `${food}: ${cell}`.
            estimated: 0,
            prepared: 0,
            served: 0,
            name: `${food}${food && " - "}${cellValue}`.trim(),
          };
        };

        const b = mk("breakfast", r.breakfast);
        const l = mk("lunch", r.lunch);
        const s = mk("supper", r.supper);

        return [b, l, s].filter(Boolean);
      })
      .flat();

    return normalized;
  };

  // Map backend items back into spreadsheet table.
  // We stored preference=day and name="{food} - {cell}".
  const parseItemsToTable = (items: any[]) => {
    const rowsByDay: Record<string, TableRow> = {};

    const ensureRow = (day: string) => {
      const key = day || "";
      if (rowsByDay[key]) return rowsByDay[key];
      return (rowsByDay[key] = {
        id: `day-${key.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(16).slice(2)}`,
        day,
        food: "",
        breakfast: "",
        lunch: "",
        supper: "",
      });
    };

    for (const it of items || []) {
      const day = String(it?.preference || "").trim();
      const meal = String(it?.meal || "").trim();
      const name = String(it?.name || "").trim();

      if (!day || !meal || !name) continue;

      const row = ensureRow(day);
      const parts = name.split(" - ");
      const food = (parts[0] ?? "").trim();
      const cell = parts.slice(1).join(" - ").trim();

      if (food && !row.food) row.food = food;

      if (meal === "breakfast") row.breakfast = cell;
      if (meal === "lunch") row.lunch = cell;
      if (meal === "supper") row.supper = cell;
    }

    // Convert to stable UI order: keep default days first, then any extras.
    const ordered: TableRow[] = [];
    for (const d of DEFAULT_DAYS) {
      if (rowsByDay[d]) ordered.push(rowsByDay[d]);
    }
    for (const key of Object.keys(rowsByDay)) {
      if (!DEFAULT_DAYS.includes(key)) ordered.push(rowsByDay[key]);
    }

    // If nothing parsed, keep defaults.
    return ordered.length
      ? ordered
      : DEFAULT_DAYS.map((d) => ({
          id: `day-${d.toLowerCase()}-${Math.random().toString(16).slice(2)}`,
          day: d,
          food: "",
          breakfast: "",
          lunch: "",
          supper: "",
        }));
  };

  React.useEffect(() => {
    setInitializing(true);
    (async () => {
      await loadUploaded();
    })().finally(() => setInitializing(false));
  }, []);

  React.useEffect(() => {
    if (!uploadedMenus?.length) return;
    const sorted = [...uploadedMenus].sort((a, b) =>
      String(b?.createdAt ?? b?.updatedAt ?? "").localeCompare(String(a?.createdAt ?? a?.updatedAt ?? ""))
    );
    const draft = sorted.find((m) => (m?.status ?? "draft") !== "published") ?? sorted[0];
    if (draft?.id && !selectedMenuId) {
      void loadSelected(String(draft.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedMenus]);

  const loadSelected = async (id: string) => {
    setSelectedMenuId(id);
    setSaving(true);
    try {
      const res = await fetch(`/api/kitchen/weekly-menus/${id}`);
      const data = await res.json();
      if (!res.ok) {
        pushToast({ title: "Failed to load menu", body: data.error || "Unknown error" });
        return;
      }
      setWeekLabel(data.weekLabel || "");
      const parsed = parseItemsToTable(Array.isArray(data.items) ? data.items : []);
      setTableRows(parsed);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadOrCreate = async () => {
    const wl = weekLabel.trim();
    if (!wl) return pushToast({ title: "Week label required", body: "Example: Week 2026-06-01" });

    const items = buildItemsFromTable(tableRows);
    const hasAnyCell = items.length > 0;
    if (!hasAnyCell) {
      return pushToast({ title: "Add menu cells", body: "Fill breakfast/lunch/supper for at least one day." });
    }

    setSaving(true);
    try {
      const res = await fetch("/api/kitchen/weekly-menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekLabel: wl, items }),
      });
      const data = await res.json();
      if (!res.ok) return pushToast({ title: "Upload failed", body: data.error || "Unknown error" });

      pushToast({ title: "Weekly menu uploaded", body: "Saved as a draft. You can edit it before publishing." });
      setSelectedMenuId(data.id);
      await loadUploaded();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedMenuId) return handleUploadOrCreate();

    const localMenu = uploadedMenus.find((m) => String(m?.id) === String(selectedMenuId));
    if ((localMenu?.status ?? "draft") === "published") {
      return pushToast({ title: "Menu is locked", body: "Published menu is locked. Create a new draft by uploading a new week label." });
    }

    setSaving(true);
    try {
      const items = buildItemsFromTable(tableRows);
      const res = await fetch(`/api/kitchen/weekly-menus/${selectedMenuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekLabel: weekLabel.trim(), items }),
      });
      const data = await res.json();
      if (!res.ok) return pushToast({ title: "Save failed", body: data.error || "Unknown error" });

      pushToast({ title: "Draft updated", body: "Your changes were saved." });
      await loadUploaded();
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedMenuId) return pushToast({ title: "Select a menu", body: "Upload or choose a saved draft first." });
    setSaving(true);
    try {
      const res = await fetch(`/api/kitchen/publish-weekly-menu/${selectedMenuId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishTo: ["admin", "facilitator", "security_officer", "kitchen_manager"] }),
      });

      const data = await res.json();
      if (!res.ok) return pushToast({ title: "Publish failed", body: data.error || "Unknown error" });

      pushToast({ title: "Weekly menu published", body: "Admin, Facilitators, Security, and Kitchen can now view it." });
      await onPublished();
      await loadUploaded();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <SectionCard title="Uploaded menus" noPadding>
          <div className="space-y-2 p-4">
            <Button variant="outline" className="w-full" onClick={loadUploaded} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>

            <div className="text-xs text-muted-foreground">
              Click a menu to edit its draft. Drafts can be saved; published menus are locked.
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {uploadedMenus.length === 0 ? (
                <div className="text-xs text-muted-foreground">No uploaded menus yet. Upload a draft to begin.</div>
              ) : (
                uploadedMenus.map((m) => {
                  const isSelected = selectedMenuId === m.id;
                  const status = m?.status || "draft";
                  return (
                    <button
                      key={m.id}
                      onClick={() => loadSelected(String(m.id))}
                      className={
                        isSelected
                          ? "w-full rounded-lg border border-border bg-accent/30 px-3 py-2 text-left text-sm"
                          : "w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-sm hover:bg-accent/60"
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{m.weekLabel}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{status}</div>
                        </div>
                        <Pencil
                          className={cn("size-4 shrink-0", status === "published" ? "text-muted-foreground" : "text-wine-500")}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="lg:col-span-2">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Weekly menu spreadsheet</p>
                <p className="text-xs text-muted-foreground">Fill day/food and each meal (breakfast, lunch, supper), then save/publish.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium">Week label</p>
                <Input value={weekLabel} onChange={(e) => setWeekLabel(e.target.value)} placeholder="Week 2026-06-01" />
              </div>
              <div className="flex items-end justify-end gap-2">
                <Button variant="outline" onClick={handleSaveEdits} disabled={saving}>
                  <Save className="size-4" /> {selectedMenuId ? "Save draft" : "Upload draft"}
                </Button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    {[
                      "day",
                      "food",
                      "breakfast",
                      "lunch",
                      "supper",
                    ].map((h) => (
                      <th key={h} className="px-3 py-3 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tableRows.map((row) => (
                    <tr key={row.id} className="bg-card/40">
                      <td className="px-3 py-3 align-top">
                        <Input
                          value={row.day}
                          onChange={(e) =>
                            setTableRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, day: e.target.value } : r)))
                          }
                          placeholder="Day"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Input
                          value={row.food}
                          onChange={(e) =>
                            setTableRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, food: e.target.value } : r)))
                          }
                          placeholder="Food"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Input
                          value={row.breakfast}
                          onChange={(e) =>
                            setTableRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, breakfast: e.target.value } : r)))
                          }
                          placeholder="Breakfast"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Input
                          value={row.lunch}
                          onChange={(e) =>
                            setTableRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, lunch: e.target.value } : r)))
                          }
                          placeholder="Lunch"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Input
                          value={row.supper}
                          onChange={(e) =>
                            setTableRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, supper: e.target.value } : r)))
                          }
                          placeholder="Supper"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {selectedMenuId ? "Editing selected draft." : "Create a new draft by saving/uploading."}
              </div>
              <Button variant="wine" onClick={handlePublish} disabled={saving || !selectedMenuId}>
                <Send className="size-4" /> {saving ? "Publishing..." : "Send / Publish weekly menu"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}



function BuildingGrid({ rows, pushToast }: { rows: any[]; pushToast: (toast: Toast) => void }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {(rows || []).map((building: any) => {
        const pct = building.capacity > 0 ? Math.round((building.occupancy / building.capacity) * 100) : 0;
        return (
          <button key={building.id} onClick={() => pushToast({ title: "Building focused", body: `${building.name} is now highlighted for patrol coordination.` })} className="rounded-lg border border-border bg-background/40 p-3 text-left hover:bg-accent">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{building.name}</p>
              <Badge variant={pct > 85 ? "wine" : pct > 65 ? "warning" : "success"}>{pct}%</Badge>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full gradient-amber" style={{ width: `${pct}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AlertsCenter({ pushToast }: { pushToast: (toast: Toast) => void }) {
  const notifRows = useNotificationsData();
  const [items, setItems] = React.useState(notifRows.rows || []);

  React.useEffect(() => { setItems(notifRows.rows || []); }, [notifRows]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SectionCard title="Alert inbox" className="lg:col-span-2" noPadding>
        <div className="divide-y divide-border/60">
          {(items || []).map((item: any) => (
            <div key={item.id} className={cn("flex items-center gap-4 px-6 py-4", !item.read && "bg-accent/30")}>
              <AlertTriangle className={cn("size-5", item.type === "security" ? "text-wine-400" : "text-amber-500")} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.body}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setItems((current: any[]) => current.map((n) => n.id === item.id ? { ...n, read: true } : n));
                pushToast({ title: "Alert resolved", body: `${item.title} was marked handled.` });
              }}>
                Resolve
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Broadcast">
        <div className="space-y-3">
          <Input placeholder="Audience" defaultValue="All campus teams" />
          <Input placeholder="Message" defaultValue="Security review is in progress." />
          <Button variant="wine" className="w-full" onClick={() => pushToast({ title: "Broadcast sent", body: "Campus teams have been notified." })}>
            <Send className="size-4" /> Send broadcast
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function SecurityModules({ section, query, pushToast, auditLogs, buildings }: { section: string; query: string; pushToast: (toast: Toast) => void; auditLogs: any[]; buildings: any[] }) {
  if (section === "heatmap") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Building occupancy" className="lg:col-span-2">
          <OccupancyAreaChart data={(buildings || []).map((b: any) => ({ hour: b.name, occupancy: b.occupancy }))} />
          <BuildingGrid rows={buildings} pushToast={pushToast} />
        </SectionCard>
        <SectionCard title="Security actions">
          <ActionPanel pushToast={pushToast} actions={["Dispatch patrol", "Broadcast exit route", "Open incident room"]} />
        </SectionCard>
      </div>
    );
  }

  if (section === "fraud" || section === "audit") {
    const rows = (auditLogs || [])
      .filter((log: any) => [log.actor, log.action, log.target, log.ip, log.device].join(" ").toLowerCase().includes(query.toLowerCase()))
      .map((log: any) => ({ event: log.action, actor: log.actor, target: log.target, ip: log.ip, device: log.device, status: log.severity }));
    return <DataTable rows={rows} onAction={(name) => pushToast({ title: "Case updated", body: `${name} was added to the investigation queue.` })} />;
  }

  if (section === "alerts") return <AlertsCenter pushToast={pushToast} />;
  return <SecurityModules section="audit" query={query} pushToast={pushToast} auditLogs={auditLogs} buildings={buildings} />;
}

function CampusModules({ section, query, filter, pushToast, campusRows, insights, departmentTrend, weeklyAttendance }: { section: string; query: string; filter: string; pushToast: (toast: Toast) => void; campusRows: any[]; insights: any[]; departmentTrend: any[]; weeklyAttendance: any[] }) {
  if (section === "campuses") {
    const rows = (campusRows || [])
      .filter((campus: any) => (campus.name || "").toLowerCase().includes(query.toLowerCase()) || (campus.location || "").toLowerCase().includes(query.toLowerCase()))
      .filter((campus: any) => filter === "all" || (filter === "active" ? campus.status === "active" : campus.status !== "active"))
      .map((campus: any) => ({
        campus: campus.name,
        location: campus.location,
        buildings: campus.buildings ?? 0,
        students: typeof campus.students === 'number' ? campus.students.toLocaleString() : String(campus.students ?? 0),
        status: campus.status,
      }));
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable rows={rows} onAction={(name) => pushToast({ title: "Campus opened", body: `${name} is ready for campus administration.` })} />
        </div>
        <SectionCard title="Onboard campus">
          <CampusForm pushToast={pushToast} />
        </SectionCard>
      </div>
    );
  }

  if (section === "subscriptions") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            rows={[
              { invoice: "INV-2026-041", campus: "Campus Alpha", plan: "Scale", amount: "$12,800", renewal: "Jun 18", status: "paid" },
              { invoice: "INV-2026-042", campus: "Campus Beta", plan: "Enterprise", amount: "$9,400", renewal: "Jul 02", status: "paid" },
            ]}
            onAction={(name) => pushToast({ title: "Invoice queued", body: `${name} was added to billing follow-up.` })}
          />
        </div>
        <SectionCard title="Billing controls">
          <ActionPanel pushToast={pushToast} actions={["Send renewal reminders", "Sync payment provider", "Create enterprise quote"]} />
        </SectionCard>
      </div>
    );
  }

  if (section === "analytics") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Attendance trend" className="lg:col-span-2">
          <AttendanceAreaChart data={weeklyAttendance} />
        </SectionCard>
        <SectionCard title="AI insight queue">
          <InsightList insights={insights} pushToast={pushToast} />
        </SectionCard>
        <SectionCard title="Department comparison" className="lg:col-span-2">
          <DepartmentBarChart data={departmentTrend} />
        </SectionCard>
        <ReportsPanel pushToast={pushToast} />
      </div>
    );
  }

  return <SecurityModules section={section} query={query} pushToast={pushToast} auditLogs={[]} buildings={[]} />;
}

function CampusAdminModules({ section, query, pushToast, liveFeed, liveSessions, departments }: { section: string; query: string; pushToast: (toast: Toast) => void; liveFeed: any[]; liveSessions: any[]; departments: any[] }) {
  if (section === "classes") {
    const [classes, setClasses] = React.useState<any[]>([]);
    const [loadingClasses, setLoadingClasses] = React.useState(true);

    React.useEffect(() => {
      fetch("/api/classes")
        .then(r => r.json())
        .then(data => setClasses(data.data || []))
        .catch(() => {})
        .finally(() => setLoadingClasses(false));
    }, []);

    const rows = (classes || []).map((c: any) => ({
      class: c.code,
      name: c.name,
      facilitator: c.facilitatorEmail || c.facilitatorId,
      members: c.members?.length || 0,
      status: "active",
    }));

    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable rows={rows} onAction={(name) => pushToast({ title: "Class opened", body: `${name} is ready for management.` })} />
        </div>
        <SectionCard title="Create class">
          <div className="space-y-3">
            <Input placeholder="Class code (e.g. CS301)" />
            <Input placeholder="Class name" />
            <Input placeholder="Facilitator email" />
            <Button className="w-full" onClick={() => pushToast({ title: "Class draft saved", body: "New class is ready for member assignment." })}>
              <Plus className="size-4" /> Save class
            </Button>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (section === "live") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Live attendance feed" className="lg:col-span-2" noPadding>
          <LiveFeed events={(liveFeed || []).filter((event: any) => (event.student || "").toLowerCase().includes(query.toLowerCase()) || (event.course || "").toLowerCase().includes(query.toLowerCase()))} />
        </SectionCard>
        <SectionCard title="Active session control">
          <div className="space-y-3">
            {(liveSessions || []).filter((s: any) => s.status === "live").map((session: any) => (
              <button
                key={session.id}
                onClick={() => pushToast({ title: "Session focused", body: `${session.course || session.courseId} is now pinned in live monitor.` })}
                className="w-full rounded-lg border border-border bg-background/40 p-3 text-left transition hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{session.course || session.courseId}</p>
                  <Badge variant={session.flagged ? "wine" : "success"}>{session.present ?? 0}/{session.total ?? 0}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{session.room} - {session.startedAt ? relativeTime(session.startedAt) : "just now"}</p>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  if (section === "departments") {
    const rows = (departments || []).map((d: any) => ({
        name: d.name,
      faculty: d.faculty,
      students: typeof d.students === 'number' ? d.students.toLocaleString() : String(d.students || 0),
      attendance: `${d.attendanceRate ?? 0}%`,
      status: (d.attendanceRate ?? 0) < 88 ? "warning" : "active"
    }));
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <DataTable rows={rows} onAction={(name) => pushToast({ title: "Intervention created", body: `${name} has been assigned to campus operations.` })} />
        <SectionCard title="Performance chart" className="lg:col-span-2">
          <DepartmentBarChart data={(departments || []).map((d: any) => ({ name: d.name, rate: d.attendanceRate ?? 0 }))} />
        </SectionCard>
      </div>
    );
  }

  if (section === "facilitators") {
    return <DataTable rows={(liveSessions || []).filter((s: any) => s.status === "live").map((s: any) => ({ facilitator: s.facilitator, department: s.facilitatorDept || "", course: s.course || s.courseId, room: s.room, status: s.flagged ? "warning" : "active" }))} onAction={(name) => pushToast({ title: "Facilitator contacted", body: `Message drafted for ${name}.` })} />;
  }

  if (section === "students") return <StudentTable query={query} pushToast={pushToast} />;
  if (section === "reports") return <ReportBuilder pushToast={pushToast} />;

  return <CampusModules section="analytics" query={query} filter="all" pushToast={pushToast} campusRows={[]} insights={[]} departmentTrend={[]} weeklyAttendance={[]} />;
}

function FacilitatorModules({ section, query, pushToast }: { section: string; query: string; pushToast: (toast: Toast) => void }) {
  // Weekly menu view
  if (section === "menu") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Weekly menu" className="lg:col-span-2" noPadding>
          {/* Loaded from publishedWeeklyMenus */}
          <WeeklyPublishedMenuCard />

        </SectionCard>
        <SectionCard title="What’s next">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Use this menu during your service operations.</p>
            <ActionPanel
              pushToast={pushToast}
              actions={["Confirm supplies", "Report issues", "Request menu changes"]}
            />
          </div>
        </SectionCard>
      </div>
    );
  }

  if (section === "classes") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            rows={classes.map((c) => ({
              class: c.code,
              title: c.title,
              time: c.time,
              room: c.room,
              students: c.students,
              attendance: `${c.rate}%`,
              status: c.status,
            }))}
            onAction={(name) => pushToast({
              title: "Attendance session prepared",
              body: `${name} is ready to launch.`,
            })}
          />
        </div>
        <SectionCard title="Create class">
          <ActionPanel
            pushToast={pushToast}
            actions={["Add recurring lecture", "Import timetable", "Invite co-facilitator"]}
          />
        </SectionCard>
      </div>
    );
  }

  if (section === "attendance") {
    // Uses UID-specific dashboard route.
    // This file already receives `role` from layout; for facilitator,
    // UID dashboards are mounted under `/dashboard/facilitator/[uid]`.
    return null;
  }


  if (section === "students") return <StudentTable query={query} pushToast={pushToast} compact />;
  if (section === "reports") return <ReportBuilder pushToast={pushToast} facilitator />;
  return null;
}


function KitchenModules({ section, pushToast }: { section: string; pushToast: (toast: Toast) => void }) {
  const { rows: mealRows } = useMealsData();


  if (section === "menu") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MenuEditor
            pushToast={pushToast}
            onPublished={async () => {
              // Other dashboards will pick up via their own data hooks (publishedWeeklyMenus).
            }}
          />

          <SectionCard title="Publish status">
            <ActionPanel pushToast={pushToast} actions={["Publish breakfast", "Publish lunch", "Notify students", "Lock dinner counts"]} />
          </SectionCard>
        </div>
      </div>
    );
  }

  if (section === "demand" || section === "analytics") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Meal demand split">
          <MealDonutChart data={(mealRows || []).map((m: any) => ({ id: m.id, name: m.meal || m.preference || "Meal", value: m.estimated || m.served || 1, color: m.preference === "pepper_free" ? "#f59e0b" : "#6366f1" }))} />
        </SectionCard>
        <SectionCard title="Service progress" className="lg:col-span-2" noPadding>
          <div className="divide-y divide-border/60">
            {(mealRows || []).map((item: any) => {
              const pct = item.prepared > 0 ? Math.round((item.served / item.prepared) * 100) : 0;
              return (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{item.meal} - {item.preference?.replace("_", " ")}</p>
                    </div>
                    <Badge variant={pct > 90 ? "success" : "warning"}>{pct}% served</Badge>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full gradient-wine" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    );
  }

  return <ReportBuilder pushToast={pushToast} kitchen />;
}

function moduleIcon(section: string) {
  switch (section) {
    case "campuses":
      return Building2;
    case "subscriptions":
      return CreditCard;
    case "analytics":
      return BarChart3;
    case "fraud":
      return ShieldCheck;
    case "audit":
      return FileText;
    case "live":
      return Activity;
    case "departments":
      return MapPin;
    case "facilitators":
      return GraduationCap;
    case "students":
      return Globe;
    case "reports":
      return FileText;
    case "classes":
      return Radio;
    case "menu":
      return ChefHat;
    case "demand":
      return Soup;
    case "heatmap":
      return MapPin;
    case "alerts":
      return AlertTriangle;
    case "attendance":
      return ClipboardCheck;
    case "drafts":
      return ClipboardCheck;
    case "achievements":
      return Check;
    case "attendance-stats":
      return BarChart3;
    default:
      return Activity;
  }
}

export function SectionShell({ role, title, section }: { role: Role; title: string; section: string }) {
  const accent = ROLES[role].accent;
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [toast, setToast] = React.useState<Toast | null>(null);
  const Icon = moduleIcon(section);

  const campusRowsHook = useCampusesData();
  const insightsHook = useInsightsData();
  const mealsHook = useMealsData();
  const buildingsHook = useBuildingsData();
  const weeklyAttHook = useWeeklyAttendanceData();
  const hourlyOccHook = useHourlyOccupancyData();
  const liveSessHook = useSessionsData();
  const auditsHook = useAuditLogsData();
  const studentsHook = useStudentsData();
  const notifsHook = useNotificationsData();
  const mealSplitHook = useMealSplitData();
  const deptHook = useDepartmentsData();
  const liveFeedHook = useLiveFeedData();

  const campusRows = campusRowsHook.rows || [];
  const insights = insightsHook.rows || [];
  const weeklyAttendance = weeklyAttHook.rows || [];
  const hourlyOccupancy = hourlyOccHook.rows || [];
  const liveFeed = liveFeedHook.rows || [];
  const auditLogs = auditsHook.rows || [];
  const buildings = buildingsHook.rows || [];
  const liveSessions = liveSessHook.rows || [];
  const mealSplitRows = mealSplitHook.rows || [];
  const departments = deptHook.rows || [];
  const mealRows = mealsHook.rows || [];

  const deptTrend = (departments.length ? departments : deptHook.rows || []).map((d: any) => ({ department: d.name, rate: d.attendanceRate ?? 0 }));

  const attendancePctValue = weeklyAttendance.length
    ? Math.round(
        (weeklyAttendance.reduce((sum, day: any) => sum + (day.present || 0), 0) /
          (weeklyAttendance.reduce((sum, day: any) => sum + (day.present || 0) + (day.absent || 0), 0) || 1)) *
          100
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={moduleCopy[section] ?? `${ROLES[role].label} production workspace.`}
      >
        <Button variant={accent === "amber" ? "default" : "wine"} size="sm" onClick={() => setToast({ title: "Workflow started", body: `${title} action center is active.` })}>
          <Icon className="size-4" /> New action
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Weekly attendance", value: `${attendancePctValue}%`, icon: ClipboardCheck },
          { label: "Active sessions", value: String(liveSessions.length), icon: Radio },
          { label: "Open alerts", value: String((notifsHook.rows || []).filter((n: any) => !n.read).length), icon: Bell },
          { label: "Meals requested", value: (mealSplitRows || []).reduce((sum, item: any) => sum + (item.value || 0), 0).toLocaleString(), icon: UtensilsCrossed },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                <item.icon className="size-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Toolbar
        query={query}
        onQuery={setQuery}
        filter={filter}
        onFilter={setFilter}
        onExport={() => setToast({ title: "Export generated", body: `${title} data was prepared for download.` })}
      />

      {(() => {
        if (role === "super_admin") {
          if (section === "classes") return <AdminClassesDashboard />;
          if (section === "drafts") return <AdminDraftsDashboard />;
          if (section === "attendance-stats") return <AttendanceStatisticsDashboard />;
          return <CampusModules section={section} query={query} filter={filter} pushToast={(t) => setToast(t)} campusRows={campusRows} insights={insights} departmentTrend={deptTrend} weeklyAttendance={weeklyAttendance} />;
        }
        if (role === "campus_admin") {
          if (section === "classes") return <AdminClassesDashboard />;
          if (section === "drafts") return <FacilitatorDraftsDashboard />;
          return <CampusAdminModules section={section} query={query} pushToast={(t) => setToast(t)} liveFeed={liveFeed} liveSessions={liveSessions} departments={departments} />;
        }
        if (role === "facilitator") {
          if (section === "drafts") return <FacilitatorDraftsDashboard />;
          return <FacilitatorModules section={section} query={query} pushToast={(t) => setToast(t)} />;
        }
        if (role === "kitchen_manager") return <KitchenModules section={section} pushToast={(t) => setToast(t)} />;

        if (role === "security_officer") return <SecurityModules section={section} query={query} pushToast={(t) => setToast(t)} auditLogs={auditLogs} buildings={buildings} />;
        return null;
      })()}

      <ActionToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
