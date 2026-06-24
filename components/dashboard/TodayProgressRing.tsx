"use client";

import React from "react";
import { Flame, Droplets, Wheat } from "lucide-react";

interface TodayProgressRingProps {
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  waterConsumed: number;
  waterTarget: number;
}

export default function TodayProgressRing({
  caloriesConsumed,
  caloriesTarget,
  proteinConsumed,
  proteinTarget,
  waterConsumed,
  waterTarget,
}: TodayProgressRingProps) {
  const calculatePercentage = (consumed: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((consumed / target) * 100, 100);
  };

  const caloriesPercent = calculatePercentage(caloriesConsumed, caloriesTarget);
  const proteinPercent = calculatePercentage(proteinConsumed, proteinTarget);
  const waterPercent = calculatePercentage(waterConsumed, waterTarget);

  const overallPercent = (caloriesPercent + proteinPercent + waterPercent) / 3;

  const getMotivationalLabel = () => {
    if (overallPercent >= 100) return "Crushed It! 🎉";
    if (overallPercent >= 80) return "On Track! 💪";
    if (overallPercent >= 50) return "Keep Going! 🔥";
    return "Behind! ⚡";
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const circumference2 = 2 * Math.PI * 35; // radius = 35
  const circumference3 = 2 * Math.PI * 25; // radius = 25

  const strokeDasharray = circumference;
  const strokeDasharray2 = circumference2;
  const strokeDasharray3 = circumference3;

  const caloriesOffset = circumference - (caloriesPercent / 100) * circumference;
  const proteinOffset = circumference2 - (proteinPercent / 100) * circumference2;
  const waterOffset = circumference3 - (waterPercent / 100) * circumference3;

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative">
        {/* Outer ring - Calories */}
        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(0, 212, 255, 0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#00D4FF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={caloriesOffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: "drop-shadow(0 0 8px rgba(0, 212, 255, 0.5))" }}
          />
        </svg>

        {/* Middle ring - Protein */}
        <svg className="absolute top-0 left-0 w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="rgba(108, 99, 255, 0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#6C63FF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray2}
            strokeDashoffset={proteinOffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: "drop-shadow(0 0 8px rgba(108, 99, 255, 0.5))" }}
          />
        </svg>

        {/* Inner ring - Water */}
        <svg className="absolute top-0 left-0 w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="25"
            fill="none"
            stroke="rgba(59, 130, 246, 0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="25"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray3}
            strokeDashoffset={waterOffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))" }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-black text-white">{Math.round(overallPercent)}%</div>
          <div className="text-xs font-bold text-white/70 mt-1">{getMotivationalLabel()}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-6">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#00D4FF]" />
          <div className="text-xs text-white/60">
            <span className="text-white font-semibold">{caloriesConsumed}</span>/{caloriesTarget} kcal
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wheat className="w-4 h-4 text-[#6C63FF]" />
          <div className="text-xs text-white/60">
            <span className="text-white font-semibold">{proteinConsumed}</span>/{proteinTarget}g protein
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-[#3b82f6]" />
          <div className="text-xs text-white/60">
            <span className="text-white font-semibold">{waterConsumed}</span>/{waterTarget}ml
          </div>
        </div>
      </div>
    </div>
  );
}
