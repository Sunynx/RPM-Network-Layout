"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseSupabaseQueryOptions {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  filter?: Record<string, unknown>;
  realtime?: boolean;
  realtimeTables?: string[];
  enabled?: boolean;
}

interface UseSupabaseQueryResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Unified data fetching hook — replaces the repeated useEffect + createClient() pattern
 * found in every page. Supports:
 * - Automatic data fetching on mount
 * - Supabase Realtime subscriptions (auto-refetch on DB changes)
 * - Loading/error state management
 * - Manual refetch trigger
 */
export function useSupabaseQuery<T = Record<string, unknown>>(
  table: string,
  options: UseSupabaseQueryOptions = {}
): UseSupabaseQueryResult<T> {
  const {
    select = "*",
    orderBy,
    ascending = true,
    realtime = true,
    realtimeTables,
    enabled = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      const supabase = createClient();
      let query = supabase.from(table).select(select);
      
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;
      if (mountedRef.current) {
        setData((result || []) as T[]);
        setError(null);
      }
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [table, select, orderBy, ascending, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Realtime subscription
    if (!realtime || !enabled) {
      return () => { mountedRef.current = false; };
    }

    const supabase = createClient();
    const tablesToWatch = realtimeTables || [table];
    const channelName = `query_${table}_${Date.now()}`;
    
    let channel = supabase.channel(channelName);
    
    tablesToWatch.forEach((t) => {
      channel = channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: t },
        () => fetchData()
      );
    });

    channel.subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchData, realtime, enabled, table, realtimeTables]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Fetch from multiple tables in parallel — replaces Promise.all([...]) pattern.
 */
export function useSupabaseQueries<T extends Record<string, unknown[]>>(
  queries: { key: string; table: string; select?: string; orderBy?: string }[],
  options: { realtime?: boolean } = {}
): { data: T; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      const supabase = createClient();
      const results = await Promise.all(
        queries.map(async (q) => {
          let query = supabase.from(q.table).select(q.select || "*");
          if (q.orderBy) query = query.order(q.orderBy);
          const { data: result, error: err } = await query;
          if (err) throw err;
          return { key: q.key, data: result || [] };
        })
      );

      if (mountedRef.current) {
        const merged: Record<string, unknown[]> = {};
        results.forEach((r) => { merged[r.key] = r.data; });
        setData(merged);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [queries]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();

    if (!options.realtime) {
      return () => { mountedRef.current = false; };
    }

    const supabase = createClient();
    const tables = [...new Set(queries.map((q) => q.table))];
    const channelName = `multi_${tables.join("_")}_${Date.now()}`;
    
    let channel = supabase.channel(channelName);
    tables.forEach((t) => {
      channel = channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: t },
        () => fetchAll()
      );
    });
    channel.subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchAll, options.realtime, queries]);

  return { data: data as T, loading, error, refetch: fetchAll };
}
