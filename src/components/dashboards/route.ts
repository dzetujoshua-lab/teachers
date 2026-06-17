import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin"; // Adjust this path to your Firebase Admin setup
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

/**
 * Bulk Attendance API Handler
 * Processes multiple attendance records in a single request using Firestore Batched Writes.
 */
export async function POST(req: Request) {
  try {
    const bulkAttendanceSchema = z.object({
      sessionId: z.string().min(1, "Session ID is required"),
      records: z.array(z.object({
        studentId: z.string().min(1, "Student ID is required"),
        method: z.enum(["manual", "qr", "nfc"]).default("manual"),
        metadata: z.object({
          status: z.enum(["present", "absent", "late", "excused", "suspended"]).default("absent"),
        }).optional(),
      })).min(1, "At least one attendance record is required"),
    });

    const body = await req.json();
    const validation = bulkAttendanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: validation.error.flatten() },
        { status: 400 } // Bad Request
      );
    }
    const { sessionId, records } = validation.data;

    // 2. Process in chunks of 500 (Firestore's maximum batch size)
    const MAX_BATCH_SIZE = 500;
    const batchPromises = [];

    for (let i = 0; i < records.length; i += MAX_BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = records.slice(i, i + MAX_BATCH_SIZE);

      chunk.forEach((record: any) => {
        // Use a composite ID (sessionId + studentId) to ensure uniqueness and allow easy updates
        const docId = `${sessionId}_${record.studentId}`;
        const docRef = adminDb.collection("attendance").doc(docId);

        batch.set(docRef, {
          sessionId,
          studentId: record.studentId,
          status: record.metadata?.status || "absent",
          method: record.method || "manual",
          timestamp: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true }); // Merge ensures we don't overwrite unrelated fields if they exist
      });

      batchPromises.push(batch.commit());
    }

    // 3. Execute all batches
    await Promise.all(batchPromises);

    return NextResponse.json({ 
      success: true, 
      count: records.length,
      message: `Successfully processed ${records.length} attendance records.`
    });
  } catch (error: any) {
    console.error("[API_ATTENDANCE_BULK_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}