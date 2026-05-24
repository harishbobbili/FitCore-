"use client";
import React, { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import CircularProgress from "./CircularProgress";

interface StatChipProps {
  icon?: React.ReactNode;
  label: string;
  value: number;
  unit?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "purple" | "cyan" | "rose" | "blue" | "orange" | "red";
  className?: string;
  progress?: {
    value: number;
    max: number;
    color: string;
  };
}

export const StatChip: React.FC<StatChipProps> = ({
  icon,
  label,
  value,
  unit = "",
  trend,
  color = "purple",
  className,
  progress,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(Math.floor(latest));
      },
    });

    return () => controls.stop();
  }, [value]);

  const getColorStyles = () => {
    switch (color) {
      case "cyan":
        return {
          iconBg: "bg-neonCyan/10 text-neonCyan",
          border: "border-neonCyan/20",
          glow: "group-hover:shadow-neon-cyan/10",
        };
      case "rose":
        return {
          iconBg: "bg-rose-500/10 text-rose-400",
          border: "border-rose-500/20",
          glow: "group-hover:shadow-rose-500/10",
        };
      case "blue":
        return {
          iconBg: "bg-blue-500/10 text-blue-400",
          border: "border-blue-500/20",
          glow: "group-hover:shadow-blue-500/10",
        };
      case "orange":
        return {
          iconBg: "bg-orange-500/10 text-orange-400",
          border: "border-orange-500/20",
          glow: "group-hover:shadow-orange-500/10",
        };
      case "red":
        return {
          iconBg: "bg-red-500/10 text-red-400",
          border: "border-red-500/20",
          glow: "group-hover:shadow-red-500/10",
        };
      default: // purple
        return {
          iconBg: "bg-neonPurple/10 text-neonPurple",
          border: "border-neonPurple/20",
          glow: "group-hover:shadow-neon-purple/10",
        };
    }
  };

  const styles = getColorStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-300",
        styles.border,
        className
      )}
    >
      <div className="flex items-center gap-3">
        {progress ? (
          <div className="flex items-center justify-center p-0.5">
            <CircularProgress
              value={progress.value}
              max={progress.max}
              color={progress.color}
              size={42}
              strokeWidth={4.5}
              showText={false}
            />
          </div>
        ) : (
          <div className={cn("p-2.5 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-300", styles.iconBg)}>
            {icon}
          </div>
        )}
        
        <div>
          <p className="text-xs text-white/50 font-medium uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              {displayValue.toLocaleString()}
            </span>
            {unit && <span className="text-sm font-medium text-white/60">{unit}</span>}
          </div>
        </div>
      </div>

      {trend && (
        <div
          className={cn(
            "flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold font-mono",
            trend.isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-rose-500/10 text-rose-400"
          )}
        >
          {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          <span>{trend.value}%</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatChip;
