"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import type { BodyMetric } from "@/lib/types";
import { showErrorToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";

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

      const { data, error } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("user_id", userId)
        .gte("date", cutoff.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;
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
    fetchMetrics();
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

    const { data, error } = await supabase
      .from("body_metrics")
      .upsert({ user_id: userId, ...fields, date }, { onConflict: "user_id,date" })
      .select("*")
      .single();

    if (error) {
      setMetrics(snapshot);
      showErrorToast(error.message);
      return null;
    }

    return data as BodyMetric;
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
