"use client";

import * as React from "react";

export type AttendanceRow = {
  id: string;
  course: string;
  facilitator: string;
  facilitatorDept?: string;
  building?: string;
  room: string;
  method: string;
  startedAt: string;
  status: string;
  present: number;
  total: number;
  flagged: number;
};

export type AuditRow = {
  id: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  device: string;
  time: string;
  severity: string;
};

export type MealRow = {
  id: string;
  meal: string;
  name: string;
  preference: string;
  estimated: number;
  prepared: number;
  served: number;
};

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  department?: string;
  studentId: string;
  attendanceRate: number;
  streak: number;
  mealPreference: string;
  dietary?: string[];
};

export type InsightRow = {
  id: string;
  tag: string;
  tone: string;
  text: string;
};

export type CampusRow = {
  id: string;
  name: string;
  location: string;
  students: number;
  status: string;
};

export type DepartmentRow = {
  id: string;
  name: string;
  faculty: string;
  students: number;
  attendanceRate: number;
};

export type BuildingRow = {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  time: string;
  read: boolean;
};

export type WeeklyDayRow = {
  day: string;
  present: number;
  absent: number;
};

export type HourlyRow = {
  hour: string;
  occupancy: number;
};

export type MealSplitRow = {
  id: string;
  name: string;
  value: number;
  color: string;
};

export type DepartmentTrendRow = {
  department: string;
  rate: number;
};

export type EventRow = {
  id: string;
  student: string;
  studentId: string;
  course: string;
  building?: string;
  status: string;
  method: string;
  time: string;
  suspicious?: boolean;
  reason?: string;
};

export type LiveFeedRow = {
  id: string;
  student: string;
  course: string;
  building?: string;
  status: string;
  method: string;
  time: string;
};

function useFirestore<T>(collectionName: string, queryFn?: (snap: any) => T[]): { rows: T[]; loading: boolean; error: string | null } {
  const [rows, setRows] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/firestore?collection=${encodeURIComponent(collectionName)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `Failed to load ${collectionName}` }));
          throw new Error(err.error || `Failed to load ${collectionName}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setRows(queryFn ? queryFn(data) : data.rows || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [collectionName]);

  return { rows, loading, error };
}

export function useSessions() {
  return useFirestore<AttendanceRow>("sessions");
}

export function useAttendance() {
  return useFirestore<EventRow>("attendance");
}

export function useLiveFeed() {
  return useFirestore<LiveFeedRow>("attendance");
}

export function useAuditLogs() {
  return useFirestore<AuditRow>("auditLogs");
}

export function useMeals() {
  return useFirestore<MealRow>("meals");
}

export function useStudents() {
  return useFirestore<StudentRow>("students");
}

export function useInsights() {
  return useFirestore<InsightRow>("aiInsights");
}

export function useCampuses() {
  return useFirestore<CampusRow>("campuses");
}

export function useDepartments() {
  return useFirestore<DepartmentRow>("departments");
}

export function useBuildings() {
  return useFirestore<BuildingRow>("buildings");
}

export function useNotifications() {
  return useFirestore<NotificationItem>("notifications");
}

export function useWeeklyAttendance() {
  return useFirestore<WeeklyDayRow>("weeklyAttendance");
}

export function useHourlyOccupancy() {
  return useFirestore<HourlyRow>("hourlyOccupancy");
}

export function useMealSplit() {
  return useFirestore<MealSplitRow>("mealSplit");
}

export function useDepartmentTrend() {
  return useFirestore<DepartmentTrendRow>("departmentTrend");
}
