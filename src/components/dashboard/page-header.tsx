import { Badge } from "@/components/ui/badge";

export function PageHeader({
  title,
  description,
  children,
  liveData,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  liveData?: {
    lastUpdated?: Date | null;
    loading?: boolean;
  };
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        {liveData && (
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="success" className="text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-green-400 opacity-75" />
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Live
            </Badge>
            {liveData.lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(liveData.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
