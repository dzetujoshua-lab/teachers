"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  accent?: "amber" | "wine" | "neutral";
  hint?: string;
  index?: number;
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "neutral",
  hint,
  index = 0,
}: StatCardProps) {
  const accentBg =
    accent === "amber"
      ? "bg-amber-500/10 text-amber-500"
      : accent === "wine"
        ? "bg-wine-500/10 text-wine-400"
        : "bg-muted text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card className="group relative overflow-hidden p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className={cn("grid h-10 w-10 place-items-center rounded-lg", accentBg)}>
            <Icon className="size-5" />
          </div>
          {typeof delta === "number" && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                delta >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {delta >= 0 ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        {hint && <p className="mt-2 text-xs text-muted-foreground/70">{hint}</p>}
      </Card>
    </motion.div>
  );
}
