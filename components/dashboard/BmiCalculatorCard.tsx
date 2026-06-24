"use client";

import React from "react";
import GlassCard from "@/components/ui/GlassCard";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import SkeletonCard from "@/components/ui/SkeletonCard";

export const BmiCalculatorCard: React.FC = () => {
  const { profile, loading } = useProfile();

  if (loading || !profile) {
    return <SkeletonCard className="flex flex-col justify-between h-full min-h-[220px]" />;
  }

  const height = profile.height_cm ?? 162.5;
  const weight = profile.weight_kg ?? 63;
  const bmi = Math.round((weight / ((height / 100) ** 2)) * 10) / 10;
  const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const catColor = bmi < 18.5 ? "text-blue-400" : bmi < 25 ? "text-emerald-400" : bmi < 30 ? "text-orange-400" : "text-red-400";
  const markerPercent = Math.min(Math.max(((bmi - 15) / 20) * 100, 0), 100);

  return (
    <GlassCard className="flex flex-col justify-between h-full min-h-[220px]" hoverable>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-neonPurple" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">BMI Calculator</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] text-white/40 block mb-1 uppercase tracking-wider">Height (cm)</span>
            <span className="text-sm font-semibold text-white">{height}</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] text-white/40 block mb-1 uppercase tracking-wider">Weight (kg)</span>
            <span className="text-sm font-semibold text-white">{weight}</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-4 border-t border-white/5 pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Current BMI</span>
            <motion.span
              key={bmi}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-extrabold text-white font-mono tracking-tight"
            >
              {bmi}
            </motion.span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block">Zone</span>
            <span className={`text-sm font-bold ${catColor}`}>{category}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-2">
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
          <div className="h-full bg-blue-500/60" style={{ width: "17.5%" }} />
          <div className="h-full bg-emerald-500/60" style={{ width: "32.5%" }} />
          <div className="h-full bg-orange-500/60" style={{ width: "25%" }} />
          <div className="h-full bg-red-500/60" style={{ width: "25%" }} />
        </div>

        <motion.div
          animate={{ left: `${markerPercent}%` }}
          transition={{ type: "spring", stiffness: 100 }}
          className="absolute -top-1.5 w-3 h-5 -ml-1.5 flex flex-col items-center pointer-events-none"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-lg border border-[#0A0A0F]" />
          <div className="w-[1.5px] h-3 bg-white/70" />
        </motion.div>

        <div className="flex justify-between text-[9px] text-white/30 font-mono mt-1 px-1">
          <span>15.0</span>
          <span>18.5</span>
          <span>25.0</span>
          <span>30.0</span>
          <span>35.0</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default BmiCalculatorCard;
