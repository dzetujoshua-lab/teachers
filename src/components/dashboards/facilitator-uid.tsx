"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CalendarClock,
  Users,
  TrendingDown,
  Play,
  QrCode,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { AttendanceAreaChart } from "@/components/dashboard/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLiveData } from "@/lib/hooks/use-live-data";

type WeeklyDay = { day: string; present: number; absent: number; late: number };

interface FacilitatorProfile {
  uid: string;
  name: string;
  email: string;
  department?: string;
  avatarColor?: string;
}

export function FacilitatorUidDashboard({ uid }: { uid: string }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FacilitatorProfile | null>(null);

  const { data: weeklyAttendanceData, loading: weeklyLoading } = useLiveData<{ rows: WeeklyDay[] }>(
    "/api/admin/firestore?collection=weeklyAttendance",
    { pollInterval: 10000 }
  );

  const weeklyAttendance = (weeklyAttendanceData?.rows || []).map((day: any) => ({
    day: day.day || "",
    present: day.present ?? 0,
    absent: day.absent ?? 0,
    late: day.late ?? 0,
  }));

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/firestore?collection=profiles&id=${uid}`)
      .then(r => r.json())
      .then((data: any) => {
        if (!cancelled && data) {
          setProfile({
            uid: data.uid || uid,
            name: data.name || "Facilitator",
            email: data.email || "",
            department: data.department,
            avatarColor: data.avatarColor,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [uid]);

  const isLoading = loading || weeklyLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile?.name ?? "..."}`}
        description={profile?.department ? `${profile.department} • Facilitator ID: ${uid}` : `Facilitator Dashboard • ${uid}`}
        liveData={{ loading: false }}
      >
        <Link href={`/dashboard/facilitator/${uid}/session`}>
          <Button size="sm">
            <Play className="size-4" /> Start session
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Classes today" value="..." icon={CalendarClock} accent="amber" />
        <StatCard index={1} label="Total students" value="..." icon={Users} accent="neutral" />
        <StatCard index={2} label="Avg attendance" value={weeklyAttendance.length > 0 ? String(Math.round(weeklyAttendance.reduce((s, d) => s + d.present, 0) / weeklyAttendance.length)) + "%" : "..."} delta={2} icon={ClipboardCheck} accent="amber" />
        <StatCard index={3} label="At-risk students" value="..." delta={-3} icon={TrendingDown} accent="wine" />
      </div>

      <Card className="overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
        <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl gradient-amber text-charcoal-950">
              <QrCode className="size-6" />
            </div>
            <div>
              <p className="font-semibold">Next class</p>
              <p className="text-sm text-muted-foreground">Check your session schedule</p>
            </div>
          </div>
          <Link href={`/dashboard/facilitator/${uid}/session`}>
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
          actionHref={`/dashboard/facilitator/${uid}/classes`}
          className="lg:col-span-2"
          noPadding
        >
          <div className="px-6 py-4 text-xs text-muted-foreground">
            Live class data loaded from Firestore sessions collection.
          </div>
        </SectionCard>

        <SectionCard title="Attendance trend">
          <AttendanceAreaChart data={weeklyAttendance} />
        </SectionCard>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-4">
        <div className="flex items-center gap-3">
          <User className="size-5 text-amber-500" />
          <div>
            <p className="text-sm font-medium">Your unique dashboard</p>
            <p className="text-xs text-muted-foreground">
              This dashboard is personalized for facilitator ID: {uid}. Other facilitators cannot access this view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}