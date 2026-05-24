"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={hoverable ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "glass-panel rounded-2xl p-6 shadow-glass backdrop-blur-xl relative overflow-hidden",
        hoverable && "hover:shadow-neon-purple/20 transition-shadow duration-300",
        className
      )}
      {...props}
    >
      {/* Subtle radial glare overlay for premium depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/[0.05] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default GlassCard;
