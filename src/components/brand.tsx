import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-9 w-9">
        <Image
          src="/images/dti-logo.png"
          alt="DTI Logo"
          fill
          className="object-contain"
          priority
          sizes="36px"
        />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">SmartCampus</p>
        <p className="-mt-0.5 text-[11px] font-medium text-muted-foreground">Attend</p>
      </div>
    </div>
  );
}
