"use client";

import React, { useState, useEffect, useCallback } from "react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HistoricalSet {
  id: string;
  session_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number;
  is_pr: boolean;
  date: string;
}

interface SetLog {
  setNumber: number;
  weight: number;      // raw number, 0 for BW or N/A
  reps: number;        // reps or duration in seconds
  completed: boolean;
  isPr: boolean;
}

interface ExerciseCardProps {
  exerciseName: string;
  muscleGroup: string;
  isActive: boolean;
  onSetChecked: (setIndex: number, reps: number, weight: number, checked: boolean, isPr: boolean) => void;
  onUpdateNotes: (notes: string) => void;
  aiSuggestion?: {
    direction: "up" | "down" | "maintain";
    amount: number;
    weight_kg: number;
    reps: number;
    reason: string;
  } | null;
  isCustom?: boolean;
  initialSets?: { setNumber: number; weight: number; reps: number; completed: boolean; isPr: boolean }[];
}

export default function ExerciseCard({
  exerciseName,
  muscleGroup,
  isActive,
  onSetChecked,
  onUpdateNotes,
  aiSuggestion = null,
  isCustom = false,
  initialSets,
}: ExerciseCardProps) {
  const [history, setHistory] = useState<HistoricalSet[]>([]);
  const [prSet, setPrSet] = useState<HistoricalSet | null>(null);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [notes, setNotes] = useState("");

  const isPlank = exerciseName.toLowerCase().includes("plank");
  const isPullUp = exerciseName.toLowerCase().includes("pull-up");

  // Local state for current workout sets
  const [sets, setSets] = useState<SetLog[]>(() => {
    if (initialSets && initialSets.length > 0) {
      return initialSets;
    }
    return [
      { setNumber: 1, weight: 0, reps: 0, completed: false, isPr: false },
      { setNumber: 2, weight: 0, reps: 0, completed: false, isPr: false },
      { setNumber: 3, weight: 0, reps: 0, completed: false, isPr: false },
    ];
  });

  // Fetch exercise history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/workout/history?exercise=${encodeURIComponent(exerciseName)}`);
      const result = await res.json();
      if (result.success && result.data) {
        const histData: HistoricalSet[] = result.data.history || [];
        setHistory(histData);
        setPrSet(result.data.pr || null);

        // Pre-fill default sets based on the last session's sets
        if (histData.length > 0) {
          const lastSessionId = histData[0].session_id;
          const lastSessionSets = histData
            .filter((s) => s.session_id === lastSessionId)
            .sort((a, b) => a.set_number - b.set_number);

          if (lastSessionSets.length > 0) {
            const mapped = lastSessionSets.map((s, idx) => ({
              setNumber: idx + 1,
              weight: s.weight_kg,
              reps: s.reps,
              completed: false,
              isPr: false,
            }));
            setSets(mapped);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching exercise history:", e);
    }
  }, [exerciseName]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Get previous set values text
  const getPrevSetText = (setIndex: number) => {
    if (history.length === 0) return "-";
    const lastSessionId = history[0].session_id;
    const lastSessionSets = history
      .filter((s) => s.session_id === lastSessionId)
      .sort((a, b) => a.set_number - b.set_number);

    const prevSet = lastSessionSets[setIndex];
    if (!prevSet) return "-";

    if (isPlank) {
      return `${prevSet.reps}s`;
    }
    if (isPullUp) {
      return `${prevSet.reps} reps`;
    }
    return `${prevSet.weight_kg}kg × ${prevSet.reps}`;
  };

  // Add a new set row
  const addSet = () => {
    setSets((prev) => {
      const nextNum = prev.length + 1;
      const lastSet = prev[prev.length - 1];
      return [
        ...prev,
        {
          setNumber: nextNum,
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : 0,
          completed: false,
          isPr: false,
        },
      ];
    });
  };

  // Update input fields
  const handleUpdateField = (index: number, field: "weight" | "reps", val: number) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  // Check if current set is a PR
  const checkIsPr = (weight: number, reps: number): boolean => {
    // Plank: PR is duration (reps)
    if (isPlank) {
      const maxPastSecs = prSet ? prSet.reps : 0;
      return reps > maxPastSecs;
    }
    // Pull-ups: PR is reps (reps)
    if (isPullUp) {
      const maxPastReps = prSet ? prSet.reps : 0;
      return reps > maxPastReps;
    }
    // Other: standard weight + reps PR logic
    if (!prSet) return weight > 0 && reps > 0;
    
    if (weight > prSet.weight_kg) return true;
    if (weight === prSet.weight_kg) {
      return reps > prSet.reps;
    }
    return false;
  };

  // Handle set completion check
  const handleToggleComplete = (index: number) => {
    if (!isActive) return;

    setSets((prev) => {
      const updated = prev.map((s, i) => {
        if (i !== index) return s;
        const newCompleted = !s.completed;
        const isPr = newCompleted ? checkIsPr(s.weight, s.reps) : false;

        // Callback to parent with details
        onSetChecked(index, s.reps, s.weight, newCompleted, isPr);

        return { ...s, completed: newCompleted, isPr };
      });
      return updated;
    });
  };

  // Format history chart data: group by session date and find max 1RM or value
  const getChartData = () => {
    if (history.length === 0) return [];

    // Group sets by date
    const sessionGroups: { [date: string]: HistoricalSet[] } = {};
    history.forEach((set) => {
      if (!sessionGroups[set.date]) {
        sessionGroups[set.date] = [];
      }
      sessionGroups[set.date].push(set);
    });

    // Map each date to its maximum metric
    const chartPoints = Object.keys(sessionGroups).map((date) => {
      const setsForDate = sessionGroups[date];
      let maxVal = 0;

      setsForDate.forEach((s) => {
        let val = 0;
        if (isPlank) {
          val = s.reps; // seconds
        } else if (isPullUp) {
          val = s.reps; // reps
        } else {
          // Epley Formula for 1RM: 1RM = w * (1 + r / 30)
          val = Math.round(s.weight_kg * (1 + s.reps / 30) * 10) / 10;
        }
        if (val > maxVal) maxVal = val;
      });

      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rawDate: date,
        value: maxVal,
      };
    });

    // Sort chronologically and take last 8 sessions
    return chartPoints
      .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
      .slice(-8);
  };

  const chartData = getChartData();
  const chartYAxisLabel = isPlank ? "Seconds" : isPullUp ? "Reps" : "1RM (kg)";

  return (
    <GlassCard className="p-5 border-white/5 flex flex-col gap-4" hoverable>
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">{exerciseName}</h3>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="inline-block text-[9px] font-bold text-neonCyan bg-neonCyan/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {muscleGroup}
            </span>
            {isCustom && (
              <span className="inline-block text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Custom
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsChartExpanded(!isChartExpanded)}
          disabled={history.length === 0}
          className="flex items-center gap-1 text-[10px] font-bold text-white/40 hover:text-white/80 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {isChartExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          History
        </button>
      </div>

      {/* AI RECOMMENDATION BOX */}
      {aiSuggestion && (
        <div className={cn(
          "p-2.5 rounded-xl border text-[11px] leading-normal font-medium flex flex-col gap-1.5",
          aiSuggestion.direction === "up" 
            ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400/90" 
            : aiSuggestion.direction === "down" 
            ? "bg-rose-500/5 border-rose-500/10 text-rose-400/90" 
            : "bg-white/5 border-white/5 text-white/60"
        )}>
          <div className="flex justify-between items-center">
            <span className="font-extrabold uppercase text-[9px] tracking-wider flex items-center gap-1">
              <span>💡 AI Suggestion Target:</span>
              <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded font-mono">
                {isPlank ? `${aiSuggestion.reps}s` : isPullUp ? `${aiSuggestion.reps} reps` : `${aiSuggestion.weight_kg}kg × ${aiSuggestion.reps} reps`}
              </strong>
            </span>
            <button
              onClick={() => {
                setSets(prev => prev.map(s => ({
                  ...s,
                  weight: isPlank || isPullUp ? 0 : aiSuggestion.weight_kg,
                  reps: aiSuggestion.reps
                })));
              }}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-extrabold text-white transition-colors cursor-pointer"
            >
              Apply Targets
            </button>
          </div>
          <p className="text-[10px] text-white/50">{aiSuggestion.reason}</p>
        </div>
      )}

      {/* COLLAPSIBLE CHART */}
      <AnimatePresence initial={false}>
        {isChartExpanded && history.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 160, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/15 border border-white/5 rounded-xl p-3"
          >
            <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold block mb-1">
              {isPlank ? "Plank Duration History" : isPullUp ? "Pull-up Reps History" : "Estimated 1-Rep Max History (Last 8 Sessions)"}
            </span>
            <div className="w-full h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -25, right: 5, top: 10, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.2)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 8 }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.2)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 8 }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(18, 18, 26, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ fontSize: "10px", fontWeight: "bold" }}
                    labelStyle={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}
                    formatter={(value) => [`${value} ${isPlank ? "s" : isPullUp ? "reps" : "kg"}`, chartYAxisLabel]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6C63FF"
                    strokeWidth={2.5}
                    dot={{ fill: "#00D4FF", r: 3 }}
                    activeDot={{ fill: "#00D4FF", r: 5, stroke: "white", strokeWidth: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABLE BODY */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[9px] font-bold text-white/30 uppercase tracking-wider pb-2">
              <th className="py-1.5 w-[10%] text-center">Set</th>
              <th className="py-1.5 w-[25%]">Prev</th>
              {!isPlank && !isPullUp && <th className="py-1.5 w-[25%]">kg</th>}
              <th className="py-1.5 w-[25%]">{isPlank ? "Secs" : "Reps"}</th>
              <th className="py-1.5 w-[15%] text-center">✓</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, idx) => (
              <tr key={idx} className="border-b border-white/5 last:border-0 align-middle">
                <td className="py-2.5 text-xs text-white/60 font-semibold font-mono text-center">
                  {set.setNumber}
                </td>
                <td className="py-2.5 text-xs text-white/40 font-mono font-medium">
                  {getPrevSetText(idx)}
                </td>
                {!isPlank && !isPullUp && (
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="0"
                        disabled={set.completed}
                        value={set.weight || ""}
                        onChange={(e) =>
                          handleUpdateField(idx, "weight", parseFloat(e.target.value) || 0)
                        }
                        className="w-16 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-neonPurple/50 text-center font-bold disabled:opacity-50"
                      />
                      {aiSuggestion && idx === 0 && (
                        <div 
                          className={cn(
                            "cursor-help text-[10px] font-black flex items-center justify-center w-5 h-5 rounded-md shrink-0",
                            aiSuggestion.direction === "up" 
                              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                              : aiSuggestion.direction === "down" 
                              ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                              : "text-white/40 bg-white/5 border border-white/10"
                          )}
                          title={`${aiSuggestion.reason} (Target: ${aiSuggestion.weight_kg}kg)`}
                        >
                          {aiSuggestion.direction === "up" ? "↑" : aiSuggestion.direction === "down" ? "↓" : "→"}
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="0"
                      disabled={set.completed}
                      value={set.reps || ""}
                      onChange={(e) =>
                        handleUpdateField(idx, "reps", parseInt(e.target.value) || 0)
                      }
                      className="w-16 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-neonPurple/50 text-center font-bold disabled:opacity-50"
                    />
                    {aiSuggestion && idx === 0 && (isPlank || isPullUp) && (
                      <div 
                        className={cn(
                          "cursor-help text-[10px] font-black flex items-center justify-center w-5 h-5 rounded-md shrink-0",
                          aiSuggestion.direction === "up" 
                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                            : aiSuggestion.direction === "down" 
                            ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                            : "text-white/40 bg-white/5 border border-white/10"
                        )}
                        title={`${aiSuggestion.reason} (Target: ${aiSuggestion.reps} reps)`}
                      >
                        {aiSuggestion.direction === "up" ? "↑" : aiSuggestion.direction === "down" ? "↓" : "→"}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleToggleComplete(idx)}
                      disabled={!isActive}
                      className={cn(
                        "w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-300",
                        set.completed
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold"
                          : "bg-white/[0.02] border-white/10 text-white/20 hover:border-white/20 hover:text-white/60 disabled:cursor-not-allowed disabled:opacity-30"
                      )}
                    >
                      {set.completed ? "✓" : ""}
                    </button>
                    {set.isPr && (
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[9px] font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 flex items-center gap-0.5 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.2)] animate-pulse"
                      >
                        <Trophy className="w-2.5 h-2.5 fill-amber-400" /> PR!
                      </motion.span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex gap-4 items-center justify-between mt-1">
        <input
          type="text"
          placeholder="Exercise notes..."
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            onUpdateNotes(e.target.value);
          }}
          className="flex-1 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/70 placeholder-white/20 focus:outline-none focus:border-white/10"
        />

        <NeonButton
          variant="purple-outline"
          className="py-1 px-3.5 text-[10px] h-7 shrink-0"
          onClick={addSet}
        >
          Add Set
        </NeonButton>
      </div>
    </GlassCard>
  );
}
