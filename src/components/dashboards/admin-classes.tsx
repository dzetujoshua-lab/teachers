"use client";

import * as React from "react";
import { Plus, Send, X, Users, QrCode, Check, Download, Upload, Trash2, Clock, Calendar, Filter } from "lucide-react";
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

export function AdminClassesDashboard() {
   const [showCreate, setShowCreate] = React.useState(false);
    const [creating, setCreating] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [selectedClass, setSelectedClass] = React.useState<ClassRow | null>(null);
    const [showMemberDialog, setShowMemberDialog] = React.useState(false);
    const [bulkImport, setBulkImport] = React.useState("");
    const [formData, setFormData] = React.useState({
      code: "",
      name: "",
      facilitatorId: "",
      facilitatorEmail: "",
      members: [] as ClassMember[],
    });

const { data: classesData, loading, lastUpdated } = useLiveData<{ data: ClassRow[] }>(
      "/api/classes",
      { pollInterval: 60000 }
    );

   const classes = classesData?.data || [];

   const generateQrCode = (studentId: string, classId: string) => {
     return `${studentId}:${classId}:${Date.now()}`;
   };

   const generatePin = () => {
     return Math.floor(100000 + Math.random() * 900000).toString();
   };

   const handleCreate = async () => {
     if (!formData.code || !formData.name || !formData.facilitatorId) {
       alert("Code, name, and facilitator are required");
       return;
     }

     const membersWithCredentials = formData.members.map(member => ({
       ...member,
       qrCode: generateQrCode(member.studentId, formData.code),
       pin: generatePin(),
     }));

     setCreating(true);
     try {
       const res = await fetch("/api/classes", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           ...formData,
           members: membersWithCredentials,
         }),
       });
       const result = await res.json();
       if (result.success) {
         setFormData({ code: "", name: "", facilitatorId: "", facilitatorEmail: "", members: [] });
         setShowCreate(false);
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
     const invalidMember = cls.members.find((m) => !m.studentId || !m.name);
     if (invalidMember) {
       alert("All members must have both Student ID and Name before sending.");
       return;
     }

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
     }
   };

   const handleMemberAdd = () => {
     const newMember: ClassMember = {
       studentId: "",
       name: "",
       email: "",
       avatarColor: "",
       qrCode: "",
       pin: "",
     };
     setFormData({
       ...formData,
       members: [...formData.members, newMember],
     });
   };

   const handleMemberChange = (idx: number, field: string, value: string) => {
     const updated = [...formData.members];
     updated[idx] = { ...updated[idx], [field]: value };
     setFormData({ ...formData, members: updated });
   };

   const handleMemberRemove = (idx: number) => {
     setFormData({
       ...formData,
       members: formData.members.filter((_, i) => i !== idx),
     });
   };

   const handleBulkImport = () => {
     const lines = bulkImport.trim().split('\n');
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

     setFormData({
       ...formData,
       members: [...formData.members, ...newMembers],
     });
     setBulkImport("");
     setShowMemberDialog(false);
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

   const filteredClasses = classes.filter((cls) =>
     [cls.code, cls.name, cls.facilitatorId, cls.facilitatorEmail]
       .join(" ")
       .toLowerCase()
       .includes(search.toLowerCase())
   );

   return (
     <div className="space-y-6">
       <PageHeader
         title="Classes Management"
         description="Create and manage classes, assign members with QR/PIN/ID/GPS credentials, and send to facilitators"
         liveData={{ lastUpdated, loading }}
       >
         <Button onClick={() => setShowCreate(!showCreate)} size="sm">
           <Plus className="size-4" /> New Class
         </Button>
       </PageHeader>

       {!showCreate && (
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
       )}

       {showCreate && (
         <Card className="p-6">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-semibold">Create New Class</h3>
             <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
               <X className="size-4" />
             </Button>
           </div>
           <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2">
               <div>
                 <Label>Class Code</Label>
                 <Input
                   placeholder="e.g. CS301"
                   value={formData.code}
                   onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                 />
               </div>
               <div>
                 <Label>Class Name</Label>
                 <Input
                   placeholder="e.g. Algorithms & Complexity"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 />
               </div>
             </div>

             <div className="grid gap-4 md:grid-cols-2">
               <div>
                 <Label>Facilitator ID</Label>
                 <Input
                   placeholder="Facilitator UID or ID"
                   value={formData.facilitatorId}
                   onChange={(e) => setFormData({ ...formData, facilitatorId: e.target.value })}
                 />
               </div>
               <div>
                 <Label>Facilitator Email (optional)</Label>
                 <Input
                   placeholder="facilitator@campus.edu"
                   value={formData.facilitatorEmail}
                   onChange={(e) => setFormData({ ...formData, facilitatorEmail: e.target.value })}
                 />
               </div>
             </div>

             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <Label>Class Members</Label>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setShowMemberDialog(true)}
                 >
                   <Upload className="size-4 mr-1" /> Bulk Import
                 </Button>
               </div>
               {showMemberDialog && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center">
                   <div
                     className="fixed inset-0 bg-black/80"
                     onClick={() => setShowMemberDialog(false)}
                   />
                   <div className="relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold">Bulk Import Members</h3>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => setShowMemberDialog(false)}
                       >
                         <X className="size-4" />
                       </Button>
                     </div>
                     <div className="space-y-4">
                       <div>
                         <Label>CSV Format: studentId,name,email</Label>
                         <Textarea
                           placeholder="STU001,John Doe,john@email.com&#10;STU002,Jane Smith,jane@email.com"
                           value={bulkImport}
                           onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkImport(e.target.value)}
                           rows={6}
                           className="font-mono text-sm"
                         />
                       </div>
                       <Button onClick={handleBulkImport} className="w-full">
                         Import Members
                       </Button>
                     </div>
                   </div>
                 </div>
               )}
               {formData.members.map((member, idx) => (
                 <div key={idx} className="grid gap-2 md:grid-cols-5 items-end">
                   <div>
                     <Label className="text-xs">Student ID</Label>
                     <Input
                       placeholder="STU001"
                       value={member.studentId}
                       onChange={(e) => handleMemberChange(idx, "studentId", e.target.value)}
                     />
                   </div>
                   <div>
                     <Label className="text-xs">Name</Label>
                     <Input
                       placeholder="John Doe"
                       value={member.name}
                       onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                     />
                   </div>
                   <div>
                     <Label className="text-xs">Email</Label>
                     <Input
                       placeholder="email@example.com"
                       value={member.email}
                       onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                     />
                   </div>
                   <div className="flex gap-1">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         const qr = generateQrCode(member.studentId || `temp-${idx}`, formData.code);
                         const pin = generatePin();
                         handleMemberChange(idx, "qrCode", qr);
                         handleMemberChange(idx, "pin", pin);
                       }}
                       title="Generate QR & PIN"
                     >
                       <QrCode className="size-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleMemberRemove(idx)}
                     >
                       <X className="size-4" />
                     </Button>
                   </div>
                   <div className="text-xs text-muted-foreground">
                     {member.qrCode ? (
                       <Badge variant="outline" className="text-xs">
                         <Check className="size-3 mr-1" /> Credentials Set
                       </Badge>
                     ) : (
                       <span className="text-muted-foreground">No credentials</span>
                     )}
                   </div>
                 </div>
               ))}
               <Button variant="outline" size="sm" onClick={handleMemberAdd} type="button">
                 <Plus className="size-4" /> Add Member
               </Button>
             </div>

             <div className="flex gap-2">
               <Button onClick={handleCreate} disabled={creating} className="flex-1">
                 {creating ? "Creating..." : "Create Class"}
               </Button>
               <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                 Cancel
               </Button>
             </div>
           </div>
         </Card>
       )}

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
                       <Badge variant="outline">{cls.members.length} members</Badge>
                     </div>
                     <p className="text-sm text-muted-foreground mt-1">{cls.name}</p>
                     <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                       <span>Facilitator: {cls.facilitatorEmail || cls.facilitatorId}</span>
                       <span>Created: {new Date(cls.createdAt).toLocaleDateString()}</span>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleExportMembers(cls)}
                       title="Export members with credentials"
                     >
                       <Download className="size-4" />
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleSendToFacilitator(cls)}
                     >
                       <Send className="size-4" /> Send
                     </Button>
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