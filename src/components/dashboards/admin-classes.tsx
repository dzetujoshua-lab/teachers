"use client";

import * as React from "react";
import { Plus, Send, X, Users, QrCode, Check, Download, Upload, Trash2, ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLiveData } from "@/lib/hooks/use-live-data";
import type { AttendanceStatus } from "@/lib/types";

interface ClassMember {
  studentId: string;
  name: string;
  email?: string;
  avatarColor?: string;
  qrCode?: string;
  pin?: string;
}

interface ClassRow {
  id: string;
  code: string;
  name: string;
  facilitatorId: string;
  facilitatorEmail?: string;
  members: ClassMember[];
  createdAt: string;
  updatedAt: string;
}

type ViewMode = "list" | "create" | "manageStudents";

export function AdminClassesDashboard() {
   const [viewMode, setViewMode] = React.useState<ViewMode>("list");
   const [creating, setCreating] = React.useState(false);
   const [search, setSearch] = React.useState("");
   const [sendingToFacilitator, setSendingToFacilitator] = React.useState(false);

   const [form, setForm] = React.useState({
     code: "",
     name: "",
     facilitatorId: "",
     facilitatorEmail: "",
     campusId: "",
   });

   const [studentBulkImport, setStudentBulkImport] = React.useState("");
   const [editingClass, setEditingClass] = React.useState<ClassRow | null>(null);

   const { data: classesData, loading, lastUpdated } = useLiveData<{ data: ClassRow[] }>(
      "/api/classes",
      { pollInterval: 60000 }
    );

   const classes = classesData?.data || [];
   const filteredClasses = classes.filter((cls) =>
     [cls.code, cls.name, cls.facilitatorId, cls.facilitatorEmail]
       .join(" ")
       .toLowerCase()
       .includes(search.toLowerCase())
   );

   const generateQrCode = (studentId: string, classCode: string) => {
      return `${studentId}:${classCode}:${Date.now()}`;
    };

    const generatePin = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleCreateClass = async () => {
      if (!form.code || !form.name || !form.facilitatorId) {
        alert("Class code, name, and facilitator are required");
        return;
      }

      setCreating(true);
      try {
        const res = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: form.code,
            name: form.name,
            facilitatorId: form.facilitatorId,
            facilitatorEmail: form.facilitatorEmail,
            campusId: form.campusId,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setForm({ code: "", name: "", facilitatorId: "", facilitatorEmail: "", campusId: "" });
          setViewMode("list");
        } else {
          alert(result.error || "Failed to create class");
        }
      } catch (err) {
        console.error("Error creating class:", err);
        alert("Error creating class");
      } finally {
        setCreating(false);
      }
    };

    const handleSendToFacilitator = async (cls: ClassRow) => {
      if (!cls.members || cls.members.length === 0) {
        alert("Add students to the class before sending to facilitator");
        return;
      }

      const invalidMember = cls.members.find((m) => !m.studentId || !m.name);
      if (invalidMember) {
        alert("All members must have both Student ID and Name before sending.");
        return;
      }

      setSendingToFacilitator(true);
      try {
        const res = await fetch("/api/attendance/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${cls.code} - ${cls.name}`,
            classId: cls.id,
            facilitatorId: cls.facilitatorId,
            members: cls.members.map((m) => ({
              studentId: String(m.studentId),
              name: String(m.name),
              email: m.email,
            })),
          }),
        });
        const result = await res.json();
        if (result.success) {
          alert(`Class ${cls.code} sent to facilitator successfully`);
        } else {
          alert(result.error || "Failed to send to facilitator");
        }
      } catch (err) {
        console.error("Error sending class:", err);
        alert("Error sending class to facilitator");
      } finally {
        setSendingToFacilitator(false);
      }
    };

    const handleManageStudents = (cls: ClassRow) => {
      setEditingClass(cls);
      setViewMode("manageStudents");
    };

    const handleMemberAdd = () => {
      if (!editingClass) return;
      const newMember: ClassMember = {
        studentId: "",
        name: "",
        email: "",
        avatarColor: "",
        qrCode: "",
        pin: "",
      };
      setEditingClass({
        ...editingClass,
        members: [...editingClass.members, newMember],
      });
    };

    const handleMemberChange = (idx: number, field: string, value: string) => {
      if (!editingClass) return;
      const updated = [...editingClass.members];
      updated[idx] = { ...updated[idx], [field]: value };
      setEditingClass({ ...editingClass, members: updated });
    };

    const handleMemberRemove = (idx: number) => {
      if (!editingClass) return;
      setEditingClass({
        ...editingClass,
        members: editingClass.members.filter((_, i) => i !== idx),
      });
    };

    const handleBulkImportStudents = () => {
      if (!editingClass) return;
      const lines = studentBulkImport.trim().split('\n');
      const newMembers: ClassMember[] = lines.map(line => {
        const [studentId, name, email] = line.split(',').map(s => s.trim());
        return {
          studentId: studentId || "",
          name: name || "",
          email: email || "",
          avatarColor: "",
          qrCode: "",
          pin: "",
        };
      }).filter(m => m.studentId || m.name);

      setEditingClass({
        ...editingClass,
        members: [...editingClass.members, ...newMembers],
      });
      setStudentBulkImport("");
    };

    const handleSaveClassMembers = async () => {
      if (!editingClass) return;

      try {
        const res = await fetch(`/api/classes/${editingClass.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            members: editingClass.members,
          }),
        });
        const result = await res.json();
        if (result.success) {
          alert("Class members saved successfully");
        } else {
          alert(result.error || "Failed to save class members");
        }
      } catch (err) {
        console.error("Error saving class members:", err);
        alert("Error saving class members");
      }
    };

    const handleExportMembers = (cls: ClassRow) => {
      let csv = "Student ID,Name,Email,QR Code,PIN\n";
      cls.members.forEach(member => {
        csv += `${member.studentId},${member.name},${member.email || ""},${member.qrCode || "N/A"},${member.pin || "N/A"}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cls.code}-members.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const renderStudentManagement = () => {
      if (!editingClass) return null;

      return (
        <div className="space-y-6">
          <PageHeader
            title={`${editingClass.code} - ${editingClass.name}`}
            description="Add and manage students for this class"
          >
            <Button variant="outline" size="sm" onClick={() => setViewMode("list")}>
              <ArrowLeft className="size-4" /> Back to Classes
            </Button>
          </PageHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Bulk Import Students</h3>
              <p className="text-xs text-muted-foreground mb-2">Format: studentId,name,email (comma-separated)</p>
              <Textarea
                placeholder="STU001,John Doe,john@email.com"
                value={studentBulkImport}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStudentBulkImport(e.target.value)}
                rows={6}
                className="font-mono text-sm mb-2"
              />
              <Button onClick={handleBulkImportStudents} className="w-full">
                <Upload className="size-4" /> Import Students
              </Button>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Students:</span>
                  <span className="font-medium">{editingClass.members.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Facilitator:</span>
                  <span className="font-medium text-xs">{editingClass.facilitatorEmail || editingClass.facilitatorId}</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Student List</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleMemberAdd}>
                  <Plus className="size-4" /> Add Student
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveClassMembers}>
                  <Save className="size-4" /> Save
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border/60 border-t border-border">
              {editingClass.members.map((member, idx) => (
                <div key={idx} className="grid gap-2 md:grid-cols-4 items-center py-3 px-4 bg-card/40">
                  <Input
                    placeholder="Student ID"
                    value={member.studentId}
                    onChange={(e) => handleMemberChange(idx, "studentId", e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Name"
                    value={member.name}
                    onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Email"
                    value={member.email}
                    onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMemberRemove(idx)}
                      title="Remove"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const qr = generateQrCode(member.studentId || `temp-${idx}`, editingClass!.code);
                        const pin = generatePin();
                        handleMemberChange(idx, "qrCode", qr);
                        handleMemberChange(idx, "pin", pin);
                      }}
                      title="Generate QR & PIN"
                    >
                      <QrCode className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {editingClass.members.length === 0 && (
                <p className="text-sm text-muted-foreground p-4 text-center">No students added yet. Add students above.</p>
              )}
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={() => handleSendToFacilitator(editingClass)}
              disabled={sendingToFacilitator || editingClass.members.length === 0}
              className="flex-1"
            >
              <Send className="size-4" /> Send to Facilitator
            </Button>
          </div>
        </div>
      );
    };

    if (viewMode === "manageStudents") {
      return renderStudentManagement();
    }

    if (viewMode === "create") {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Create New Class"
            description="Create a class and then add students"
          >
            <Button variant="outline" size="sm" onClick={() => setViewMode("list")}>
              <ArrowLeft className="size-4" /> Back to Classes
            </Button>
          </PageHeader>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Class Code</Label>
                  <Input
                    placeholder="e.g. CS301"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Class Name</Label>
                  <Input
                    placeholder="e.g. Algorithms & Complexity"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Facilitator ID</Label>
                  <Input
                    placeholder="Facilitator UID or ID"
                    value={form.facilitatorId}
                    onChange={(e) => setForm({ ...form, facilitatorId: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Facilitator Email (optional)</Label>
                  <Input
                    placeholder="facilitator@campus.edu"
                    value={form.facilitatorEmail}
                    onChange={(e) => setForm({ ...form, facilitatorEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateClass} disabled={creating} className="flex-1">
                  {creating ? "Creating..." : "Create Class"}
                </Button>
                <Button variant="outline" onClick={() => setViewMode("list")} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title="Classes Management"
          description="Create classes and manage student rosters for facilitators"
          liveData={{ lastUpdated, loading }}
        >
          <Button onClick={() => setViewMode("create")} size="sm">
            <Plus className="size-4" /> New Class
          </Button>
        </PageHeader>

        <div className="relative">
          <Input
            placeholder="Search classes by code, name, or facilitator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Classes ({filteredClasses.length})</h3>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : filteredClasses.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="size-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-semibold mb-2">No classes found</h4>
              <p className="text-sm text-muted-foreground">
                Create your first class to get started
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredClasses.map((cls) => (
                <Card key={cls.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">{cls.code}</p>
                        <Badge variant="outline">{cls.members?.length || 0} students</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{cls.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Facilitator: {cls.facilitatorEmail || cls.facilitatorId}</span>
                        <span>Created: {new Date(cls.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={cls.members && cls.members.length > 0 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleManageStudents(cls)}
                      >
                        {cls.members && cls.members.length > 0 ? "Edit Students" : "Add Students"}
                      </Button>
                      {cls.members && cls.members.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendToFacilitator(cls)}
                        >
                          <Send className="size-4" /> Send
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