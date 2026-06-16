"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeonButtonProps extends Omit<React.ComponentPropsWithoutRef<typeof motion.button>, "children"> {
  children: React.ReactNode;
  variant?: "gradient" | "purple-outline" | "cyan-outline" | "ghost";
  glow?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  className,
  variant = "gradient",
  glow = true,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "purple-outline":
        return cn(
          "border border-neonPurple/40 bg-[#0A0A0F]/60 text-white font-medium hover:border-neonPurple hover:bg-neonPurple/10",
          glow && "hover:shadow-neon-purple-hover"
        );
      case "cyan-outline":
        return cn(
          "border border-neonCyan/40 bg-[#0A0A0F]/60 text-white font-medium hover:border-neonCyan hover:bg-neonCyan/10",
          glow && "hover:shadow-neon-cyan-hover"
        );
      case "ghost":
        return "bg-transparent text-white/70 hover:text-white hover:bg-white/5";
      default: // gradient fill
        return cn(
          "bg-neon-grad text-white font-semibold hover:brightness-110",
          glow && "shadow-neon-purple hover:shadow-neon-purple-hover"
        );
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "px-6 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
        getVariantStyles(),
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};

export default NeonButton;
