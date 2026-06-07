"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { useLiveData } from "@/lib/hooks/use-live-data";

type WeeklyMenuItem = {
  id?: string;
  meal: string;
  preference: string;
  estimated: number;
  name?: string;
};

type PublishedWeeklyMenu = {
  id?: string;
  weekLabel?: string;
  items?: WeeklyMenuItem[];
};

type TableRow = {
  id: string;
  day: string;
  breakfast?: string;
  lunch?: string;
  supper?: string;
  food?: string;
};

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TO_KEY: Record<string, "breakfast" | "lunch" | "supper"> = {
  breakfast: "breakfast",
  lunch: "lunch",
  supper: "supper",
};

function parseTable(items: WeeklyMenuItem[]): TableRow[] {
  const rowsByDay: Record<string, TableRow> = {};

  const ensureRow = (day: string): TableRow => {
    const key = day || "";
    if (rowsByDay[key]) return rowsByDay[key];
    return (rowsByDay[key] = {
      id: `day-${key.toLowerCase().replace(/\s+/g, "-")}`,
      day,
    });
  };

  for (const it of items || []) {
    const day = String(it.preference || "").trim();
    const mealKey = MEAL_TO_KEY[String(it.meal || "").trim()];
    const name = String(it.name || "").trim();

    if (!day || !mealKey || !name) continue;

    const row = ensureRow(day);

    const parts = name.split(" - ");
    const food = parts[0]?.trim();
    const cellText = parts.slice(1).join(" - ").trim() || name;

    if (food && !row.food) row.food = food;
    row[mealKey] = cellText;
  }

  const ordered: TableRow[] = [];
  for (const d of DEFAULT_DAYS) if (rowsByDay[d]) ordered.push(rowsByDay[d]);
  for (const key of Object.keys(rowsByDay)) if (!DEFAULT_DAYS.includes(key)) ordered.push(rowsByDay[key]);

  return ordered.length
    ? ordered
    : DEFAULT_DAYS.map((d) => ({ id: `day-${d.toLowerCase()}`, day: d }));
}

export function WeeklyPublishedMenuCard() {
  const { data: menuData, loading, lastUpdated, refetch } = useLiveData<PublishedWeeklyMenu>(
    "/api/kitchen/published-weekly-menu-view",
    { pollInterval: 10000 }
  );

  const items = Array.isArray(menuData?.items) ? menuData!.items! : [];
  const weekLabel = menuData?.id || menuData?.weekLabel || "";
  const tableRows = parseTable(items);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 p-4">
        <div>
          <p className="text-sm font-semibold">Latest weekly menu</p>
          <p className="text-xs text-muted-foreground">{weekLabel ? `Week: ${weekLabel}` : "No menu published yet."}</p>
          {lastUpdated && !loading && (
            <p className="text-xs text-muted-foreground">Live · Updated {new Date(lastUpdated).toLocaleTimeString()}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="p-4">
          {items.length === 0 ? (
            <div className="text-xs text-muted-foreground">No published menu found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Day</th>
                    <th className="px-3 py-3">Breakfast</th>
                    <th className="px-3 py-3">Lunch</th>
                    <th className="px-3 py-3">Supper</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tableRows.map((r) => (
                    <tr key={r.id} className="bg-card/40">
                      <td className="px-3 py-3">
                        <span className="font-medium">{r.day}</span>
                      </td>
                      <td className="px-3 py-3">{r.breakfast || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-3">{r.lunch || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-3">{r.supper || <span className="text-muted-foreground">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Published menus are read-only for non-kitchen roles.</span>
          <Badge variant="success">Ready</Badge>
        </div>
      </div>
    </Card>
  );
}