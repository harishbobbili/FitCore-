"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Apple,
  Dumbbell,
  Flame,
  TrendingUp,
  Layers,
  Bot,
  User,
  Activity,
  LogOut,
  Loader2,
  CalendarDays,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useAppStore } from "@/store/useAppStore";
import { usePersistedStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Diet", href: "/diet", icon: Apple },
  { label: "Workout", href: "/workout", icon: Dumbbell },
  { label: "Cardio", href: "/cardio", icon: Flame },
  { label: "Analytics", href: "/analytics", icon: TrendingUp },
  { label: "Abs", href: "/abs", icon: Layers },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Progress", href: "/progress", icon: Camera },
  { label: "AI Coach", href: "/ai-coach", icon: Bot },
  { label: "Profile", href: "/profile", icon: User },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();
  const [signingOut, setSigningOut] = useState(false);

  const setProfile = useAppStore((state) => state.setProfile);
  const setTodayLog = useAppStore((state) => state.setTodayLog);
  const setMeals = useAppStore((state) => state.setMeals);
  const setStreak = useAppStore((state) => state.setStreak);
  const setActiveSession = usePersistedStore((state) => state.setActiveSession);
  const setExerciseSets = usePersistedStore((state) => state.setExerciseSets);
  const invalidateCache = useAppStore((state) => state.invalidateCache);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setTodayLog(null);
      setMeals([]);
      setStreak(null);
      setActiveSession(null);
      setExerciseSets([]);
      invalidateCache();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-brandCard/40 border-r border-white/5 p-6 z-30 backdrop-blur-xl">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-9 h-9 rounded-xl bg-neon-grad flex items-center justify-center shadow-neon-purple/30 shadow-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Fit<span className="text-neonCyan">Core</span>
            </h1>
            <span className="text-[10px] text-white/30 font-semibold tracking-widest uppercase">
              Intermediate Hub
            </span>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="flex-1 flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            // Use pathname.startsWith for items with sub-routes (dashboard, workout), exact match for others
            const hasSubRoutes = item.href === "/dashboard" || item.href === "/workout";
            const isActive = hasSubRoutes ? pathname.startsWith(item.href) : pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 group cursor-pointer",
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                {/* Active Background Glow Pill using Framer Motion */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavDesktop"
                    className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 shadow-inner z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                {/* Left Active border marker */}
                {isActive && (
                  <motion.div
                    layoutId="activeBorderDesktop"
                    className="absolute left-0 top-3 bottom-3 w-1 bg-neonPurple rounded-r-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon className={cn(
                  "w-5 h-5 relative z-10 transition-colors",
                  isActive ? "text-neonCyan" : "text-white/40 group-hover:text-white/80"
                )} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card at Bottom of Sidebar */}
        <div className="pt-4 border-t border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neonCyan font-bold font-mono">
            {(profile?.name || "Gym").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-xs font-semibold text-white">{profile?.name || "FitCore Athlete"}</span>
            <span className="text-[10px] text-white/40">
              {profile?.height_cm ?? 162.5}cm | {profile?.weight_kg ?? 63}kg
            </span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sign out"
          >
            {signingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (horizontally scrollable) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#12121A]/90 backdrop-blur-xl border-t border-white/5 flex items-center overflow-x-auto overflow-y-hidden px-4 z-40 scroll-smooth snap-x snap-mandatory">
        {NAV_ITEMS.map((item) => {
          // Use pathname.startsWith for items with sub-routes (dashboard, workout), exact match for others
          const hasSubRoutes = item.href === "/dashboard" || item.href === "/workout";
          const isActive = hasSubRoutes ? pathname.startsWith(item.href) : pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 min-w-[72px] h-12 rounded-xl transition-colors duration-200 cursor-pointer snap-center shrink-0",
                isActive ? "text-white" : "text-white/50 hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavMobile"
                  className="absolute inset-0 bg-white/5 rounded-xl border border-white/5 shadow-inner"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <Icon className={cn(
                "w-5 h-5 relative z-10",
                isActive ? "text-neonCyan" : "text-white/40"
              )} />
              <span className="text-[9px] font-medium mt-1 relative z-10 scale-95">
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Navigation;
