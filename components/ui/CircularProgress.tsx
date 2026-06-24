"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  max: number;
  color?: string; // Hex color or SVG stroke color (e.g. '#6C63FF')
  size?: number;   // size in px
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
  unit?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  color = "#6C63FF", // default to neonPurple
  size = 120,
  strokeWidth = 10,
  className,
  showText = true,
  unit = "",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  
  // Custom glow shadow id for the circle
  const glowId = `glow-${color.replace("#", "")}`;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />
        
        {/* Animated Active Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - percentage * circumference }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />
      </svg>

      {showText && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl font-bold tracking-tight text-white font-mono"
          >
            {value.toLocaleString()}
            {unit && <span className="text-xs text-white/50 ml-0.5">{unit}</span>}
          </motion.span>
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider mt-0.5">
            of {max.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default CircularProgress;
