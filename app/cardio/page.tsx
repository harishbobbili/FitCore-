"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useProfile } from "@/hooks/useProfile";
import { 
  Flame, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Heart, 
  TrendingUp, 
  Activity, 
  Footprints, 
  Timer, 
  AlertCircle,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface CardioLogItem {
  id: string;
  date: string;
  type: string;
  duration_mins: number;
  distance_km: number;
  calories_burned: number;
  avg_heart_rate: number | null;
  incline_pct: number;
}

const cardioTypeLabels: Record<string, string> = {
  walk: "Treadmill Walk",
  run: "Running",
  hiit: "HIIT Session",
  jump_rope: "Jump Rope",
};

export default function CardioPage() {
  const breadcrumbs = [{ label: "Cardio" }];
  const { log, logSteps, logCalories } = useDailyLog();
  const { profile } = useProfile();

  // States
  const [weeklyLogs, setWeeklyLogs] = useState<CardioLogItem[]>([]);
  const [todayLogs, setTodayLogs] = useState<CardioLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [logStatus, setLogStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Treadmill Calculator state
  const [treadmillDuration, setTreadmillDuration] = useState(30);
  const [treadmillSpeed, setTreadmillSpeed] = useState(4.8); // km/h
  const [treadmillIncline, setTreadmillIncline] = useState(8); // %
  const [treadmillHr, setTreadmillHr] = useState(122); // bpm

  // Running Calculator state
  const [runningDuration, setRunningDuration] = useState(20);
  const [runningDistance, setRunningDistance] = useState(3.0); // km
  const [runningHr, setRunningHr] = useState(140); // bpm

  // Steps state
  const [stepsToAdd, setStepsToAdd] = useState(1000);

  // HIIT Timer states
  const [hiitWorkTime, setHiitWorkTime] = useState(20); // seconds
  const [hiitRestTime, setHiitRestTime] = useState(10); // seconds
  const [hiitRounds, setHiitRounds] = useState(8);
  const [hiitCurrentRound, setHiitCurrentRound] = useState(1);
  const [hiitState, setHiitState] = useState<"IDLE" | "WORK" | "REST" | "FINISHED">("IDLE");
  const [hiitSecondsLeft, setHiitSecondsLeft] = useState(20);
  const [hiitIsPaused, setHiitIsPaused] = useState(true);

  // Heart Rate zone selector state
  const [hrInput, setHrInput] = useState(125); // slider

  // Timers references
  const hiitIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio synthesis for HIIT
  const playBeep = useCallback((type: "transition" | "final") => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("AudioContext not supported in this browser.");
        return;
      }
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      
      if (type === "transition") {
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // High pitch transition
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } else {
        // Double beep for final completion
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.35);

        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.4);
        }, 400);
      }
    } catch (e) {
      console.warn("Audio synthesis blocked or unsupported:", e);
    }
  }, []);

  // Fetch range logs
  const fetchCardioLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const today = new Date();
      
      // Calculate past 7 days (including today)
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 6);
      
      const startDateStr = pastDate.toISOString().split("T")[0];
      const endDateStr = today.toISOString().split("T")[0];

      // Next.js App Router API route is at /api/cardio
      const apiRes = await fetch(`/api/cardio?startDate=${startDateStr}&endDate=${endDateStr}`);
      const result = await apiRes.json();

      if (result.success && result.data) {
        setWeeklyLogs(result.data);
        
        // Filter logs completed today
        const todayStr = today.toISOString().split("T")[0];
        const tLogs = result.data.filter((l: CardioLogItem) => l.date === todayStr);
        setTodayLogs(tLogs);
      }
    } catch (e) {
      console.error("Error fetching cardio logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchCardioLogs();
  }, [fetchCardioLogs]);

  // Post cardio session helper
  const logCardioSession = useCallback(async (payload: {
    type: string;
    duration_mins: number;
    distance_km: number;
    calories_burned: number;
    avg_heart_rate: number | null;
    incline_pct: number;
  }) => {
    try {
      setIsLogging(true);
      setLogStatus(null);

      const res = await fetch("/api/cardio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          date: new Date().toISOString().split("T")[0],
        }),
      });
      const result = await res.json();

      if (result.success) {
        setLogStatus({ type: "success", msg: `${cardioTypeLabels[payload.type] ?? payload.type} logged successfully!` });
        // Sync calories with local store
        logCalories((log?.calories_consumed ?? 0) + payload.calories_burned);
        // Refresh feed and charts
        fetchCardioLogs();
      } else {
        throw new Error(result.error || "Failed to log session");
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Could not log cardio session.";
      setLogStatus({ type: "error", msg: errMsg });
    } finally {
      setIsLogging(false);
      setTimeout(() => setLogStatus(null), 4000);
    }
  }, [fetchCardioLogs, log, logCalories]);

  // HIIT Timer logic loop
  useEffect(() => {
    if (hiitState !== "IDLE" && hiitState !== "FINISHED" && !hiitIsPaused) {
      hiitIntervalRef.current = setInterval(() => {
        setHiitSecondsLeft((prev) => {
          if (prev <= 1) {
            // Transition state
            if (hiitState === "WORK") {
              playBeep("transition");
              // Transition to REST
              setHiitState("REST");
              return hiitRestTime;
            } else if (hiitState === "REST") {
              // Check if all rounds done
              if (hiitCurrentRound >= hiitRounds) {
                playBeep("final");
                setHiitState("FINISHED");
                setHiitIsPaused(true);
                // Log HIIT session automatically
                logCardioSession({
                  type: "hiit",
                  duration_mins: Math.ceil((hiitWorkTime * hiitRounds + hiitRestTime * (hiitRounds - 1)) / 60),
                  distance_km: 0,
                  calories_burned: Math.round(hiitRounds * hiitWorkTime * 0.12), // rough calories
                  avg_heart_rate: 155,
                  incline_pct: 0
                });
                return 0;
              } else {
                playBeep("transition");
                setHiitCurrentRound((r) => r + 1);
                setHiitState("WORK");
                return hiitWorkTime;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (hiitIntervalRef.current) clearInterval(hiitIntervalRef.current);
    }

    return () => {
      if (hiitIntervalRef.current) clearInterval(hiitIntervalRef.current);
    };
  }, [hiitState, hiitIsPaused, hiitCurrentRound, hiitRounds, hiitWorkTime, hiitRestTime, playBeep, logCardioSession]);

  // Treadmill MET and Calories Formula
  // VO2 = 0.1 * S + 1.8 * S * G + 3.5 (where speed S in m/min, grade G in decimal)
  const getTreadmillStats = () => {
    const sMmin = treadmillSpeed * 16.67; // km/h to m/min
    const grade = treadmillIncline / 100;
    const vo2 = 0.1 * sMmin + 1.8 * sMmin * grade + 3.5;
    const met = vo2 / 3.5;
    const calories = met * (profile?.weight_kg ?? 63) * (treadmillDuration / 60);
    return {
      met: Math.round(met * 10) / 10,
      calories: Math.round(calories),
    };
  };

  const treadmillStats = getTreadmillStats();

  const handleLogTreadmill = () => {
    logCardioSession({
      type: "walk",
      duration_mins: treadmillDuration,
      distance_km: Math.round(((treadmillSpeed * treadmillDuration) / 60) * 100) / 100,
      calories_burned: treadmillStats.calories,
      avg_heart_rate: treadmillHr,
      incline_pct: treadmillIncline,
    });
  };

  // Running MET and Calories Formula
  // VO2 = 0.2 * S + 3.5 (flat running)
  const getRunningStats = () => {
    if (runningDuration <= 0 || runningDistance <= 0) return { met: 0, calories: 0, speed: 0 };
    const speedKmh = (runningDistance / runningDuration) * 60;
    const sMmin = speedKmh * 16.67;
    const vo2 = 0.2 * sMmin + 3.5;
    const met = vo2 / 3.5;
    const calories = met * (profile?.weight_kg ?? 63) * (runningDuration / 60);
    return {
      met: Math.round(met * 10) / 10,
      calories: Math.round(calories),
      speed: Math.round(speedKmh * 10) / 10,
    };
  };

  const runningStats = getRunningStats();

  const handleLogRunning = () => {
    logCardioSession({
      type: "run",
      duration_mins: runningDuration,
      distance_km: runningDistance,
      calories_burned: runningStats.calories,
      avg_heart_rate: runningHr,
      incline_pct: 0,
    });
  };

  // Steps logger
  const handleLogSteps = () => {
    if (stepsToAdd <= 0) return;
    logSteps((log?.steps ?? 0) + stepsToAdd);
    // 0.04 calories burned per step
    const stepCalories = Math.round(stepsToAdd * 0.04);
    logCalories((log?.calories_consumed ?? 0) + stepCalories);
    
    setLogStatus({ type: "success", msg: `Added ${stepsToAdd.toLocaleString()} steps (+${stepCalories} kcal)` });
    setTimeout(() => setLogStatus(null), 4000);
  };

  // HIIT Timer Actions
  const handleStartHiit = () => {
    setHiitState("WORK");
    setHiitSecondsLeft(hiitWorkTime);
    setHiitCurrentRound(1);
    setHiitIsPaused(false);
  };

  const handlePauseHiit = () => {
    setHiitIsPaused(!hiitIsPaused);
  };

  const handleResetHiit = () => {
    setHiitState("IDLE");
    setHiitSecondsLeft(hiitWorkTime);
    setHiitCurrentRound(1);
    setHiitIsPaused(true);
  };

  // HR Zone evaluation
  const getHrZoneDetails = (bpm: number) => {
    if (bpm < 115) {
      return { 
        zone: "Active Rest / Warmup", 
        desc: "Low-intensity cardiovascular prep. Minimal fat oxidation.",
        color: "text-white/40",
        bg: "bg-white/5",
        percent: ((bpm - 60) / (200 - 60)) * 100 
      };
    }
    if (bpm >= 115 && bpm <= 133) {
      return { 
        zone: "Zone 2 - Fat Oxidation", 
        desc: "SWEET SPOT. Optimizes lipid burn, spares glycogen, high recovery rate.",
        color: "text-neonCyan",
        bg: "bg-neonCyan/10 border-neonCyan/20",
        percent: ((bpm - 60) / (200 - 60)) * 100 
      };
    }
    if (bpm > 133 && bpm <= 152) {
      return { 
        zone: "Zone 3 - Aerobic Pace", 
        desc: "Improves glycogen storage capacity and cardiovascular threshold.",
        color: "text-neonPurple",
        bg: "bg-neonPurple/10 border-neonPurple/20",
        percent: ((bpm - 60) / (200 - 60)) * 100 
      };
    }
    return { 
      zone: "Zone 4/5 - Anaerobic / VO2 Max", 
      desc: "High lactic acid buildup, rapid glycogen depletion. CNS fatiguing.",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      percent: ((bpm - 60) / (200 - 60)) * 100 
    };
  };

  const hrDetails = getHrZoneDetails(hrInput);

  // Group weekly logs for chart: Map last 7 days from Sunday to Saturday or just last 7 days chronologically
  const chartData = useMemo(() => {
    const daysData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      // sum durations for this date
      const totalMinutes = weeklyLogs
        .filter((l) => l.date === dateStr)
        .reduce((sum, curr) => sum + curr.duration_mins, 0);

      daysData.push({
        day: dayName,
        date: dateStr,
        minutes: totalMinutes,
      });
    }
    return daysData;
  }, [weeklyLogs]);

  const totalWeeklyMinutes = chartData.reduce((sum, d) => sum + d.minutes, 0);

  // HIIT active progress percentage
  const hiitMaxTime = hiitState === "WORK" ? hiitWorkTime : hiitRestTime;
  const hiitProgressPct = hiitSecondsLeft / (hiitMaxTime || 1);

  return (
    <div>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Cardio & Activity Hub"
          subtitle="Manage LISS cardio, step counts, and HIIT interval circuits to accelerate fat loss while preserving muscle."
          breadcrumbs={breadcrumbs}
        />

      {/* STATUS BANNER */}
      <AnimatePresence>
        {logStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs z-40 fixed top-4 right-4 shadow-glass max-w-sm ${
              logStatus.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {logStatus.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{logStatus.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step Counter Stat */}
        <GlassCard className="p-5 flex items-center justify-between border-white/5 relative overflow-hidden" hoverable>
          <div className="absolute top-0 right-0 w-32 h-32 bg-neonCyan/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-neonCyan bg-neonCyan/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit">
              Steps Today
            </span>
            <span className="text-2xl font-black text-white mt-2 font-mono">
              {(log?.steps ?? 0).toLocaleString()} / {(profile?.step_goal ?? 9000).toLocaleString()}
            </span>
            <span className="text-[11px] text-white/40 font-medium">
              Goal Progress: {Math.min(100, Math.round(((log?.steps ?? 0) / (profile?.step_goal ?? 9000)) * 100))}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neonCyan/10 flex items-center justify-center text-neonCyan shadow-[0_0_15px_rgba(0,212,255,0.1)]">
            <Footprints className="w-6 h-6" />
          </div>
        </GlassCard>

        {/* Weekly Cardio duration */}
        <GlassCard className="p-5 flex items-center justify-between border-white/5 relative overflow-hidden" hoverable>
          <div className="absolute top-0 right-0 w-32 h-32 bg-neonPurple/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-neonPurple bg-neonPurple/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit">
              Weekly Cardio
            </span>
            <span className="text-2xl font-black text-white mt-2 font-mono">
              {totalWeeklyMinutes} / 150 min
            </span>
            <span className="text-[11px] text-white/40 font-medium">
              Aim for 150 min LISS Zone 2 / week
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neonPurple/10 flex items-center justify-center text-neonPurple shadow-[0_0_15px_rgba(108,99,255,0.1)]">
            <Timer className="w-6 h-6" />
          </div>
        </GlassCard>

        {/* Calories Burned Today */}
        <GlassCard className="p-5 flex items-center justify-between border-white/5 relative overflow-hidden" hoverable>
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit">
              Today&apos;s Step Burn
            </span>
            <span className="text-2xl font-black text-white mt-2 font-mono">
              {Math.round((log?.steps ?? 0) * 0.04)} kcal
            </span>
            <span className="text-[11px] text-white/40 font-medium">
              Calculated at 0.04 kcal / step
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <Flame className="w-6 h-6 fill-rose-500" />
          </div>
        </GlassCard>
      </div>

      {/* CORE LOGGING SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CALCULATORS COLUMN (Left/Mid) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* TREADMILL WIDGET */}
          <GlassCard className="border-white/5 relative overflow-hidden p-5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-neonCyan/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-base font-extrabold text-white flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-neonCyan" /> Incline Treadmill LISS Calculator
            </h2>
            <p className="text-xs text-white/40 mb-4">
              Uses ACSM Walking equation to calculate METs & calorie expenditure for your current profile weight.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider">Duration (min)</label>
                <input
                  type="number"
                  value={treadmillDuration}
                  onChange={(e) => setTreadmillDuration(Math.max(1, parseInt(e.target.value) || 0))}
                  className="bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-neonCyan"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider">Speed (km/h)</label>
                <input
                  type="number"
                  step="0.1"
                  value={treadmillSpeed}
                  onChange={(e) => setTreadmillSpeed(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-neonCyan"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider">Incline (%)</label>
                <input
                  type="number"
                  value={treadmillIncline}
                  onChange={(e) => setTreadmillIncline(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-neonCyan"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={treadmillHr}
                  onChange={(e) => setTreadmillHr(Math.max(40, parseInt(e.target.value) || 0))}
                  className="bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-neonCyan"
                />
              </div>
            </div>

            {/* Results Preview */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
              <div className="flex gap-6 items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Estimated METs</span>
                  <span className="text-base font-black font-mono text-neonCyan">{treadmillStats.met}</span>
                </div>
                <div className="flex flex-col border-l border-white/5 pl-6">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Est. Calories Burned</span>
                  <span className="text-base font-black font-mono text-rose-400">{treadmillStats.calories} kcal</span>
                </div>
              </div>

              <NeonButton
                variant="cyan-outline"
                disabled={isLogging}
                onClick={handleLogTreadmill}
                className="text-xs h-9 py-0"
              >
                <Plus className="w-3.5 h-3.5" /> Log Treadmill Session
              </NeonButton>
            </div>
          </GlassCard>

          {/* RUNNING WIDGET */}
          <GlassCard className="border-white/5 relative overflow-hidden p-5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-neonPurple/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-base font-extrabold text-white flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-neonPurple" /> Running / Jogging Calculator
            </h2>
            <p className="text-xs text-white/40 mb-4">
              Calculates flat running metabolic load and calorie expenditure using the ACSM Running equation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider">Duration (min)</label>
                <input
                  type="number"
                  value={runningDuration}
                  onChange={(e) => setRunningDuration(Math.max(1, parseInt(e.target.value) || 0))}
                  className="bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-neonPurple"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={runningDistance}
                  onChange={(e) => setRunningDistance(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-neonPurple"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider">Avg Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={runningHr}
                  onChange={(e) => setRunningHr(Math.max(40, parseInt(e.target.value) || 0))}
                  className="bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-neonPurple"
                />
              </div>
            </div>

            {/* Results Preview */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
              <div className="flex gap-6 items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Avg Speed</span>
                  <span className="text-base font-black font-mono text-neonPurple">{runningStats.speed} km/h</span>
                </div>
                <div className="flex flex-col border-l border-white/5 pl-6">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Estimated METs</span>
                  <span className="text-base font-black font-mono text-white/80">{runningStats.met}</span>
                </div>
                <div className="flex flex-col border-l border-white/5 pl-6">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Est. Calories</span>
                  <span className="text-base font-black font-mono text-rose-400">{runningStats.calories} kcal</span>
                </div>
              </div>

              <NeonButton
                variant="purple-outline"
                disabled={isLogging}
                onClick={handleLogRunning}
                className="text-xs h-9 py-0"
              >
                <Plus className="w-3.5 h-3.5" /> Log Running Session
              </NeonButton>
            </div>
          </GlassCard>

          {/* HIIT INTERACTIVE INTERVAL TIMER */}
          <GlassCard className="border-white/5 relative overflow-hidden p-5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-base font-extrabold text-white flex items-center gap-2 mb-1">
              <Timer className="w-4 h-4 text-rose-500" /> HIIT Interactive Circuit Timer
            </h2>
            <p className="text-xs text-white/40 mb-4">
              Set up Work / Rest interval parameters and follow the rounds countdown. Synth alarm triggers at intervals.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              
              {/* Controls Form */}
              <div className="md:col-span-2 flex flex-col gap-3">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex flex-col gap-1 w-1/2">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Work (s)</span>
                    <input
                      type="number"
                      disabled={hiitState !== "IDLE"}
                      value={hiitWorkTime}
                      onChange={(e) => {
                        setHiitWorkTime(Math.max(5, parseInt(e.target.value) || 0));
                        if (hiitState === "IDLE") setHiitSecondsLeft(Math.max(5, parseInt(e.target.value) || 0));
                      }}
                      className="bg-white/[0.02] border border-white/10 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-rose-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-1/2">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Rest (s)</span>
                    <input
                      type="number"
                      disabled={hiitState !== "IDLE"}
                      value={hiitRestTime}
                      onChange={(e) => setHiitRestTime(Math.max(2, parseInt(e.target.value) || 0))}
                      className="bg-white/[0.02] border border-white/10 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-rose-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Rounds Count</span>
                  <input
                    type="number"
                    disabled={hiitState !== "IDLE"}
                    value={hiitRounds}
                    onChange={(e) => setHiitRounds(Math.max(1, parseInt(e.target.value) || 0))}
                    className="bg-white/[0.02] border border-white/10 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-rose-500 disabled:opacity-50"
                  />
                </div>

                {/* Control Action Buttons */}
                <div className="flex gap-2 mt-2">
                  {hiitState === "IDLE" ? (
                    <NeonButton
                      variant="gradient"
                      onClick={handleStartHiit}
                      className="w-full text-xs h-10 py-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Start Circuit
                    </NeonButton>
                  ) : (
                    <>
                      <button
                        onClick={handlePauseHiit}
                        className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          hiitIsPaused 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" 
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                        }`}
                      >
                        {hiitIsPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                        {hiitIsPaused ? "Resume" : "Pause"}
                      </button>
                      <button
                        onClick={handleResetHiit}
                        className="w-12 flex items-center justify-center h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Animated Round Display Circle */}
              <div className="md:col-span-2 flex flex-col items-center justify-center gap-2 py-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      className="stroke-white/5"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="72"
                      cy="72"
                      r="64"
                      className={
                        hiitState === "WORK" 
                          ? "stroke-neonCyan" 
                          : hiitState === "REST" 
                          ? "stroke-neonPurple" 
                          : hiitState === "FINISHED"
                          ? "stroke-emerald-400"
                          : "stroke-white/10"
                      }
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 64}
                      animate={{ strokeDashoffset: (2 * Math.PI * 64) * (1 - hiitProgressPct) }}
                      transition={{ ease: "linear", duration: 1 }}
                    />
                  </svg>
                  
                  {/* Text panel inside SVG */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    {hiitState === "IDLE" && (
                      <>
                        <span className="text-[10px] text-white/30 uppercase font-black tracking-wider">Ready</span>
                        <span className="text-2xl font-black text-white font-mono">{hiitWorkTime}s</span>
                      </>
                    )}

                    {hiitState === "WORK" && (
                      <>
                        <span className="text-[10px] text-neonCyan uppercase font-black tracking-widest animate-pulse">WORK</span>
                        <span className="text-3xl font-black text-white font-mono mt-0.5">{hiitSecondsLeft}s</span>
                        <span className="text-[10px] text-white/40 font-bold mt-1 font-mono">Rd {hiitCurrentRound}/{hiitRounds}</span>
                      </>
                    )}

                    {hiitState === "REST" && (
                      <>
                        <span className="text-[10px] text-neonPurple uppercase font-black tracking-widest animate-pulse">REST</span>
                        <span className="text-3xl font-black text-white font-mono mt-0.5">{hiitSecondsLeft}s</span>
                        <span className="text-[10px] text-white/40 font-bold mt-1 font-mono">Rd {hiitCurrentRound}/{hiitRounds}</span>
                      </>
                    )}

                    {hiitState === "FINISHED" && (
                      <>
                        <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider">Done!</span>
                        <span className="text-sm font-extrabold text-white mt-1">Completed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </GlassCard>

        </div>

        {/* SIDE COLUMN (Right) */}
        <div className="flex flex-col gap-6">

          {/* STEP LOG ENTRY */}
          <GlassCard className="border-white/5 relative overflow-hidden p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
              <Footprints className="w-4 h-4 text-neonCyan" /> Log Steps Log
            </h2>
            <p className="text-[11px] text-white/40 leading-relaxed mb-4">
              Add steps completed outside gym sessions. Calculated burn rate is 40 kcal per 1,000 steps.
            </p>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="1000"
                value={stepsToAdd}
                onChange={(e) => setStepsToAdd(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-neonCyan"
              />
              <NeonButton
                variant="cyan-outline"
                onClick={handleLogSteps}
                className="text-xs h-9 py-0 px-4 shrink-0"
              >
                Log Steps
              </NeonButton>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-1.5 mt-3">
              <button
                onClick={() => setStepsToAdd(2500)}
                className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 transition-colors cursor-pointer"
              >
                +2.5k Steps
              </button>
              <button
                onClick={() => setStepsToAdd(5000)}
                className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 transition-colors cursor-pointer"
              >
                +5.0k Steps
              </button>
              <button
                onClick={() => setStepsToAdd(10000)}
                className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 transition-colors cursor-pointer"
              >
                +10.0k Steps
              </button>
            </div>
          </GlassCard>

          {/* SLIDING HR ZONE GAUGE */}
          <GlassCard className="border-white/5 p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" /> HR Zone Interactive Gauge
            </h2>
            <p className="text-[11px] text-white/40 mb-3">
              Slide to evaluate metabolic profile of your active heart rate.
            </p>

            {/* SVG GAUGE ARC */}
            <div className="flex flex-col items-center justify-center gap-1 py-1 mt-1">
              <div className="relative w-44 h-24 flex items-end justify-center overflow-hidden">
                <svg className="w-44 h-22">
                  {/* Base Track */}
                  <path
                    d="M 12 88 A 76 76 0 0 1 164 88"
                    fill="none"
                    className="stroke-white/5"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Highlighted zone segments */}
                  {/* Zone 2 Arc (115-133 bpm) -> approx 40% to 55% of the gauge */}
                  <path
                    d="M 64 26 A 76 76 0 0 1 112 26"
                    fill="none"
                    className="stroke-neonCyan/30"
                    strokeWidth="10"
                  />
                  {/* Active Indicator Pin */}
                  <motion.circle
                    cx={88 + 76 * Math.cos((180 - (hrInput - 60) * (180 / (200 - 60))) * (Math.PI / 180))}
                    cy={88 - 76 * Math.sin((180 - (hrInput - 60) * (180 / (200 - 60))) * (Math.PI / 180))}
                    r="6"
                    className={
                      hrInput >= 115 && hrInput <= 133 
                        ? "fill-neonCyan" 
                        : hrInput > 133 && hrInput <= 152 
                        ? "fill-neonPurple" 
                        : hrInput > 152 
                        ? "fill-rose-500" 
                        : "fill-white/60"
                    }
                    animate={{ 
                      cx: 88 + 76 * Math.cos((180 - (hrInput - 60) * (180 / (200 - 60))) * (Math.PI / 180)),
                      cy: 88 - 76 * Math.sin((180 - (hrInput - 60) * (180 / (200 - 60))) * (Math.PI / 180)) 
                    }}
                    transition={{ type: "spring", stiffness: 100 }}
                  />
                </svg>
                
                {/* Overlay Text */}
                <div className="absolute bottom-1 flex flex-col items-center text-center">
                  <span className="text-2xl font-black font-mono text-white leading-none">{hrInput}</span>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1">BPM</span>
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="60"
                max="200"
                value={hrInput}
                onChange={(e) => setHrInput(parseInt(e.target.value))}
                className="w-full accent-neonPurple bg-white/10 h-1 rounded-lg outline-none cursor-pointer mt-2"
              />

              {/* Description Panel */}
              <div className={`w-full p-2.5 rounded-lg border text-center transition-all duration-300 mt-2 ${hrDetails.bg}`}>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${hrDetails.color}`}>
                  {hrDetails.zone}
                </span>
                <span className="text-[10px] text-white/50 font-medium block mt-1 leading-normal">
                  {hrDetails.desc}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* WEEKLY MINUTES BARCHART */}
          <GlassCard className="border-white/5 p-5 relative overflow-hidden">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-neonPurple" /> Weekly Cardio minutes
            </h2>
            <p className="text-[11px] text-white/40 mb-4">
              LISS and cardio logs completed over the last 7 days.
            </p>

            <div className="w-full h-36">
              {loadingLogs ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-neonPurple border-t-transparent animate-spin" />
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -32, right: 0, top: 10, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      stroke="rgba(255,255,255,0.15)"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 8 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.15)"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 8 }}
                      domain={[0, "auto"]}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      contentStyle={{
                        background: "rgba(18, 18, 26, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ fontSize: "10px", fontWeight: "bold" }}
                      labelStyle={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}
                    />
                    <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.minutes >= 30 ? "#00D4FF" : "#6C63FF"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Weekly Status Summary Details */}
            <div className="flex justify-between items-center text-[10px] font-bold text-white/40 pt-4 mt-1 border-t border-white/5 font-mono">
              <span>Cardio goal: 150 min</span>
              <span className={totalWeeklyMinutes >= 150 ? "text-emerald-400" : "text-white/60"}>
                {Math.round((totalWeeklyMinutes / 150) * 100)}% Met
              </span>
            </div>
          </GlassCard>

          {/* TODAY'S CARDIOLOG FEED */}
          {loadingLogs ? (
            <GlassCard className="border-white/5 p-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-3">
                <Calendar className="w-4 h-4 text-rose-400" /> Today&apos;s Logged Sessions
              </h2>
              <div className="flex flex-col gap-2.5">
                <SkeletonCard className="h-16 w-full" />
                <SkeletonCard className="h-16 w-full" />
                <SkeletonCard className="h-16 w-full" />
              </div>
            </GlassCard>
          ) : todayLogs.length > 0 ? (
            <GlassCard className="border-white/5 p-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5 mb-3">
                <Calendar className="w-4 h-4 text-rose-400" /> Today&apos;s Logged Sessions
              </h2>
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                {todayLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-2.5 rounded-lg bg-white/[0.01] border border-white/5 text-xs">
                    <div>
                      <span className="text-white/80 font-bold block">{cardioTypeLabels[log.type] ?? log.type}</span>
                      <span className="text-[10px] text-white/40 font-mono mt-0.5 block">
                        {log.duration_mins} min {log.distance_km > 0 ? `| ${log.distance_km} km` : ""} {log.incline_pct > 0 ? `| Incline ${log.incline_pct}%` : ""}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black text-rose-400">
                      -{log.calories_burned} kcal
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : null}

        </div>

      </div>
    </div>
    </div>
  );
}
