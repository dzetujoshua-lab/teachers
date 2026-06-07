"use client";

import Link from "next/link";
import {
  ClipboardCheck,
  CalendarClock,
  Users,
  TrendingDown,
  Play,
  QrCode,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { AttendanceAreaChart } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWeeklyAttendance } from "@/lib/firebase/data";

const classes = [
  { code: "CS301", title: "Algorithms & Complexity", time: "09:00", room: "EA-204", students: 160, rate: 94 },
  { code: "CS210", title: "Data Structures", time: "11:30", room: "EA-110", students: 142, rate: 89 },
  { code: "CS415", title: "Distributed Systems", time: "14:00", room: "Sci-Lab2", students: 78, rate: 96 },
];

export function FacilitatorDashboard() {
  const { rows: weeklyAttendance = [] } = useWeeklyAttendance();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Dr. Mensah"
        description="Computer Science - 3 classes scheduled today"
      >
        <Link href="/dashboard/facilitator/session">
          <Button size="sm">
            <Play className="size-4" /> Start session
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Classes today" value="3" icon={CalendarClock} accent="amber" />
        <StatCard index={1} label="Total students" value="380" icon={Users} accent="neutral" />
        <StatCard index={2} label="Avg attendance" value="92.6%" delta={2} icon={ClipboardCheck} accent="amber" />
        <StatCard index={3} label="At-risk students" value="14" delta={-3} icon={TrendingDown} accent="wine" />
      </div>

      <Card className="overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
        <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl gradient-amber text-charcoal-950">
              <QrCode className="size-6" />
            </div>
            <div>
              <p className="font-semibold">Next class: CS301 - Algorithms</p>
              <p className="text-sm text-muted-foreground">09:00 - Engineering Block A, EA-204</p>
            </div>
          </div>
          <Link href="/dashboard/facilitator/session">
            <Button>
              <Play className="size-4" /> Take attendance
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Today's classes"
          action="My classes"
          actionHref="/dashboard/facilitator/classes"
          className="lg:col-span-2"
          noPadding
        >
          <div className="divide-y divide-border/60">
            {classes.map((c) => (
              <div key={c.code} className="flex items-center gap-4 px-6 py-4">
                <div className="w-14 text-center">
                  <p className="text-sm font-semibold">{c.time}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {c.code} - {c.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.room} - {c.students} students
                  </p>
                </div>
                <Badge variant={c.rate >= 90 ? "success" : "warning"}>{c.rate}%</Badge>
                <Link href="/dashboard/facilitator/session">
                  <Button variant="outline" size="sm">
                    Start
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Attendance trend">
          <AttendanceAreaChart data={weeklyAttendance} />
        </SectionCard>
      </div>
    </div>
  );
}
