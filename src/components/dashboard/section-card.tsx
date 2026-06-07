import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  action,
  actionHref,
  children,
  className,
  noPadding,
}: {
  title: string;
  action?: string;
  actionHref?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {action && actionHref && (
          <Link
            href={actionHref}
            className="flex items-center gap-1 text-xs font-medium text-amber-500 hover:underline"
          >
            {action}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </CardHeader>
      <CardContent className={cn(noPadding && "p-0")}>{children}</CardContent>
    </Card>
  );
}
