import * as React from "react";
import { cn, initials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" };

export function Avatar({ name, color, size = "md", className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-background",
        sizes[size],
        className
      )}
      style={{ backgroundColor: color ?? "#5f616b" }}
      {...props}
    >
      {initials(name)}
    </div>
  );
}
