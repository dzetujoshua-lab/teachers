"use client";

import * as React from "react";
import { Soup, UtensilsCrossed, Flame, Trash2, ChefHat, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { MealDonutChart } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/types";
import { useLiveData } from "@/lib/hooks/use-live-data";

type MealRow = { id: string; meal: string; name: string; preference: string; estimated: number; prepared: number; served: number };
type MealSplitRow = { id: string; name: string; value: number; color: string };
type AttendanceDraft = { id: string; title: string; members: { studentId: string; name: string; status?: AttendanceStatus }[]; createdAt: string };

export function KitchenDashboard() {
   const [publishing, setPublishing] = React.useState(false);

   const { data: mealsData, loading: mealsLoading } = useLiveData<{ rows: MealRow[] }>(
     "/api/admin/firestore?collection=meals",
     { pollInterval: 3000 }
   );

   const { data: splitData } = useLiveData<{ rows: MealSplitRow[] }>(
     "/api/admin/firestore?collection=mealSplit",
     { pollInterval: 5000 }
   );

   const { data: draftsData, loading: draftsLoading, lastUpdated } = useLiveData<{ rows: AttendanceDraft[] }>(
     "/api/attendance/drafts?status=sent_to_kitchen",
     { pollInterval: 3000 }
   );

   const menu = mealsData?.rows || [];
   const mealSplit = splitData?.rows || [];
   const attendanceDrafts = draftsData?.rows || [];
   const loading = mealsLoading || draftsLoading;

   const handlePublishMenu = async () => {
     setPublishing(true);
     try {
       const res = await fetch("/api/kitchen/publish-menu", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ menu }),
       });
       if (res.ok) {
         alert("Today's menu published successfully!");
       } else {
         alert("Failed to publish menu. Please try again.");
       }
     } catch (err) {
       console.error("Error publishing menu:", err);
       alert("Error publishing menu");
     } finally {
       setPublishing(false);
     }
   };

   return (
     <div className="space-y-6">
       <PageHeader
         title="Kitchen Operations"
         description="Nkyemu Main Campus · today's service"
         liveData={{ lastUpdated: loading ? null : new Date(), loading: false }}
       >
         <Button variant="wine" size="sm" onClick={handlePublishMenu} disabled={publishing}>
           <ChefHat className="size-4" /> {publishing ? "Publishing..." : "Publish menu"}
         </Button>
       </PageHeader>

       <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
         <StatCard index={0} label="Meals requested" value={loading ? "..." : String(mealSplit.reduce((sum, m) => sum + m.value, 0))} delta={4} icon={UtensilsCrossed} accent="wine" />
         <StatCard index={1} label="Pepper demand" value={mealSplit.length > 0 ? String(mealSplit.find(m => m.name === "Pepper")?.value || 0) : "..."} delta={3} icon={Flame} accent="wine" />
         <StatCard index={2} label="Meals served" value={menu.length > 0 ? String(menu.reduce((sum, m) => sum + m.served, 0)) : "..."} delta={2} icon={Soup} accent="amber" />
         <StatCard index={3} label="Food waste" value="..." delta={-8} icon={Trash2} accent="neutral" hint="vs last week" />
       </div>

       <div className="grid gap-6 lg:grid-cols-3">
         <SectionCard
           title="Today's menu"
           action="Edit menu"
           actionHref="/dashboard/kitchen_manager/menu"
           className="lg:col-span-2"
           noPadding
         >
           <div className="divide-y divide-border/60">
             {menu.map((m) => {
               const pct = m.estimated > 0 ? Math.round((m.served / m.estimated) * 100) : 0;
               return (
                 <div key={m.id} className="px-6 py-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium">{m.name}</p>
                       <p className="text-xs capitalize text-muted-foreground">
                         {m.meal} ·{" "}
                         {m.preference.replace("_", "-")}
                       </p>
                     </div>
<Badge variant="warning">
                        {m.estimated.toLocaleString()} est.
                      </Badge>
                   </div>
                   <div className="mt-3 flex items-center gap-3">
                     <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                       <div
                         className="h-full rounded-full gradient-wine"
                         style={{ width: `${Math.min(pct, 100)}%` }}
                       />
                     </div>
                     <span className="w-32 text-right text-xs tabular-nums text-muted-foreground">
                       {m.served.toLocaleString()} / {m.prepared.toLocaleString()} served
                     </span>
                   </div>
                 </div>
               );
             })}
             {menu.length === 0 && !loading && (
               <div className="px-6 py-4 text-xs text-muted-foreground">No meal data from Firestore.</div>
             )}
           </div>
         </SectionCard>

         <SectionCard title="Received Attendance" action="View all" actionHref="/dashboard/kitchen_manager/attendance">
           {attendanceDrafts.length === 0 ? (
             <p className="text-xs text-muted-foreground">No attendance records received yet.</p>
           ) : (
             <div className="space-y-3">
               {attendanceDrafts.slice(0, 3).map((draft) => (
                 <div key={draft.id} className="rounded-lg border border-border bg-background/40 p-3">
                   <p className="text-sm font-medium">{draft.title}</p>
                   <p className="text-xs text-muted-foreground mt-1">
                     {draft.members.length} members
                   </p>
                   <p className="text-xs text-muted-foreground mt-1">
                     {relativeTime(draft.createdAt)}
                   </p>
                 </div>
               ))}
             </div>
           )}
         </SectionCard>
       </div>

       <SectionCard title="Preference split" action="Analytics" actionHref="/dashboard/kitchen_manager/analytics">
         <MealDonutChart data={mealSplit} />
         <div className="mt-4 rounded-lg bg-amber-500/5 p-3 text-xs text-muted-foreground">
           <span className="font-medium text-amber-500">AI tip:</span> Live preference analytics updating in real-time.
         </div>
       </SectionCard>
     </div>
   );
}