"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { BodyMetric } from "@/lib/types";
import { showErrorToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";
import { getBodyMetricsRepository } from "@/lib/repositories";

export const useBodyMetrics = () => {
  const profile = useAppStore((state) => state.profile);
  const todayLog = useAppStore((state) => state.todayLog);
  const updateTodayLog = useAppStore((state) => state.updateTodayLog);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async (range: "2W" | "1M" | "3M" | "6M" = "1M") => {
    try {
      setLoading(true);
      const userId = await getSessionUserId();
      if (!userId) {
        setMetrics([]);
        return [];
      }

      const rangeDays = range === "2W" ? 14 : range === "1M" ? 30 : range === "3M" ? 90 : 180;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - rangeDays);

      const repo = getBodyMetricsRepository();
      const { data, error } = await repo.getByDateRange(
        userId,
        cutoff.toISOString().split("T")[0],
        new Date().toISOString().split("T")[0]
      );

      if (error) throw new Error(error.message);
      setMetrics((data ?? []) as BodyMetric[]);
      return (data ?? []) as BodyMetric[];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load body metrics.";
      showErrorToast(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();

    const loadMetrics = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        const userId = await getSessionUserId();
        if (!mounted) return;
        
        if (!userId) {
          if (mounted) setMetrics([]);
          return;
        }

        const rangeDays = 30; // Default to 1M
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - rangeDays);

        const repo = getBodyMetricsRepository();
        const { data, error } = await repo.getByDateRange(
          userId,
          cutoff.toISOString().split("T")[0],
          new Date().toISOString().split("T")[0]
        );

        if (abortController.signal.aborted || !mounted) return;
        
        if (error) throw new Error(error.message);
        
        if (mounted) {
          setMetrics((data ?? []) as BodyMetric[]);
        }
      } catch (error) {
        if (abortController.signal.aborted || !mounted) return;
        
        const message = error instanceof Error ? error.message : "Failed to load body metrics.";
        showErrorToast(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMetrics();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, []);

  const logMetrics = async (fields: Partial<BodyMetric>) => {
    const userId = await getSessionUserId();
    if (!userId) return null;

    const date = fields.date || new Date().toISOString().split("T")[0];
    const snapshot = metrics;
    const optimisticRow: BodyMetric = {
      id: crypto.randomUUID(),
      user_id: userId,
      date,
      weight_kg: fields.weight_kg ?? null,
      body_fat_pct: fields.body_fat_pct ?? null,
      waist_cm: fields.waist_cm ?? null,
      chest_cm: fields.chest_cm ?? null,
      hip_cm: fields.hip_cm ?? null,
    };

    setMetrics((prev) => {
      const filtered = prev.filter((metric) => metric.date !== date);
      return [...filtered, optimisticRow].sort((a, b) => a.date.localeCompare(b.date));
    });

    if (fields.weight_kg !== undefined) {
      updateTodayLog({ weight_kg: fields.weight_kg });
    }

    const repo = getBodyMetricsRepository();
    const { data, error } = await repo.log(userId, fields);

    if (error) {
      setMetrics(snapshot);
      showErrorToast(error.message);
      return null;
    }

    return data;
  };

  return {
    metrics,
    loading,
    logMetrics,
    fetchMetrics,
    currentWeight: todayLog?.weight_kg ?? profile?.weight_kg ?? 0,
  };
};

export default useBodyMetrics;
