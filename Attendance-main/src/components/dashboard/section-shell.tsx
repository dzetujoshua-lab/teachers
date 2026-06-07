import { Construction, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";

export function SectionShell({ role, title }: { role: Role; title: string }) {
  const accent = ROLES[role].accent;
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={`${ROLES[role].label} - ${ROLES[role].tagline}`}
      >
        <Badge variant={accent === "amber" ? "warning" : "wine"}>
          <Sparkles className="size-3" /> Module preview
        </Badge>
      </PageHeader>

      <Card className="grid place-items-center px-6 py-20 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Construction className="size-7" />
          </div>
          <h2 className="text-lg font-semibold">{title} is scaffolded</h2>
          <p className="text-sm text-muted-foreground">
            This module is wired into navigation and the design system. The overview
            dashboard for <strong>{ROLES[role].label}</strong> is fully built - this
            deeper view is ready for the next implementation pass (real Firebase
            queries, tables, and workflows).
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button variant={accent === "amber" ? "default" : "wine"} size="sm">
              Request this module next
            </Button>
            <Button variant="outline" size="sm">
              View documentation
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
