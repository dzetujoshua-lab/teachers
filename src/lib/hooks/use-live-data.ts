"use client";

import * as React from "react";

export interface LiveDataOptions {
  pollInterval?: number;
  enabled?: boolean;
  immediate?: boolean;
}

export function useLiveData<T>(
  url: string | null,
  options: LiveDataOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
} {
  const { pollInterval = 5000, enabled = true, immediate = true } = options;
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(immediate);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!url || !enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  React.useEffect(() => {
    fetchData();
    
    if (!enabled || !pollInterval) return;
    
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, enabled, pollInterval]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}