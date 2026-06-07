"use client";

import * as React from "react";
import { ShieldCheck, ShieldAlert, MapPin, Fingerprint, ScrollText, FileSearch } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, relativeTime } from "@/lib/utils";
import { useLiveData } from "@/lib/hooks/use-live-data";

type AuditRow = { id: string; actor: string; action: string; target: string; ip: string; device: string; time: string; severity: string };
type BuildingRow = { id: string; name: string; capacity: number; occupancy: number };
type FraudAlert = { id: string; threat: string; severity: string; count: number };

export function SecurityDashboard() {
   const [buildings, setBuildings] = React.useState<BuildingRow[]>([]);

   const { data: auditLogsData, loading, lastUpdated } = useLiveData<{ rows: AuditRow[] }>(
     "/api/admin/firestore?collection=auditLogs",
     { pollInterval: 3000 }
   );

   const auditLogs = auditLogsData?.rows || [];

   React.useEffect(() => {
     let cancelled = false;
     fetch("/api/admin/firestore?collection=buildings").then(r => r.json()).then((data) => {
       if (!cancelled) setBuildings(data.rows || []);
     }).catch(() => {});
     return () => { cancelled = true; };
   }, []);

   const handleReviewFraud = () => {
     window.open("/dashboard/security_officer/fraud", "_blank");
   };

   const fraudAlerts: FraudAlert[] = [
     { id: "1", threat: "GPS spoofing", severity: "critical", count: auditLogs.filter(l => l.severity === "critical").length },
     { id: "2", threat: "Duplicate devices", severity: "warning", count: auditLogs.filter(l => l.severity === "warning").length },
   ];

   return (
     <div className="space-y-6">
       <PageHeader
         title="Security & Integrity"
         description="Nkyemu Main Campus · real-time monitoring"
         liveData={{ lastUpdated, loading }}
       >
         <Button variant="wine" size="sm" onClick={handleReviewFraud}>
           <FileSearch className="size-4" /> Review fraud
         </Button>
       </PageHeader>

       <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
         <StatCard index={0} label="Threats blocked (24h)" value={loading ? "..." : String(auditLogs.filter(l => l.severity === "critical").length)} delta={-12} icon={ShieldCheck} accent="amber" />
         <StatCard index={1} label="GPS spoofs" value={loading ? "..." : String(auditLogs.filter(l => l.action.includes("GPS")).length)} delta={2} icon={MapPin} accent="wine" />
         <StatCard index={2} label="Duplicate devices" value={loading ? "..." : String(auditLogs.filter(l => l.severity === "warning").length)} icon={Fingerprint} accent="wine" />
         <StatCard index={3} label="Events processed" value={loading ? "..." : String(auditLogs.length)} delta={6} icon={ScrollText} accent="neutral" />
       </div>

       <div className="grid gap-6 lg:grid-cols-3">
         <SectionCard
           title="Audit log"
           action="Full log"
           actionHref="/dashboard/security_officer/audit"
           className="lg:col-span-2"
           noPadding
         >
           <div className="divide-y divide-border/60">
             {auditLogs.map((l) => (
               <div key={l.id} className="flex items-center gap-4 px-6 py-3.5">
                 <div
                   className={cn(
                     "grid h-9 w-9 place-items-center rounded-lg",
                     l.severity === "critical"
                       ? "bg-red-500/10 text-red-400"
                       : l.severity === "warning"
                         ? "bg-amber-500/10 text-amber-400"
                         : "bg-muted text-muted-foreground"
                   )}
                 >
                   {l.severity === "info" ? (
                     <ScrollText className="size-4" />
                   ) : (
                     <ShieldAlert className="size-4" />
                   )}
                 </div>
                 <div className="min-w-0 flex-1">
                   <p className="truncate text-sm font-medium">{l.action}</p>
                   <p className="truncate text-xs text-muted-foreground">
                     {l.actor} → {l.target} · {l.ip} · {l.device}
                   </p>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                   <Badge
                     variant={
                       l.severity === "critical"
                         ? "danger"
                         : l.severity === "warning"
                           ? "warning"
                           : "muted"
                     }
                   >
                     {l.severity}
                   </Badge>
                   <span className="text-[10px] text-muted-foreground">
                     {relativeTime(l.time)}
                   </span>
                 </div>
               </div>
             ))}
             {auditLogs.length === 0 && !loading && (
               <div className="px-6 py-4 text-xs text-muted-foreground">No audit logs from Firestore.</div>
             )}
           </div>
         </SectionCard>

         <SectionCard title="Campus heatmap" action="Open map" actionHref="/dashboard/security_officer/heatmap">
           <div className="relative aspect-square overflow-hidden rounded-xl border border-border grid-bg">
             {buildings.map((b, i) => {
               const load = b.capacity > 0 ? b.occupancy / b.capacity : 0;
               return (
                 <div
                   key={b.id}
                   className="absolute -translate-x-1/2 -translate-y-1/2"
                   style={{
                     left: `${15 + (i % 3) * 35}%`,
                     top: `${20 + Math.floor(i / 3) * 38}%`,
                   }}
                 >
                   <span
                     className={cn(
                       "block rounded-full",
                       load > 0.85
                         ? "bg-wine-500/40"
                         : load > 0.6
                           ? "bg-amber-500/40"
                           : "bg-emerald-500/30"
                     )}
                     style={{ width: 28 + load * 36, height: 28 + load * 36 }}
                   />
                   <span
                     className={cn(
                       "absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                       load > 0.85
                         ? "bg-wine-500"
                         : load > 0.6
                           ? "bg-amber-500"
                           : "bg-emerald-500"
                     )}
                   />
                 </div>
               );
             })}
             {buildings.length === 0 && !loading && (
               <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No building data from Firestore.</div>
             )}
           </div>
           <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
             <span className="flex items-center gap-1.5">
               <span className="h-2 w-2 rounded-full bg-emerald-500" /> Normal
             </span>
             <span className="flex items-center gap-1.5">
               <span className="h-2 w-2 rounded-full bg-amber-500" /> Busy
             </span>
             <span className="flex items-center gap-1.5">
               <span className="h-2 w-2 rounded-full bg-wine-500" /> High
             </span>
           </div>
         </SectionCard>
       </div>
     </div>
   );
}