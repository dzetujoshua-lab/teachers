"use client";

import { Soup, UtensilsCrossed, Flame, Trash2, ChefHat } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { MealDonutChart } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMeals, useMealSplit } from "@/lib/firebase/data";

export function KitchenDashboard() {
  const { rows: menu = [] } = useMeals();
  const { rows: mealSplit = [] } = useMealSplit();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kitchen Operations"
        description="Nkyemu Main Campus · today's service"
      >
        <Button variant="wine" size="sm">
          <ChefHat className="size-4" /> Publish menu
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Meals requested" value="10,600" delta={4} icon={UtensilsCrossed} accent="wine" />
        <StatCard index={1} label="Pepper demand" value="55%" delta={3} icon={Flame} accent="wine" />
        <StatCard index={2} label="Meals served" value="9,108" delta={2} icon={Soup} accent="amber" />
        <StatCard index={3} label="Food waste" value="4.2%" delta={-8} icon={Trash2} accent="neutral" hint="vs 6.1% last week" />
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
              const pct = Math.round((m.served / m.estimated) * 100);
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
                    <Badge variant={m.preference === "pepper" ? "wine" : "warning"}>
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
          </div>
        </SectionCard>

        <SectionCard title="Preference split" action="Analytics" actionHref="/dashboard/kitchen_manager/analytics">
          <MealDonutChart data={mealSplit} />
          <div className="mt-4 rounded-lg bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-amber-500">AI tip:</span> Engineering
            students prefer pepper-free meals (+18%). Consider scaling the mild batch.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
