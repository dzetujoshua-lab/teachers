"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Clock,
  X,
  FileText,
  Leaf,
  UtensilsCrossed,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import type { AttendanceStatus, MealPreference } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SessionStudent {
  id: string;
  name: string;
  studentNo?: string;
}

const statuses: { key: AttendanceStatus; label: string; cls: string }[] = [
  { key: "present", label: "Present", cls: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
  { key: "late", label: "Late", cls: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
  { key: "excused", label: "Excused", cls: "bg-charcoal-500/15 text-muted-foreground ring-border" },
  { key: "absent", label: "Absent", cls: "bg-red-500/15 text-red-400 ring-red-500/30" },
  { key: "suspended", label: "Suspended", cls: "bg-wine-500/15 text-wine-400 ring-wine-500/30" },
];

const meals: { key: MealPreference; label: string; icon: typeof Flame }[] = [
  { key: "pepper_free", label: "Pepper-Free", icon: Leaf },
  { key: "alternative", label: "Alternative", icon: UtensilsCrossed },
];

interface Mark {
  status?: AttendanceStatus;
  meal?: MealPreference;
}

export function FacilitatorSession() {
  const [marks, setMarks] = React.useState<Record<string, Mark>>({});
  const [started, setStarted] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [roster, setRoster] = React.useState<SessionStudent[]>([]);
  const [draftId, setDraftId] = React.useState<string | null>(null);
  const [draftTitle, setDraftTitle] = React.useState<string>("");
  const [assignmentLoading, setAssignmentLoading] = React.useState(true);
  const [publishing, setPublishing] = React.useState(false);

  React.useEffect(() => {
    const loadAssignedDraft = async () => {
      try {
        setAssignmentLoading(true);
        const response = await fetch("/api/attendance/drafts?status=draft");
        if (!response.ok) return;
        const data = await response.json();
        const draft = Array.isArray(data.rows) && data.rows.length > 0 ? data.rows[0] : null;

        if (draft) {
          setDraftId(draft.id);
          setDraftTitle(draft.title || "Assigned attendance draft");
          setRoster(
            Array.isArray(draft.members)
              ? draft.members.map((member: any) => ({
                  id: String(member.studentId),
                  name: String(member.name || "Unnamed student"),
                  studentNo: member.studentNo ? String(member.studentNo) : undefined,
                }))
              : []
          );
        }
      } catch (error) {
        console.error("Failed to load assigned draft:", error);
      } finally {
        setAssignmentLoading(false);
      }
    };

    loadAssignedDraft();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadAssignedDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started]);

  const setStatus = (id: string, status: AttendanceStatus) =>
    setMarks((m) => ({ ...m, [id]: { ...m[id], status } }));
  const setMeal = (id: string, meal: MealPreference) =>
    setMarks((m) => ({ ...m, [id]: { ...m[id], meal } }));

  const marked = Object.values(marks).filter((m) => m.status).length;
  const presentCount = Object.values(marks).filter((m) => m.status === "present").length;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const rosterEmpty = roster.length === 0;
  const headerDescription = assignmentLoading
    ? "Loading your assigned class roster…"
    : draftTitle
    ? `Assigned roster loaded from "${draftTitle}". Start your session when ready.`
    : "The roster will remain blank until your admin assigns students, a class, and a campus.";

  const handleExport = () => {
    const rows = roster.map((r) => ({
      name: r.name,
      studentNo: r.studentNo ?? "",
      status: marks[r.id]?.status ?? "unmarked",
      meal: marks[r.id]?.meal ?? "unmarked",
    }));
    const csv = "Name,Student No,Status,Meal\n" + rows.map((row) => `${row.name},${row.studentNo},${row.status},${row.meal}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAndPublish = async () => {
    if (!started) return;
    if (rosterEmpty) {
      alert("No roster available yet. Ask your admin to assign the class roster.");
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch("/api/attendance/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTitle: draftTitle || "Take Attendance",
          draftId,
          roster: roster.map((student) => ({
            studentId: student.id,
            name: student.name,
            studentNo: student.studentNo,
            status: marks[student.id]?.status || "absent",
            meal: marks[student.id]?.meal || "unknown",
          })),
        }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error || "Failed to publish attendance.");
      }

      alert("Attendance published. Admin, security, and kitchen dashboards have been notified.");
      setStarted(false);
      setElapsed(0);
      setMarks({});
      setDraftId(null);
      setDraftTitle("");
      setRoster([]);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to publish attendance.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Take Attendance"
        description={headerDescription}
      >
        {started ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="success" className="gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live - {mm}:{ss}
            </Badge>
            <Button size="sm" variant="default" onClick={handleSaveAndPublish} disabled={publishing || rosterEmpty || marked === 0}>
              <Send className="size-4" /> Save & Publish
            </Button>
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

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Roster</p>
            <p className="text-xs text-muted-foreground">
              {marked}/{roster.length} marked{rosterEmpty ? "" : " - meal preferences captured live"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileText className="size-4" /> Export
          </Button>
        </div>

        {rosterEmpty ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No students have been assigned to this roster yet.
            <div className="mt-2">
              Once your admin creates students, a class, and a campus and sends them to you, they will appear here to take attendance.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {roster.map((r, i) => {
              const mark = marks[r.id] ?? {};
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex flex-col gap-3 px-5 py-3 md:flex-row md:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={r.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.studentNo ?? "No student number"}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {statuses.map((s) => {
                      const active = mark.status === s.key;
                      const Icon = s.key === "present" ? Check : s.key === "late" ? Clock : X;
                      return (
                        <button
                          key={s.key}
                          onClick={() => setStatus(r.id, s.key)}
                          title={s.label}
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-lg ring-1 transition-all",
                            active
                              ? s.cls
                              : "ring-border text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {s.key === "excused" ? (
                            <span className="text-xs font-bold">E</span>
                          ) : (
                            <Icon className="size-4" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-1.5 md:border-l md:border-border md:pl-3">
                    {meals.map((meal) => {
                      const Icon = meal.icon;
                      const active = mark.meal === meal.key;
                      return (
                        <button
                          key={meal.key}
                          onClick={() => setMeal(r.id, meal.key)}
                          title={meal.label}
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-lg ring-1 transition-all",
                            active
                              ? "bg-wine-500/15 text-wine-400 ring-wine-500/30"
                              : "ring-border text-muted-foreground hover:bg-accent"
                          )}
                        >
                          <Icon className="size-4" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
