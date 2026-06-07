"use client";

import {
  ClipboardCheck,
  Flame as Streak,
  Trophy,
  TrendingUp,
  UtensilsCrossed,
  Award,
  Medal,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const history = [
  { course: "CS301 · Algorithms", date: "Today · 09:00", status: "present" },
  { course: "CS210 · Data Structures", date: "Today · 11:30", status: "present" },
  { course: "MATH204 · Linear Algebra", date: "Yesterday", status: "late" },
  { course: "ENG101 · Technical Writing", date: "Mon", status: "present" },
  { course: "CS415 · Distributed Systems", date: "Mon", status: "excused" },
];

const badges = [
  { icon: Streak, label: "42-day streak", tone: "amber" },
  { icon: Award, label: "Perfect month", tone: "wine" },
  { icon: Medal, label: "Top 5% dept.", tone: "amber" },
  { icon: Star, label: "Early bird", tone: "wine" },
];

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome back, Akosua"
        description="Computer Science · STU-2024000"
      >
        <Button size="sm">
          <UtensilsCrossed className="size-4" /> Set meal preference
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Attendance rate" value="96.2%" delta={2} icon={ClipboardCheck} accent="amber" />
        <StatCard index={1} label="Current streak" value="42 days" icon={Streak} accent="wine" />
        <StatCard index={2} label="Dept. ranking" value="#18" delta={4} icon={TrendingUp} accent="amber" />
        <StatCard index={3} label="Consistency" value="A+" icon={Trophy} accent="wine" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Recent attendance"
          action="Full history"
          actionHref="/dashboard/student/attendance"
          className="lg:col-span-2"
          noPadding
        >
          <div className="divide-y divide-border/60">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    h.status === "present"
                      ? "bg-emerald-500"
                      : h.status === "late"
                        ? "bg-amber-500"
                        : "bg-charcoal-400"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.course}</p>
                  <p className="text-xs text-muted-foreground">{h.date}</p>
                </div>
                <Badge
                  variant={
                    h.status === "present"
                      ? "success"
                      : h.status === "late"
                        ? "warning"
                        : "muted"
                  }
                >
                  {h.status}
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Achievements" action="All badges" actionHref="/dashboard/student/achievements">
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background/40 p-4 text-center"
                  >
                    <div
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-full",
                        b.tone === "amber"
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-wine-500/15 text-wine-400"
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <p className="text-xs font-medium leading-tight">{b.label}</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <Card className="overflow-hidden bg-gradient-to-br from-wine-500/10 to-transparent p-5">
            <p className="text-sm font-medium">Today's meal</p>
            <p className="mt-1 text-xs text-muted-foreground">Lunch · 12:30 – 14:00</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="wine">
                <Streak className="size-3" /> Pepper
              </Badge>
              <span className="text-sm text-muted-foreground">Jollof Rice & Chicken</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}