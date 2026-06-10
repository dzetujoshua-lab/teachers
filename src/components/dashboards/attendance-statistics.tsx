import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Card } from "@/components/ui/card";
import { AttendanceAreaChart, DepartmentBarChart } from "@/components/dashboard/charts";
import { useLiveData } from "@/lib/hooks/use-live-data";

export function AttendanceStatisticsDashboard() {
  const { data: trendData, loading: trendLoading, lastUpdated: trendUpdated } = useLiveData<{
    data: { date: string; day: string; present: number; absent: number; late: number; rate: number }[];
  }>(
    "/api/attendance/statistics?view=trend&days=30",
    { pollInterval: 60000, immediate: true }
  );

  const { data: deptData, loading: deptLoading, lastUpdated: deptUpdated } = useLiveData<{
    data: { id: string; name: string; students: number; attendanceRate: number; present: number; total: number }[];
  }>(
    "/api/attendance/statistics?view=department",
    { pollInterval: 120000, immediate: true }
  );

  const trend = trendData?.data || [];
  const departments = deptData?.data || [];

  const avgRate = trend.length 
    ? Math.round(trend.reduce((sum: number, d: any) => sum + (d.rate || 0), 0) / trend.length)
    : 0;

  const totalStudents = departments.reduce((sum: number, d: any) => sum + (d.students || 0), 0);
  const totalRecords = departments.reduce((sum: number, d: any) => sum + (d.total || 0), 0);
  const totalPresent = departments.reduce((sum: number, d: any) => sum + (d.present || 0), 0);
  const overallRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Statistics"
        description="View attendance trends and department comparisons over time"
        liveData={{ lastUpdated: trendUpdated || deptUpdated, loading: trendLoading || deptLoading }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">30-day Avg Rate</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{avgRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Overall Rate</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{overallRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Students</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totalStudents}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Records (30d)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totalRecords}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Attendance Trend (30 days)">
          <AttendanceAreaChart data={trend.map((d: any) => ({
            day: d.day,
            present: d.present,
            absent: d.absent,
            late: d.late
          }))} />
        </SectionCard>

        <SectionCard title="Department Comparison">
          <DepartmentBarChart data={departments.map((d: any) => ({
            name: d.name,
            rate: d.attendanceRate
          }))} />
        </SectionCard>
      </div>

      <SectionCard title="Department Details">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Attendance Rate</th>
                <th className="px-4 py-3 font-medium">Present</th>
                <th className="px-4 py-3 font-medium">Total Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(departments || []).map((dept: any) => (
                <tr key={dept.id} className="bg-card/40">
                  <td className="px-4 py-3 font-medium">{dept.name}</td>
                  <td className="px-4 py-3 tabular-nums">{dept.students}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-muted">
                        <div 
                          className="h-full rounded-full bg-amber-500" 
                          style={{ width: `${Math.min(100, dept.attendanceRate)}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-xs">{dept.attendanceRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{dept.present}</td>
                  <td className="px-4 py-3 tabular-nums">{dept.total}</td>
                </tr>
              ))}
              {departments.length === 0 && !deptLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No department data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Daily Attendance History">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Present</th>
                <th className="px-4 py-3 font-medium">Absent</th>
                <th className="px-4 py-3 font-medium">Late</th>
                <th className="px-4 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {trend.slice(0, 14).map((day: any) => (
                <tr key={day.date} className="bg-card/40">
                  <td className="px-4 py-3 font-medium">{day.date}</td>
                  <td className="px-4 py-3 tabular-nums text-green-500">{day.present}</td>
                  <td className="px-4 py-3 tabular-nums text-red-500">{day.absent}</td>
                  <td className="px-4 py-3 tabular-nums text-orange-500">{day.late}</td>
                  <td className="px-4 py-3 tabular-nums">{day.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}