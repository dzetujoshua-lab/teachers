import { NextResponse } from "next/server";
import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const view = url.searchParams.get("view") || "trend";

    if (view === "trend") {
      const trendData = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split("T")[0];
        
        const attendanceSnapshot = await db.collection("attendance")
          .where("date", "==", dateStr)
          .get();
        
        const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data());
        
        const present = attendanceRecords.filter((r: any) => r.status === "present").length;
        const absent = attendanceRecords.filter((r: any) => r.status === "absent").length;
        const late = attendanceRecords.filter((r: any) => r.status === "late").length;
        const total = present + absent + late;
        
        trendData.push({
          date: dateStr,
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          present: present,
          absent: absent,
          late: late,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        });
      }

      return NextResponse.json({
        success: true,
        view: "trend",
        days,
        data: trendData,
      });
    }

    if (view === "department") {
      const departmentsSnapshot = await db.collection("departments").get();
      const departments = departmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }));

      const departmentStats = [];
      for (const dept of departments as { id: string; name?: string }[]) {
        const deptId = dept.id;
        
        const studentsSnapshot = await db.collection("students")
          .where("departmentId", "==", deptId)
          .get();
        
        const studentCount = studentsSnapshot.size;

        const attendanceSnapshot = await db.collection("attendance")
          .where("departmentId", "==", deptId)
          .get();
        
        const records = attendanceSnapshot.docs.map((doc) => doc.data());
        const present = records.filter((r: any) => r.status === "present").length;
        const total = records.length;
        
        departmentStats.push({
          id: deptId,
          name: dept.name || "Unknown",
          students: studentCount,
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
          present,
          total,
        });
      }

      return NextResponse.json({
        success: true,
        view: "department",
        data: departmentStats,
      });
    }

    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 });
  } catch (error) {
    console.error("Attendance statistics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}