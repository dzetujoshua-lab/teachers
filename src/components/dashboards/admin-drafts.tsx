"use client";

import * as React from "react";
import { Send, CheckCircle, Clock, AlertCircle, Edit, Save, ChefHat, Plus, X, PauseCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { relativeTime } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/types";
import { useLiveData } from "@/lib/hooks/use-live-data";

interface DraftRow {
  id: string;
  title: string;
  classId?: string;
  facilitatorId: string;
  facilitatorEmail?: string;
  members: { studentId: string; name: string; status?: AttendanceStatus }[];
  status: "draft" | "submitted" | "approved" | "sent_to_kitchen";
  createdAt: string;
  updatedAt: string;
}

interface SpreadsheetStudentRow {
  idNo: string;
  classCode: string;
  studentName: string;
  email: string;
  status: AttendanceStatus;
}


export function AdminDraftsDashboard() {
   const [showCreate, setShowCreate] = React.useState(false);
    const [selectedDraft, setSelectedDraft] = React.useState<DraftRow | null>(null);
    const [editMembers, setEditMembers] = React.useState<{ studentId: string; name: string; status?: AttendanceStatus }[]>([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [sendingToKitchen, setSendingToKitchen] = React.useState(false);
    const [autoGenerating, setAutoGenerating] = React.useState(false);

const { data: draftsData, loading, lastUpdated, error: draftsError } = useLiveData<{ rows: DraftRow[] }>(
       "/api/attendance/drafts?includeAll=true",
       { pollInterval: 60000 }
     );

     const drafts = draftsData?.rows || [];

  const [facilitators, setFacilitators] = React.useState<{ id: string; name?: string; email?: string }[]>([]);
  const [allStudents, setAllStudents] = React.useState<{ id: string; name: string; studentId?: string; email?: string }[]>([]);
  const [newTitle, setNewTitle] = React.useState("");
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [selectedFacilitator, setSelectedFacilitator] = React.useState<string | null>(null);


  const [creating, setCreating] = React.useState(false);
  const [creatingCampus, setCreatingCampus] = React.useState(false);
const [creatingStudent, setCreatingStudent] = React.useState(false);
   const [creatingBulkStudents, setCreatingBulkStudents] = React.useState(false);
   const [bulkStudentsText, setBulkStudentsText] = React.useState("");
   const [bulkCampusId, setBulkCampusId] = React.useState("");
   const [creatingClass, setCreatingClass] = React.useState(false);
  const [campuses, setCampuses] = React.useState<{ id: string; name: string; location?: string }[]>([]);
  const [classesList, setClassesList] = React.useState<any[]>([]);
  const [newCampus, setNewCampus] = React.useState({ name: "", location: "" });
  const [newStudent, setNewStudent] = React.useState({ studentId: "", name: "", email: "", campusId: "" });
  const [classForm, setClassForm] = React.useState({ code: "", name: "", campusId: "", facilitatorId: "", members: [] as string[] });

const loadCreateResources = async () => {
     try {
       const [campusesRes, profilesRes, studentsRes, classesRes] = await Promise.all([
         fetch(`/api/campuses`),
         fetch(`/api/admin/firestore?collection=profiles`),
         fetch(`/api/admin/firestore?collection=students`),
         fetch(`/api/classes`),
       ]);

       if (!campusesRes.ok || !profilesRes.ok || !studentsRes.ok || !classesRes.ok) {
         throw new Error("One or more resources failed to load");
       }

       const [campusesData, profilesData, studentsData, classesData] = await Promise.all([
         campusesRes.json(),
         profilesRes.json(),
         studentsRes.json(),
         classesRes.json(),
       ]);

       setCampuses(campusesData.data || []);

       const facs = (profilesData.rows || [])
         .filter((p: any) => p.role === "facilitator")
         .map((p: any) => ({ id: p.id, name: p.name, email: p.email }));
       setFacilitators(facs);

       const studs = (studentsData.rows || []).map((s: any) => ({ id: s.id, name: s.name, studentId: s.studentId }));
       setAllStudents(studs);
       setClassesList(classesData.data || []);
     } catch (err) {
       console.error("Failed to load create resources:", err);
       setFacilitators([]);
       setAllStudents([]);
       setClassesList([]);
     }
   };

   React.useEffect(() => {
     loadCreateResources();
   }, []);

const handleAutoGenerateToday = async () => {
      setAutoGenerating(true);
      try {
        const res = await fetch("/api/attendance/auto-generate-daily-drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const result = await res.json();
        if (result.success) {
          alert(`Auto-generated ${result.generated} daily attendance drafts`);
        } else {
          alert(result.error || "Failed to auto-generate drafts");
        }
      } catch (err) {
        console.error("Auto-generate error:", err);
        alert("Error generating daily drafts");
      } finally {
        setAutoGenerating(false);
      }
    };

  const [editableRows, setEditableRows] = React.useState<SpreadsheetStudentRow[]>([
    { idNo: "101", classCode: "A-101", studentName: "John Smith", email: "john.smith@students.edu", status: "present" },
    { idNo: "102", classCode: "B-102", studentName: "Maria Garcia", email: "maria.garcia@students.edu", status: "present" },
    { idNo: "103", classCode: "C-103", studentName: "David Chen", email: "david.chen@students.edu", status: "present" },
    { idNo: "104", classCode: "D-104", studentName: "Emily Wilson", email: "emily.wilson@students.edu", status: "present" },
    { idNo: "105", classCode: "A-101", studentName: "Michael Brown", email: "michael.brown@students.edu", status: "present" },
  ]);

  const syncEditableRowsFromText = () => {
    const lines = bulkStudentsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = lines
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        const [idNo = "", classCode = "", studentName = "", email = ""] = parts;
        if (!idNo && !classCode && !studentName && !email) return null;
        return { idNo, classCode, studentName, email, status: "present" as AttendanceStatus };
      })
      .filter((r): r is SpreadsheetStudentRow => Boolean(r));
    setEditableRows(parsed);
  };

  const syncTextFromEditableRows = () => {
    const text = editableRows
      .map((r) => `${r.idNo},${r.classCode},${r.studentName},${r.email}`)
      .join("\n");
    setBulkStudentsText(text);
  };

  React.useEffect(() => {
    if (bulkStudentsText.trim()) {
      syncEditableRowsFromText();
    }
  }, [bulkStudentsText]);

  const handleEditableRowChange = (idx: number, field: keyof SpreadsheetStudentRow, value: string) => {
    setEditableRows((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      syncTextFromEditableRows();
      return updated;
    });
  };

  const addEditableRow = () => {
    setEditableRows((prev) => [...prev, { idNo: "", classCode: "", studentName: "", email: "", status: "present" }]);
    setBulkStudentsText((prev) => `${prev}\n,,,,`);
  };

  const removeEditableRow = (idx: number) => {
    setEditableRows((prev) => prev.filter((_, i) => i !== idx));
    const lines = bulkStudentsText.split("\n").filter((_, i) => i !== idx);
    setBulkStudentsText(lines.join("\n"));
  };

  const handleRowPaste = (e: React.ClipboardEvent, idx: number) => {
    const pasted = e.clipboardData.getData("text/plain");
    const lines = pasted.split("\n").filter((l) => l.trim());
    if (lines.length <= 1) return;
    e.preventDefault();
const newRows = lines.map((line) => {
       const parts = line.split(",").map((p) => p.trim());
       const [rawStudentId = "", classCode = "", name = "", email = ""] = parts;
       return { idNo: rawStudentId, classCode, studentName: name, email, status: "present" as AttendanceStatus };
     }).filter((r): r is SpreadsheetStudentRow => Boolean(r));
    setEditableRows((prev) => {
      const updated = [...prev];
      updated.splice(idx, 1, ...newRows);
      syncTextFromEditableRows();
      return updated;
    });
  };

  const renderEditableTable = () => (
    <div className="rounded-lg border border-slate-300 bg-background">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-100">
              <th className="border border-slate-600 px-3 py-1.5 text-center font-bold w-12">#</th>
              <th className="border border-slate-600 px-3 py-1.5 text-center font-bold">ID No.</th>
              <th className="border border-slate-600 px-3 py-1.5 text-center font-bold">Class Code</th>
              <th className="border border-slate-600 px-3 py-1.5 text-center font-bold">Student Name</th>
              <th className="border border-slate-600 px-3 py-1.5 text-center font-bold">Email</th>
              <th className="border border-slate-600 px-3 py-1.5 text-center font-bold w-28">Status</th>
              <th className="border border-slate-600 px-3 py-1.5 text-center font-bold w-10"></th>
            </tr>
          </thead>
          <tbody>
            {editableRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-slate-300 px-3 py-6 text-center text-xs text-muted-foreground">
                  Paste or type student data in the text area below to populate the table, or use the inputs above to add rows manually.
                </td>
              </tr>
            ) : (
              editableRows.map((r, idx) => (
                <tr
                  key={`${r.idNo}-${r.classCode}-${idx}`}
                  onPaste={(e) => handleRowPaste(e, idx)}
                >
                  <td className="border border-slate-300 px-3 py-1.5 text-center font-mono text-muted-foreground font-medium bg-slate-100">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 px-0 py-1 bg-white">
                    <input
                      type="text"
                      className="w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-none px-3 py-1.5 font-mono text-sm text-slate-900"
                      value={r.idNo}
                      onChange={(e) => handleEditableRowChange(idx, "idNo", e.target.value)}
                      placeholder="101"
                    />
                  </td>
                  <td className="border border-slate-300 px-0 py-1 bg-white">
                    <input
                      type="text"
                      className="w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-none px-3 py-1.5 font-mono text-sm text-slate-900"
                      value={r.classCode}
                      onChange={(e) => handleEditableRowChange(idx, "classCode", e.target.value)}
                      placeholder="A-101"
                    />
                  </td>
                  <td className="border border-slate-300 px-0 py-1 bg-white">
                    <input
                      type="text"
                      className="w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-none px-3 py-1.5 text-sm text-slate-900"
                      value={r.studentName}
                      onChange={(e) => handleEditableRowChange(idx, "studentName", e.target.value)}
                      placeholder="John Doe"
                    />
                  </td>
                  <td className="border border-slate-300 px-0 py-1 bg-white">
                    <input
                      type="text"
                      className="w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-none px-3 py-1.5 text-sm text-slate-900"
                      value={r.email}
                      onChange={(e) => handleEditableRowChange(idx, "email", e.target.value)}
                      placeholder="john@example.com"
                    />
                  </td>
                  <td className="border border-slate-300 px-0 py-1 bg-white">
                    <select
                      value={r.status}
                      onChange={(e) => handleEditableRowChange(idx, "status", e.target.value)}
                      className="w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-none px-3 py-1.5 text-sm text-slate-900 cursor-pointer"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 text-center bg-white">
                    <button
                      type="button"
                      onClick={() => removeEditableRow(idx)}
                      className="shrink-0 p-1 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      title="Remove row"
                    >
                      <X className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-300 p-3 bg-slate-50">
         <div className="flex items-center gap-2">
           <div className="text-xs text-muted-foreground">
             Format: <span className="font-medium">ID No.,Class,Student Name,Email</span> (one per line)
           </div>
           <Button
             type="button"
             variant="outline"
             size="sm"
             onClick={() => {
               setEditableRows([]);
               setBulkStudentsText("");
             }}
             className="shrink-0"
           >
             Clear All
           </Button>
         </div>
         <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEditableRow}
          className="shrink-0 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500"
        >
          <Plus className="size-3.5 mr-1" /> Add Row
        </Button>
      </div>

      <div className="p-3 border-t border-slate-300">
        <textarea
          className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-yellow-50/30"
          placeholder={`101,A-101,John Doe,john@example.com\n102,B-102,Jane Doe,jane@example.com`}
          value={bulkStudentsText}
          onChange={(e) => setBulkStudentsText(e.target.value)}
        />
      </div>
    </div>
  );

  const formatStudentIdNumber = (raw: string) => {
    const digitsOnly = String(raw).replace(/\D+/g, "");
    const asNumber = Number(digitsOnly);
    return Number.isFinite(asNumber) ? String(asNumber) : raw;
  };
  const handleEditDraft = (draft: DraftRow) => {
    setSelectedDraft(draft);
    setEditMembers(draft.members.map((m) => ({ ...m })));
  };

  const handleStatusChange = (
    idx: number,
    status: AttendanceStatus
  ) => {
    const updated = [...editMembers];
    updated[idx] = { ...updated[idx], status };
    setEditMembers(updated);
  };

  const handleSaveEdit = async () => {
    if (!selectedDraft) return;

    try {
      const res = await fetch(`/api/attendance/drafts/${selectedDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: editMembers,
          status: "approved",
        }),
      });

if (res.ok) {
         alert("Draft saved and approved");
         setSelectedDraft(null);
       } else {
         alert("Failed to save draft");
       }
    } catch (err) {
      console.error("Error saving draft:", err);
      alert("Error saving draft");
    }
  };

  const handleSendToKitchen = async () => {
    if (!selectedDraft) return;

    setSendingToKitchen(true);
    try {
      const res = await fetch(`/api/attendance/drafts/${selectedDraft.id}/send-to-kitchen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

if (res.ok) {
         alert("Attendance sent to kitchen manager successfully");
         setSelectedDraft(null);
       } else {
         const result = await res.json();
         alert(result.error || "Failed to send to kitchen manager");
       }
    } catch (err) {
      console.error("Error sending to kitchen:", err);
      alert("Error sending to kitchen manager");
    } finally {
      setSendingToKitchen(false);
    }
  };

  const handleSendToFacilitator = async () => {
    if (!selectedDraft) return;

    setSendingToKitchen(true);
    try {
      const res = await fetch("/api/attendance/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedDraft.title,
          classId: selectedDraft.classId || null,
          facilitatorId: selectedDraft.facilitatorId || "unassigned",
          members: selectedDraft.members.map((m) => ({
            studentId: m.studentId,
            name: m.name,
          })),
        }),
      });


      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Draft sent/assigned to facilitator successfully");
        setSelectedDraft(null);
      } else {
        alert(result.error || "Failed to send draft to facilitator");
      }
    } catch (err) {
      console.error("Error sending to facilitator:", err);
      alert("Error sending to facilitator");
    } finally {
      setSendingToKitchen(false);
    }
  };

  const handleCreateCampus = async () => {
    if (!newCampus.name.trim()) {
      alert("Campus name is required");
      return;
    }

    setCreatingCampus(true);
    try {
      const res = await fetch("/api/campuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampus),
      });
      const result = await res.json();

      if (res.ok) {
        setCampuses((current) => [result.campus, ...current]);
        setNewCampus({ name: "", location: "" });
      } else {
        alert(result.error || "Failed to create campus");
      }
    } catch (err) {
      console.error("Error creating campus:", err);
      alert("Error creating campus");
    } finally {
      setCreatingCampus(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudent.studentId.trim() || !newStudent.name.trim() || !newStudent.email.trim()) {
      alert("Student ID, name, and email are required");
      return;
    }

    setCreatingStudent(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      const result = await res.json();

      if (res.ok) {
        setAllStudents((current) => [result.student, ...current]);
        setNewStudent({ studentId: "", name: "", email: "", campusId: "" });
      } else {
        alert(result.error || "Failed to create student");
      }
    } catch (err) {
      console.error("Error creating student:", err);
      alert("Error creating student");
} finally {
      setCreatingStudent(false);
    }
  };

   const handleCreateBulkStudents = async () => {
    const lines = bulkStudentsText.trim().split("\n").filter(line => line.trim());
    if (lines.length === 0) {
      alert("Enter at least one student");
      return;
    }

    const students = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return {
        studentId: parts[0] || "",
        name: parts[1] || "",
        email: parts[2] || "",
      };
    }).filter(s => s.studentId && s.name && s.email);

    if (students.length === 0) {
      alert("Each line must have: studentId, name, email");
      return;
    }

    setCreatingBulkStudents(true);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students, campusId: bulkCampusId || undefined }),
      });
      const result = await res.json();

      if (res.ok) {
        setAllStudents((current) => [...result.students, ...current]);
        setBulkStudentsText("");
        setBulkCampusId("");
        alert(`Created ${result.count} students`);
      } else {
        alert(result.error || "Failed to create students");
      }
    } catch (err) {
      console.error("Error creating bulk students:", err);
      alert("Error creating students");
    } finally {
      setCreatingBulkStudents(false);
    }
  };

   const handleCreateClass = async () => {
    if (!classForm.code.trim() || !classForm.name.trim() || !classForm.facilitatorId.trim()) {
      alert("Class code, name, and facilitator are required");
      return;
    }

    setCreatingClass(true);
    try {
      const members = allStudents
        .filter((student) => classForm.members.includes(student.id))
        .map((student) => ({ studentId: student.studentId || student.id, name: student.name, email: (student as any).email || "" }));
      const campus = campuses.find((campus) => campus.id === classForm.campusId);

      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: classForm.code,
          name: classForm.name,
          facilitatorId: classForm.facilitatorId,
          facilitatorEmail: facilitators.find((f) => f.id === classForm.facilitatorId)?.email || "",
          campusId: classForm.campusId,
          campusName: campus?.name,
          members,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        setClassesList((current) => [result.class, ...current]);
        setClassForm({ code: "", name: "", campusId: "", facilitatorId: "", members: [] });
      } else {
        alert(result.error || "Failed to create class");
      }
    } catch (err) {
      console.error("Error creating class:", err);
      alert("Error creating class");
    } finally {
      setCreatingClass(false);
    }
  };

  if (selectedDraft) {
    const presentCount = editMembers.filter((m) => m.status === "present").length;
    const absentCount = editMembers.filter((m) => m.status === "absent").length;
    const lateCount = editMembers.filter((m) => m.status === "late").length;

    return (
      <div className="space-y-6">
        <PageHeader
          title={selectedDraft.title}
          description={`Review and edit attendance for ${editMembers.length} members`}
        >
          <Button
            onClick={() => setSelectedDraft(null)}
            variant="outline"
            size="sm"
          >
            Back
          </Button>
        </PageHeader>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{presentCount}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{lateCount}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">
              {(
                (presentCount / editMembers.length) *
                100
              ).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Attendance</p>
          </Card>
        </div>

         <Card className="p-6">
           <div className="overflow-x-auto">
             <table className="w-full border-collapse text-sm">
               <thead>
                 <tr className="bg-slate-200 text-slate-800">
                   <th className="border border-slate-300 px-3 py-1.5 text-center font-bold w-12">#</th>
                   <th className="border border-slate-300 px-3 py-1.5 text-center font-bold">Student ID</th>
                   <th className="border border-slate-300 px-3 py-1.5 text-center font-bold">Student Name</th>
                   <th className="border border-slate-300 px-3 py-1.5 text-center font-bold">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {editMembers.map((member, idx) => (
                   <tr key={idx}>
                     <td className="border border-slate-300 px-3 py-1.5 text-center font-mono text-muted-foreground font-medium bg-slate-100">
                       {idx + 1}
                     </td>
                     <td className="border border-slate-300 px-0 py-1 bg-white">
                       <input
                         type="text"
                         className="w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-none px-3 py-1.5 font-mono text-sm text-slate-900"
                         value={member.studentId}
                         onChange={(e) => {
                           const updated = [...editMembers];
                           updated[idx] = { ...updated[idx], studentId: e.target.value };
                           setEditMembers(updated);
                         }}
                         placeholder="Student ID"
                       />
                     </td>
                     <td className="border border-slate-300 px-0 py-1 bg-white">
                       <input
                         type="text"
                         className="w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-none px-3 py-1.5 text-sm text-slate-900"
                         value={member.name}
                         onChange={(e) => {
                           const updated = [...editMembers];
                           updated[idx] = { ...updated[idx], name: e.target.value };
                           setEditMembers(updated);
                         }}
                         placeholder="Student Name"
                       />
                     </td>
                     <td className="border border-slate-300 px-0 py-1 bg-white">
                       <select
                         value={member.status || "absent"}
                         onChange={(e) => handleStatusChange(idx, e.target.value as AttendanceStatus)}
                         className="w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-none px-3 py-1.5 text-sm text-slate-900 cursor-pointer"
                       >
                         <option value="present">Present</option>
                         <option value="absent">Absent</option>
                         <option value="late">Late</option>
                         <option value="excused">Excused</option>
                         <option value="suspended">Suspended</option>
                       </select>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </Card>

        <div className="flex gap-3">
          <Button
            onClick={handleSaveEdit}
            size="lg"
            className="flex-1"
          >
            <Save className="size-4" /> Save & Approve
          </Button>
          <Button
            onClick={handleSendToFacilitator}
            disabled={sendingToKitchen}
            size="lg"
            className="flex-1"
            variant="outline"
          >
            <Send className="size-4" /> {sendingToKitchen ? "Sending..." : "Send to Facilitator"}
          </Button>
          <Button
            onClick={handleSendToKitchen}
            disabled={sendingToKitchen}
            size="lg"
            className="flex-1"
          >
            <ChefHat className="size-4" /> {sendingToKitchen ? "Sending..." : "Send to Kitchen"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedDraft(null)}
            size="lg"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
<PageHeader
         title="Attendance Drafts"
         description="Review submitted attendance drafts and send to kitchen manager"
         liveData={{ lastUpdated, loading }}
       >
        <Button size="sm" onClick={handleAutoGenerateToday} disabled={autoGenerating}>
          {autoGenerating ? "Generating..." : "Auto-generate Today"}
        </Button>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> New Draft
        </Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3">
<Card className="space-y-4 p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold">Create Attendance Draft</h3>
          <p className="text-xs text-muted-foreground">
            Enter student data in the table below. Columns: ID No., Class Code, Student Name, Email, Status
          </p>
          {renderEditableTable()}
          <Button
            onClick={async () => {
              if (editableRows.length === 0) return alert("Enter at least one student row");
              const members = editableRows
                .filter(r => r.idNo && r.classCode && r.studentName && r.email)
                .map(r => ({ studentId: r.idNo, name: r.studentName, email: r.email, status: r.status }));
              if (members.length === 0) return alert("Enter valid student data");
              setCreating(true);
              try {
                const res = await fetch("/api/attendance/drafts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: newTitle || "Attendance draft",
                    classId: null,
                    facilitatorId: null,
                    members,
                  }),
                });
                if (res.ok) {
                  alert("Draft created and sent");
                  setNewTitle("");
                  setBulkStudentsText("");
setEditableRows([
                     { idNo: "101", classCode: "A-101", studentName: "John Smith", email: "john.smith@students.edu", status: "present" },
                     { idNo: "102", classCode: "B-102", studentName: "Maria Garcia", email: "maria.garcia@students.edu", status: "present" },
                     { idNo: "103", classCode: "C-103", studentName: "David Chen", email: "david.chen@students.edu", status: "present" },
                     { idNo: "104", classCode: "D-104", studentName: "Emily Wilson", email: "emily.wilson@students.edu", status: "present" },
                     { idNo: "105", classCode: "A-101", studentName: "Michael Brown", email: "michael.brown@students.edu", status: "present" },
                   ]);
                } else {
                  const err = await res.json().catch(() => ({}));
                  alert(err.error || "Failed to create draft");
                }
              } catch (err) {
                console.error("Create draft error:", err);
                alert("Error creating draft");
              } finally {
                setCreating(false);
              }
            }}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create & Send"}
          </Button>
        </Card>

        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-semibold">Quick actions</h3>
          <div className="space-y-2">
            <Button onClick={() => setShowCreate(true)} className="w-full">
              <Plus className="size-4" /> Create new draft
            </Button>
          </div>
        </Card>
      </div>

      {showCreate && (
        <Card className="p-6">
          <h3 className="text-sm font-medium mb-2">Create Attendance Draft</h3>
          <div className="space-y-4">
            <Input placeholder="Draft title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            {renderEditableTable()}
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (editableRows.length === 0) return alert("Enter at least one student row");
                  const members = editableRows
                    .filter(r => r.idNo && r.classCode && r.studentName && r.email)
                    .map(r => ({ studentId: r.idNo, name: r.studentName, email: r.email, status: r.status }));
                  if (members.length === 0) return alert("Enter valid student data");
                  setCreating(true);
                  try {
                    const res = await fetch("/api/attendance/drafts", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: newTitle || "Attendance draft",
                      classId: null,
                      facilitatorId: null,
                      members,
                    }),
                    });
                    if (res.ok) {
                      alert("Draft created and sent");
                      setShowCreate(false);
                      setNewTitle("");
                      setBulkStudentsText("");
setEditableRows([
                         { idNo: "101", classCode: "A-101", studentName: "John Smith", email: "john.smith@students.edu", status: "present" },
                         { idNo: "102", classCode: "B-102", studentName: "Maria Garcia", email: "maria.garcia@students.edu", status: "present" },
                         { idNo: "103", classCode: "C-103", studentName: "David Chen", email: "david.chen@students.edu", status: "present" },
                         { idNo: "104", classCode: "D-104", studentName: "Emily Wilson", email: "emily.wilson@students.edu", status: "present" },
                         { idNo: "105", classCode: "A-101", studentName: "Michael Brown", email: "michael.brown@students.edu", status: "present" },
                       ]);
                    } else {
                      const err = await res.json().catch(() => ({}));
                      alert(err.error || "Failed to create draft");
                    }
                  } catch (err) {
                    console.error("Create draft error:", err);
                    alert("Error creating draft");
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create & Send"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

<div className="space-y-3">
         <h3 className="text-sm font-medium">All Drafts</h3>
         {draftsError && (
           <p className="text-sm text-amber-600">Temporary connection issue - refresh to retry</p>
         )}
         {loading ? (
           <p className="text-sm text-muted-foreground">Loading...</p>
         ) : drafts.length === 0 ? (
           <p className="text-sm text-muted-foreground">{draftsError ? "Unable to load drafts" : "No drafts found"}</p>
         ) : (
           <div className="grid gap-4">
             {drafts.map((draft) => (
               <Card key={draft.id} className="p-4">
                 <div className="flex items-start justify-between">
                   <div>
                     <p className="font-medium">{draft.title}</p>
                     <p className="text-xs text-muted-foreground">
                       {draft.members.length} members · Facilitator: {draft.facilitatorEmail || draft.facilitatorId}
                     </p>
                     <p className="text-xs text-muted-foreground mt-1">
                       {relativeTime(draft.createdAt)}
                     </p>
                   </div>
                   <div className="flex items-center gap-2">
                     <Badge
                       variant={
                         draft.status === "submitted" ? "warning" :
                         draft.status === "approved" ? "success" :
                         draft.status === "sent_to_kitchen" ? "default" : "outline"
                       }
                     >
                       {draft.status}
                     </Badge>
                     {draft.status === "submitted" && (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleEditDraft(draft)}
                       >
                         <Edit className="size-4" />
                       </Button>
                     )}
                   </div>
                 </div>
               </Card>
             ))}
           </div>
         )}
       </div>
    </div>
  );
}