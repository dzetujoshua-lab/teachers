import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl gradient-amber shadow-lg shadow-amber-500/20">
        <span className="text-lg font-bold text-charcoal-950">S</span>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-wine-600 ring-2 ring-background" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">SmartCampus</p>
        <p className="-mt-0.5 text-[11px] font-medium text-muted-foreground">Attend</p>
      </div>
    </div>
  );
}
