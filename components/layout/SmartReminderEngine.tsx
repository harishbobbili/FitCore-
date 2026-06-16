"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { showToast } from "@/lib/toast";

const REMINDER_PREFIX = "fitcore:smart-reminder";

export default function SmartReminderEngine() {
  const calorieTarget = useAppStore((state) => state.profile?.target_kcal ?? 1800);
  const caloriesConsumed = useAppStore((state) => state.todayLog?.calories_consumed ?? 0);
  const pendingRemindersRef = useRef(new Set<string>());

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const todayKey = now.toISOString().split("T")[0];

    let message = "";
    let slot = "";

    if (currentHour >= 6 && currentHour < 10) {
      slot = "breakfast";
      message = "Log your breakfast";
    } else if (currentHour >= 11 && currentHour < 15) {
      const remaining = Math.max(0, calorieTarget - caloriesConsumed);
      slot = "midday-calories";
      message = `Halfway through - ${remaining} kcal remaining today`;
    } else if (currentHour >= 15 && currentHour < 18) {
      slot = "pre-workout";
      message = "Time for your pre-workout meal";
    } else if (currentHour >= 20 && currentHour < 24) {
      slot = "water";
      message = "Don't forget to log water intake";
    }

    if (!message || !slot) {
      return undefined;
    }

    const reminderKey = `${REMINDER_PREFIX}:${todayKey}:${slot}`;
    if (pendingRemindersRef.current.has(reminderKey) || localStorage.getItem(reminderKey)) {
      return undefined;
    }

    const pendingReminders = pendingRemindersRef.current;
    pendingReminders.add(reminderKey);
    const timer = window.setTimeout(() => {
      localStorage.setItem(reminderKey, "shown");
      pendingReminders.delete(reminderKey);
      showToast(message, "info");
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      pendingReminders.delete(reminderKey);
    };
  }, [calorieTarget, caloriesConsumed]);

  return null;
}
