"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";

const QUOTES = [
  "Your body is a reflection of your choices. Choose discipline over cravings today.",
  "Abs are built in the gym but revealed in the kitchen. Defend the deficit.",
  "The daily 400 kcal deficit is a small price to pay for visible, shredded abs.",
  "Consistency beats intensity. Trust the weekly progress, not the daily scale fluctuations.",
  "Hypertrophy requires mechanical tension. Focus on form, control, and progressive overload.",
  "A steady training split is a contract with yourself. Never miss a workout session.",
  "Visible abs are earned through invisible discipline when no one is watching.",
  "Hydration fuels muscle recovery and cell volume. Hit your water target today.",
  "Sleep is the ultimate performance enhancer. Aim for 7+ hours of quality rest tonight.",
  "Track your current weight, keep the trend moving, and let the data do the talking.",
  "NEAT is your secret weapon. Keep your daily steps high to support the deficit.",
  "A high-protein diet preserves muscle tissue in a deficit. Stay consistent with your target.",
  "The last rep of the set is where the hypertrophy magic happens. Lean into the burn.",
  "Progress is built daily. One meal, one workout, one night of sleep at a time.",
  "You are closer than you were yesterday. Let the next check-in show the trend.",
  "Hypertrophy isn't just about weight; it's about control, tension, and stimulus.",
  "The best workout is the one that actually gets done. Step up and execute.",
  "Don't wish it were easier; wish you were more disciplined. Maintain the deficit.",
  "Fat loss takes patience. Keep your eyes on the target and let the science work.",
  "You have a system now. Keep the inputs clean and let the results accumulate."
];

export const QuoteCard: React.FC = () => {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Generate date-seeded index
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = dateSeed % QUOTES.length;
    setQuote(QUOTES[index]);
  }, []);

  return (
    <div className="relative p-[1.5px] rounded-2xl overflow-hidden w-full group">
      {/* Shifting Gradient Glow Border */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-neonPurple via-neonCyan to-neonPurple"
        style={{ backgroundSize: "200% 200%" }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner Card Panel */}
      <div className="relative bg-brandCard/95 backdrop-blur-2xl rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-neonCyan flex items-center justify-center shrink-0">
            <Quote className="w-6 h-6 animate-pulse-slow" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-neonCyan uppercase tracking-widest font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Daily Motivation
            </span>
            <p className="text-sm md:text-base font-semibold text-white/90 italic leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        </div>
        
        <div className="shrink-0 flex items-center gap-2 border-l border-white/5 pl-6 hidden md:flex h-12">
          <div className="text-right">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold font-mono">ESTABLISHED</p>
            <p className="text-xs font-bold text-white font-mono">FITCORE AI</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteCard;
