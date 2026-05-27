"use client";

import React, { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Scale, Plus } from "lucide-react";
import { motion } from "framer-motion";
import SkeletonCard from "@/components/ui/SkeletonCard";

export const WeightSparklineCard: React.FC = () => {
  const { currentWeight, metrics, logMetrics, loading } = useBodyMetrics();
  const [logWeightVal, setLogWeightVal] = useState("");

  const chartData = metrics.slice(-7).map((metric) => ({
    day: new Date(metric.date).toLocaleDateString("en-US", { weekday: "short" }),
    weight: metric.weight_kg ?? currentWeight,
  }));

  const handleLogWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(logWeightVal);
    if (!isNaN(w) && w > 0) {
      logMetrics({ weight_kg: w });
      setLogWeightVal("");
    }
  };

  if (loading) {
    return <SkeletonCard className="flex flex-col justify-between h-full min-h-[220px]" />;
  }

  return (
    <GlassCard className="flex flex-col justify-between h-full min-h-[220px]" hoverable>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-neonCyan" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Today&apos;s Weight</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Active
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-2">
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold text-white font-mono tracking-tight"
          >
            {currentWeight}
          </motion.span>
          <span className="text-sm font-semibold text-white/50">kg</span>
        </div>
      </div>

      <div className="w-full h-14 my-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Tooltip
              contentStyle={{
                background: "rgba(18, 18, 26, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "4px 8px",
              }}
              itemStyle={{ color: "#00D4FF", fontSize: "11px", fontWeight: "bold" }}
              labelStyle={{ display: "none" }}
              formatter={(value) => [`${value} kg`]}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#00D4FF"
              strokeWidth={2.5}
              dot={{ r: 2, strokeWidth: 1, fill: "#0A0A0F" }}
              activeDot={{ r: 4, stroke: "#6C63FF", strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <form onSubmit={handleLogWeight} className="flex gap-2 items-center mt-2 border-t border-white/5 pt-3">
        <input
          type="number"
          step="0.1"
          placeholder="New wt..."
          value={logWeightVal}
          onChange={(e) => setLogWeightVal(e.target.value)}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-neonCyan/50 font-mono transition-colors"
        />
        <NeonButton type="submit" variant="cyan-outline" className="px-2 py-1 text-xs h-7 min-w-[50px] flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 mr-0.5" /> Log
        </NeonButton>
      </form>
    </GlassCard>
  );
};

export default WeightSparklineCard;
