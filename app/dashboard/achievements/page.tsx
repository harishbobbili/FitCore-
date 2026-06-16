"use client";

import { useMemo } from "react";
import { Lock } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import useAchievements from "@/hooks/useAchievements";
import { BADGE_DEFINITIONS } from "@/lib/constants";

export default function AchievementsPage() {
  const { earned, loading } = useAchievements();
  const allBadges = useMemo(() => BADGE_DEFINITIONS, []);

  if (loading) return <SkeletonCard className="h-[480px] w-full" />;

  const breadcrumbs = [{ label: "Dashboard" }, { label: "Achievements" }];

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        <PageHeader title="Achievements" subtitle="Track every badge you have unlocked or are still chasing." breadcrumbs={breadcrumbs} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allBadges.map((badge) => {
            const achieved = earned.some((item) => item.badge_id === badge.id);
            return (
              <GlassCard key={badge.id} className={achieved ? "border-neonPurple/40 shadow-[0_0_20px_rgba(108,99,255,0.6)]" : "opacity-70"}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-4xl">{badge.icon}</div>
                    <h3 className="mt-3 text-lg font-semibold text-white">{badge.title}</h3>
                    <p className="mt-2 text-sm text-white/60">{badge.description}</p>
                  </div>
                  {!achieved ? <Lock className="h-5 w-5 text-white/40" /> : null}
                </div>
                <div className="mt-4 text-xs uppercase tracking-[0.3em] text-white/40">{achieved ? "Earned" : `0 / ${badge.threshold}`}</div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </ErrorBoundary>
  );
}