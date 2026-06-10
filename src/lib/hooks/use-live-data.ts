"use client";

import * as React from "react";

export interface LiveDataOptions {
  pollInterval?: number;
  enabled?: boolean;
  immediate?: boolean;
  refreshInterval?: number;
}

export function useLiveData<T>(
  url: string | null,
  options: LiveDataOptions = {},
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
} {
  const { pollInterval = 30000, enabled = true, immediate = true, refreshInterval = 0 } = options;
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
    if (!enabled) return;

    fetchData();

    if (!pollInterval) return;

    const interval = setInterval(fetchData, pollInterval);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchData, enabled, pollInterval]);

  React.useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const getNextRefresh = () => {
      const now = new Date();
      const next = new Date(now);
      const msUntilNext = (refreshInterval - (now.getTime() % refreshInterval));
      next.setTime(next.getTime() + msUntilNext);
      return next;
    };

    const scheduleNextRefresh = () => {
      const next = getNextRefresh();
      const msUntil = next.getTime() - Date.now();
      if (msUntil > 0 && msUntil < 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          fetchData();
        }, msUntil);
        return timer;
      }
      return null;
    };

    let timer: ReturnType<typeof setTimeout> | null = scheduleNextRefresh();
    const interval = setInterval(() => {
      if (timer) clearTimeout(timer);
      timer = scheduleNextRefresh();
    }, refreshInterval);

    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}