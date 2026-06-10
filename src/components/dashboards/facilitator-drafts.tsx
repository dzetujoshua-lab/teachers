"use client";

import * as React from "react";
import { Send, Save, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";
import { useLiveData } from "@/lib/hooks/use-live-data";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface Member {
  studentId: string;
  name: string;
  status?: AttendanceStatus;
}

interface DraftRow {
  id: string;
  title: string;
  members: Member[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function FacilitatorDraftsDashboard() {
   const [selectedDraft, setSelectedDraft] = React.useState<DraftRow | null>(null);
   const [updatedMembers, setUpdatedMembers] = React.useState<Member[]>([]);
   const [submitting, setSubmitting] = React.useState(false);

const { data: draftsData, loading, lastUpdated } = useLiveData<{ rows: DraftRow[] }>(
      "/api/attendance/drafts",
      { pollInterval: 3000, refreshInterval: 60 * 60 * 1000 }
    );

   const drafts = draftsData?.rows || [];

   const handleOpenDraft = (draft: DraftRow) => {
     setSelectedDraft(draft);
     setUpdatedMembers(draft.members.map((m) => ({ ...m })));
   };

   const handleStatusChange = (
     idx: number,
     status: AttendanceStatus
   ) => {
     const updated = [...updatedMembers];
     updated[idx] = { ...updated[idx], status };
     setUpdatedMembers(updated);
   };

   const handleSaveDraft = async () => {
     if (!selectedDraft) return;

     try {
       const res = await fetch(`/api/attendance/drafts/${selectedDraft.id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           members: updatedMembers,
         }),
       });

       if (res.ok) {
         alert("Draft saved successfully");
       } else {
         alert("Failed to save draft");
       }
     } catch (err) {
       console.error("Error saving draft:", err);
       alert("Error saving draft");
     }
   };

   const handleSubmit = async () => {
     if (!selectedDraft) return;

     setSubmitting(true);
     try {
       const res = await fetch(`/api/attendance/drafts/${selectedDraft.id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           members: updatedMembers,
           status: "submitted",
         }),
       });

       if (res.ok) {
         alert("Attendance draft submitted successfully");
         setSelectedDraft(null);
       } else {
         alert("Failed to submit draft");
       }
     } catch (err) {
       console.error("Error submitting draft:", err);
       alert("Error submitting draft");
     } finally {
       setSubmitting(false);
     }
   };

   if (selectedDraft) {
     const presentCount = updatedMembers.filter(
       (m) => m.status === "present"
     ).length;
     const absentCount = updatedMembers.filter(
       (m) => m.status === "absent"
     ).length;
     const lateCount = updatedMembers.filter((m) => m.status === "late").length;

     return (
       <div className="space-y-6">
         <PageHeader
           title={selectedDraft.title}
           description={`Mark attendance for ${updatedMembers.length} members`}
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
                 (presentCount / updatedMembers.length) *
                 100
               ).toFixed(0)}%
             </p>
             <p className="text-xs text-muted-foreground">Attendance</p>
           </Card>
         </div>

         <Card className="p-6">
           <div className="space-y-3 max-h-[500px] overflow-y-auto">
             {updatedMembers.map((member, idx) => (
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
              onClick={handleSaveDraft}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Save className="size-4" /> Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="flex-1"
            >
              <Send className="size-4" /> Submit to Admin
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
         title="My Attendance Drafts"
         description="Mark and submit attendance for assigned sessions"
         liveData={{ lastUpdated, loading }}
       />

       {loading ? (
         <p className="text-sm text-muted-foreground">Loading...</p>
       ) : drafts.length === 0 ? (
         <Card className="p-8 text-center">
           <p className="text-muted-foreground">No drafts assigned yet</p>
           <p className="text-xs text-muted-foreground mt-2">
             Admin will send you drafts to mark attendance
           </p>
         </Card>
       ) : (
         <div className="grid gap-4">
           {drafts.map((draft) => (
             <Card
               key={draft.id}
               className="p-4 cursor-pointer hover:shadow-md transition-shadow"
               onClick={() => handleOpenDraft(draft)}
             >
               <div className="flex items-start justify-between">
                 <div>
                   <p className="font-medium">{draft.title}</p>
                   <p className="text-xs text-muted-foreground">
                     {draft.members.length} members to mark
                   </p>
                   <p className="text-xs text-muted-foreground mt-1">
                     {relativeTime(draft.createdAt)}
                   </p>
                 </div>
                 <Badge
                   variant={
                     draft.status === "submitted" ? "default" : "outline"
                   }
                 >
                   {draft.status}
                 </Badge>
               </div>
             </Card>
           ))}
         </div>
       )}
     </div>
   );
}