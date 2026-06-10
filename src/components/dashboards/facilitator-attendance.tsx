"use client";

import * as React from "react";
import { Send, X, Check, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttendanceStatus } from "@/lib/types";
import { useLiveData } from "@/lib/hooks/use-live-data";

interface AttendanceMember {
  studentId: string;
  name: string;
  email?: string;
  status: AttendanceStatus;
}

interface AttendanceSessionData {
   id: string;
   course?: string;
   courseId?: string;
   classId?: string;
   campus?: string;
   campusId?: string;
   room?: string;
   roomId?: string;
   members?: AttendanceMember[];
   roster?: AttendanceMember[];
   startedAt: string;
   status: string;
 }

interface ClassData {
  id: string;
  code: string;
  name: string;
  facilitatorId: string;
  facilitatorEmail?: string;
  institutionId?: string;
  campusId?: string;
  campusName?: string;
  members?: any[];
}

export function FacilitatorAttendanceDashboard({ uid }: { uid: string }) {
   const [session, setSession] = React.useState<AttendanceSessionData | null>(null);
   const [submitting, setSubmitting] = React.useState(false);
   const [showCreateStudent, setShowCreateStudent] = React.useState(false);
   const [showClassSelection, setShowClassSelection] = React.useState(true);
   const [newStudent, setNewStudent] = React.useState({
     studentId: "",
     name: "",
     email: "",
   });
   const [selectedClass, setSelectedClass] = React.useState<ClassData | null>(null);
   const [classesLoading, setClassesLoading] = React.useState(false);
   const [classes, setClasses] = React.useState<ClassData[]>([]);

   const { data: sessionData, loading, lastUpdated } = useLiveData<{ data: AttendanceSessionData[] }>(
     `/api/sessions?facilitatorId=${uid}`,
     { pollInterval: 2000 }
   );

   const liveSession = sessionData?.data?.find((s) => s.status === "live");
    
   React.useEffect(() => {
     if (liveSession && !session) {
       const members = (liveSession.roster || []).map((m: any) => ({
         studentId: m.studentId,
         name: m.name || "Student",
         email: m.email,
         status: "absent" as AttendanceStatus,
       }));
       setSession({
         id: liveSession.id,
         course: liveSession.course || liveSession.courseId,
         room: liveSession.room || liveSession.roomId || "Unassigned",
         members,
         startedAt: liveSession.startedAt,
         status: liveSession.status,
       });
     }
   }, [liveSession, session]);

   React.useEffect(() => {
     const loadClasses = async () => {
       try {
         setClassesLoading(true);
         const res = await fetch(`/api/classes?facilitatorId=${uid}`);
         const data = await res.json();
         setClasses(data.data || []);
       } catch (err) {
         console.error("Failed to load classes:", err);
       } finally {
         setClassesLoading(false);
       }
     };
     loadClasses();
   }, [uid]);

   const handleStartSession = async () => {
     if (!selectedClass) {
       alert("Please select a class");
       return;
     }

     try {
       const res = await fetch("/api/sessions", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           courseId: selectedClass.code,
           course: selectedClass.name,
           classId: selectedClass.id,
           campusId: selectedClass.campusId || selectedClass.institutionId,
           roomId: selectedClass.id.toLowerCase().replace(/\s+/g, "-"),
           room: selectedClass.name,
           method: "manual",
           roster: (selectedClass.members || []).map((m: any) => ({
             studentId: m.studentId || m.id,
             name: m.name,
             email: m.email,
           })),
         }),
       });
       const data = await res.json();
       if (data.success) {
         setShowClassSelection(false);

         if (data.sessionId) {
           fetch("/api/attendance/notify-admin-on-start", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ sessionId: data.sessionId }),
           }).catch((err) => console.error("notify start failed:", err));
         }
       }
     } catch (err) {
       console.error("Failed to start session:", err);
       alert("Failed to start session");
     }
   };

   const handleMarkAttendance = async (studentId: string, status: AttendanceStatus) => {
     if (!session || !session.members) return;

     const updatedMembers = session.members.map(m => 
       m.studentId === studentId ? { ...m, status } : m
     );
     setSession({ ...session, members: updatedMembers });
   };

   const handleCreateStudent = async () => {
     if (!newStudent.studentId || !newStudent.name) {
       alert("Student ID and name are required");
       return;
     }

     try {
       const res = await fetch("/api/students", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           studentId: newStudent.studentId,
           name: newStudent.name,
           email: newStudent.email,
         }),
       });
       const result = await res.json();
       if (result.success) {
         if (session && session.members) {
           setSession({
             ...session,
             members: [...session.members, { 
               studentId: newStudent.studentId, 
               name: newStudent.name, 
               email: newStudent.email,
               status: "present" as AttendanceStatus,
             }],
           });
         }
         setNewStudent({ studentId: "", name: "", email: "" });
         setShowCreateStudent(false);
       } else {
         alert(result.error || "Failed to create student");
       }
     } catch (err) {
       console.error("Error creating student:", err);
       alert("Error creating student");
     }
   };

   const handleSubmitAttendance = async () => {
     if (!session || !session.members) return;

     setSubmitting(true);
     try {
       const draftCheckRes = await fetch(`/api/attendance/drafts?facilitatorId=${uid}&includeAll=true`);
       const draftCheckData = await draftCheckRes.json();

       let draftId = null;
       const existingDraft = draftCheckData.rows?.find((d: any) => 
         d.status === "draft" && (d.classId === session.id || d.title?.includes(session.course))
       );

       if (!existingDraft) {
          const createDraftRes = await fetch("/api/attendance/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
             title: `${session.course} - ${session.room} - ${new Date().toLocaleDateString()}`,
              classId: session.id,
              facilitatorId: uid,

              members: session.members.map((m: any) => ({

               studentId: m.studentId,
               name: m.name,
               status: m.status,
             })),
           }),
         });
         const createDraftData = await createDraftRes.json();
         if (createDraftData.success) {
           draftId = createDraftData.id;
         }
       } else {
         draftId = existingDraft.id;
       }

       for (const member of session.members) {
         await fetch("/api/attendance", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             sessionId: session.id,
             studentId: member.studentId,
             method: "manual",
             metadata: {
               status: member.status,
             },
           }),
         });
       }

       if (draftId) {
         await fetch(`/api/attendance/drafts/${draftId}`, {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             members: session.members,
             status: "submitted",
           }),
         });
       }

       fetch("/api/attendance/notify-admin-on-submit", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ sessionId: session.id }),
       }).catch((err) => console.error("notify submit failed:", err));

       alert("Attendance submitted successfully!");
       setSession(null);
     } catch (err) {
       console.error("Error submitting attendance:", err);
       alert("Error submitting attendance");
     } finally {
       setSubmitting(false);
     }
   };

   const presentCount = session?.members?.filter(m => m.status === "present").length || 0;

   return (
     <div className="space-y-6">
       <PageHeader
         title="Take Attendance"
         description="Mark student attendance"
         liveData={{ lastUpdated, loading }}
       >
         {session && (
           <div className="flex gap-2">
             <Badge variant="success" className="text-sm">
               <div className="w-2 h-2 rounded-full bg-green-500 mr-1" /> Live
             </Badge>
             <Button onClick={handleSubmitAttendance} disabled={submitting} size="sm">
               <Send className="size-4" /> Submit
             </Button>
           </div>
         )}
       </PageHeader>

       {!session ? (
         showClassSelection ? (
           <Card className="p-6">
             <h3 className="text-lg font-semibold mb-4">Select Class</h3>
             
             <div className="space-y-4">
               <div>
                 <Label className="text-base font-medium mb-3 block">Choose a class</Label>
                 {classesLoading ? (
                   <p className="text-sm text-muted-foreground">Loading classes...</p>
                 ) : classes.length === 0 ? (
                   <p className="text-sm text-muted-foreground">No classes found</p>
                 ) : (
                   <select
                     value={selectedClass?.id ?? ""}
                     onChange={(e) => {
                       const id = e.target.value;
                       const cls = classes.find((c) => String(c.id) === id);
                       setSelectedClass(cls ?? null);
                     }}
                     className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                   >
                     <option value="">Select class...</option>
                     {classes.map((cls) => (
                       <option key={cls.id} value={cls.id}>
                         {cls.code} - {cls.name}
                       </option>
                     ))}
                   </select>
                 )}
               </div>


               <div className="flex gap-3 pt-4">
                 <Button
                   onClick={handleStartSession}
                   disabled={!selectedClass || classesLoading}
                   className="flex-1"
                 >
                   <Plus className="size-4 mr-2" /> Start Session
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => setShowClassSelection(false)}
                   className="flex-1"
                 >
                   Cancel
                 </Button>
               </div>
             </div>
           </Card>
         ) : (
           <Card className="p-8 text-center">
             <Check className="size-12 mx-auto mb-4 text-muted-foreground" />
             <h3 className="text-lg font-semibold mb-2">No active session</h3>
             <p className="text-sm text-muted-foreground mb-4">Start a new attendance session to begin marking</p>
             <Button onClick={() => setShowClassSelection(true)}>
               <Plus className="size-4" /> Start New Session
             </Button>
           </Card>
         )
       ) : (
         <>
           <div className="grid gap-4 md:grid-cols-4">
             <Card className="p-4">
               <p className="text-xs text-muted-foreground">Course</p>
               <p className="font-semibold text-sm">{session.course}</p>
             </Card>
             {session.campus && (
               <Card className="p-4">
                 <p className="text-xs text-muted-foreground">Campus</p>
                 <p className="font-semibold text-sm">{session.campus}</p>
               </Card>
             )}
             <Card className="p-4">
               <p className="text-xs text-muted-foreground">Room</p>
               <p className="font-semibold text-sm">{session.room}</p>
             </Card>
             <Card className="p-4">
               <p className="text-xs text-muted-foreground">Present</p>
               <p className="font-semibold text-sm">{presentCount}/{session.members?.length || 0}</p>
             </Card>
           </div>

           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <h3 className="text-sm font-medium">Attendance Roster</h3>
               <Button variant="outline" size="sm" onClick={() => setShowCreateStudent(true)}>
                 <Plus className="size-4" /> Add Student
               </Button>
             </div>

             {showCreateStudent && (
               <Card className="p-4">
                 <div className="flex items-center justify-between mb-3">
                   <h4 className="font-medium">Add Student</h4>
                   <Button variant="ghost" size="sm" onClick={() => setShowCreateStudent(false)}>
                     <X className="size-4" />
                   </Button>
                 </div>
                 <div className="grid gap-3 md:grid-cols-2">
                   <Input placeholder="Student ID" value={newStudent.studentId} onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })} />
                   <Input placeholder="Student Name" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
                 </div>
                 <Button className="mt-3 w-full" onClick={handleCreateStudent}>
                   Add & Mark Present
                 </Button>
               </Card>
             )}

             <div className="divide-y divide-border/60 border-t border-border">
               {session.members?.map((member) => (
                 <div key={member.studentId} className="flex items-center justify-between py-3 px-4 bg-card/40">
                   <div>
                     <p className="font-medium">{member.name}</p>
                     <p className="text-xs text-muted-foreground">{member.studentId}</p>
                   </div>
                   <div className="flex gap-2">
                     <Button
                       variant={member.status === "present" ? "default" : "outline"}
                       size="sm"
                       onClick={() => handleMarkAttendance(member.studentId, "present")}
                       className={member.status === "present" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                     >
                       <Check className="size-4" />
                     </Button>
                     <Button
                       variant={member.status === "absent" ? "destructive" : "outline"}
                       size="sm"
                       onClick={() => handleMarkAttendance(member.studentId, "absent")}
                     >
                       <X className="size-4" />
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </>
       )}
     </div>
   );
}