"use client";

import * as React from "react";
import {
  QrCode,
  MapPin,
  Hash,
  ScanLine,
  FileText,
  Flame,
  Leaf,
  UtensilsCrossed,
  Ban,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AttendanceStatus, AttendanceMethod, MealPreference } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStudents } from "@/lib/firebase/data";
import { useSessions, useNotifications } from "@/lib/firebase/data";



const methods: { key: AttendanceMethod; label: string; icon: typeof QrCode }[] = [
  { key: "qr", label: "QR Code", icon: QrCode },
  { key: "gps", label: "GPS", icon: MapPin },
  { key: "pin", label: "PIN", icon: Hash },
  { key: "id_scan", label: "ID Scan", icon: ScanLine },
];

const statuses: { key: AttendanceStatus; label: string; cls: string }[] = [
  { key: "present", label: "Present", cls: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
  { key: "late", label: "Late", cls: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
  { key: "excused", label: "Excused", cls: "bg-charcoal-500/15 text-muted-foreground ring-border" },
  { key: "absent", label: "Absent", cls: "bg-red-500/15 text-red-400 ring-red-500/30" },
];

const meals: { key: MealPreference; label: string; icon: typeof Flame }[] = [
  { key: "pepper", label: "Pepper", icon: Flame },
  { key: "pepper_free", label: "Pepper-Free", icon: Leaf },
  { key: "alternative", label: "Alternative", icon: UtensilsCrossed },
  { key: "no_meal", label: "No Meal", icon: Ban },
];

interface Mark {
  status?: AttendanceStatus;
  meal?: MealPreference;
}

export function FacilitatorSession() {
  const { rows: students = [], loading: studentsLoading } = useStudents();
  const [method, setMethod] = React.useState<AttendanceMethod>("qr");
  const [marks, setMarks] = React.useState<Record<string, Mark>>({});
  const [started, setStarted] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);


  React.useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started]);

  const setStatus = (id: string, status: AttendanceStatus) =>
    setMarks((m) => ({ ...m, [id]: { ...m[id], status } }));
  const setMeal = (id: string, meal: MealPreference) =>
    setMarks((m) => ({ ...m, [id]: { ...m[id], meal } }));

  const counts = statuses.reduce(
    (acc, s) => {
      acc[s.key] = Object.values(marks).filter((m) => m.status === s.key).length;
      return acc;
    },
    {} as Record<AttendanceStatus, number>
  );
  const marked = Object.values(marks).filter((m) => m.status).length;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <PageHeader
        title="CS301 - Algorithms"
        description="Engineering Block A - EA-204 - 160 enrolled"
      >
        {started ? (
          <div className="flex items-center gap-3">
            <Badge variant="success" className="gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live - {mm}:{ss}
            </Badge>
            <Button variant="wine" size="sm" onClick={() => setStarted(false)}>
              End session
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setStarted(true)}>
            Start session
          </Button>
        )}
      </PageHeader>

      {/* Method selector + QR preview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <p className="mb-3 text-sm font-medium">Verification method</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {methods.map((m) => {
              const Icon = m.icon;
              const active = method === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all",
                    active
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
                      : "border-border text-muted-foreground hover:border-border hover:bg-accent/50"
                  )}
                >
                  <Icon className="size-5" />
                  {m.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {statuses.map((s) => (
              <div key={s.key} className="rounded-lg border border-border bg-background/40 py-3">
                <p className="text-xl font-semibold tabular-nums">{counts[s.key] ?? 0}</p>
                <p className="text-xs capitalize text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="grid place-items-center p-5">
          {method === "qr" ? (
            <div className="text-center">
              <div className="mx-auto grid h-36 w-36 place-items-center rounded-2xl bg-white p-3">
                <QrCode className="h-full w-full text-charcoal-950" strokeWidth={1.2} />
              </div>
              <p className="mt-3 text-sm font-medium">Students scan to check in</p>
              <p className="text-xs text-muted-foreground">Rotates every 30s - anti-fraud</p>
            </div>
          ) : method === "pin" ? (
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Session PIN</p>
              <p className="mt-2 font-mono text-4xl font-bold tracking-[0.3em] text-amber-500">
                4827
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Share with students in room</p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              {method === "gps" ? (
                <MapPin className="mx-auto size-10 text-amber-500" />
              ) : (
                <ScanLine className="mx-auto size-10 text-amber-500" />
              )}
              <p className="mt-3 text-sm font-medium text-foreground">
                {method === "gps" ? "Geofence active" : "Scanner ready"}
              </p>
              <p className="text-xs">
                {method === "gps"
                  ? "120m radius - EA-204 verified"
                  : "Tap student IDs to register"}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Roster with status + meal */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Roster</p>
            <p className="text-xs text-muted-foreground">
              {marked}/{students.length} marked - meal preferences captured live
            </p>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="size-4" /> Export
          </Button>
        </div>
        <div className="divide-y divide-border/60">
          {studentsLoading ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">Loading roster...</div>
          ) : students.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">No students found.</div>
          ) : (
            students.map((s) => {
              const mark = marks[s.id] || {};
              const status = mark.status as AttendanceStatus | undefined;
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                  <Avatar name={s.name} color={s.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.studentId} {s.department ? `· ${s.department}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={status ?? ""}
                      onChange={(e) => setStatus(s.id, e.target.value as AttendanceStatus)}
                      className={cn(
                        "h-8 rounded-md border border-border bg-background px-2 text-xs",
                        status && statuses.find((x) => x.key === status)?.cls
                      )}
                    >
                      <option value="">Status</option>
                      {statuses.map((st) => (
                        <option key={st.key} value={st.key}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={mark.meal ?? ""}
                      onChange={(e) => setMeal(s.id, e.target.value as MealPreference)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="">Meal</option>
                      {meals.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

