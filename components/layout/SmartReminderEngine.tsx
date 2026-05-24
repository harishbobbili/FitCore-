"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { showToast } from "@/lib/toast";

export default function SmartReminderEngine() {
  const calorieTarget = useAppStore((state) => state.profile?.target_kcal ?? 1800);
  const caloriesConsumed = useAppStore((state) => state.todayLog?.calories_consumed ?? 0);

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();

    let message = "";

    if (currentHour >= 6 && currentHour < 10) {
      message = "Log your breakfast";
    } else if (currentHour >= 11 && currentHour < 15) {
      const remaining = Math.max(0, calorieTarget - caloriesConsumed);
      message = `Halfway through - ${remaining} kcal remaining today`;
    } else if (currentHour >= 15 && currentHour < 18) {
      message = "Time for your pre-workout meal";
    } else if (currentHour >= 20 && currentHour < 24) {
      message = "Don't forget to log water intake";
    }

    if (message) {
      const timer = window.setTimeout(() => showToast(message, "info"), 1500);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [calorieTarget, caloriesConsumed]);

  return null;
}
