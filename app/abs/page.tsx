"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import {
  CheckCircle2,
  Lock,
  Calendar,
  Zap,
  Activity,
  Trophy,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";

// Types
interface ExerciseProgress {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  currentProgress: number; // e.g. reps or seconds
  history: number[];
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  color: string;
}

export default function AbsPage() {
  const breadcrumbs = [{ label: "Abs Goal" }];
  const { profile } = useProfile();

  // 1. Calculator States
  const [currentBF, setCurrentBF] = useState<number>(12.5);
  const [targetBF, setTargetBF] = useState<number>(10.0);
  const [lossRate, setLossRate] = useState<number>(0.4); // kg per week

  // 2. Schedule Checklist States (Mon, Wed, Fri checklist items)
  const [scheduleCompleted, setScheduleCompleted] = useState<Record<string, boolean>>({
    "mon-crunches": false,
    "mon-raises": false,
    "wed-plank": false,
    "wed-twists": false,
    "fri-hanging": false,
    "fri-bicycle": false,
    "fri-plank": false,
  });

  // 3. Exercise Progression States
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, ExerciseProgress>>({
    crunches: { name: "Crunches", level: "Beginner", currentProgress: 12, history: [10, 12] },
    plank: { name: "Plank", level: "Beginner", currentProgress: 20, history: [15, 20] },
    raises: { name: "Leg Raises", level: "Beginner", currentProgress: 6, history: [5, 6] },
  });

  // Particle animation state
  const [particles, setParticles] = useState<Record<string, Particle[]>>({});
  const [levelUpEffect, setLevelUpEffect] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const savedChecklist = localStorage.getItem("fitcore_abs_checklist");
    const savedProgression = localStorage.getItem("fitcore_abs_progression");
    if (savedChecklist) {
      try {
        setScheduleCompleted(JSON.parse(savedChecklist));
      } catch (e) {
        console.error(e);
      }
    }
    if (savedProgression) {
      try {
        setExerciseProgress(JSON.parse(savedProgression));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync checklist changes
  const toggleScheduleItem = (key: string) => {
    setScheduleCompleted((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("fitcore_abs_checklist", JSON.stringify(updated));
      return updated;
    });
  };

  // Log Reps / Time progress
  const logProgress = (exerciseKey: string, amount: number) => {
    setExerciseProgress((prev) => {
      const ex = prev[exerciseKey];
      const newProgress = Math.max(0, ex.currentProgress + amount);
      const updated = {
        ...prev,
        [exerciseKey]: {
          ...ex,
          currentProgress: newProgress,
          history: [...ex.history, newProgress].slice(-10), // keep last 10 logs
        },
      };
      localStorage.setItem("fitcore_abs_progression", JSON.stringify(updated));
      return updated;
    });
  };

  // Level thresholds
  const levelThresholds: Record<string, Record<string, number>> = {
    crunches: { Beginner: 20, Intermediate: 30, Advanced: 50 },
    plank: { Beginner: 30, Intermediate: 60, Advanced: 90 },
    raises: { Beginner: 10, Intermediate: 20, Advanced: 30 },
  };

  // Trigger Level Up Animation
  const triggerParticles = (key: string) => {
    const colors = ["#00D4FF", "#6C63FF", "#A855F7", "#F43F5E", "#EAB308"];
    const newParticles: Particle[] = Array.from({ length: 24 }).map((_, i) => ({
      id: Date.now() + i,
      angle: Math.random() * 360,
      distance: 30 + Math.random() * 60,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setParticles((prev) => ({ ...prev, [key]: newParticles }));
    setTimeout(() => {
      setParticles((prev) => ({ ...prev, [key]: [] }));
    }, 1000);
  };

  // Perform Level Up
  const handleLevelUp = (exerciseKey: string) => {
    const ex = exerciseProgress[exerciseKey];
    let nextLevel: "Beginner" | "Intermediate" | "Advanced" = "Beginner";

    if (ex.level === "Beginner") nextLevel = "Intermediate";
    else if (ex.level === "Intermediate") nextLevel = "Advanced";
    else return; // already advanced

    // Reset progress to 0 for the next level tier
    setExerciseProgress((prev) => {
      const updated = {
        ...prev,
        [exerciseKey]: {
          ...ex,
          level: nextLevel,
          currentProgress: 0,
        },
      };
      localStorage.setItem("fitcore_abs_progression", JSON.stringify(updated));
      return updated;
    });

    setLevelUpEffect(exerciseKey);
    triggerParticles(exerciseKey);
    setTimeout(() => setLevelUpEffect(null), 1500);
  };

  // Core Strength Score Math
  const getCoreScore = () => {
    // Levels weight
    const levelScoreMap = { Beginner: 10, Intermediate: 25, Advanced: 45 };
    const crunchVal = levelScoreMap[exerciseProgress.crunches.level] + Math.min(10, exerciseProgress.crunches.currentProgress * 0.5);
    const plankVal = levelScoreMap[exerciseProgress.plank.level] + Math.min(10, exerciseProgress.plank.currentProgress * 0.2);
    const raisesVal = levelScoreMap[exerciseProgress.raises.level] + Math.min(10, exerciseProgress.raises.currentProgress * 0.5);

    // Checklist completions
    const checkCount = Object.values(scheduleCompleted).filter(Boolean).length;
    const checklistScore = checkCount * 5; // max 35

    return Math.min(100, Math.round(crunchVal + plankVal + raisesVal + checklistScore));
  };

  const coreScore = getCoreScore();

  // Score History (7-day trend mockup seeded with coreScore)
  const getScoreHistoryData = () => {
    const base = Math.max(20, coreScore - 10);
    return [
      { day: "Mon", score: base },
      { day: "Tue", score: base },
      { day: "Wed", score: base + (scheduleCompleted["wed-plank"] ? 3 : 0) },
      { day: "Thu", score: base + (scheduleCompleted["wed-plank"] ? 4 : 1) },
      { day: "Fri", score: Math.max(base, coreScore - 3) },
      { day: "Sat", score: Math.max(base, coreScore - 1) },
      { day: "Sun", score: coreScore },
    ];
  };

  const scoreHistoryData = getScoreHistoryData();

  const currentWeight = profile?.weight_kg ?? 63.0;
  const currentFatMass = currentWeight * (currentBF / 100);

  // Solve weeks: (currentFatMass - W * lossRate) / (currentWeight - W * lossRate) = targetBF / 100
  const solveWeeksForBF = (target: number) => {
    const tRatio = target / 100;
    const numerator = currentFatMass - tRatio * currentWeight;
    const denominator = lossRate * (1 - tRatio);
    if (denominator <= 0 || numerator <= 0) return 0;
    return Math.round((numerator / denominator) * 10) / 10;
  };

  const weeksToTargetBF = solveWeeksForBF(targetBF);

  const getDateWeeksAway = (weeks: number) => {
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const targetDateStr = getDateWeeksAway(weeksToTargetBF);

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        title="Visible Abs Tracker"
        subtitle="Track specific timelines, complete ab schedules, and advance core progressions."
        breadcrumbs={breadcrumbs}
      />

      {/* TOP ROW: DYNAMIC CALCULATOR & SCORE GAUGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visible Abs Timeline Calculator (2 cols) */}
        <GlassCard className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
            Visible Abs Calculator
          </h2>
          <p className="text-xs text-white/50 mb-6">
            Abs outlines reveal around 13-14% body fat for men. Shredded deep six-packs require reaching under 11%.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-5">
              {/* Sliders */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white/70">Current Est. Body Fat %</span>
                  <span className="text-neonCyan font-mono">{currentBF}%</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="25"
                  step="0.5"
                  value={currentBF}
                  onChange={(e) => setCurrentBF(Number(e.target.value))}
                  className="w-full accent-neonCyan h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white/70">Target Body Fat %</span>
                  <span className="text-neonPurple font-mono">{targetBF}%</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="15"
                  step="0.5"
                  value={targetBF}
                  onChange={(e) => setTargetBF(Number(e.target.value))}
                  className="w-full accent-neonPurple h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white/70">Weekly Fat Loss Velocity</span>
                  <span className="text-amber-400 font-mono">{lossRate} kg/wk</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.8"
                  step="0.1"
                  value={lossRate}
                  onChange={(e) => setLossRate(Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Calculations Output */}
            <div className="flex flex-col justify-between bg-white/[0.01] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neonPurple/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-xs text-white/40 block font-bold uppercase tracking-wider">Estimated Timeline</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black text-white font-mono">{weeksToTargetBF}</span>
                  <span className="text-sm text-white/50">weeks</span>
                </div>
                <div className="text-xs text-neonCyan font-bold mt-2">Target Date: {targetDateStr}</div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-4 flex flex-col gap-2">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Milestone Indicators:</span>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${currentBF <= 14 ? "text-emerald-400" : "text-white/20"}`} />
                  <span className={currentBF <= 14 ? "text-white/80" : "text-white/40"}>~14% Upper abs outlines visible</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${currentBF <= 12 ? "text-emerald-400" : "text-white/20"}`} />
                  <span className={currentBF <= 12 ? "text-white/80" : "text-white/40"}>~12% 4-Pack outlines defined</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${currentBF <= 10 ? "text-emerald-400" : "text-white/20"}`} />
                  <span className={currentBF <= 10 ? "text-white/80" : "text-white/40"}>~10% Full 6-Pack shredded depth</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Core Strength Composite Score */}
        <GlassCard className="flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neonCyan/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-neonCyan" />
                Core Strength Score
              </span>
              <span className="text-[10px] text-neonCyan font-mono bg-neonCyan/10 border border-neonCyan/20 px-2 py-0.5 rounded-full">
                Active Index
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black text-white font-mono">{coreScore}</span>
              <span className="text-xs text-white/50">/ 100</span>
            </div>

            {/* Recharts trend AreaChart */}
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1">Weekly Composite Trend</span>
            <div className="w-full h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreHistoryData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} />
                  <YAxis domain={[10, 100]} stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#00D4FF"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[9px] text-white/30 leading-relaxed border-t border-white/5 pt-2 mt-2">
            💡 Level up Crunches, Planks, and Leg Raises and complete your Mon/Wed/Fri routines to boost your strength index.
          </div>
        </GlassCard>
      </div>

      {/* SECOND ROW: WEEKLY ABS SCHEDULE (7-DAY GRID) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-neonPurple" />
          Weekly Abs Schedule
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Mon Routine */}
          <GlassCard className="flex flex-col justify-between border-t border-t-white/5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-white/50 uppercase">Monday split</span>
                <span className="text-[10px] text-neonCyan font-mono bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded">Hypertrophy</span>
              </div>
              <h4 className="text-base font-bold text-white mb-4">Core Flexion Split</h4>
              
              <div className="flex flex-col gap-3">
                <div
                  onClick={() => toggleScheduleItem("mon-crunches")}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    scheduleCompleted["mon-crunches"]
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">Weighted Crunches</span>
                    <span className="text-[10px] opacity-60">3 sets × 20 reps</span>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${scheduleCompleted["mon-crunches"] ? "text-emerald-400" : "text-white/10"}`} />
                </div>

                <div
                  onClick={() => toggleScheduleItem("mon-raises")}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    scheduleCompleted["mon-raises"]
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">Flat Leg Raises</span>
                    <span className="text-[10px] opacity-60">3 sets × 15 reps</span>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${scheduleCompleted["mon-raises"] ? "text-emerald-400" : "text-white/10"}`} />
                </div>
              </div>
            </div>
            
            <div className="text-[9px] text-white/30 mt-6 pt-2 border-t border-white/5">
              Focus on slow, controlled eccentric reps. Feel the burn.
            </div>
          </GlassCard>

          {/* Wed Routine */}
          <GlassCard className="flex flex-col justify-between border-t border-t-white/5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-white/50 uppercase">Wednesday split</span>
                <span className="text-[10px] text-neonPurple font-mono bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded">Isometrics</span>
              </div>
              <h4 className="text-base font-bold text-white mb-4">Stability & Rotational</h4>
              
              <div className="flex flex-col gap-3">
                <div
                  onClick={() => toggleScheduleItem("wed-plank")}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    scheduleCompleted["wed-plank"]
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">Weighted Plank Hold</span>
                    <span className="text-[10px] opacity-60">3 sets × 45 secs</span>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${scheduleCompleted["wed-plank"] ? "text-emerald-400" : "text-white/10"}`} />
                </div>

                <div
                  onClick={() => toggleScheduleItem("wed-twists")}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    scheduleCompleted["wed-twists"]
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">Russian Twists</span>
                    <span className="text-[10px] opacity-60">3 sets × 20 reps</span>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${scheduleCompleted["wed-twists"] ? "text-emerald-400" : "text-white/10"}`} />
                </div>
              </div>
            </div>
            
            <div className="text-[9px] text-white/30 mt-6 pt-2 border-t border-white/5">
              Squeeze the transverse abdominis. Draw the navel in.
            </div>
          </GlassCard>

          {/* Fri Routine */}
          <GlassCard className="flex flex-col justify-between border-t border-t-white/5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-white/50 uppercase">Friday split</span>
                <span className="text-[10px] text-amber-400 font-mono bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded">Compound</span>
              </div>
              <h4 className="text-base font-bold text-white mb-4">Complete Burnout</h4>
              
              <div className="flex flex-col gap-3">
                <div
                  onClick={() => toggleScheduleItem("fri-hanging")}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    scheduleCompleted["fri-hanging"]
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">Hanging Leg Raises</span>
                    <span className="text-[10px] opacity-60">3 sets × 12 reps</span>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${scheduleCompleted["fri-hanging"] ? "text-emerald-400" : "text-white/10"}`} />
                </div>

                <div
                  onClick={() => toggleScheduleItem("fri-bicycle")}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    scheduleCompleted["fri-bicycle"]
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">Bicycle Crunches</span>
                    <span className="text-[10px] opacity-60">3 sets × 20 reps</span>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${scheduleCompleted["fri-bicycle"] ? "text-emerald-400" : "text-white/10"}`} />
                </div>

                <div
                  onClick={() => toggleScheduleItem("fri-plank")}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    scheduleCompleted["fri-plank"]
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">Bodyweight Plank</span>
                    <span className="text-[10px] opacity-60">1 set × 60 secs</span>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${scheduleCompleted["fri-plank"] ? "text-emerald-400" : "text-white/10"}`} />
                </div>
              </div>
            </div>
            
            <div className="text-[9px] text-white/30 mt-6 pt-2 border-t border-white/5">
              Maximum contraction at the top of hanging leg raises.
            </div>
          </GlassCard>

        </div>
      </div>

      {/* THIRD ROW: AB EXERCISE PROGRESSION TRACKER */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Core Progression levels
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["crunches", "plank", "raises"] as const).map((key) => {
            const ex = exerciseProgress[key];
            const target = levelThresholds[key][ex.level];
            const isPlank = key === "plank";
            const percent = Math.min(100, Math.round((ex.currentProgress / target) * 100));
            const canLevelUp = ex.currentProgress >= target && ex.level !== "Advanced";

            return (
              <GlassCard key={key} className="relative flex flex-col justify-between overflow-hidden">
                {/* Level Up particle explosion */}
                <AnimatePresence>
                  {particles[key] && particles[key].map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                      animate={{
                        scale: Math.random() * 1.5 + 0.5,
                        x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                        y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                        opacity: 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute w-2 h-2 rounded-full z-30"
                      style={{
                        backgroundColor: p.color,
                        boxShadow: `0 0 8px ${p.color}`,
                        left: "50%",
                        top: "50%",
                      }}
                    />
                  ))}
                </AnimatePresence>

                {/* Level Up flash border overlay */}
                {levelUpEffect === key && (
                  <motion.div
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 bg-neonCyan/5 border-2 border-neonCyan rounded-2xl z-20 pointer-events-none"
                  />
                )}

                <div>
                  {/* Badge Row */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-white/40 uppercase">Progression card</span>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        ex.level === "Beginner"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : ex.level === "Intermediate"
                          ? "bg-neonPurple/10 border-neonPurple/20 text-neonPurple"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {ex.level}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                    {ex.name}
                  </h4>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    Target: {target} {isPlank ? "secs" : "reps"}
                  </p>

                  {/* Progress Ring / Bar */}
                  <div className="mt-5 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/60">Current: {ex.currentProgress} {isPlank ? "s" : "reps"}</span>
                      <span className="text-neonCyan">{percent}%</span>
                    </div>

                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-neonPurple to-neonCyan"
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Log Button Deck */}
                <div className="flex flex-col gap-2 mt-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => logProgress(key, isPlank ? 5 : 2)}
                      className="flex-1 bg-white/[0.03] hover:bg-white/[0.06] text-white py-1.5 rounded-lg text-xs font-bold border border-white/5 transition-colors active:scale-95"
                    >
                      +{isPlank ? "5s" : "2 reps"}
                    </button>
                    <button
                      onClick={() => logProgress(key, isPlank ? -5 : -2)}
                      disabled={ex.currentProgress <= 0}
                      className="flex-1 bg-white/[0.03] hover:bg-white/[0.06] text-white py-1.5 rounded-lg text-xs font-bold border border-white/5 transition-colors disabled:opacity-50 active:scale-95"
                    >
                      -{isPlank ? "5s" : "2 reps"}
                    </button>
                  </div>

                  {canLevelUp ? (
                    <motion.button
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLevelUp(key)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-[#0A0A0F] font-black text-xs py-2 rounded-lg flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition"
                    >
                      <Zap className="w-3.5 h-3.5 fill-[#0A0A0F]" /> Level Up!
                    </motion.button>
                  ) : ex.level === "Advanced" && ex.currentProgress >= target ? (
                    <div className="text-center text-[10px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 py-2 rounded-lg flex items-center justify-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> Max Level Mastered!
                    </div>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-white/5 text-white/30 font-bold text-xs py-2 rounded-lg cursor-not-allowed border border-white/5 flex items-center justify-center gap-1"
                    >
                      <Lock className="w-3 h-3" /> Log more to unlock Level Up
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

    </div>
  );
}
