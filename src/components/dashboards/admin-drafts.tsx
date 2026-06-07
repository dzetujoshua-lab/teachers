"use client";

import * as React from "react";
import { Send, CheckCircle, Clock, AlertCircle, Edit, Save, ChefHat, Plus, X } from "lucide-react";
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

export function AdminDraftsDashboard() {
   const [showCreate, setShowCreate] = React.useState(false);
    const [selectedDraft, setSelectedDraft] = React.useState<DraftRow | null>(null);
    const [editMembers, setEditMembers] = React.useState<{ studentId: string; name: string; status?: AttendanceStatus }[]>([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [sendingToKitchen, setSendingToKitchen] = React.useState(false);
    const [autoGenerating, setAutoGenerating] = React.useState(false);

    const { data: draftsData, loading, lastUpdated } = useLiveData<{ rows: DraftRow[] }>(
      "/api/attendance/drafts?includeAll=true",
      { pollInterval: 3000 }
    );

    const drafts = draftsData?.rows || [];

  const [facilitators, setFacilitators] = React.useState<{ id: string; name?: string; email?: string }[]>([]);
  const [allStudents, setAllStudents] = React.useState<{ id: string; name: string; studentId?: string }[]>([]);
  const [newTitle, setNewTitle] = React.useState("");
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [selectedFacilitator, setSelectedFacilitator] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [creatingCampus, setCreatingCampus] = React.useState(false);
  const [creatingStudent, setCreatingStudent] = React.useState(false);
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

  const handleSendToFacilitator = async (cls: any) => {
    try {
      const res = await fetch("/api/attendance/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${cls.code} - ${cls.name}`,
          classId: cls.id,
          facilitatorId: cls.facilitatorId,
          members: cls.members || [],
        }),
      });
      const result = await res.json();

      if (res.ok) {
        alert(`Class ${cls.code} sent to facilitator successfully`);
      } else {
        alert(result.error || "Failed to send class to facilitator");
      }
    } catch (err) {
      console.error("Error sending class:", err);
      alert("Error sending class to facilitator");
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
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {editMembers.map((member, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.studentId}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(["present", "absent", "late", "excused"] as const).map(
                    (status) => (
                      <Button
                        key={status}
                        variant={
                          member.status === status ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleStatusChange(idx, status)}
                      >
                        {status === "present" && (
                          <CheckCircle className="size-4" />
                        )}
                        {status === "absent" && (
                          <AlertCircle className="size-4" />
                        )}
                        {status === "late" && (
                          <Clock className="size-4" />
                        )}
                        {status !== "present" &&
                          status !== "absent" &&
                          status !== "late" &&
                          status}
                      </Button>
                    )
                  )}
                </div>
              </div>
            ))}
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
        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-semibold">Create Campus</h3>
          <Input
            placeholder="Campus name"
            value={newCampus.name}
            onChange={(e) => setNewCampus((current) => ({ ...current, name: e.target.value }))}
          />
          <Input
            placeholder="Location"
            value={newCampus.location}
            onChange={(e) => setNewCampus((current) => ({ ...current, location: e.target.value }))}
          />
          <Button onClick={handleCreateCampus} disabled={creatingCampus} className="w-full">
            {creatingCampus ? "Saving campus..." : "Create Campus"}
          </Button>
        </Card>

        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-semibold">Create Student</h3>
          <Input
            placeholder="Student ID"
            value={newStudent.studentId}
            onChange={(e) => setNewStudent((current) => ({ ...current, studentId: e.target.value }))}
          />
          <Input
            placeholder="Name"
            value={newStudent.name}
            onChange={(e) => setNewStudent((current) => ({ ...current, name: e.target.value }))}
          />
          <Input
            placeholder="Email"
            value={newStudent.email}
            onChange={(e) => setNewStudent((current) => ({ ...current, email: e.target.value }))}
          />
          <select
            value={newStudent.campusId}
            onChange={(e) => setNewStudent((current) => ({ ...current, campusId: e.target.value }))}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Assign to campus (optional)</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>{campus.name}</option>
            ))}
          </select>
          <Button onClick={handleCreateStudent} disabled={creatingStudent} className="w-full">
            {creatingStudent ? "Saving student..." : "Create Student"}
          </Button>
        </Card>

        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-semibold">Create Class</h3>
          <Input
            placeholder="Class code"
            value={classForm.code}
            onChange={(e) => setClassForm((current) => ({ ...current, code: e.target.value }))}
          />
          <Input
            placeholder="Class name"
            value={classForm.name}
            onChange={(e) => setClassForm((current) => ({ ...current, name: e.target.value }))}
          />
          <select
            value={classForm.campusId}
            onChange={(e) => setClassForm((current) => ({ ...current, campusId: e.target.value }))}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Choose campus</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>{campus.name}</option>
            ))}
          </select>
          <div className="grid gap-2">
            <p className="text-xs font-medium">Select facilitator</p>
            {facilitators.map((f) => (
              <Button
                key={f.id}
                variant={classForm.facilitatorId === f.id ? "default" : "outline"}
                size="sm"
                onClick={() => setClassForm((current) => ({ ...current, facilitatorId: f.id }))}
              >
                {f.name || f.email}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium">Select students</p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-background p-2">
              {allStudents.slice(0, 50).map((student) => (
                <label key={student.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={classForm.members.includes(student.id)}
                    onChange={() => {
                      setClassForm((current) => {
                        const selected = current.members.includes(student.id)
                          ? current.members.filter((id) => id !== student.id)
                          : [...current.members, student.id];
                        return { ...current, members: selected };
                      });
                    }}
                  />
                  <span>{student.name} · {student.studentId}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleCreateClass} disabled={creatingClass} className="w-full">
            {creatingClass ? "Saving class..." : "Create Class"}
          </Button>
        </Card>
      </div>

      {showCreate && (
        <Card className="p-6">
          <h3 className="text-sm font-medium mb-2">Create Attendance Draft</h3>
          <div className="grid gap-3">
            <Input placeholder="Draft title" value={newTitle} onChange={(e) => setNewTitle((e.target as HTMLInputElement).value)} />

            <div>
              <p className="text-xs font-medium mb-1">Select Facilitator</p>
              <div className="grid gap-2">
                {facilitators.map((f) => (
                  <Button key={f.id} variant={selectedFacilitator === f.id ? "default" : "outline"} size="sm" onClick={() => setSelectedFacilitator(f.id)}>
                    {f.name || f.email}
                  </Button>
                ))}
                {facilitators.length === 0 && <p className="text-xs text-muted-foreground">No facilitators found</p>}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-1">Select Students</p>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {allStudents.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => {
                      setSelectedStudents(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]);
                    }} />
                    <span>{s.name} · {s.studentId}</span>
                  </label>
                ))}
                {allStudents.length === 0 && <p className="text-xs text-muted-foreground">No students found</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={async () => {
                if (!selectedFacilitator) return alert('Select a facilitator');
                if (selectedStudents.length === 0) return alert('Select at least one student');
                setCreating(true);
                try {
                  const members = allStudents.filter(s => selectedStudents.includes(s.id)).map(s => ({ studentId: s.id, name: s.name }));
                  const res = await fetch('/api/attendance/drafts', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle || 'Attendance draft', facilitatorId: selectedFacilitator, members }),
                  });
                  if (res.ok) {
                    alert('Draft created and assigned');
                    setShowCreate(false);
                    setNewTitle('');
                    setSelectedStudents([]);
setSelectedFacilitator(null);
                  } else {
                    const err = await res.json().catch(() => ({}));
                    alert(err.error || 'Failed to create draft');
                  }
                } catch (err) {
                  console.error('Create draft error:', err);
                  alert('Error creating draft');
                } finally {
                  setCreating(false);
                }
              }} disabled={creating}>
                {creating ? 'Creating...' : 'Create & Assign'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium">All Drafts</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No drafts found</p>
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