"use client";

import React, { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useWeeklyAnalytics } from "@/hooks/useWeeklyAnalytics";
import { useProfile } from "@/hooks/useProfile";

export const WeeklyProgressChart: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { weeklyData, weeklyConsistencyScore, loading } = useWeeklyAnalytics();
  const { profile } = useProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return <SkeletonCard className="w-full h-[380px]" />;
  }

  const leftDomainMax = Math.max(2200, ...weeklyData.map((point) => point.calories || 0));
  const rightDomainMax = Math.max(140, ...weeklyData.flatMap((point) => [point.protein || 0, point.weight || 0]));

  return (
    <GlassCard className="w-full h-full min-h-[380px]" hoverable>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-neonCyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Progress Analytics</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-white/40">Deficit: <strong className="text-neonCyan font-mono">{profile?.target_kcal ?? 1800} kcal</strong></span>
          <span className="text-white/40">Protein: <strong className="text-neonPurple font-mono">{profile?.protein_goal_g ?? 120}g</strong></span>
          <span className="text-white/40">Consistency: <strong className="text-emerald-400 font-mono">{weeklyConsistencyScore}%</strong></span>
        </div>
      </div>

      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={weeklyData} margin={{ top: 10, right: -5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />

            <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.3)" fontSize={11} tickLine={false} axisLine={false} />

            <YAxis
              yAxisId="left"
              domain={[0, leftDomainMax]}
              stroke="rgba(255, 255, 255, 0.3)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickCount={5}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[50, rightDomainMax]}
              stroke="rgba(255, 255, 255, 0.3)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickCount={5}
            />

            <Tooltip
              contentStyle={{
                background: "rgba(18, 18, 26, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "bold" }}
              itemStyle={{ fontSize: "12px", padding: "2px 0" }}
            />

            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}
            />

            <Bar
              yAxisId="left"
              name="Calories Consumed (kcal)"
              dataKey="calories"
              fill="url(#calGrad)"
              stroke="#00D4FF"
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
              barSize={32}
            />

            <Line
              yAxisId="right"
              type="monotone"
              name="Protein Intake (g)"
              dataKey="protein"
              stroke="#6C63FF"
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />

            <Line
              yAxisId="right"
              type="monotone"
              name="Bodyweight (kg)"
              dataKey="weight"
              stroke="#FF4B91"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 2, strokeWidth: 1 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export default WeeklyProgressChart;
