"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, FilePlus, AlertTriangle } from "lucide-react";
import type { AttendanceDraft } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";

export function FacilitatorDraftsDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [drafts, setDrafts] = useState<AttendanceDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchDrafts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/attendance/drafts?status=draft");
        if (!response.ok) throw new Error("Failed to fetch drafts");
        const data = await response.json();
        setDrafts(data.rows || []);
      } catch (error) {
        toast.error("Could not load your attendance lists.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  const handleClaim = async (draftId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/attendance/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "draft" }), // Signal to claim the draft
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to claim the list.");
        }

        toast.success("Attendance list claimed! You can now take attendance.");
        // Refresh the list to show the change in state
        setDrafts(drafts.map(d => d.id === draftId ? { ...d, facilitatorId: profile!.uid } : d));
        router.refresh();
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  const handleTakeAttendance = (draftId: string) => {
    // Navigate to the specific page for taking attendance for this draft
    router.push(`/dashboard/facilitator/session/${draftId}`);
  };

  if (isLoading) {
    return <div>Loading attendance lists...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {drafts.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground">
          <FilePlus className="mx-auto h-12 w-12" />
          <p className="mt-4">No pending attendance lists found.</p>
        </div>
      )}
      {drafts.map((draft) => {
        const isUnassigned = draft.facilitatorId === "unassigned";
        return (
          <Card key={draft.id} className={isUnassigned ? "border-amber-500/50 bg-amber-500/5" : ""}>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{draft.title}</span>
                {isUnassigned && (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Unassigned
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center pt-1">
                <Users className="mr-2 h-4 w-4" />
                {draft.members.length} Students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isUnassigned
                  ? "This list is available for any facilitator to claim and complete."
                  : "This list is assigned to you. Please take attendance."}
              </p>
            </CardContent>
            <CardFooter>
              {isUnassigned ? (
                <Button
                  className="w-full"
                  onClick={() => handleClaim(draft.id)}
                  disabled={isPending}
                >
                  {isPending ? "Claiming..." : "Claim"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleTakeAttendance(draft.id)}
                >
                  Take Attendance
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}