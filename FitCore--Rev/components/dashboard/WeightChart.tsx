"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";

export const WeightChart: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { metrics, loading } = useBodyMetrics();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="w-full h-[220px] bg-white/[0.01] animate-pulse rounded-xl flex items-center justify-center">
        <span className="text-xs text-white/20">Loading weight progression...</span>
      </div>
    );
  }

  const data = metrics.slice(-7).map((metric) => ({
    day: new Date(metric.date).toLocaleDateString("en-US", { weekday: "short" }),
    weight: metric.weight_kg ?? 0,
  }));

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="rgba(255, 255, 255, 0.3)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[(data[0]?.weight ?? 0) - 2, (data[data.length - 1]?.weight ?? 0) + 2]}
            stroke="rgba(255, 255, 255, 0.3)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickCount={4}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(18, 18, 26, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}
            itemStyle={{ color: "#00D4FF", fontSize: "12px", fontWeight: "bold" }}
            formatter={(value) => [`${value} kg`, "Weight"]}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#00D4FF"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#weightGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;
