"use client";

import React, { useState, useEffect } from "react";
import { Soup, UtensilsCrossed, Flame, Trash2, ChefHat, ClipboardCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { MealDonutChart } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";
import { useLiveData } from "@/lib/hooks/use-live-data";
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assuming you have client-side Firebase initialized here
import { useAuth } from "@/lib/hooks/use-auth"; // Assuming a hook to get current user's UID
import type { AttendanceStatus } from "@/lib/types";

type MealRow = { id: string; meal: string; name: string; preference: string; estimated: number; prepared: number; served: number }; // This type might become obsolete or change
type MenuDocument = { id: string; week_start: string; menu_url: string; uploaded_by: string; };
type MealSplitRow = { id: string; name: string; value: number; color: string };
type AttendanceDraft = { id: string; title: string; members: { studentId: string; name: string; status?: AttendanceStatus }[]; createdAt: string };

export function KitchenDashboard() {
  const [publishing, setPublishing] = useState(false);
  const [mealStats, setMealStats] = useState({ pepper: 0, pepper_free: 0, total: 0 });
  const [currentMenu, setCurrentMenu] = useState<MenuDocument | null>(null);
  const [loadingMealStats, setLoadingMealStats] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [attendanceDrafts, setAttendanceDrafts] = useState<AttendanceDraft[]>([]);
  const { user } = useAuth(); // Assuming useAuth provides the current user object

  // Real-time listener for meal aggregation
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const q = query(
      collection(db, "attendance_records"),
      where("date", "==", today),
      where("is_verified", "==", true),
      where("status", "==", "present")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totals = {
        pepper: 0,
        pepper_free: 0,
        total: 0
      };

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.diet === "pepper") totals.pepper++;
        if (data.diet === "pepper_free") totals.pepper_free++;
        totals.total++;
      });

      setMealStats(totals);
      setLoadingMealStats(false);
    }, (error) => {
      console.error("Error fetching kitchen stats:", error);
      setLoadingMealStats(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch latest weekly menu
  useEffect(() => {
    const fetchLatestMenu = async () => {
      setLoadingMenu(true);
      try {
        const q = query(
          collection(db, "menus"),
          orderBy("week_start", "desc"), // Assuming week_start is sortable (e.g., ISO string)
          limit(1)
        );
        const querySnapshot = await getDocs(q); // Use getDocs for a one-time fetch
        if (!querySnapshot.empty) {
          setCurrentMenu(querySnapshot.docs[0].data() as MenuDocument);
        } else {
          setCurrentMenu(null);
        }
      } catch (error) {
        console.error("Error fetching latest menu:", error);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchLatestMenu();
  }, []);

  // Real-time listener for attendance drafts sent specifically to the kitchen
  useEffect(() => {
    const q = query(
      collection(db, "attendanceDrafts"),
      where("status", "==", "sent_to_kitchen")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const drafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceDraft));
      setAttendanceDrafts(drafts);
    });

    return () => unsubscribe();
  }, []);

  // Placeholder for the "Today's menu" section.
  // In a real system, this would parse the uploaded menu file (PDF/Image)
  // or fetch structured menu data if it were stored in Firestore.
  // For now, we'll just show a placeholder or a link to the uploaded menu.
  const dummyMenuDisplay = [
    { id: "1", meal: "breakfast", name: "Scrambled Eggs & Toast", preference: "pepper", estimated: mealStats.pepper + mealStats.pepper_free, prepared: mealStats.pepper + mealStats.pepper_free, served: mealStats.pepper + mealStats.pepper_free },
    { id: "2", meal: "lunch", name: "Chicken Stir-fry", preference: "pepper", estimated: mealStats.pepper, prepared: mealStats.pepper, served: mealStats.pepper },
    { id: "3", meal: "lunch", name: "Vegetable Curry", preference: "pepper_free", estimated: mealStats.pepper_free, prepared: mealStats.pepper_free, served: mealStats.pepper_free },
  ];

  const loading = loadingMealStats || loadingMenu;

  const mealSplitDataForChart: MealSplitRow[] = [
    { id: "pepper", name: "Pepper", value: mealStats.pepper, color: "var(--color-orange)" },
    { id: "pepper_free", name: "Pepper-Free", value: mealStats.pepper_free, color: "var(--color-blue)" },
  ];

   return (
     <div className="space-y-6">
       <PageHeader
         title="Kitchen Operations"
         description="Nkyemu Main Campus · today's service"
         liveData={{ lastUpdated: new Date(), loading: loading }}
       >
         <Button variant="wine" size="sm" onClick={() => alert("Navigate to menu upload page")} disabled={publishing}>
           <ChefHat className="size-4" /> Upload Weekly Menu
         </Button>
       </PageHeader>

       <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
         <StatCard index={0} label="Meals requested" value={loadingMealStats ? "..." : String(mealStats.total)} delta={4} icon={UtensilsCrossed} accent="wine" />
         <StatCard index={1} label="Pepper demand" value={loadingMealStats ? "..." : String(mealStats.pepper)} delta={3} icon={Flame} accent="wine" />
         <StatCard index={2} label="Pepper-Free demand" value={loadingMealStats ? "..." : String(mealStats.pepper_free)} delta={2} icon={Soup} accent="amber" />
         <StatCard index={3} label="Food waste" value="..." delta={-8} icon={Trash2} accent="neutral" hint="vs last week" />
       </div>

       <div className="grid gap-6 lg:grid-cols-3">
         <SectionCard
           title="Weekly Menu"
           action="View Menu File"
           actionHref={currentMenu?.menu_url || "#"}
           className="lg:col-span-2"
           noPadding
         >
           {loadingMenu ? (
             <div className="flex items-center justify-center p-6">
               <Loader2 className="size-5 animate-spin text-muted-foreground" />
             </div>
           ) : currentMenu ? (
             <div className="p-4">
               <p className="text-sm font-medium">Menu for week starting: {currentMenu.week_start}</p>
               <p className="text-xs text-muted-foreground">Uploaded by: {currentMenu.uploaded_by}</p>
               <a href={currentMenu.menu_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm mt-2 block">
                 Download Menu File (PDF/Image)
               </a>
               {/* This part would ideally parse the menu file or fetch structured menu data */}
               <div className="divide-y divide-border/60 mt-4">
             {dummyMenuDisplay.map((m) => {
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
             })} {/* End dummyMenuDisplay map */}
               </div>
             </div>
           ) : (
             <div className="px-6 py-4 text-xs text-muted-foreground">No weekly menu published yet.</div>
           )}
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

       <SectionCard title="Today's Meal Preference Split" action="Analytics" actionHref="/dashboard/kitchen_manager/analytics">
         <MealDonutChart data={mealSplitDataForChart} />
         <div className="mt-4 rounded-lg bg-amber-500/5 p-3 text-xs text-muted-foreground">
           <span className="font-medium text-amber-500">AI tip:</span> Live preference analytics updating in real-time.
         </div>
       </SectionCard>
     </div>
   );
}